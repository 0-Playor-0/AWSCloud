"""ID-number guard (HANDOFF.md 4.3). Never log or return what matched.

- Aadhaar / "other" crops: any 12-digit number, or a PAN-format string, rejects the crop.
- Every other doc type: only a Verhoeff-valid 12-digit number (Aadhaar's checksum) rejects it,
  so ordinary 12-digit numbers such as bank account numbers pass.
"""

from __future__ import annotations

import re

# 12 digits, contiguous or grouped 4-4-4 with spaces or hyphens, not part of a longer number.
_TWELVE_DIGITS = re.compile(r"(?<!\d)\d{4}[ \-]?\d{4}[ \-]?\d{4}(?!\d)")
# PAN: 5 letters, 4 digits, 1 letter.
_PAN = re.compile(r"(?<![A-Z0-9])[A-Z]{5}\d{4}[A-Z](?![A-Z0-9])")
_STRICT_DOC_TYPES = frozenset({"aadhaar", "other"})

# Verhoeff tables: dihedral group D5 multiplication and position permutation.
_D = (
    (0, 1, 2, 3, 4, 5, 6, 7, 8, 9), (1, 2, 3, 4, 0, 6, 7, 8, 9, 5),
    (2, 3, 4, 0, 1, 7, 8, 9, 5, 6), (3, 4, 0, 1, 2, 8, 9, 5, 6, 7),
    (4, 0, 1, 2, 3, 9, 5, 6, 7, 8), (5, 9, 8, 7, 6, 0, 4, 3, 2, 1),
    (6, 5, 9, 8, 7, 1, 0, 4, 3, 2), (7, 6, 5, 9, 8, 2, 1, 0, 4, 3),
    (8, 7, 6, 5, 9, 3, 2, 1, 0, 4), (9, 8, 7, 6, 5, 4, 3, 2, 1, 0),
)
_P = (
    (0, 1, 2, 3, 4, 5, 6, 7, 8, 9), (1, 5, 7, 6, 2, 8, 3, 0, 9, 4),
    (5, 8, 0, 3, 7, 9, 6, 1, 4, 2), (8, 9, 1, 6, 0, 4, 3, 5, 2, 7),
    (9, 4, 5, 3, 1, 2, 6, 8, 7, 0), (4, 2, 8, 6, 5, 7, 3, 9, 0, 1),
    (2, 7, 9, 3, 8, 0, 6, 4, 1, 5), (7, 0, 4, 6, 9, 1, 3, 2, 5, 8),
)


def verhoeff_valid(digits: str) -> bool:
    """True if the digit string (check digit last) passes the Verhoeff checksum."""
    c = 0
    for i, ch in enumerate(reversed(digits)):
        c = _D[c][_P[i % 8][int(ch)]]
    return c == 0


def _twelve_digit_numbers(text: str) -> list[str]:
    return [re.sub(r"\D", "", m) for m in _TWELVE_DIGITS.findall(text)]


def contains_id_number(doc_type: str, text: str) -> bool:
    """True if the OCR text must be discarded. Returns a bool only, never the match."""
    numbers = _twelve_digit_numbers(text)
    if doc_type in _STRICT_DOC_TYPES:
        return bool(numbers) or bool(_PAN.search(text.upper()))
    return any(verhoeff_valid(n) for n in numbers)
