"""Fallback for cards that print values without labels (Aadhaar front, old PAN)."""

from __future__ import annotations

from .common import FieldValue, OcrLine, clean_name, find_date, latin

_DOB_HINT = ("DOB", "DATE OF BIRTH", "YEAR OF BIRTH", "YOB")


def first_date_index(lines: list[OcrLine]) -> int | None:
    for i, line in enumerate(lines):
        t = latin(line.text)
        if find_date(t) or any(h in t for h in _DOB_HINT):
            return i
    return None


def names_before_date(lines: list[OcrLine]) -> list[FieldValue]:
    """Name-like lines above the first date line, top to bottom."""
    end = first_date_index(lines)
    window = lines if end is None else lines[:end]
    return [FieldValue(n, line.confidence) for line in window if (n := clean_name(line.text))]
