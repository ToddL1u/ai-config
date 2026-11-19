"""Download audio for every job, then transcribe each into a timestamped Markdown file.

usage: python -I pipeline.py --jobs jobs.json --work WORK_DIR --out OUT_DIR [--lang zh]

jobs.json is a list of:
  {"slug": "ch01-02", "title": "...", "kind": "hls" | "ytdlp", "source": URL,
   "vtt": optional subtitle URL or local path, "link": optional page URL for the header}

Re-running is safe: finished audio and existing transcripts are skipped.
"""
import argparse, json, os, re, subprocess, sys, urllib.parse
from concurrent.futures import ThreadPoolExecutor

ap = argparse.ArgumentParser()
ap.add_argument("--jobs", required=True)
ap.add_argument("--work", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--lang", default="zh")
ap.add_argument("--prompt", default="以下是繁體中文的內容。")
a = ap.parse_args()
jobs = json.load(open(a.jobs))
AUDIO = os.path.join(a.work, "audio")
os.makedirs(AUDIO, exist_ok=True)
os.makedirs(a.out, exist_ok=True)


def curl(url):
    # curl's default user agent passes Cloudflare; Python's urllib UA gets 403.
    return subprocess.run(["curl", "-sfL", url], capture_output=True, check=True).stdout


def download(j):
    f = os.path.join(AUDIO, j["slug"] + ".m4a")
    if os.path.exists(f) and os.path.getsize(f) > 0:
        return j["slug"], "cached"
    part = f + ".part.m4a"
    try:
        if j["kind"] == "ytdlp":
            cmd = ["yt-dlp", "-q", "-f", "bestaudio", "-x", "--audio-format", "m4a", "-o", part, j["source"]]
        else:
            src = j["source"]
            m = re.search(r'TYPE=AUDIO[^\n]*URI="([^"]+)"', curl(src).decode())
            if m:  # separate audio rendition: fetch only that
                src = urllib.parse.urljoin(src, m[1])
            cmd = ["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", src, "-vn", "-c:a", "copy", part]
        r = subprocess.run(cmd, stdin=subprocess.DEVNULL, capture_output=True, text=True)
        if r.returncode:
            return j["slug"], "FAIL " + r.stderr[-200:]
        os.rename(part, f)
        return j["slug"], "ok"
    except Exception as e:
        return j["slug"], f"FAIL {e}"


with ThreadPoolExecutor(6) as ex:
    for slug, status in ex.map(download, jobs):
        print("DL", slug, status, flush=True)
print("DOWNLOAD PHASE DONE", flush=True)

import mlx_whisper, opencc  # noqa: E402  (imported late so downloads start fast)

to_trad = opencc.OpenCC("s2twp").convert if a.lang == "zh" else (lambda s: s)


def ts(t):
    t = int(t)
    return f"{t // 3600}:{t // 60 % 60:02d}:{t % 60:02d}" if t >= 3600 else f"{t // 60:02d}:{t % 60:02d}"


def duration(f):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f],
                         capture_output=True, text=True).stdout
    return float(out or 0)


def parse_vtt(src):
    raw = (open(src, encoding="utf-8-sig").read() if os.path.exists(src) else curl(src).decode("utf-8-sig"))
    segs = []
    for block in re.split(r"\n\s*\n", raw):
        m = re.search(r"(?:(\d+):)?(\d+):(\d+)[.,]\d+\s*-->", block)
        if not m:
            continue
        start = int(m[1] or 0) * 3600 + int(m[2]) * 60 + int(m[3])
        text = " ".join(l.strip() for l in block.split("\n") if l.strip() and "-->" not in l and not l.strip().isdigit())
        text = re.sub(r"<[^>]+>", "", text)
        if text and (not segs or segs[-1]["text"] != text):
            segs.append({"start": start, "text": to_trad(text)})
    return segs


def write(j, segs, method, dur):
    paras, cur = [], []
    for s in segs:
        if cur and s["start"] - cur[0]["start"] >= 30:
            paras.append(cur)
            cur = []
        cur.append(s)
    if cur:
        paras.append(cur)
    sep = "，" if a.lang == "zh" else " "
    body = "\n\n".join(f"**[{ts(p[0]['start'])}]** " + "".join(
        x["text"] if x["text"][-1:] in "，。？！,.?!:" else x["text"] + sep for x in p) for p in paras)
    src = f"<{j['link']}>" if j.get("link") else "n/a"
    head = f"# {j['title']}\n\nSource: {src} · Duration: {ts(dur)}\n\nMethod: {method}\n\n"
    open(os.path.join(a.out, j["slug"] + "-transcript.md"), "w").write(head + body + "\n")


for j in jobs:
    md = os.path.join(a.out, j["slug"] + "-transcript.md")
    f = os.path.join(AUDIO, j["slug"] + ".m4a")
    if os.path.exists(md):
        print("TX", j["slug"], "exists", flush=True)
        continue
    if not os.path.exists(f):
        print("TX", j["slug"], "SKIP no audio", flush=True)
        continue
    dur = duration(f)
    try:
        if j.get("vtt"):
            try:
                segs = parse_vtt(j["vtt"])
                write(j, segs, "official subtitle file (not AI-transcribed).", dur)
                print("TX", j["slug"], "vtt", len(segs), flush=True)
                continue
            except Exception as e:
                print("TX", j["slug"], "vtt failed, whisper fallback:", e, flush=True)
        r = mlx_whisper.transcribe(f, path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language=a.lang,
                                   initial_prompt=a.prompt, condition_on_previous_text=False)
        segs = [{"start": s["start"], "text": to_trad(s["text"].strip())} for s in r["segments"] if s["text"].strip()]
        write(j, segs, "local Whisper large-v3-turbo transcription. **Unproofread**: check homophones and punctuation against the video.", dur)
        print("TX", j["slug"], "ok", len(segs), flush=True)
    except Exception as e:
        print("TX", j["slug"], "FAIL", e, flush=True)
print("ALL DONE", flush=True)
