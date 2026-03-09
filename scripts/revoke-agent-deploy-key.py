#!/usr/bin/env python3
"""Remove a managed deploy key and its local key material."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


def die(message: str) -> "NoReturn":
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(1)


def run(*args: str) -> str:
    result = subprocess.run(
        list(args),
        check=True,
        text=True,
        capture_output=True,
    )
    return result.stdout.strip()


def current_repo() -> str:
    return run("gh", "repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Remove the managed deploy key and local key material for a repository.",
    )
    parser.add_argument(
        "--repo",
        help="Repository in owner/name form. Defaults to the current checkout.",
    )
    parser.add_argument(
        "--state-dir",
        default="~/.local/state/opencode-sandbox",
        help="Directory holding the deploy key state file.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    repo = args.repo or current_repo()
    if "/" not in repo:
        die("repository must be in owner/name format")
    owner, name = repo.split("/", 1)
    if not owner or not name:
        die("repository must be in owner/name format")

    state_path = Path(args.state_dir).expanduser() / f"{owner}__{name}.json"
    if not state_path.is_file():
        die(f"no managed state found at {state_path}")

    state = json.loads(state_path.read_text(encoding="utf-8"))

    deploy_key_id = state.get("deploy_key_id")
    if deploy_key_id:
        run("gh", "api", "--method", "DELETE", f"/repos/{repo}/keys/{deploy_key_id}")

    for key in ("private_key", "public_key"):
        candidate = state.get(key)
        if candidate:
            Path(candidate).expanduser().unlink(missing_ok=True)

    state_path.unlink(missing_ok=True)
    print(f"Removed managed deploy key state for {repo}")


if __name__ == "__main__":
    main()
