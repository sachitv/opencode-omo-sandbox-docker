#!/usr/bin/env python3
"""Compute a fingerprint for files that affect the devcontainer images/runtime."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
INCLUDE_PATHS = [
    Path("docker-compose.yml"),
    Path(".devcontainer"),
    Path("infra"),
    Path("services"),
]


def iter_files() -> list[Path]:
    files: list[Path] = []
    for relative in INCLUDE_PATHS:
        path = ROOT / relative
        if path.is_file():
            files.append(path)
            continue
        if path.is_dir():
            for child in sorted(path.rglob("*")):
                if child.is_file():
                    files.append(child)
    return sorted(files)


def main() -> None:
    digest = hashlib.sha256()
    manifest: list[str] = []

    for path in iter_files():
        relative = path.relative_to(ROOT).as_posix()
        manifest.append(relative)
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")

    print(
        json.dumps(
            {
                "fingerprint": digest.hexdigest(),
                "files": manifest,
            },
            indent=2,
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
