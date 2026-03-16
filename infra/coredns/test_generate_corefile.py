"""
Tests for infra/coredns/generate-corefile.py.

Run locally:
    cd infra/coredns
    uv run pytest test_generate_corefile.py -v --cov=generate_corefile --cov-report=term-missing

Run inside the generator container image (matches the actual build environment):
    docker build --target corefile-generator -f infra/coredns/Dockerfile -t coredns-test-env .
    docker run --rm \\
        -v "$(pwd)/infra/coredns/test_generate_corefile.py":/work/test_generate_corefile.py \\
        coredns-test-env \\
        sh -c "pip install pytest pytest-cov --quiet --root-user-action=ignore && \\
               python -m pytest test_generate_corefile.py -v --cov=generate_corefile --cov-report=term-missing"
"""
from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import patch

import pytest

sys.path.insert(0, str(Path(__file__).parent))

# The module filename uses a hyphen, so import via importlib.
import importlib.util

_spec = importlib.util.spec_from_file_location(
    "generate_corefile",
    Path(__file__).parent / "generate-corefile.py",
)
_mod = importlib.util.module_from_spec(_spec)  # type: ignore[arg-type]
_spec.loader.exec_module(_mod)  # type: ignore[union-attr]

normalize_zone = _mod.normalize_zone
load_zones = _mod.load_zones
render_corefile = _mod.render_corefile
main = _mod.main


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _yaml_file(tmp_path: Path, content: str) -> Path:
    p = tmp_path / "allow-list.yaml"
    p.write_text(content, encoding="utf-8")
    return p


# ---------------------------------------------------------------------------
# normalize_zone
# ---------------------------------------------------------------------------

class TestNormalizeZone:
    def test_global_wildcard_maps_to_dot(self):
        assert normalize_zone("*") == "."

    def test_wildcard_subdomain_strips_prefix(self):
        assert normalize_zone("*.example.com") == "example.com"

    def test_exact_host_unchanged(self):
        assert normalize_zone("example.com") == "example.com"

    def test_strips_leading_trailing_whitespace(self):
        assert normalize_zone("  example.com  ") == "example.com"

    def test_lowercases_exact_host(self):
        assert normalize_zone("EXAMPLE.COM") == "example.com"

    def test_lowercases_wildcard_subdomain(self):
        assert normalize_zone("*.EXAMPLE.COM") == "example.com"


# ---------------------------------------------------------------------------
# load_zones
# ---------------------------------------------------------------------------

class TestLoadZones:
    def test_empty_file_returns_empty_list(self, tmp_path):
        f = _yaml_file(tmp_path, "")
        assert load_zones(f) == []

    def test_null_yaml_returns_empty_list(self, tmp_path):
        f = _yaml_file(tmp_path, "null\n")
        assert load_zones(f) == []

    def test_non_dict_top_level_raises(self, tmp_path):
        f = _yaml_file(tmp_path, "- example.com\n")
        with pytest.raises(ValueError, match="mapping"):
            load_zones(f)

    def test_single_host_returned(self, tmp_path):
        f = _yaml_file(tmp_path, "example.com:\n")
        assert load_zones(f) == ["example.com"]

    def test_multiple_hosts_sorted(self, tmp_path):
        f = _yaml_file(tmp_path, "beta.com:\nalpha.com:\ngamma.com:\n")
        assert load_zones(f) == ["alpha.com", "beta.com", "gamma.com"]

    def test_wildcard_subdomain_normalized_to_base(self, tmp_path):
        f = _yaml_file(tmp_path, '"*.example.com":\n')
        assert load_zones(f) == ["example.com"]

    def test_global_wildcard_returns_dot_only(self, tmp_path):
        f = _yaml_file(tmp_path, '"*":\n')
        assert load_zones(f) == ["."]

    def test_global_wildcard_with_other_hosts_still_returns_dot_only(self, tmp_path):
        f = _yaml_file(tmp_path, '"*":\nexample.com:\n')
        assert load_zones(f) == ["."]

    def test_empty_string_key_discarded(self, tmp_path):
        # An empty quoted key normalises to "" and is discarded.
        f = _yaml_file(tmp_path, '"": null\nexample.com:\n')
        assert load_zones(f) == ["example.com"]

    def test_wildcard_and_exact_deduplicated(self, tmp_path):
        # "*.example.com" normalises to "example.com", same as the exact entry.
        f = _yaml_file(tmp_path, '"*.example.com":\nexample.com:\n')
        assert load_zones(f) == ["example.com"]

    def test_host_value_coerced_to_string(self, tmp_path):
        # YAML integer keys are str()-coerced before normalisation.
        f = _yaml_file(tmp_path, "123:\n")
        zones = load_zones(f)
        assert zones == ["123"]


# ---------------------------------------------------------------------------
# render_corefile
# ---------------------------------------------------------------------------

