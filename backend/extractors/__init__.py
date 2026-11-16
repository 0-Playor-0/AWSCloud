"""Pluggable extractors, chosen by the EXTRACTOR env var (HANDOFF.md section 3)."""

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

    def extract(self, doc_type: str, image: bytes) -> Extraction: ...


def get_extractor(name: str) -> Extractor:
    if name == "textract":
        from .textract import TextractExtractor

        return TextractExtractor()
    # "bedrock" is optional and not built until the Phase 0 smoke test passes and is approved.
    raise ValueError(f"unsupported EXTRACTOR: {name}")
