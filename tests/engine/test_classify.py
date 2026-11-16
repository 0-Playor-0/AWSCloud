"""Table-driven tests for name and DOB classification (cases.yaml)."""

from pathlib import Path

import pytest
import yaml

from engine import dates, names

CASES = yaml.safe_load(Path(__file__).with_name("cases.yaml").read_text(encoding="utf-8"))


def _id(case: list) -> str:
    return " | ".join(str(c) for c in case)


@pytest.mark.parametrize("raw,expected", CASES["normalize"], ids=_id)
def test_normalize(raw: str, expected: list[str]) -> None:
    assert names.normalize(raw) == expected


@pytest.mark.parametrize("a,b,kind", CASES["names"], ids=_id)
def test_name_kind(a: str, b: str, kind: str) -> None:
    assert names.classify(a, b) == kind
    assert names.classify(b, a) == kind  # symmetric


@pytest.mark.parametrize("a,b,kind", CASES["dobs"], ids=_id)
def test_dob_kind(a: str, b: str, kind: str) -> None:
    assert dates.classify(a, b) == kind
    assert dates.classify(b, a) == kind  # symmetric


@pytest.mark.parametrize("value", CASES["bad_dobs"])
def test_bad_dob_rejected(value: str) -> None:
    with pytest.raises(ValueError):
        dates.parse(value)


def test_every_name_kind_covered() -> None:
    assert {c[2] for c in CASES["names"]} == set(names.NAME_KINDS)


def test_every_dob_kind_covered() -> None:
    assert {c[2] for c in CASES["dobs"]} == set(dates.DOB_KINDS)


@pytest.mark.parametrize(
    "a,b,distance",
    [("POOJA", "PUJA", 2), ("", "ABC", 3), ("KITTEN", "SITTING", 3), ("SAME", "SAME", 0)],
)
def test_levenshtein(a: str, b: str, distance: int) -> None:
    assert names.levenshtein(a, b) == distance
