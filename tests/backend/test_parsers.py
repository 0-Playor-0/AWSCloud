"""Parser tests from synthetic OCR fixtures, plus MRZ details."""

from datetime import UTC, datetime
from pathlib import Path

import pytest
import yaml

from backend.parsers import FIELD_NAMES, OcrLine, parse
from backend.parsers.common import clean_name, find_date, find_gender
from backend.parsers.passport import check_digit, parse_mrz

FIXTURES = yaml.safe_load(Path(__file__).with_name("ocr_fixtures.yaml").read_text("utf-8"))


@pytest.mark.parametrize("case", FIXTURES, ids=[c["id"] for c in FIXTURES])
def test_parser_fixture(case: dict) -> None:
    lines = [OcrLine(t, c) for t, c in case["lines"]]
    fields = parse(case["doc_type"], lines)
    got = {f: getattr(fields, f).value for f in FIELD_NAMES}
    assert got == case["expect"]
    if "dob_precision" in case:
        assert fields.dob.precision == case["dob_precision"]


def test_every_doc_type_has_fixture() -> None:
    assert {c["doc_type"] for c in FIXTURES} == {
        "aadhaar", "pan", "marksheet10", "passport", "passbook", "other"
    }


@pytest.mark.parametrize(
    "text,expected",
    [
        ("DOB: 14/03/2007", ("2007-03-14", "day")),
        ("14-03-2007", ("2007-03-14", "day")),
        ("14.03.2007", ("2007-03-14", "day")),
        ("2007-03-14", ("2007-03-14", "day")),
        ("14 MAR 2007", ("2007-03-14", "day")),
        ("14-March-2007", ("2007-03-14", "day")),
        ("Year of Birth: 2007", ("2007", "year")),
        ("YOB 2007", ("2007", "year")),
        ("31/02/2007", None),
        ("Roll No 12345678", None),
        ("14 XYZ 2007", None),
    ],
)
def test_find_date(text: str, expected) -> None:
    assert find_date(text) == expected


@pytest.mark.parametrize(
    "text,expected",
    [("MALE", "M"), ("Female", "F"), ("TRANSGENDER", "O"), ("Sex: M", "M"),
     ("Gender - F", "F"), ("Gender: T", "O"), ("FEMALENESS", None), ("Ravi", None)],
)
def test_find_gender(text: str, expected) -> None:
    assert find_gender(text) == expected


@pytest.mark.parametrize(
    "text,expected",
    [("Ravi Kumar", "RAVI KUMAR"), ("R.K.Sharma", "R. K. SHARMA"), ("DOB", None),
     ("Government of India", None), ("A1", None), ("X", None), ("O'Brien", "O'BRIEN"),
     ("रवि", None)],
)
def test_clean_name(text: str, expected) -> None:
    assert clean_name(text) == expected


def test_mrz_check_digit_known_value() -> None:
    # ICAO 9303 specimen: document number L898902C3 has check digit 6.
    assert check_digit("L898902C3") == 6


def test_mrz_bad_dob_check_lowers_confidence() -> None:
    lines = [OcrLine("P<INDKUMAR<<RAVI".ljust(44, "<"), 0.9),
             OcrLine("X0000000<1IND0703148M3001019<<<<<<<<<<<<<<06", 0.9)]
    fields = parse_mrz(lines)
    assert fields is not None
    assert fields.dob.value == "2007-03-14" and fields.dob.confidence < 0.8


def test_mrz_century() -> None:
    lines = [OcrLine("P<INDRAO<<VENKAT".ljust(44, "<"), 0.9),
             OcrLine("X0000000<1IND7501019M3001019<<<<<<<<<<<<<<06", 0.9)]
    fields = parse_mrz(lines, now=datetime(2026, 11, 16, tzinfo=UTC))
    assert fields is not None and fields.dob.value == "1975-01-01"


def test_mrz_absent_returns_none() -> None:
    assert parse_mrz([OcrLine("Surname", 0.9), OcrLine("IYER", 0.9)]) is None
