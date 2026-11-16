"""Request models for the API contract (HANDOFF.md section 3)."""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

DocType = Literal["aadhaar", "pan", "marksheet10", "passport", "passbook", "other"]
Purpose = Literal["general", "pan_aadhaar_link", "epf_claim"]

MAX_NAME_CHARS = 100
MAX_OCR_LINES = 40
MAX_OCR_LINE_CHARS = 120


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ExtractRequest(_Strict):
    doc_type: DocType
    ocr_lines: list[Annotated[str, Field(max_length=MAX_OCR_LINE_CHARS)]] = Field(
        min_length=1, max_length=MAX_OCR_LINES
    )


class CompareFields(_Strict):
    name: str | None = Field(default=None, max_length=MAX_NAME_CHARS)
    dob: str | None = Field(default=None, pattern=r"^(\d{4}-\d{2}-\d{2}|\d{4})?$")
    parent_name: str | None = Field(default=None, max_length=MAX_NAME_CHARS)
    gender: Literal["M", "F", "O"] | None = None


class CompareDocument(_Strict):
    doc_type: DocType
    fields: CompareFields


class Anchor(_Strict):
    name: DocType | None = None
    dob: DocType | None = None
    parent_name: DocType | None = None
    gender: DocType | None = None


class CompareRequest(_Strict):
    purpose: Purpose
    documents: list[CompareDocument] = Field(min_length=2, max_length=6)
    anchor: Anchor | None = None
