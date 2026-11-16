"""Text lines OCR'd on the user's device -> deterministic per-doc-type parsers."""

from __future__ import annotations

from ..parsers import FIELD_NAMES, OcrLine, parse
from . import Extraction

# Reported field confidence uses a fixed line confidence; parsers still lower a field's
# confidence when a check fails (e.g. a bad MRZ check digit). The device's per-line OCR
# confidence, when sent, is used only to flag fields read from lines under LOW_LINE_CONFIDENCE.
CLIENT_LINE_CONFIDENCE = 0.9
LOW_LINE_CONFIDENCE = 0.75


class ClientOcrExtractor:
    name = "client_ocr"
    metered = False

    def extract(
        self, doc_type: str, lines: list[str], confidence: list[float] | None = None
    ) -> Extraction:
        fields = parse(doc_type, [OcrLine(text, CLIENT_LINE_CONFIDENCE) for text in lines])
        low: frozenset[str] = frozenset()
        if confidence is not None:
            measured_lines = [OcrLine(t, c) for t, c in zip(lines, confidence, strict=True)]
            measured = parse(doc_type, measured_lines)
            low = frozenset(
                n for n in FIELD_NAMES
                if (fv := getattr(measured, n)).value is not None
                and fv.confidence < LOW_LINE_CONFIDENCE
            )
        return Extraction("\n".join(lines), fields, low)
