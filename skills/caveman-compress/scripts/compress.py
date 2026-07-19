#!/usr/bin/env python3
"""
Caveman Memory Orchestrator

Usage:
    python memory/compress.py <filepath>
"""

import shutil
import subprocess
import sys
from pathlib import Path
from typing import List

from .detect import should_compress
from .validate import validate

MAX_RETRIES = 2


# ---------- Provider Calls ----------


def call_provider(provider: str, prompt: str) -> str:
    commands = {
        "claude": ["claude", "--print"],
        "codex": ["codex", "exec", "--ephemeral", "--sandbox", "read-only", "-"],
    }
    if provider not in commands:
        raise ValueError(f"Unsupported provider: {provider}")

    command = commands[provider]
    if shutil.which(command[0]) is None:
        raise RuntimeError(
            f"Selected provider executable is unavailable: {command[0]}"
        )

    try:
        result = subprocess.run(
            command,
            input=prompt,
            text=True,
            capture_output=True,
            check=True,
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as error:
        detail = error.stderr.strip() or f"exit status {error.returncode}"
        raise RuntimeError(f"{provider} call failed:\n{detail}") from error


def build_compress_prompt(original: str) -> str:
    return f"""
Compress this markdown into caveman format.

STRICT RULES:
- Do NOT modify anything inside ``` code blocks
- Do NOT modify anything inside inline backticks
- Preserve ALL URLs exactly
- Preserve ALL headings exactly
- Preserve file paths and commands

Only compress natural language.

TEXT:
{original}
"""


def build_fix_prompt(original: str, compressed: str, errors: List[str]) -> str:
    errors_str = "\n".join(f"- {e}" for e in errors)
    return f"""You are fixing a caveman-compressed markdown file. Specific validation errors were found.

CRITICAL RULES:
- DO NOT recompress or rephrase the file
- ONLY fix the listed errors — leave everything else exactly as-is
- The ORIGINAL is provided as reference only (to restore missing content)
- Preserve caveman style in all untouched sections

ERRORS TO FIX:
{errors_str}

HOW TO FIX:
- Missing URL: find it in ORIGINAL, restore it exactly where it belongs in COMPRESSED
- Code block mismatch: find the exact code block in ORIGINAL, restore it in COMPRESSED
- Heading mismatch: restore the exact heading text from ORIGINAL into COMPRESSED
- Do not touch any section not mentioned in the errors

ORIGINAL (reference only):
{original}

COMPRESSED (fix this):
{compressed}

Return ONLY the fixed compressed file. No explanation.
"""


# ---------- Core Logic ----------


def compress_file(filepath: Path, provider: str) -> bool:
    print(f"📄 Processing: {filepath}")

    if not should_compress(filepath):
        print("⚠️ Skipping (not natural language)")
        return False

    original_text = filepath.read_text(errors="ignore")
    backup_path = filepath.with_name(filepath.stem + ".original.md")

    # Step 1: Compress
    print(f"🧠 Compressing with {provider}...")
    compressed = call_provider(provider, build_compress_prompt(original_text))

    # Save original as backup, write compressed to original path
    backup_path.write_text(original_text)
    filepath.write_text(compressed)

    # Step 2: Validate + Retry
    for attempt in range(MAX_RETRIES):
        print(f"\n🔍 Validation attempt {attempt + 1}")

        result = validate(backup_path, filepath)

        if result.is_valid:
            print("✅ Validation passed")
            break

        print("❌ Validation failed:")
        for err in result.errors:
            print(f"   - {err}")

        if attempt == MAX_RETRIES - 1:
            # Restore original on failure
            filepath.write_text(original_text)
            backup_path.unlink(missing_ok=True)
            print("❌ Failed after retries — original restored")
            return False

        print(f"🛠 Fixing with {provider}...")
        compressed = call_provider(
            provider,
            build_fix_prompt(original_text, compressed, result.errors)
        )
        filepath.write_text(compressed)

    return True


# ---------- Main ----------


def main():
    if len(sys.argv) != 4 or sys.argv[1] != "--provider":
        print("Usage: python memory/compress.py --provider <claude|codex> <filepath>")
        sys.exit(1)

    provider = sys.argv[2]
    filepath = Path(sys.argv[3])

    if not filepath.exists():
        print(f"❌ File not found: {filepath}")
        sys.exit(1)

    success = compress_file(filepath, provider)

    if success:
        sys.exit(0)
    else:
        sys.exit(2)


if __name__ == "__main__":
    main()
