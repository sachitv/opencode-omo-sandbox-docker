#!/usr/bin/env python3
"""Create a dedicated write deploy key for one repository.

This runs on the host. It generates a fresh SSH keypair, adds the public key as
a write-enabled deploy key on GitHub, and writes a small state file for the
git-broker to consume.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path


def die(message: str) -> "NoReturn":
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(1)


def run(*args: str, env: dict[str, str] | None = None) -> str:
    result = subprocess.run(
        list(args),
        check=True,
        text=True,
        capture_output=True,
        env=env,
    )
    return result.stdout.strip()


def current_repo() -> str:
    return run("gh", "repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner")


def current_branch() -> str:
    return run("git", "rev-parse", "--abbrev-ref", "HEAD")


def current_remote() -> str:
    return run("git", "remote", "get-url", "origin")


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def cleanup_existing(state_path: Path) -> None:
    if not state_path.is_file():
        return

    state = json.loads(state_path.read_text(encoding="utf-8"))
    repo = state.get("repo")
    key_id = state.get("deploy_key_id")
    private_key = state.get("private_key")
    public_key = state.get("public_key")

    if repo and key_id:
        try:
            run("gh", "api", "--method", "DELETE", f"/repos/{repo}/keys/{key_id}")
        except subprocess.CalledProcessError as exc:
            print(exc.stderr.strip(), file=sys.stderr)

    for candidate in (private_key, public_key):
        if candidate:
            try:
                Path(candidate).unlink(missing_ok=True)
            except OSError:
                pass

    state_path.unlink(missing_ok=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a dedicated deploy key for the current repository.",
    )
    parser.add_argument(
        "--repo",
        help="Repository to scope the deploy key to, in owner/name form. Defaults to the current checkout.",
    )
    parser.add_argument(
        "--title",
        help="Deploy key title. Defaults to a repo-specific generated title.",
    )
    parser.add_argument(
        "--state-dir",
        default="~/.local/state/opencode-sandbox",
        help="Directory for the deploy-key state file.",
    )
    parser.add_argument(
        "--key-dir",
        default="~/.local/share/opencode-sandbox/keys",
        help="Directory for the generated private/public keypair.",
    )
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Replace any existing managed deploy key state for this repository.",
    )
    parser.add_argument(
        "--ensure",
        action="store_true",
        help="Exit successfully if managed state already exists for this repository.",
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

    branch = current_branch()
    remote = current_remote()

    state_dir = Path(args.state_dir).expanduser()
    key_dir = Path(args.key_dir).expanduser()
    state_path = state_dir / f"{owner}__{name}.json"
    key_path = key_dir / f"{owner}__{name}"
    if state_path.exists():
        if args.ensure:
            print(f"Managed deploy key state already exists at {state_path}")
            return
        if not args.replace:
            die(f"state already exists at {state_path}; rerun with --replace to rotate it")
        cleanup_existing(state_path)

    ensure_parent(state_path)
    ensure_parent(key_path)

    title = args.title or f"opencode-agent-{name}-{int(time.time())}"

    run(
        "ssh-keygen",
        "-q",
        "-t",
        "ed25519",
        "-N",
        "",
        "-C",
        title,
        "-f",
        str(key_path),
    )

    public_key = Path(f"{key_path}.pub").read_text(encoding="utf-8").strip()
    response = run(
        "gh",
        "api",
        "--method",
        "POST",
        f"/repos/{repo}/keys",
        "-f",
        f"title={title}",
        "-f",
        f"key={public_key}",
        "-F",
        "read_only=false",
    )
    deploy_key = json.loads(response)
    deploy_key_id = deploy_key.get("id")
    if not deploy_key_id:
        die("GitHub did not return a deploy key id")

    state = {
        "repo": repo,
        "branch": branch,
        "origin": remote,
        "deploy_key_id": deploy_key_id,
        "deploy_key_title": title,
        "private_key": str(key_path),
        "public_key": str(key_path.with_suffix(".pub")),
        "created_at": int(time.time()),
    }
    state_path.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print(f"Created deploy key {deploy_key_id} for {repo}")
    print(f"State file: {state_path}")
    print(f"Private key: {key_path}")
    print(f"Allowed origin: {remote}")
    print(f"Allowed branch: {branch}")


if __name__ == "__main__":
    main()
