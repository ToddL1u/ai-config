"""Print a progress bar and ETA for a running pipeline.py batch.

usage: python3 status.py --jobs jobs.json --work WORK_DIR --out OUT_DIR
"""
import argparse, json, os, subprocess, time

ap = argparse.ArgumentParser()
ap.add_argument("--jobs", required=True)
ap.add_argument("--work", required=True)
ap.add_argument("--out", required=True)
a = ap.parse_args()
jobs = json.load(open(a.jobs))
n = len(jobs)
log_path = os.path.join(a.work, "pipeline.log")
log = open(log_path).read() if os.path.exists(log_path) else ""
audio = lambda j: os.path.join(a.work, "audio", j["slug"] + ".m4a")
done_dl = [j for j in jobs if os.path.exists(audio(j))]
done_tx = [j for j in jobs if os.path.exists(os.path.join(a.out, j["slug"] + "-transcript.md"))]


def bar(k, w=30):
    f = round(w * k / max(n, 1))
    return "█" * f + "░" * (w - f)


def seconds(f):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f],
                         capture_output=True, text=True).stdout
    return float(out or 0)


# Whisper large-v3-turbo on Apple Silicon runs at roughly 0.37x audio length.
left = sum(seconds(audio(j)) for j in done_dl if j not in done_tx) + 600 * (n - len(done_dl))
eta = left * 0.37
running = subprocess.run(["pgrep", "-f", "pipeline.py"], capture_output=True).returncode == 0
current = next((j["slug"] for j in done_dl if j not in done_tx), "-") if "DOWNLOAD PHASE DONE" in log else "downloading"
print(f"\n  {time.strftime('%H:%M')}  {'running' if running else 'stopped'}")
print(f"  audio       {bar(len(done_dl))}  {len(done_dl):>3}/{n}")
print(f"  transcripts {bar(len(done_tx))}  {len(done_tx):>3}/{n}   now: {current}")
print(f"  audio left ≈ {left / 3600:.1f} h → ETA {int(eta // 3600)}h {int(eta % 3600 // 60)}m "
      f"(≈ {time.strftime('%H:%M', time.localtime(time.time() + eta))})")
fails = [l for l in log.splitlines() if "FAIL" in l]
if fails:
    print("  failures:\n   " + "\n   ".join(l[:100] for l in fails))
print()
