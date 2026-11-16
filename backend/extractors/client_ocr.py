"""Text lines OCR'd on the user's device -> deterministic per-doc-type parsers."""

from __future__ import annotations

from ..parsers import OcrLine, parse
from . import Extraction

# The client sends text only, without per-line OCR confidence. Parsers still lower a field's
# confidence when a check fails (e.g. a bad MRZ check digit), which drives the warnings.
CLIENT_LINE_CONFIDENCE = 0.9


class ClientOcrExtractor:
    name = "client_ocr"
    metered = False

    def extract(self, doc_type: str, lines: list[str]) -> Extraction:
        ocr = [OcrLine(text, CLIENT_LINE_CONFIDENCE) for text in lines]
        return Extraction("\n".join(lines), parse(doc_type, ocr))
