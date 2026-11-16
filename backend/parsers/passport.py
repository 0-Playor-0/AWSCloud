"""Passport parser: ICAO 9303 TD3 machine-readable zone first, visual labels as fallback."""

from __future__ import annotations

import re
from datetime import UTC, datetime

from .common import Fields, FieldValue, OcrLine, clean_name, find_date, find_gender, latin

_LINE1 = re.compile(r"^P[A-Z<][A-Z<]{3}[A-Z<]+$")
_LINE2 = re.compile(r"^[A-Z0-9<]{9}[0-9<][A-Z<]{3}\d{6}\d[MFX<]\d{6}\d")
_WEIGHTS = (7, 3, 1)
MRZ_CONFIDENCE = 0.99
MRZ_BAD_CHECK_CONFIDENCE = 0.5


def _mrz_text(text: str) -> str:
    return text.upper().replace(" ", "").replace("«", "<<").replace("‹", "<")


def check_digit(data: str) -> int:
    total = 0
    for i, ch in enumerate(data):
        if ch.isdigit():
            v = int(ch)
        elif ch.isalpha():
            v = ord(ch) - 55
        else:
            v = 0
        total += v * _WEIGHTS[i % 3]
    return total % 10


def _yymmdd(s: str, now: datetime) -> str | None:
    yy, mm, dd = int(s[:2]), int(s[2:4]), int(s[4:6])
    year = 2000 + yy if 2000 + yy <= now.year else 1900 + yy
    try:
        return datetime(year, mm, dd).date().isoformat()
    except ValueError:
        return None


def parse_mrz(lines: list[OcrLine], now: datetime | None = None) -> Fields | None:
    now = now or datetime.now(UTC)
    texts = [(_mrz_text(line.text), line.confidence) for line in lines]
    for i in range(len(texts) - 1):
        l1, l2 = texts[i][0], texts[i + 1][0]
        if not (_LINE1.match(l1) and _LINE2.match(l2)):
            continue
        out = Fields()
        surname, _, given = l1[5:].partition("<<")
        full = " ".join(p for p in (given.replace("<", " "), surname.replace("<", " ")) if p)
        if name := clean_name(full):
            out.name = FieldValue(name, MRZ_CONFIDENCE)
        dob_raw, dob_check = l2[13:19], l2[19]
        if dob := _yymmdd(dob_raw, now):
            ok = check_digit(dob_raw) == int(dob_check)
            out.dob = FieldValue(dob, MRZ_CONFIDENCE if ok else MRZ_BAD_CHECK_CONFIDENCE, "day")
        sex = {"M": "M", "F": "F", "X": "O"}.get(l2[20])
        if sex:
            out.gender = FieldValue(sex, MRZ_CONFIDENCE)
        return out
    return None


def _next_value(lines: list[OcrLine], i: int, label: re.Pattern[str]) -> FieldValue:
    rest = label.sub("", latin(lines[i].text), count=1).strip(" :/")
    if rest and (n := clean_name(rest)):
        return FieldValue(n, lines[i].confidence)
    if i + 1 < len(lines) and (n := clean_name(lines[i + 1].text)):
        return FieldValue(n, lines[i + 1].confidence)
    return FieldValue()


_SURNAME = re.compile(r"^SURNAME\b")
_GIVEN = re.compile(r"^GIVEN\s*NAME\(?S?\)?")


def parse_visual(lines: list[OcrLine]) -> Fields:
    out = Fields()
    surname = given = FieldValue()
    for i, line in enumerate(lines):
        t = latin(line.text)
        if _SURNAME.match(t):
            surname = _next_value(lines, i, _SURNAME)
        elif _GIVEN.match(t):
            given = _next_value(lines, i, _GIVEN)
        elif out.dob.value is None and (d := find_date(t)):
            out.dob = FieldValue(d[0], line.confidence, d[1])
        elif out.gender.value is None and (g := find_gender(t)):
            out.gender = FieldValue(g, line.confidence)
    parts = [p for p in (given, surname) if p.value]
    if parts:
        out.name = FieldValue(
            " ".join(p.value for p in parts if p.value), min(p.confidence for p in parts)
        )
    return out


def parse_passport(lines: list[OcrLine]) -> Fields:
    visual = parse_visual(lines)
    mrz = parse_mrz(lines)
    return mrz.fill(visual) if mrz else visual
