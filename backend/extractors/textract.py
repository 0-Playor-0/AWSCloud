"""Textract DetectDocumentText on the cropped strip, then deterministic parsers."""

from __future__ import annotations

from typing import Any

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from ..parsers import OcrLine, parse
from . import Extraction, ExtractorError, ExtractorThrottled

_THROTTLE_CODES = frozenset({
    "ThrottlingException", "ProvisionedThroughputExceededException",
    "LimitExceededException",
})
_UNREADABLE_CODES = frozenset({
    "BadDocumentException", "UnsupportedDocumentException", "InvalidParameterException",
})
_CONFIG = Config(
    region_name="ap-south-1",
    connect_timeout=3,
    read_timeout=10,
    retries={"max_attempts": 2, "mode": "standard"},
)


def lines_from_response(response: dict[str, Any]) -> list[OcrLine]:
    return [
        OcrLine(block.get("Text", ""), round(float(block.get("Confidence", 0.0)) / 100, 2))
        for block in response.get("Blocks", [])
        if block.get("BlockType") == "LINE"
    ]


class TextractExtractor:
    name = "textract"

    def __init__(self, client: Any | None = None) -> None:
        self._client = client or boto3.client("textract", config=_CONFIG)

    def extract(self, doc_type: str, image: bytes) -> Extraction:
        try:
            response = self._client.detect_document_text(Document={"Bytes": image})
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code", "")
            if code in _THROTTLE_CODES:
                raise ExtractorThrottled from None
            if code in _UNREADABLE_CODES:  # valid JPEG that Textract cannot read
                return Extraction("", parse(doc_type, []))
            raise ExtractorError(code or "client_error") from None
        except BotoCoreError:
            raise ExtractorError("botocore_error") from None
        lines = lines_from_response(response)
        return Extraction("\n".join(line.text for line in lines), parse(doc_type, lines))
