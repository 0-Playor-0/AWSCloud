"""Pluggable extractors, chosen by the EXTRACTOR env var (HANDOFF.md section 3).

- client_ocr (default): the browser runs OCR on the cropped photo and sends only text lines;
  the server parses them. No AWS call, so no daily cap.
- bedrock (off; future, in-region only): not built. It would be `metered`, so the daily cap
  applies to it.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from ..parsers import Fields


@dataclass(frozen=True)
class Extraction:
    raw_text: str  # held in memory only, for the ID-number guard; never logged or returned
    fields: Fields


class ExtractorError(Exception):
    """The extraction service failed (maps to 502 extractor_failed)."""


class ExtractorThrottled(Exception):
    """The extraction service throttled us (maps to 429 throttled)."""


class Extractor(Protocol):
    name: str
    metered: bool  # True when each call costs money: the daily cap applies

    def extract(self, doc_type: str, lines: list[str]) -> Extraction: ...


def get_extractor(name: str) -> Extractor:
    if name == "client_ocr":
        from .client_ocr import ClientOcrExtractor

        return ClientOcrExtractor()
    raise ValueError(f"unsupported EXTRACTOR: {name}")
