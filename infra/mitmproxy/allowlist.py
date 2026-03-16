from __future__ import annotations

import posixpath
import re
from enum import Enum, auto
from pathlib import Path
from typing import Optional
from urllib.parse import unquote

import yaml
import yaml.constructor
from mitmproxy import ctx, http


POLICY_PATH = Path("/opt/mitmproxy/allow-list.yaml")


class _NoDuplicatesLoader(yaml.SafeLoader):
    """SafeLoader that raises on duplicate mapping keys instead of silently dropping them."""


def _construct_no_duplicate_mapping(loader, node, deep=False):
    loader.flatten_mapping(node)
    pairs = loader.construct_pairs(node, deep=deep)
    seen: set = set()
    for key, _ in pairs:
        if key in seen:
            raise yaml.constructor.ConstructorError(
                "while constructing a mapping",
                node.start_mark,
                f"found duplicate key: {key!r}",
                node.start_mark,
            )
        seen.add(key)
    return dict(pairs)


_NoDuplicatesLoader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,
    _construct_no_duplicate_mapping,
)


def _negation_entry_constructor(loader, suffix, node):
    # YAML parses "!/foo" as tag "!/" + suffix "foo" on empty scalar → reconstruct "!/foo".
    # YAML parses "!DELETE /data/" as tag "!DELETE" + suffix "DELETE" on scalar "/data/"
    # → reconstruct "!DELETE /data/" with a space when the scalar is non-empty.
    scalar = loader.construct_scalar(node)
    return "!" + suffix + (" " + scalar if scalar else "")


_NoDuplicatesLoader.add_multi_constructor("!", _negation_entry_constructor)

INTERNAL_HOSTS: frozenset[str] = frozenset(
    {
        "localhost",
        "127.0.0.1",
        "::1",
        "mitmproxy",
        "openrouter-proxy",
        "perplexity-mcp",
        "workspace",
    }
)

_PATTERN_RE = re.compile(r"^(\*\.)?[a-z0-9][a-z0-9._-]*$")

# All HTTP methods we recognise as method prefixes in path entries.
_HTTP_METHODS: frozenset[str] = frozenset(
    {
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "HEAD",
        "OPTIONS",
        "CONNECT",
        "TRACE",
    }
)


def _normalize_path(raw: str) -> str:
    """Normalize a request path before allowlist matching.

    Strips query string and fragment (access control is path-only), then
    percent-decodes and resolves dot segments / double slashes so that
    encoding tricks and traversal sequences cannot bypass rules.
    """
    # Strip query string and fragment — these are not part of the access check.
    path = raw.split("?", 1)[0].split("#", 1)[0]
    # Percent-decode before normalising: %61dmin → admin, %2F → /.
    # errors="replace" substitutes U+FFFD for malformed sequences (safe default).
    path = unquote(path, errors="replace")
    # posixpath.normpath: resolves ./ and ../, cannot escape root.
    # Note: normpath preserves a leading // per POSIX (implementation-defined meaning);
    # we always collapse to a single leading slash for consistent matching.
    path = posixpath.normpath(path or "/")
    path = "/" + path.lstrip("/")
    return path


def _matches_path_prefix(path: str, prefix: str) -> bool:
    """Return True if path matches prefix at a segment/query/end boundary.

    Prevents "/api" from matching "/apifoo" while still allowing:
      - exact match:          /a/x.png  matches  /a/x.png
      - sub-path:             /api/v1   matches  /api
      - query string:         /api?k=v  matches  /api
      - fragment:             /api#s    matches  /api
    """
    if path == prefix:
        return True
    stem = prefix.rstrip("/")
    return (
        path.startswith(stem + "/")
        or path.startswith(stem + "?")
        or path.startswith(stem + "#")
    )


class PathEntry:
    __slots__ = ("path", "method")

    def __init__(self, path: str, method: Optional[str] = None) -> None:
        self.path = path
        self.method = method  # None = any method

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, PathEntry):
            return NotImplemented
        return self.path == other.path and self.method == other.method

    def __repr__(self) -> str:
        return f"PathEntry(path={self.path!r}, method={self.method!r})"

    def matches(self, method: str, path: str) -> bool:
        if self.method is not None and self.method != method.upper():
            return False
        return _matches_path_prefix(path, self.path)


class PathMode(Enum):
    ALL = auto()  # null value — any path and method allowed
    ALLOW = auto()  # only listed (method, path) combinations allowed
    DENY = auto()  # all requests except listed (method, path) combinations allowed


