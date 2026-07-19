#!/usr/bin/env python3
"""
Caveman Memory CLI

Usage:
    caveman <filepath>
"""

import argparse
import sys
from pathlib import Path

from .compress import compress_file
from .detect import detect_file_type, should_compress


def main():
    parser = argparse.ArgumentParser(
        description="Compress a natural-language file with Claude or Codex."
    )
    parser.add_argument(
        "--provider", required=True, choices=("claude", "codex")
    )
    parser.add_argument("filepath", type=Path)
    args = parser.parse_args()
    filepath = args.filepath

    # Check file exists
    if not filepath.exists():
        print(f"❌ File not found: {filepath}")
        sys.exit(1)

    if not filepath.is_file():
        print(f"❌ Not a file: {filepath}")
        sys.exit(1)

    # Detect file type
    file_type = detect_file_type(filepath)

    print(f"Detected: {file_type}")

    # Check if compressible
    if not should_compress(filepath):
        print("Skipping: file is not natural language (code/config)")
        sys.exit(0)

    print("Starting caveman compression...\n")

    try:
        success = compress_file(filepath, args.provider)

        if success:
            print("\nCompression completed successfully")
            backup_path = filepath.with_name(filepath.stem + ".original.md")
            print(f"Compressed: {filepath}")
            print(f"Original:   {backup_path}")
            sys.exit(0)
        else:
            print("\n❌ Compression failed after retries")
            sys.exit(2)

    except KeyboardInterrupt:
        print("\nInterrupted by user")
        sys.exit(130)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
