"""The deploy region is configured once (samconfig.toml); every other mention must agree."""

import re
import tomllib
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent


def _samconfig_region() -> str:
    cfg = tomllib.loads((ROOT / "samconfig.toml").read_text())
    return cfg["default"]["global"]["parameters"]["region"]


class _CfnLoader(yaml.SafeLoader):
    pass


_CfnLoader.add_multi_constructor("!", lambda loader, suffix, node: None)


def test_template_guard_matches_samconfig() -> None:
    template = yaml.load((ROOT / "template.yaml").read_text(), Loader=_CfnLoader)
    assert template["Parameters"]["DeployRegion"]["Default"] == _samconfig_region()


def test_no_other_region_hardcoded() -> None:
    region = _samconfig_region()
    pattern = re.compile(r"\b(?:af|ap|ca|eu|il|me|mx|sa|us)-[a-z]+-\d\b")
    paths = [p for g in ("backend/**/*.py", "scripts/*", "template.yaml", ".github/**/*.yml",
                         "HANDOFF.md", "CLAUDE.md", "README.md", "docs/*.md",
                         "frontend/src/**/*.ts*", "frontend/src/strings/*.json")
             for p in ROOT.glob(g) if p.is_file()]
    for path in paths:
        for found in pattern.findall(path.read_text(errors="ignore")):
            assert found == region, f"{path.relative_to(ROOT)} mentions {found}, expected {region}"