class TestRenderCorefile:
    # --- header ---

    def test_header_comment_present(self):
        result = render_corefile([])
        assert "# Auto-generated by infra/coredns/generate-corefile.py" in result
        assert "# Source: infra/mitmproxy/allow-list.yaml" in result

    # --- empty allowlist ---

    def test_empty_zones_has_catch_all_refused(self):
        result = render_corefile([])
        assert ".:5353 {" in result
        assert "rcode REFUSED" in result

    def test_empty_zones_has_no_forward(self):
        assert "forward" not in render_corefile([])

    def test_empty_zones_has_no_per_zone_blocks(self):
        result = render_corefile([])
        # Only one server block
        assert result.count("{") == 2  # outer block + template block

    # --- global wildcard (dot zone) ---

    def test_dot_zone_produces_forward_all(self):
        result = render_corefile(["."])
        assert ".:5353 {" in result
        assert "forward . 127.0.0.11:53" in result

    def test_dot_zone_has_no_refused_template(self):
        assert "rcode REFUSED" not in render_corefile(["."])

    def test_dot_zone_has_no_per_zone_blocks(self):
        result = render_corefile(["."])
        assert result.count("{") == 1

    # --- normal allowlist ---

    def test_normal_has_catch_all_refused(self):
        result = render_corefile(["example.com"])
        assert ".:5353 {" in result
        assert "rcode REFUSED" in result

    def test_normal_has_per_zone_forward_block(self):
        result = render_corefile(["example.com"])
        assert "example.com:5353 {" in result
        assert "forward . 127.0.0.11:53" in result

    def test_multiple_zones_all_present(self):
        result = render_corefile(["alpha.com", "beta.com"])
        assert "alpha.com:5353 {" in result
        assert "beta.com:5353 {" in result

    def test_zone_order_preserved(self):
        result = render_corefile(["alpha.com", "beta.com"])
        assert result.index("alpha.com:5353") < result.index("beta.com:5353")

    # --- plugins present in all blocks ---

    def test_bufsize_in_empty_catch_all(self):
        assert "bufsize 512" in render_corefile([])

    def test_bufsize_in_dot_zone(self):
        assert "bufsize 512" in render_corefile(["."])

    def test_bufsize_in_all_blocks_normal(self):
        result = render_corefile(["example.com"])
        assert result.count("bufsize 512") == 2

    def test_log_in_empty_catch_all(self):
        assert "    log\n" in render_corefile([])

    def test_log_in_dot_zone(self):
        assert "    log\n" in render_corefile(["."])

    def test_log_in_all_blocks_normal(self):
        result = render_corefile(["example.com"])
        assert result.count("    log\n") == 2

    def test_errors_in_empty_catch_all(self):
        assert "    errors\n" in render_corefile([])

    def test_errors_in_dot_zone(self):
        assert "    errors\n" in render_corefile(["."])

    def test_errors_in_all_blocks_normal(self):
        result = render_corefile(["example.com"])
        assert result.count("    errors\n") == 2

    def test_cache_in_empty_catch_all(self):
        assert "    cache 60\n" in render_corefile([])

    def test_cache_in_dot_zone(self):
        assert "    cache 60\n" in render_corefile(["."])

    def test_cache_in_all_blocks_normal(self):
        result = render_corefile(["example.com"])
        assert result.count("    cache 60\n") == 2

    # --- loop plugin must be absent ---

    def test_no_loop_plugin_in_empty(self):
        assert "loop" not in render_corefile([])

    def test_no_loop_plugin_in_dot_zone(self):
        assert "loop" not in render_corefile(["."])

    def test_no_loop_plugin_in_normal(self):
        assert "loop" not in render_corefile(["example.com"])


# ---------------------------------------------------------------------------
# main — CLI integration
# ---------------------------------------------------------------------------

class TestMain:
    def test_dunder_main_guard(self, tmp_path):
        import runpy
        input_file = _yaml_file(tmp_path, "example.com:\n")
        output_file = tmp_path / "Corefile"
        with patch("sys.argv", ["generate-corefile.py",
                                 "--input", str(input_file),
                                 "--output", str(output_file)]):
            runpy.run_path(
                str(Path(__file__).parent / "generate-corefile.py"),
                run_name="__main__",
            )
        assert "example.com:5353 {" in output_file.read_text(encoding="utf-8")

    def test_main_writes_corefile(self, tmp_path):
        input_file = _yaml_file(tmp_path, "example.com:\n")
        output_file = tmp_path / "Corefile"

        with patch("sys.argv", ["generate-corefile.py",
                                 "--input", str(input_file),
                                 "--output", str(output_file)]):
            main()

        content = output_file.read_text(encoding="utf-8")
        assert "example.com:5353 {" in content
        assert "forward . 127.0.0.11:53" in content

    def test_main_empty_allowlist(self, tmp_path):
        input_file = _yaml_file(tmp_path, "")
        output_file = tmp_path / "Corefile"

        with patch("sys.argv", ["generate-corefile.py",
                                 "--input", str(input_file),
                                 "--output", str(output_file)]):
            main()

        content = output_file.read_text(encoding="utf-8")
        assert "rcode REFUSED" in content
        assert "forward" not in content
