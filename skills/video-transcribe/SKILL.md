---
name: video-transcribe
description: Download online video audio, transcribe it locally with Whisper into timestamped Markdown, and optionally summarize it.
disable-model-invocation: true
---

# Video Transcribe

Turn online videos (public pages or logged-in course platforms) into timestamped Markdown transcripts, entirely on this Mac. A **job** is one video; a **batch** is the list of jobs one `pipeline.py` run processes. Scripts live in `scripts/` beside this file (`SKILL_DIR` below).

## Steps

1. **Scope.** Agree on the videos, the output folder, and the spoken language. Say once that downloading paid or login-only content may break the platform's terms, so outputs stay local. Done when: the video list and output folder are confirmed.

2. **Tools.** Reuse or create the venv:

   ```bash
   V=~/.cache/video-transcribe/venv
   [ -x $V/bin/python ] || { python3 -m venv $V && $V/bin/pip install -q mlx-whisper opencc-python-reimplemented; }
   ```

   `ffmpeg` and (for public pages) `yt-dlp` come from Homebrew. Done when: `$V/bin/python -c "import mlx_whisper"` passes and `ffmpeg -version` runs.

3. **Sources → `jobs.json`.** Pick a work folder (the session scratchpad suits it) and write one job per video, following the schema in `pipeline.py`'s docstring. Prefer an **official subtitle** whenever one exists: it is exact, and the job's `vtt` field makes the pipeline skip Whisper.
   - **Public page** (YouTube and similar): `kind: "ytdlp"`, `source` = page URL. `yt-dlp --list-subs URL` shows subtitles; fetch creator-made ones (skip auto-generated) with `yt-dlp --skip-download --write-subs --sub-langs LANG --sub-format vtt -o WORK/subs/SLUG URL` and set `vtt` to that local file.
   - **Login-gated platform**: read the user's logged-in Chrome tab. Use Claude in Chrome tools when they are present in the session; otherwise `SKILL_DIR/scripts/chrome-js.sh file.js` runs JavaScript in the active tab (the user enables Chrome › View › Developer › Allow JavaScript from Apple Events). Dump `document.documentElement.outerHTML` to a file and search it for `.m3u8` / `.mpd` / `data-video-url` and `.vtt`: a course page often embeds every unit's signed link at once. Fallback: the user copies the `manifest` request URL from DevTools › Network. `kind: "hls"`, `source` = manifest URL, `link` = the unit's page URL.

   Signed links expire (decode the JWT `exp`, often ~1 h), so build the whole batch from one page load and start step 4 right away. Done when: every video has a job, and the job count matches the platform's unit list.

4. **Run in the background.**

   ```bash
   cd WORK && nohup $V/bin/python -I SKILL_DIR/scripts/pipeline.py --jobs jobs.json --work . --out OUT --lang zh < /dev/null > pipeline.log 2>&1 &
   ```

   It downloads audio only (6 in parallel) before transcribing anything, so expiring links are spent first. Wait for `DOWNLOAD PHASE DONE` with a background until-loop on `pipeline.log`. Done when: every `DL` line reads `ok` or `cached`; for failures, refresh the source page, rebuild those jobs, and rerun (finished work is skipped).

5. **Progress.** Run `python3 SKILL_DIR/scripts/status.py --jobs … --work … --out …` once for the user, copy that command to the clipboard with `pbcopy` (prefixed `! `), and let them check it themselves; it costs no tokens. Wait for `ALL DONE` with another background until-loop. Done when: `ALL DONE` is logged.

6. **Verify.** Every job has a `*-transcript.md` or a reported failure. Read two transcripts against the video's on-screen subtitles or audio and list the recurring homophone errors in the report. Then update the folder's index or README, if one exists, with what was transcribed and how.

7. **Summary (only on request).** Summarize from the transcript, one file per video or chapter, marking anything the transcript leaves unclear.

## Gotchas

- **403 from Cloudflare**: Python's urllib user agent is blocked; `pipeline.py` fetches with `curl` and `ffmpeg`, whose default agents pass. Keep the honest default agent: auto mode denies user-agent spoofing.
- **Auto mode denies the batch download**: stop after the first denial. Put the exact command on the clipboard (`pbcopy`) and ask the user to run it in their terminal, then confirm with `ps` that exactly one `pipeline.py` is running.
- **Suspended `ffmpeg`** (`suspended (tty output)`): a background job that reads the terminal is stopped by the shell. Keep `< /dev/null` and `-nostdin`.
- **Duplicate runs**: two pipelines overwrite each other's files. Check `pgrep -f pipeline.py` before starting one.
- **Speed**: Whisper large-v3-turbo runs at ~0.37× audio length on Apple Silicon; quote the ETA from `ffprobe` durations, not file sizes.
- **Chinese output** comes back partly Simplified; with `--lang zh` the pipeline converts to Taiwan Traditional via OpenCC `s2twp`. For other languages, pass `--lang` and a matching `--prompt`.
