"""
Tests for the mitmproxy allowlist addon.

Run locally:
    cd infra/mitmproxy
    uv run pytest test_allowlist.py -v

Run inside the container (no extra setup needed):
    docker compose run --rm \
        -v $(pwd)/infra/mitmproxy:/opt/mitmproxy \
        mitmproxy \
        sh -c "pip install pytest --quiet && pytest /opt/mitmproxy/test_allowlist.py -v"
"""
from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import patch

import pytest

# Allow importing allowlist from the same directory.
sys.path.insert(0, str(Path(__file__).parent))

import allowlist
from allowlist import (
    HostRule,
    PathEntry,
    PathMode,
    _check_conflicts,
    _find_rule,
    _is_allowed,
    _load_policy,
    _matches_path_prefix,
    _normalize_path,
    _parse_paths,
    load,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _policy_file(tmp_path: Path, content: str) -> Path:
    p = tmp_path / "allow-list.yaml"
    p.write_text(content, encoding="utf-8")
    return p


def _set_rules(monkeypatch, rules: list[HostRule]) -> None:
    monkeypatch.setattr(allowlist, "_rules", rules)


def _allow_rule(pattern: str, *entries: PathEntry) -> HostRule:
    return HostRule(pattern, PathMode.ALLOW, list(entries))


def _deny_rule(pattern: str, *entries: PathEntry) -> HostRule:
    return HostRule(pattern, PathMode.DENY, list(entries))


def _all_rule(pattern: str) -> HostRule:
    return HostRule(pattern, PathMode.ALL)


# ---------------------------------------------------------------------------
# HostRule — properties
# ---------------------------------------------------------------------------

class TestHostRuleProperties:
    def test_global_wildcard(self):
        r = _all_rule("*")
        assert r.is_global is True
        assert r.is_wildcard_subdomain is False

    def test_wildcard_subdomain(self):
        r = _all_rule("*.foo.com")
        assert r.is_global is False
        assert r.is_wildcard_subdomain is True

    def test_exact(self):
        r = _all_rule("foo.com")
        assert r.is_global is False
        assert r.is_wildcard_subdomain is False


# ---------------------------------------------------------------------------
# HostRule.matches_host
# ---------------------------------------------------------------------------

class TestMatchesHost:
    def test_exact_match(self):
        assert _all_rule("example.com").matches_host("example.com") is True

    def test_exact_no_match(self):
        assert _all_rule("example.com").matches_host("other.com") is False

    def test_exact_does_not_match_subdomain(self):
        assert _all_rule("example.com").matches_host("sub.example.com") is False

    def test_wildcard_matches_subdomain(self):
        assert _all_rule("*.example.com").matches_host("sub.example.com") is True

    def test_wildcard_matches_deep_subdomain(self):
        assert _all_rule("*.example.com").matches_host("a.b.example.com") is True

    def test_wildcard_does_not_match_bare_domain(self):
        assert _all_rule("*.example.com").matches_host("example.com") is False

    def test_wildcard_does_not_match_different_domain(self):
        assert _all_rule("*.example.com").matches_host("sub.other.com") is False

    def test_global_matches_anything(self):
        r = _all_rule("*")
        assert r.matches_host("anything.example.com") is True
        assert r.matches_host("example.com") is True


# ---------------------------------------------------------------------------
# _normalize_path
# ---------------------------------------------------------------------------

class TestNormalizePath:
    def test_plain_path_unchanged(self):
        assert _normalize_path("/api/v1") == "/api/v1"

    def test_query_stripped(self):
        assert _normalize_path("/api?foo=bar") == "/api"

    def test_fragment_stripped(self):
        assert _normalize_path("/api#section") == "/api"

    def test_query_and_fragment_stripped(self):
        assert _normalize_path("/api?x=1#s") == "/api"

    def test_dot_segment_resolved(self):
        assert _normalize_path("/api/./v1") == "/api/v1"

    def test_double_dot_resolved(self):
        assert _normalize_path("/allowed/../blocked") == "/blocked"

    def test_double_dot_cannot_escape_root(self):
        assert _normalize_path("/../etc/passwd") == "/etc/passwd"

    def test_double_slash_collapsed(self):
        assert _normalize_path("//admin") == "/admin"

    def test_double_slash_mid_path_collapsed(self):
        assert _normalize_path("/api//v1") == "/api/v1"

    def test_percent_decoded(self):
        assert _normalize_path("/%61dmin") == "/admin"

    def test_percent_encoded_slash_decoded(self):
        assert _normalize_path("/foo%2Fbar") == "/foo/bar"

    def test_trailing_slash_stripped(self):
        assert _normalize_path("/api/") == "/api"

    def test_root(self):
        assert _normalize_path("/") == "/"

    def test_empty_string_becomes_root(self):
        assert _normalize_path("") == "/"

    def test_complex_traversal(self):
        assert _normalize_path("/a/b/../../c") == "/c"

    def test_encoded_traversal(self):
        # %2E%2E is ".." — decoded then normalised
        assert _normalize_path("/allowed/%2E%2E/blocked") == "/blocked"


# ---------------------------------------------------------------------------
# _matches_path_prefix
# ---------------------------------------------------------------------------

class TestMatchesPathPrefix:
    def test_exact_match(self):
        assert _matches_path_prefix("/a/x.png", "/a/x.png") is True

    def test_sub_path(self):
        assert _matches_path_prefix("/api/v1/users", "/api") is True

    def test_query_string_boundary(self):
        assert _matches_path_prefix("/api?foo=bar", "/api") is True

    def test_fragment_boundary(self):
        assert _matches_path_prefix("/api#section", "/api") is True

    def test_no_false_prefix_match(self):
        assert _matches_path_prefix("/apifoo", "/api") is False

    def test_no_extension_prefix_match(self):
        assert _matches_path_prefix("/a/x.png.evil", "/a/x.png") is False

    def test_file_with_query_string(self):
        assert _matches_path_prefix("/a/x.png?v=2", "/a/x.png") is True

    def test_trailing_slash_on_prefix_is_normalised(self):
        assert _matches_path_prefix("/api/v1", "/api/") is True

    def test_root_prefix(self):
        assert _matches_path_prefix("/anything", "/") is True


# ---------------------------------------------------------------------------
# PathEntry
# ---------------------------------------------------------------------------

class TestPathEntry:
    def test_no_method_matches_any_method(self):
        e = PathEntry("/api")
        assert e.matches("GET", "/api") is True
        assert e.matches("POST", "/api") is True
        assert e.matches("PUT", "/api/v1") is True
        assert e.matches("DELETE", "/api/items") is True

    def test_method_restricts_to_that_method(self):
        e = PathEntry("/foo/bar/1", method="PUT")
        assert e.matches("PUT", "/foo/bar/1") is True
        assert e.matches("GET", "/foo/bar/1") is False
        assert e.matches("POST", "/foo/bar/1") is False
        assert e.matches("DELETE", "/foo/bar/1") is False

    def test_method_is_case_insensitive(self):
        e = PathEntry("/foo", method="GET")
        assert e.matches("get", "/foo") is True
        assert e.matches("Get", "/foo") is True

    def test_path_boundary_still_applies(self):
        e = PathEntry("/api", method="GET")
        assert e.matches("GET", "/api/v1") is True
        assert e.matches("GET", "/apifoo") is False

    def test_method_and_path_must_both_match(self):
        e = PathEntry("/foo", method="PUT")
        assert e.matches("PUT", "/bar") is False
        assert e.matches("GET", "/foo") is False


# ---------------------------------------------------------------------------
# HostRule.allows_request
# ---------------------------------------------------------------------------

class TestAllowsRequest:
    def test_all_mode_allows_any_method_and_path(self):
        r = _all_rule("example.com")
        assert r.allows_request("GET", "/") is True
        assert r.allows_request("DELETE", "/sensitive") is True

    def test_allow_mode_path_only_entry(self):
        r = _allow_rule("example.com", PathEntry("/api"))
        assert r.allows_request("GET", "/api/v1") is True
        assert r.allows_request("POST", "/api/v1") is True
        assert r.allows_request("GET", "/other") is False

    def test_allow_mode_method_restricted_entry(self):
        r = _allow_rule("example.com", PathEntry("/foo/bar/1", method="PUT"))
        assert r.allows_request("PUT", "/foo/bar/1") is True
        assert r.allows_request("GET", "/foo/bar/1") is False

    def test_allow_mode_multiple_entries(self):
        r = _allow_rule(
            "example.com",
            PathEntry("/foo/bar/1", method="PUT"),
            PathEntry("/a/b", method="GET"),
            PathEntry("/public/"),
        )
        assert r.allows_request("PUT", "/foo/bar/1") is True
        assert r.allows_request("GET", "/foo/bar/1") is False
        assert r.allows_request("GET", "/a/b?x=1") is True
        assert r.allows_request("POST", "/a/b") is False
        assert r.allows_request("DELETE", "/public/resource") is True

    def test_allow_mode_no_false_prefix_match(self):
        r = _allow_rule("example.com", PathEntry("/api"))
        assert r.allows_request("GET", "/apifoo") is False
        assert r.allows_request("GET", "/api.evil") is False

    def test_deny_mode_blocks_any_method_by_default(self):
        r = _deny_rule("example.com", PathEntry("/admin"))
        assert r.allows_request("GET", "/admin") is False
        assert r.allows_request("POST", "/admin") is False
        assert r.allows_request("GET", "/public") is True

    def test_deny_mode_method_restricted_entry(self):
        r = _deny_rule("example.com", PathEntry("/data/", method="DELETE"))
        assert r.allows_request("DELETE", "/data/item") is False
        assert r.allows_request("GET", "/data/item") is True  # DELETE blocked, GET fine
        assert r.allows_request("POST", "/data/item") is True

    def test_deny_mode_no_false_prefix_match(self):
        r = _deny_rule("example.com", PathEntry("/admin"))
        assert r.allows_request("GET", "/administrator") is True


# ---------------------------------------------------------------------------
# _parse_paths
# ---------------------------------------------------------------------------

class TestParsePaths:
    def test_allow_list_plain_paths(self):
        mode, entries = _parse_paths("example.com", ["/foo", "/bar"])
        assert mode == PathMode.ALLOW
        assert [(e.path, e.method) for e in entries] == [("/foo", None), ("/bar", None)]

    def test_allow_list_with_methods(self):
        mode, entries = _parse_paths("example.com", ["PUT /foo/bar/1", "GET /a/b"])
        assert mode == PathMode.ALLOW
        assert [(e.path, e.method) for e in entries] == [
            ("/foo/bar/1", "PUT"),
            ("/a/b", "GET"),
        ]

    def test_allow_list_mixed_method_and_plain(self):
        mode, entries = _parse_paths("example.com", ["PUT /foo", "/public/"])
        assert mode == PathMode.ALLOW
        assert entries[0].method == "PUT"
        assert entries[1].method is None

    def test_deny_list_plain_paths(self):
        mode, entries = _parse_paths("example.com", ["!/foo", "!/bar"])
        assert mode == PathMode.DENY
        assert [(e.path, e.method) for e in entries] == [("/foo", None), ("/bar", None)]

    def test_deny_list_with_method(self):
        mode, entries = _parse_paths("example.com", ["!DELETE /data/"])
        assert mode == PathMode.DENY
        assert entries[0].path == "/data/"
        assert entries[0].method == "DELETE"

    def test_mixed_positive_negative_raises(self):
        with pytest.raises(ValueError, match="cannot mix"):
            _parse_paths("example.com", ["/foo", "!/bar"])

    def test_path_without_slash_raises(self):
        with pytest.raises(ValueError, match="must start with '/'"):
            _parse_paths("example.com", ["noslash"])

    def test_method_path_without_slash_raises(self):
        with pytest.raises(ValueError, match="must start with '/'"):
            _parse_paths("example.com", ["GET noslash"])

    def test_negated_path_without_slash_raises(self):
        with pytest.raises(ValueError, match="must start with '/'"):
            _parse_paths("example.com", ["!noslash"])

    def test_method_uppercased(self):
        _, entries = _parse_paths("example.com", ["get /foo"])
        assert entries[0].method == "GET"

    def test_whitespace_stripped(self):
        _, entries = _parse_paths("example.com", ["  /foo  "])
        assert entries[0].path == "/foo"


# ---------------------------------------------------------------------------
# _load_policy
# ---------------------------------------------------------------------------

class TestLoadPolicy:
    def test_empty_file_returns_empty(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        assert _load_policy() == []

    def test_null_value_is_all_paths(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "example.com:\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        rules = _load_policy()
        assert len(rules) == 1
        assert rules[0].pattern == "example.com"
        assert rules[0].path_mode == PathMode.ALL

    def test_path_list_is_allow_mode(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "example.com:\n  - /foo\n  - /bar\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        rules = _load_policy()
        assert rules[0].path_mode == PathMode.ALLOW
        assert [(e.path, e.method) for e in rules[0].paths] == [("/foo", None), ("/bar", None)]

    def test_method_prefixed_paths_parsed(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "example.com:\n  - PUT /foo/bar/1\n  - GET /a/b\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        rules = _load_policy()
        assert [(e.path, e.method) for e in rules[0].paths] == [
            ("/foo/bar/1", "PUT"),
            ("/a/b", "GET"),
        ]

    def test_negated_paths_is_deny_mode(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "example.com:\n  - !/admin\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        rules = _load_policy()
        assert rules[0].path_mode == PathMode.DENY
        assert rules[0].paths[0].path == "/admin"
        assert rules[0].paths[0].method is None

    def test_negated_method_path_parsed(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "example.com:\n  - !DELETE /data/\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        rules = _load_policy()
        assert rules[0].path_mode == PathMode.DENY
        assert rules[0].paths[0].path == "/data/"
        assert rules[0].paths[0].method == "DELETE"

    def test_wildcard_subdomain_key(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, '"*.example.com":\n')
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        rules = _load_policy()
        assert rules[0].pattern == "*.example.com"
        assert rules[0].is_wildcard_subdomain is True

    def test_global_wildcard_key(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, '"*":\n')
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        rules = _load_policy()
        assert rules[0].pattern == "*"
        assert rules[0].is_global is True

    def test_duplicate_pattern_raises_at_yaml_parse_time(self, tmp_path, monkeypatch):
        import yaml
        f = _policy_file(tmp_path, "example.com:\nexample.com:\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with pytest.raises((yaml.constructor.ConstructorError, ValueError)):
            _load_policy()

    def test_case_folded_duplicate_raises(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "EXAMPLE.COM:\nexample.com:\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with pytest.raises(ValueError, match="Duplicate"):
            _load_policy()

    def test_invalid_pattern_raises(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, '"not a valid host!!":\n')
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with pytest.raises(ValueError, match="Invalid host pattern"):
            _load_policy()

    def test_empty_path_list_raises(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "example.com: []\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with pytest.raises(ValueError, match="path list is empty"):
            _load_policy()

    def test_mixed_paths_raises(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "example.com:\n  - /foo\n  - !/bar\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with pytest.raises(ValueError, match="cannot mix"):
            _load_policy()

    def test_non_dict_top_level_raises(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "- example.com\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with pytest.raises(ValueError, match="must be a YAML mapping"):
            _load_policy()

    def test_invalid_value_type_raises(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "example.com: 42\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with pytest.raises(ValueError, match="must be null"):
            _load_policy()

    def test_pattern_normalised_to_lowercase(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "EXAMPLE.COM:\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        rules = _load_policy()
        assert rules[0].pattern == "example.com"

    # --- YAML boolean/null key coercion (issue D) ---

    def test_yaml_bool_true_key_raises(self, tmp_path, monkeypatch):
        # `true:` is parsed by PyYAML as Python True, not the string "true".
        f = _policy_file(tmp_path, "true:\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with pytest.raises(ValueError, match="must be a string"):
            _load_policy()

    def test_yaml_bool_false_key_raises(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "false:\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with pytest.raises(ValueError, match="must be a string"):
            _load_policy()

    def test_yaml_null_key_raises(self, tmp_path, monkeypatch):
        # `null:` and `~:` are both parsed as Python None.
        f = _policy_file(tmp_path, "null:\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with pytest.raises(ValueError, match="must be a string"):
            _load_policy()

    def test_yaml_tilde_key_raises(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "~:\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with pytest.raises(ValueError, match="must be a string"):
            _load_policy()

    def test_yaml_integer_key_raises(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "1234:\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with pytest.raises(ValueError, match="must be a string"):
            _load_policy()

    def test_quoted_keyword_hostname_is_valid(self, tmp_path, monkeypatch):
        # Quoting forces YAML to treat the key as a string.
        f = _policy_file(tmp_path, '"true.example.com":\n')
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        rules = _load_policy()
        assert rules[0].pattern == "true.example.com"

    def test_multiple_rules_preserved_in_order(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "alpha.com:\nbeta.com:\ngamma.com:\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        rules = _load_policy()
        assert [r.pattern for r in rules] == ["alpha.com", "beta.com", "gamma.com"]

    def test_ip_address_pattern_rejected(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "1.2.3.4:\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with pytest.raises(ValueError, match="IP addresses are not allowed"):
            _load_policy()

    def test_ipv6_pattern_rejected(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, '"2001:db8::1":\n')
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with pytest.raises(ValueError, match="IP addresses are not allowed"):
            _load_policy()


# ---------------------------------------------------------------------------
# _check_conflicts
# ---------------------------------------------------------------------------

class TestCheckConflicts:
    def test_global_with_other_rules_warns(self):
        rules = [_all_rule("*"), _all_rule("example.com")]
        with patch("allowlist.ctx") as mock_ctx:
            _check_conflicts(rules)
            mock_ctx.log.warn.assert_called_once()
            assert "'*'" in mock_ctx.log.warn.call_args[0][0]

    def test_global_alone_no_warning(self):
        with patch("allowlist.ctx") as mock_ctx:
            _check_conflicts([_all_rule("*")])
            mock_ctx.log.warn.assert_not_called()

    def test_exact_shadowed_by_wildcard_warns(self):
        rules = [
            _all_rule("*.example.com"),
            _allow_rule("sub.example.com", PathEntry("/api")),
        ]
        with patch("allowlist.ctx") as mock_ctx:
            _check_conflicts(rules)
            warns = [c[0][0] for c in mock_ctx.log.warn.call_args_list]
            assert any("sub.example.com" in w and "takes precedence" in w for w in warns)

    def test_no_conflicts_no_warnings(self):
        rules = [_all_rule("example.com"), _allow_rule("other.com", PathEntry("/api"))]
        with patch("allowlist.ctx") as mock_ctx:
            _check_conflicts(rules)
            mock_ctx.log.warn.assert_not_called()

    def test_unrelated_wildcards_no_shadowing_warning(self):
        # Neither wildcard shadows the other — no shadowing warning.
        # (Bare-domain warnings are separate and expected here.)
        rules = [_all_rule("*.foo.com"), _all_rule("*.bar.com")]
        with patch("allowlist.ctx") as mock_ctx:
            _check_conflicts(rules)
            warns = [c[0][0] for c in mock_ctx.log.warn.call_args_list]
            assert not any("takes precedence" in w for w in warns)

    # --- bare domain not covered ---

    def test_wildcard_without_bare_domain_warns(self):
        rules = [_all_rule("*.example.com")]
        with patch("allowlist.ctx") as mock_ctx:
            _check_conflicts(rules)
            warns = [c[0][0] for c in mock_ctx.log.warn.call_args_list]
            assert any("example.com" in w and "bare domain" in w for w in warns)

    def test_wildcard_with_bare_domain_no_bare_domain_warning(self):
        rules = [_all_rule("*.example.com"), _all_rule("example.com")]
        with patch("allowlist.ctx") as mock_ctx:
            _check_conflicts(rules)
            warns = [c[0][0] for c in mock_ctx.log.warn.call_args_list]
            assert not any("bare domain" in w for w in warns)

    # --- redundant path entries within a rule ---

    def test_redundant_path_prefix_warns(self):
        # "/api/v1" is already covered by "/api"
        rules = [_allow_rule("example.com", PathEntry("/api"), PathEntry("/api/v1"))]
        with patch("allowlist.ctx") as mock_ctx:
            _check_conflicts(rules)
            warns = [c[0][0] for c in mock_ctx.log.warn.call_args_list]
            assert any("/api/v1" in w and "redundant" in w for w in warns)

    def test_redundant_method_specific_covered_by_any_method_warns(self):
        # "/foo" (any method) subsumes "GET /foo"
        rules = [_allow_rule("example.com", PathEntry("/foo"), PathEntry("/foo", method="GET"))]
        with patch("allowlist.ctx") as mock_ctx:
            _check_conflicts(rules)
            warns = [c[0][0] for c in mock_ctx.log.warn.call_args_list]
            assert any("GET /foo" in w and "redundant" in w for w in warns)

    def test_different_methods_same_path_not_redundant(self):
        # GET /foo and POST /foo are distinct — neither covers the other
        rules = [_allow_rule("example.com",
                              PathEntry("/foo", method="GET"),
                              PathEntry("/foo", method="POST"))]
        with patch("allowlist.ctx") as mock_ctx:
            _check_conflicts(rules)
            warns = [c[0][0] for c in mock_ctx.log.warn.call_args_list]
            assert not any("redundant" in w for w in warns)

    def test_disjoint_paths_not_redundant(self):
        rules = [_allow_rule("example.com", PathEntry("/api"), PathEntry("/other"))]
        with patch("allowlist.ctx") as mock_ctx:
            _check_conflicts(rules)
            warns = [c[0][0] for c in mock_ctx.log.warn.call_args_list]
            assert not any("redundant" in w for w in warns)

    def test_redundant_in_deny_mode_warns(self):
        # "/admin/users" is already denied by "/admin"
        rules = [_deny_rule("example.com", PathEntry("/admin"), PathEntry("/admin/users"))]
        with patch("allowlist.ctx") as mock_ctx:
            _check_conflicts(rules)
            warns = [c[0][0] for c in mock_ctx.log.warn.call_args_list]
            assert any("/admin/users" in w and "redundant" in w for w in warns)

    def test_all_mode_rule_no_path_redundancy_check(self):
        rules = [_all_rule("example.com")]
        with patch("allowlist.ctx") as mock_ctx:
            _check_conflicts(rules)
            mock_ctx.log.warn.assert_not_called()

    def test_identical_entry_values_skipped_in_redundancy_check(self):
        # The same_identity guard (entry_a.path == entry_b.path and
        # entry_a.method == entry_b.method) is a defensive check inside
        # _check_conflicts; _parse_paths would reject true duplicates before they
        # reach this point.  Two distinct objects with the same (path, method)
        # values must not emit a spurious redundancy warning — they are genuinely
        # the same rule, not a subsumption relationship.
        e1 = PathEntry("/api")
        e2 = PathEntry("/api")  # distinct object, equal values
        assert e1 is not e2    # confirm they are not the same object
        rule = HostRule("example.com", PathMode.ALLOW, [e1, e2])
        with patch("allowlist.ctx") as mock_ctx:
            _check_conflicts([rule])
            warns = [c[0][0] for c in mock_ctx.log.warn.call_args_list]
            assert not any("redundant" in w for w in warns)

    # --- dead-rule warnings for normalised-away paths ---

    def test_double_slash_path_entry_warns_dead_rule(self):
        rules = [_allow_rule("example.com", PathEntry("//admin"))]
        with patch("allowlist.ctx") as mock_ctx:
            _check_conflicts(rules)
            warns = [c[0][0] for c in mock_ctx.log.warn.call_args_list]
            assert any("//admin" in w and "dead rule" in w for w in warns)

    def test_percent_encoded_path_entry_warns_dead_rule(self):
        rules = [_allow_rule("example.com", PathEntry("/%61dmin"))]
        with patch("allowlist.ctx") as mock_ctx:
            _check_conflicts(rules)
            warns = [c[0][0] for c in mock_ctx.log.warn.call_args_list]
            assert any("/%61dmin" in w and "dead rule" in w for w in warns)

    def test_normal_path_entry_no_dead_rule_warning(self):
        rules = [_allow_rule("example.com", PathEntry("/admin"))]
        with patch("allowlist.ctx") as mock_ctx:
            _check_conflicts(rules)
            warns = [c[0][0] for c in mock_ctx.log.warn.call_args_list]
            assert not any("dead rule" in w for w in warns)


# ---------------------------------------------------------------------------
# duplicate path entry → hard error
# ---------------------------------------------------------------------------

class TestDuplicatePathEntry:
    def test_exact_duplicate_raises(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "example.com:\n  - /foo\n  - /foo\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with pytest.raises(ValueError, match="duplicate path entry"):
            _load_policy()

    def test_method_duplicate_raises(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "example.com:\n  - GET /foo\n  - GET /foo\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with pytest.raises(ValueError, match="duplicate path entry"):
            _load_policy()

    def test_same_path_different_methods_ok(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "example.com:\n  - GET /foo\n  - POST /foo\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        rules = _load_policy()
        assert len(rules[0].paths) == 2

    def test_path_with_and_without_method_ok(self, tmp_path, monkeypatch):
        # "/foo" (any method) and "GET /foo" are different entries — no duplicate error,
        # but a redundancy warning is expected (tested in TestCheckConflicts)
        f = _policy_file(tmp_path, "example.com:\n  - /foo\n  - GET /foo\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        rules = _load_policy()
        assert len(rules[0].paths) == 2


# ---------------------------------------------------------------------------
# _find_rule — precedence
# ---------------------------------------------------------------------------

class TestFindRule:
    def test_exact_match(self, monkeypatch):
        _set_rules(monkeypatch, [_all_rule("example.com")])
        assert _find_rule("example.com") is not None

    def test_wildcard_match(self, monkeypatch):
        _set_rules(monkeypatch, [_all_rule("*.example.com")])
        assert _find_rule("sub.example.com") is not None

    def test_wildcard_does_not_match_bare_domain(self, monkeypatch):
        _set_rules(monkeypatch, [_all_rule("*.example.com")])
        assert _find_rule("example.com") is None

    def test_global_match(self, monkeypatch):
        _set_rules(monkeypatch, [_all_rule("*")])
        assert _find_rule("anything.com") is not None

    def test_exact_beats_wildcard(self, monkeypatch):
        exact = _allow_rule("sub.example.com", PathEntry("/specific"))
        wildcard = _all_rule("*.example.com")
        _set_rules(monkeypatch, [wildcard, exact])
        assert _find_rule("sub.example.com") is exact

    def test_wildcard_beats_global(self, monkeypatch):
        wildcard = _allow_rule("*.example.com", PathEntry("/api"))
        global_ = _all_rule("*")
        _set_rules(monkeypatch, [global_, wildcard])
        assert _find_rule("sub.example.com") is wildcard

    def test_longer_wildcard_beats_shorter(self, monkeypatch):
        short = _all_rule("*.com")
        long_ = _allow_rule("*.example.com", PathEntry("/v2"))
        _set_rules(monkeypatch, [short, long_])
        assert _find_rule("api.example.com") is long_

    def test_no_match_returns_none(self, monkeypatch):
        _set_rules(monkeypatch, [_all_rule("example.com")])
        assert _find_rule("other.com") is None

    def test_empty_rules_returns_none(self, monkeypatch):
        _set_rules(monkeypatch, [])
        assert _find_rule("example.com") is None


# ---------------------------------------------------------------------------
# _is_allowed
# ---------------------------------------------------------------------------

class TestIsAllowed:
    def test_internal_host_always_allowed(self, monkeypatch):
        _set_rules(monkeypatch, [])
        for host in ("localhost", "127.0.0.1", "mitmproxy", "workspace"):
            assert _is_allowed(host, "GET", "/anything") is True

    def test_internal_host_case_insensitive(self, monkeypatch):
        _set_rules(monkeypatch, [])
        assert _is_allowed("LOCALHOST", "GET", "/foo") is True

    def test_allowed_host_any_path(self, monkeypatch):
        _set_rules(monkeypatch, [_all_rule("example.com")])
        assert _is_allowed("example.com", "GET", "/anything") is True

    def test_host_not_in_rules_is_blocked(self, monkeypatch):
        _set_rules(monkeypatch, [_all_rule("example.com")])
        assert _is_allowed("other.com", "GET", "/") is False

    def test_allow_mode_matching_path_and_method(self, monkeypatch):
        _set_rules(monkeypatch, [_allow_rule("example.com", PathEntry("/api", method="GET"))])
        assert _is_allowed("example.com", "GET", "/api/v1") is True

    def test_allow_mode_wrong_method_blocked(self, monkeypatch):
        _set_rules(monkeypatch, [_allow_rule("example.com", PathEntry("/api", method="GET"))])
        assert _is_allowed("example.com", "POST", "/api/v1") is False

    def test_deny_mode_blocked_method_path(self, monkeypatch):
        _set_rules(monkeypatch, [_deny_rule("example.com", PathEntry("/data/", method="DELETE"))])
        assert _is_allowed("example.com", "DELETE", "/data/item") is False

    def test_deny_mode_other_method_allowed(self, monkeypatch):
        _set_rules(monkeypatch, [_deny_rule("example.com", PathEntry("/data/", method="DELETE"))])
        assert _is_allowed("example.com", "GET", "/data/item") is True

    def test_host_lookup_is_case_insensitive(self, monkeypatch):
        _set_rules(monkeypatch, [_all_rule("example.com")])
        assert _is_allowed("EXAMPLE.COM", "GET", "/foo") is True

    def test_method_case_insensitive_through_is_allowed(self, monkeypatch):
        # PathEntry.matches uppercases the incoming method before comparing,
        # so lowercase/mixed-case methods from HTTP clients still match rules.
        _set_rules(monkeypatch, [_allow_rule("example.com", PathEntry("/api", method="GET"))])
        assert _is_allowed("example.com", "get", "/api") is True
        assert _is_allowed("example.com", "Get", "/api") is True
        assert _is_allowed("example.com", "post", "/api") is False

    def test_wildcard_subdomain_allow(self, monkeypatch):
        _set_rules(monkeypatch, [_all_rule("*.cdn.com")])
        assert _is_allowed("assets.cdn.com", "GET", "/file.js") is True

    def test_wildcard_does_not_cover_bare_domain(self, monkeypatch):
        _set_rules(monkeypatch, [_all_rule("*.cdn.com")])
        assert _is_allowed("cdn.com", "GET", "/") is False

    def test_ipv6_loopback_always_allowed(self, monkeypatch):
        _set_rules(monkeypatch, [])
        assert _is_allowed("::1", "GET", "/anything") is True

    # --- trailing dot in hostname (issue C) ---

    def test_trailing_dot_host_matches_rule(self, monkeypatch):
        # "example.com." is DNS FQDN notation, identical to "example.com".
        # Some clients (Go net, curl --resolve) include the trailing dot in Host.
        _set_rules(monkeypatch, [_all_rule("example.com")])
        assert _is_allowed("example.com.", "GET", "/foo") is True

    def test_trailing_dot_internal_host_still_allowed(self, monkeypatch):
        _set_rules(monkeypatch, [])
        assert _is_allowed("localhost.", "GET", "/health") is True

    def test_trailing_dot_unknown_host_still_blocked(self, monkeypatch):
        _set_rules(monkeypatch, [_all_rule("example.com")])
        assert _is_allowed("other.com.", "GET", "/") is False

    # --- path normalisation security tests ---

    def test_path_traversal_cannot_bypass_allow_rule(self, monkeypatch):
        # /allowed/../blocked normalises to /blocked, which is not in the allow list.
        _set_rules(monkeypatch, [_allow_rule("example.com", PathEntry("/allowed"))])
        assert _is_allowed("example.com", "GET", "/allowed/../blocked") is False

    def test_path_traversal_stays_within_allowed_subtree(self, monkeypatch):
        # /allowed/a/../b normalises to /allowed/b — still under /allowed.
        _set_rules(monkeypatch, [_allow_rule("example.com", PathEntry("/allowed"))])
        assert _is_allowed("example.com", "GET", "/allowed/a/../b") is True

    def test_double_slash_cannot_bypass_deny_rule(self, monkeypatch):
        # //admin normalises to /admin, which is denied.
        _set_rules(monkeypatch, [_deny_rule("example.com", PathEntry("/admin"))])
        assert _is_allowed("example.com", "GET", "//admin") is False

    def test_url_encoding_cannot_bypass_deny_rule(self, monkeypatch):
        # %61dmin decodes to "admin" → /admin is denied.
        _set_rules(monkeypatch, [_deny_rule("example.com", PathEntry("/admin"))])
        assert _is_allowed("example.com", "GET", "/%61dmin") is False

    def test_encoded_traversal_cannot_bypass_allow_rule(self, monkeypatch):
        # /allowed/%2E%2E/blocked → /allowed/../blocked → /blocked — not allowed.
        _set_rules(monkeypatch, [_allow_rule("example.com", PathEntry("/allowed"))])
        assert _is_allowed("example.com", "GET", "/allowed/%2E%2E/blocked") is False

    def test_query_string_does_not_affect_path_matching(self, monkeypatch):
        # Query string is stripped before matching; /api is allowed, /admin is not.
        _set_rules(monkeypatch, [_allow_rule("example.com", PathEntry("/api"))])
        assert _is_allowed("example.com", "GET", "/api?admin=true") is True
        assert _is_allowed("example.com", "GET", "/admin?bypass=true") is False

    # --- IP address blocking ---

    def test_external_ipv4_blocked(self, monkeypatch):
        _set_rules(monkeypatch, [])
        assert _is_allowed("1.2.3.4", "GET", "/") is False

    def test_external_ipv4_blocked_even_with_global_wildcard(self, monkeypatch):
        # A global wildcard rule must not allow raw IP addresses.
        _set_rules(monkeypatch, [_all_rule("*")])
        assert _is_allowed("93.184.216.34", "GET", "/") is False

    def test_external_ipv6_blocked(self, monkeypatch):
        _set_rules(monkeypatch, [])
        assert _is_allowed("2001:db8::1", "GET", "/") is False

    def test_internal_ipv4_loopback_still_allowed(self, monkeypatch):
        _set_rules(monkeypatch, [])
        assert _is_allowed("127.0.0.1", "GET", "/anything") is True

    def test_internal_ipv6_loopback_still_allowed(self, monkeypatch):
        _set_rules(monkeypatch, [])
        assert _is_allowed("::1", "GET", "/anything") is True


# ---------------------------------------------------------------------------
# request hook — HTTP flow integration
# ---------------------------------------------------------------------------

class _FakeRequest:
    def __init__(self, host: str, method: str, path: str) -> None:
        self.pretty_host = host
        self.method = method
        self.path = path


class _FakeFlow:
    def __init__(self, host: str, method: str, path: str) -> None:
        self.request = _FakeRequest(host, method, path)
        self.response = None


class TestRequestHook:
    def test_allowed_host_does_not_set_response(self, monkeypatch):
        _set_rules(monkeypatch, [_all_rule("example.com")])
        flow = _FakeFlow("example.com", "GET", "/anything")
        allowlist.request(flow)  # type: ignore[arg-type]
        assert flow.response is None

    def test_blocked_host_returns_403(self, monkeypatch):
        _set_rules(monkeypatch, [_all_rule("example.com")])
        flow = _FakeFlow("blocked.com", "GET", "/")
        allowlist.request(flow)  # type: ignore[arg-type]
        assert flow.response is not None
        assert flow.response.status_code == 403

    def test_blocked_path_returns_403(self, monkeypatch):
        _set_rules(monkeypatch, [_allow_rule("example.com", PathEntry("/api"))])
        flow = _FakeFlow("example.com", "GET", "/admin")
        allowlist.request(flow)  # type: ignore[arg-type]
        assert flow.response is not None
        assert flow.response.status_code == 403

    def test_allowed_path_passes(self, monkeypatch):
        _set_rules(monkeypatch, [_allow_rule("example.com", PathEntry("/api"))])
        flow = _FakeFlow("example.com", "GET", "/api/v2/users")
        allowlist.request(flow)  # type: ignore[arg-type]
        assert flow.response is None

    def test_wrong_method_returns_403(self, monkeypatch):
        _set_rules(monkeypatch, [_allow_rule("example.com", PathEntry("/foo/bar/1", method="PUT"))])
        flow = _FakeFlow("example.com", "GET", "/foo/bar/1")
        allowlist.request(flow)  # type: ignore[arg-type]
        assert flow.response is not None
        assert flow.response.status_code == 403

    def test_correct_method_passes(self, monkeypatch):
        _set_rules(monkeypatch, [_allow_rule("example.com", PathEntry("/foo/bar/1", method="PUT"))])
        flow = _FakeFlow("example.com", "PUT", "/foo/bar/1")
        allowlist.request(flow)  # type: ignore[arg-type]
        assert flow.response is None

    def test_internal_host_always_passes(self, monkeypatch):
        _set_rules(monkeypatch, [])
        flow = _FakeFlow("localhost", "GET", "/health")
        allowlist.request(flow)  # type: ignore[arg-type]
        assert flow.response is None


# ---------------------------------------------------------------------------
# load() hook
# ---------------------------------------------------------------------------

class TestLoadHook:
    def test_load_sets_rules_and_logs_info(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "example.com:\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with patch("allowlist.ctx") as mock_ctx:
            load(None)
            assert len(allowlist._rules) == 1
            assert allowlist._rules[0].pattern == "example.com"
            mock_ctx.log.info.assert_called_once()
            assert "1 rules" in mock_ctx.log.info.call_args[0][0]

    def test_load_invalid_policy_raises_runtime_error(self, tmp_path, monkeypatch):
        # Any policy error must be wrapped in RuntimeError so mitmproxy prints
        # it and exits cleanly at startup rather than showing a raw traceback.
        f = _policy_file(tmp_path, '"not a valid host!!":\n')
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with patch("allowlist.ctx"):
            with pytest.raises(RuntimeError, match="Policy error"):
                load(None)

    def test_load_replaces_previous_rules(self, tmp_path, monkeypatch):
        monkeypatch.setattr(allowlist, "_rules", [_all_rule("stale.com")])
        f = _policy_file(tmp_path, "fresh.com:\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        with patch("allowlist.ctx"):
            load(None)
            assert all(r.pattern != "stale.com" for r in allowlist._rules)


# ---------------------------------------------------------------------------
# Comment examples from allow-list.yaml — integration tests
# Each test maps to a named example in the comment block of allow-list.yaml.
# ---------------------------------------------------------------------------

class TestCommentExamples:
    """Integration tests covering each named example in the allow-list.yaml comments."""

    # --- Allow only specific path prefixes (allow-list mode) ---
    # api.github.com:
    #   - /repos/
    #   - /user

    def test_allow_list_trailing_slash_allows_deep_subtree(self, monkeypatch):
        # /repos/ should allow /repos/owner/name (multi-level deep) but block /gists
        _set_rules(monkeypatch, [_allow_rule(
            "api.github.com",
            PathEntry("/repos/"),
            PathEntry("/user"),
        )])
        assert _is_allowed("api.github.com", "GET", "/repos/owner/name") is True
        assert _is_allowed("api.github.com", "GET", "/user") is True
        assert _is_allowed("api.github.com", "GET", "/user/profile") is True
        assert _is_allowed("api.github.com", "GET", "/gists") is False

    # --- Allow a specific file ---
    # example.me:
    #   - /a/x.png    # matches /a/x.png and /a/x.png?v=2 but NOT /a/x.png.evil

    def test_specific_file_allows_query_string_blocks_evil_extension(self, monkeypatch):
        _set_rules(monkeypatch, [_allow_rule("example.me", PathEntry("/a/x.png"))])
        assert _is_allowed("example.me", "GET", "/a/x.png") is True
        assert _is_allowed("example.me", "GET", "/a/x.png?v=2") is True
        assert _is_allowed("example.me", "GET", "/a/x.png.evil") is False

    # --- Allow a specific file with method restriction ---
    # example.me:
    #   - GET /a/x.png    # same but restricted to GET only

    def test_specific_file_method_restricted(self, monkeypatch):
        _set_rules(monkeypatch, [_allow_rule("example.me", PathEntry("/a/x.png", method="GET"))])
        assert _is_allowed("example.me", "GET", "/a/x.png") is True
        assert _is_allowed("example.me", "GET", "/a/x.png?v=2") is True
        assert _is_allowed("example.me", "POST", "/a/x.png") is False

    # --- Allow a whole subtree ---
    # assets.example.me:
    #   - /static/    # matches /static/css/app.css, /static/js/app.js, etc.

    def test_subtree_trailing_slash_matches_deep_paths(self, monkeypatch):
        _set_rules(monkeypatch, [_allow_rule("assets.example.me", PathEntry("/static/"))])
        assert _is_allowed("assets.example.me", "GET", "/static/css/app.css") is True
        assert _is_allowed("assets.example.me", "GET", "/static/js/app.js") is True
        assert _is_allowed("assets.example.me", "GET", "/other/file.js") is False

    # --- Deny-list mode ---
    # example.me:
    #   - !/admin     # blocks any method to /admin and /admin/*, allows everything else

    def test_deny_list_admin_blocks_subpaths(self, monkeypatch):
        _set_rules(monkeypatch, [_deny_rule("example.me", PathEntry("/admin"))])
        assert _is_allowed("example.me", "GET", "/admin") is False
        assert _is_allowed("example.me", "POST", "/admin/settings") is False
        assert _is_allowed("example.me", "DELETE", "/admin/users") is False
        assert _is_allowed("example.me", "GET", "/public") is True

    # --- Deny-list mode with method restriction ---
    # example.me:
    #   - !DELETE /data/   # blocks DELETE to /data/ subtree only

    def test_deny_list_method_specific_allows_other_methods(self, monkeypatch):
        _set_rules(monkeypatch, [_deny_rule("example.me", PathEntry("/data/", method="DELETE"))])
        assert _is_allowed("example.me", "DELETE", "/data/item") is False
        assert _is_allowed("example.me", "GET", "/data/item") is True
        assert _is_allowed("example.me", "POST", "/data/report") is True


# ---------------------------------------------------------------------------
# Edge cases that may behave unexpectedly
# ---------------------------------------------------------------------------

class TestEdgeCases:
    # --- !/  blocks ALL paths (footgun) ---
    # "/" is a universal prefix, so a deny-list entry of "!/" matches every path.
    # A host with only "- !/" is effectively unreachable despite being listed.

    def test_deny_root_path_blocks_everything(self, monkeypatch):
        _set_rules(monkeypatch, [_deny_rule("example.com", PathEntry("/"))])
        assert _is_allowed("example.com", "GET", "/") is False
        assert _is_allowed("example.com", "GET", "/api/v1") is False
        assert _is_allowed("example.com", "POST", "/anything") is False

    # --- - /  in allow-list is equivalent to null (allows ALL paths) ---
    # "/" prefix matches every path, so allow-list "- /" is not "root only".

    def test_allow_root_path_entry_allows_everything(self, monkeypatch):
        _set_rules(monkeypatch, [_allow_rule("example.com", PathEntry("/"))])
        assert _is_allowed("example.com", "GET", "/") is True
        assert _is_allowed("example.com", "DELETE", "/admin/secrets") is True
        assert _is_allowed("example.com", "POST", "/anything/at/all") is True

    # --- Rule paths are NOT normalized at load time ---
    # Request paths are normalized (double-slash → single-slash, %xx decoded, etc.)
    # but PathEntry.path is stored verbatim.  A rule with "//admin" or "/%61dmin"
    # never matches because it can never equal the normalized request path "/admin".

    def test_double_slash_rule_path_never_matches_normalized_request(self, monkeypatch):
        # Rule has "//admin" but all requests arrive normalized to "/admin".
        _set_rules(monkeypatch, [_allow_rule("example.com", PathEntry("//admin"))])
        assert _is_allowed("example.com", "GET", "/admin") is False   # dead rule
        assert _is_allowed("example.com", "GET", "//admin") is False  # normalized away

    def test_percent_encoded_rule_path_never_matches(self, monkeypatch):
        # Rule has "/%61dmin" (URL-encoded "admin") but the request normalizes to "/admin".
        _set_rules(monkeypatch, [_allow_rule("example.com", PathEntry("/%61dmin"))])
        assert _is_allowed("example.com", "GET", "/admin") is False      # decoded request
        assert _is_allowed("example.com", "GET", "/%61dmin") is False    # also decoded

    # --- Host pattern validation allows consecutive dots ---
    # "example..com" passes _PATTERN_RE but can never match a real DNS hostname.

    def test_consecutive_dots_in_host_pattern_passes_validation(self, tmp_path, monkeypatch):
        f = _policy_file(tmp_path, "example..com:\n")
        monkeypatch.setattr(allowlist, "POLICY_PATH", f)
        # Loads without error — the regex allows consecutive dots.
        rules = _load_policy()
        assert rules[0].pattern == "example..com"
        # The pattern does exact-match "example..com" as a string, but DNS never
        # produces hostnames with consecutive dots — so this rule is permanently dead.
        assert rules[0].matches_host("example.com") is False   # real hostname: no match
        assert rules[0].matches_host("example..com") is True   # only matches the literal typo
