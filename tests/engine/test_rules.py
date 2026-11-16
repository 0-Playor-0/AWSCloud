"""rules.yaml stays the seed set and obeys the sourcing rules."""

from pathlib import Path

import pytest

from engine.rules import default_rules, load_rules


def test_seed_rules_only() -> None:
    assert set(default_rules()) == {"R-AADHAAR-LIMITS", "R-EPF-MISMATCH", "R-PAN-AADHAAR-LINK"}


def test_unverified_rules_say_may() -> None:
    for rule in default_rules().values():
        if not rule.has_source:
            assert " may " in f" {rule.statement} "


@pytest.mark.parametrize(
    "body,error",
    [
        ("verified: unverified\n    source_url: null\n    statement: It fails.\n"
         "    effect: {type: annotate}", "may"),
        ("verified: unverified\n    source_url: null\n    statement: It may fail.\n"
         "    effect: {type: raise_severity}", "raise severity"),
        ("verified: maybe\n    source_url: null\n    statement: It may fail.\n"
         "    effect: {type: annotate}", "verified"),
        ("verified: unverified\n    source_url: null\n    statement: It may fail.\n"
         "    effect: {type: delete_everything}", "effect"),
    ],
)
def test_invalid_rules_rejected(tmp_path: Path, body: str, error: str) -> None:
    path = tmp_path / "rules.yaml"
    path.write_text(f"rules:\n  - id: R-X\n    applies_to: [general]\n    {body}\n")
    with pytest.raises(ValueError, match=error):
        load_rules(path)