class HostRule:
    __slots__ = ("pattern", "path_mode", "paths")

    def __init__(
        self,
        pattern: str,
        path_mode: PathMode,
        paths: Optional[list[PathEntry]] = None,
    ) -> None:
        self.pattern = pattern
        self.path_mode = path_mode
        self.paths: list[PathEntry] = paths if paths is not None else []

    def __repr__(self) -> str:
        return f"HostRule(pattern={self.pattern!r}, path_mode={self.path_mode!r}, paths={self.paths!r})"

    @property
    def is_global(self) -> bool:
        return self.pattern == "*"

    @property
    def is_wildcard_subdomain(self) -> bool:
        return self.pattern.startswith("*.")

    def matches_host(self, host: str) -> bool:
        if self.is_global:
            return True
        if self.is_wildcard_subdomain:
            # "*.foo.com" → suffix ".foo.com"; matches "bar.foo.com" but not "foo.com"
            suffix = self.pattern[1:]
            return host.endswith(suffix) and host != suffix.lstrip(".")
        return host == self.pattern

    def allows_request(self, method: str, path: str) -> bool:
        if self.path_mode == PathMode.ALL:
            return True
        if self.path_mode == PathMode.ALLOW:
            return any(e.matches(method, path) for e in self.paths)
        # PathMode.DENY
        return not any(e.matches(method, path) for e in self.paths)


def _parse_path_entry(host_pattern: str, raw: str) -> PathEntry:
    """Parse 'PUT /foo/bar' or '/foo/bar' into a PathEntry."""
    parts = raw.split(" ", 1)
    if len(parts) == 2 and parts[0].upper() in _HTTP_METHODS:
        method, path = parts[0].upper(), parts[1].strip()
    else:
        method, path = None, raw

    if not path.startswith("/"):
        raise ValueError(
            f"Rule '{host_pattern}': path '{raw}' must start with '/' "
            f"(or 'METHOD /path', e.g. 'PUT /foo/bar')"
        )
    return PathEntry(path=path, method=method)


def _parse_paths(pattern: str, raw: list) -> tuple[PathMode, list[PathEntry]]:
    """Parse path entries for a rule, returning (mode, entries)."""
    has_positive = any(not str(p).startswith("!") for p in raw)
    has_negative = any(str(p).startswith("!") for p in raw)

    if has_positive and has_negative:
        raise ValueError(
            f"Rule '{pattern}': cannot mix positive paths and negated paths ('!') "
            f"in the same rule — use either an allow-list or a deny-list, not both"
        )

    mode = PathMode.DENY if has_negative else PathMode.ALLOW
    entries: list[PathEntry] = []
    seen_entries: set[tuple[Optional[str], str]] = set()
    for raw_entry in raw:
        p = str(raw_entry).strip()
        cleaned = p[1:] if p.startswith("!") else p
        entry = _parse_path_entry(pattern, cleaned)
        key = (entry.method, entry.path)
        if key in seen_entries:
            raise ValueError(
                f"Rule '{pattern}': duplicate path entry '{_entry_label(entry)}'"
            )
        seen_entries.add(key)
        entries.append(entry)

    return mode, entries


def _entry_label(e: PathEntry) -> str:
    return f"{e.method} {e.path}" if e.method else e.path


def _check_conflicts(rules: list[HostRule]) -> None:
    """Log warnings for suspicious but non-fatal rule combinations."""
    has_global = any(r.is_global for r in rules)
    if has_global and len(rules) > 1:
        ctx.log.warn(
            "[allowlist] '*' rule allows all traffic — all other rules are redundant"
        )
        return

    wildcard_rules = [r for r in rules if r.is_wildcard_subdomain]
    exact_rules = [r for r in rules if not r.is_wildcard_subdomain and not r.is_global]
    exact_patterns = {r.pattern for r in exact_rules}

    # Warn when an exact host rule is shadowed by a wildcard that already covers it.
    for exact in exact_rules:
        for wc in wildcard_rules:
            if wc.matches_host(exact.pattern):
                ctx.log.warn(
                    f"[allowlist] '{exact.pattern}' is already covered by '{wc.pattern}'; "
                    f"the exact rule takes precedence — this may be unintentional"
                )

    # Warn when a wildcard exists but the bare domain has no rule.
    for wc in wildcard_rules:
        bare = wc.pattern[2:]  # "*.example.com" → "example.com"
        if bare not in exact_patterns:
            ctx.log.warn(
                f"[allowlist] '{wc.pattern}' does not cover the bare domain '{bare}' — "
                f"add a '{bare}:' rule if access to the root domain is also needed"
            )

    # Warn about redundant path entries within a single rule.
    # Entry A is redundant if entry B covers every request A would match:
    #   - B.path is a prefix of A.path (or equal with different method)
    #   - B.method is None (any method) or equals A.method
    for rule in rules:
        if rule.path_mode == PathMode.ALL:
            continue
        for entry_a in rule.paths:
            for entry_b in rule.paths:
                if entry_a is entry_b:
                    continue
                same_identity = (
                    entry_a.path == entry_b.path and entry_a.method == entry_b.method
                )
                if same_identity:
                    continue
                b_covers_a = _matches_path_prefix(entry_a.path, entry_b.path) and (
                    entry_b.method is None or entry_b.method == entry_a.method
                )
                if b_covers_a:
                    ctx.log.warn(
                        f"[allowlist] Rule '{rule.pattern}': "
                        f"'{_entry_label(entry_a)}' is already covered by "
                        f"'{_entry_label(entry_b)}' and is redundant"
                    )


