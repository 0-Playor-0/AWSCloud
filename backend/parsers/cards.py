"""Parsers for Aadhaar, PAN, Class 10 marksheet, bank passbook and other/portal screenshots."""

from __future__ import annotations

import re

from .common import Fields, FieldValue, OcrLine, clean_name, labelled_fields, latin
from .positional import names_before_date

_CERTIFY = re.compile(r"CERTIFY\s+THAT\s+(?:MR\.?|MS\.?|KUMARI)?\s*([A-Z .']+?)"
                      r"(?:\s+(?:SON|DAUGHTER|HAS|ROLL|OF)\b|$)")


def parse_aadhaar(lines: list[OcrLine]) -> Fields:
    """Name is the Latin line just above the DOB line; Aadhaar has no name label."""
    out = labelled_fields(lines)
    if out.name.value is None and (candidates := names_before_date(lines)):
        out.name = candidates[-1]
    return out


def parse_pan(lines: list[OcrLine]) -> Fields:
    """New PAN has labels; old PAN lists name then father's name above the DOB."""
    out = labelled_fields(lines)
    candidates = names_before_date(lines)
    if out.name.value is None and candidates:
        out.name = candidates[0]
    if out.parent_name.value is None and len(candidates) > 1:
        out.parent_name = candidates[1]
    out.gender = FieldValue()  # PAN does not show gender; never guess one
    return out


def parse_marksheet10(lines: list[OcrLine]) -> Fields:
    out = labelled_fields(lines)
    if out.name.value is None:
        for line in lines:
            if (m := _CERTIFY.search(latin(line.text))) and (n := clean_name(m[1])):
                out.name = FieldValue(n, line.confidence)
                break
    return out


def parse_labelled(lines: list[OcrLine]) -> Fields:
    """Passbook and other/portal screenshots: labels only, no positional guessing."""
    return labelled_fields(lines)
