"""ID-number guard (HANDOFF.md 4.3). Never log or return what matched."""

from __future__ import annotations

import re

# Aadhaar: 12 digits, first digit 2–9, optionally grouped 4-4-4 with spaces or hyphens.
_AADHAAR = re.compile(r"(?<!\d)[2-9]\d{3}[ \-]?\d{4}[ \-]?\d{4}(?!\d)")
# PAN: 5 letters, 4 digits, 1 letter.
_PAN = re.compile(r"(?<![A-Z0-9])[A-Z]{5}\d{4}[A-Z](?![A-Z0-9])")
_PAN_CHECKED_DOC_TYPES = frozenset({"aadhaar", "other"})


def contains_id_number(doc_type: str, text: str) -> bool:
    """True if the OCR text holds an Aadhaar-like number (any doc type) or, for
    Aadhaar / other crops, a PAN-format string."""
    if _AADHAAR.search(text):
        return True
    return doc_type in _PAN_CHECKED_DOC_TYPES and bool(_PAN.search(text.upper()))
