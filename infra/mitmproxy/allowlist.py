from pathlib import Path

from mitmproxy import ctx
from mitmproxy import http
import yaml


POLICY_PATH = Path("/opt/mitmproxy/allowed-hosts.yaml")
INTERNAL_HOSTS = {
    "localhost",
    "127.0.0.1",
    "mitmproxy",
    "openrouter-proxy",
    "perplexity-mcp",
    "workspace",
}
EXACT_HOSTS: set[str] = set()
SUFFIX_HOSTS: tuple[str, ...] = ()


def _load_policy() -> tuple[set[str], tuple[str, ...]]:
    parsed = yaml.safe_load(POLICY_PATH.read_text(encoding="utf-8")) or {}
    if not isinstance(parsed, dict):
        raise ValueError("allowed-hosts.yaml must contain a YAML object at the top level")

    exact_hosts: set[str] = set()
    suffix_hosts: list[str] = []

    for value in parsed.get("exact", []):
        if not isinstance(value, str):
            raise ValueError("entries under 'exact' must be strings")
        exact_hosts.add(value.strip().lower())

    for value in parsed.get("wildcards", []):
        if not isinstance(value, str):
            raise ValueError("entries under 'wildcards' must be strings")
        normalized = value.strip().lower()
        if not normalized.startswith("*."):
            raise ValueError("wildcard entries must start with '*.'")
        suffix_hosts.append(normalized[1:])

    return exact_hosts, tuple(suffix_hosts)


def load(_loader):
    global EXACT_HOSTS
    global SUFFIX_HOSTS

    EXACT_HOSTS, SUFFIX_HOSTS = _load_policy()
    ctx.log.info(
        f"Loaded {len(EXACT_HOSTS)} exact hosts and {len(SUFFIX_HOSTS)} wildcard suffixes from {POLICY_PATH}"
    )


def _is_allowed(host: str) -> bool:
    normalized = host.lower()

    if normalized in INTERNAL_HOSTS or normalized in EXACT_HOSTS:
        return True

    return any(normalized.endswith(suffix) for suffix in SUFFIX_HOSTS)


def request(flow: http.HTTPFlow) -> None:
    if _is_allowed(flow.request.pretty_host):
        return

    flow.response = http.Response.make(
        403,
        b"Host is blocked by the sandbox allowlist.\n",
        {"content-type": "text/plain; charset=utf-8"},
    )