def _load_policy() -> list[HostRule]:
    raw = yaml.load(POLICY_PATH.read_text(encoding="utf-8"), Loader=_NoDuplicatesLoader)
    if raw is None:
        return []
    if not isinstance(raw, dict):
        raise ValueError("allowed-hosts.yaml must be a YAML mapping at the top level")

    rules: list[HostRule] = []
    seen: set[str] = set()

    for key, value in raw.items():
        # Reject non-string keys.  PyYAML 1.1 coerces unquoted scalars like
        # `true`, `false`, `null`, `~`, and bare integers to Python booleans,
        # None, or int.  str() would silently turn them into "true", "none",
        # "1234" etc., which pass the pattern regex but create dead rules that
        # can never match a real hostname.  Forcing the author to quote unusual
        # keys ("true.example.com":) catches typos early.
        if not isinstance(key, str):
            raise ValueError(
                f"Host pattern must be a string, got {type(key).__name__}: {key!r}. "
                f"If the hostname looks like a YAML keyword (true, false, null, ~), "
                f"quote it: '\"{key}\".example.com:'"
            )
        pattern = key.strip().lower()

        if pattern in seen:
            raise ValueError(f"Duplicate host pattern: '{pattern}'")
        seen.add(pattern)

        if pattern != "*" and not _PATTERN_RE.match(pattern):
            raise ValueError(
                f"Invalid host pattern: '{pattern}'. "
                f"Use 'example.com', '*.example.com', or '*'."
            )

        if value is None:
            rules.append(HostRule(pattern=pattern, path_mode=PathMode.ALL))
        elif isinstance(value, list):
            if not value:
                raise ValueError(
                    f"Rule '{pattern}': path list is empty — "
                    f"use a null value to allow all paths, or list at least one path"
                )
            path_mode, entries = _parse_paths(pattern, value)
            rules.append(HostRule(pattern=pattern, path_mode=path_mode, paths=entries))
        else:
            raise ValueError(
                f"Rule '{pattern}': value must be null (allow all paths) "
                f"or a list of path entries, got {type(value).__name__}"
            )

    return rules


_rules: list[HostRule] = []


def _find_rule(host: str) -> Optional[HostRule]:
    """Return the most-specific matching rule for host, or None."""
    # 1. Exact match
    for rule in _rules:
        if (
            not rule.is_wildcard_subdomain
            and not rule.is_global
            and rule.matches_host(host)
        ):
            return rule
    # 2. Wildcard subdomain — longest pattern wins (most specific)
    wildcard_matches = [
        r for r in _rules if r.is_wildcard_subdomain and r.matches_host(host)
    ]
    if wildcard_matches:
        return max(wildcard_matches, key=lambda r: len(r.pattern))
    # 3. Global wildcard
    for rule in _rules:
        if rule.is_global:
            return rule
    return None


def _is_allowed(host: str, method: str, path: str) -> bool:
    # Strip trailing dot: "example.com." is valid DNS notation for a FQDN and
    # identical to "example.com", but some HTTP clients (Go's net package, curl
    # --resolve, some DNS libraries) include it in the Host header.  Without this
    # strip, a rule for "example.com" would silently fail to match "example.com."
    # and the request would be blocked with a confusing 403.
    host = host.lower().rstrip(".")
    if host in INTERNAL_HOSTS:
        return True
    rule = _find_rule(host)
    if rule is None:
        return False
    return rule.allows_request(method, _normalize_path(path))


def load(_loader) -> None:
    try:
        new_rules = _load_policy()
        _check_conflicts(new_rules)
        _rules[:] = new_rules
        ctx.log.info(f"[allowlist] Loaded {len(_rules)} rules from {POLICY_PATH}")
    except Exception as exc:
        # Raising here causes mitmproxy to print the error and exit at startup.
        raise RuntimeError(f"[allowlist] Policy error: {exc}") from exc


def request(flow: http.HTTPFlow) -> None:
    if _is_allowed(flow.request.pretty_host, flow.request.method, flow.request.path):
        return

    flow.response = http.Response.make(
        403,
        b"Host or path is blocked by the sandbox allowlist.\n",
        {"content-type": "text/plain; charset=utf-8"},
    )
