"""Deterministic per-document parsers: OCR lines in, four fields out."""

from __future__ import annotations

from collections.abc import Callable

from .cards import parse_aadhaar, parse_labelled, parse_marksheet10, parse_pan
from .common import FIELD_NAMES, Fields, FieldValue, OcrLine
from .passport import parse_passport

PARSERS: dict[str, Callable[[list[OcrLine]], Fields]] = {
    "aadhaar": parse_aadhaar,
    "pan": parse_pan,
    "marksheet10": parse_marksheet10,
    "passport": parse_passport,
    "passbook": parse_labelled,
    "other": parse_labelled,
}


def parse(doc_type: str, lines: list[OcrLine]) -> Fields:
    return PARSERS[doc_type](lines)


__all__ = ["FIELD_NAMES", "FieldValue", "Fields", "OcrLine", "parse"]
