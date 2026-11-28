"""Request and response models for the API contract (HANDOFF.md section 3)."""

from __future__ import annotations

from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator

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
    # Optional on-device OCR confidence per line (0..1), same order and length as ocr_lines.
    ocr_confidence: list[Annotated[float, Field(ge=0, le=1)]] | None = None

    @model_validator(mode="after")
    def _confidence_matches_lines(self) -> ExtractRequest:
        if self.ocr_confidence is not None and len(self.ocr_confidence) != len(self.ocr_lines):
            raise ValueError("ocr_confidence must have one value per line")
        return self


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


class OfficialReference(_Strict):
    source_id: str = Field(min_length=1, pattern=r"^[a-z][a-z0-9_]*$")
    label: str = Field(min_length=1)
    url: HttpUrl
    authority: str = Field(min_length=1)
    status: Literal["verified", "needs_verification"]
    verified_on: date | None = None

    @field_validator("url")
    @classmethod
    def _official_https_url(cls, value: HttpUrl) -> HttpUrl:
        if value.scheme != "https":
            raise ValueError("official reference URL must use HTTPS")
        return value


class GuidanceItem(_Strict):
    finding_index: int = Field(ge=0)
    code: str = Field(min_length=1, pattern=r"^[A-Z][A-Z0-9_]*$")
    title: str = Field(min_length=1)
    summary: str = Field(min_length=1)
    priority: Literal["optional", "review", "review_first"]
    why_it_matters: str = Field(min_length=1)
    recommended_action: str = Field(min_length=1)
    steps: list[Annotated[str, Field(min_length=1)]] = Field(min_length=1)
    official_references: list[OfficialReference]
    disclaimer: str = Field(min_length=1)


class GuidanceResponse(_Strict):
    guidance: list[GuidanceItem]

    @model_validator(mode="after")
    def _indices_match_findings(self) -> GuidanceResponse:
        indices = [item.finding_index for item in self.guidance]
        if indices != list(range(len(self.guidance))):
            raise ValueError("guidance finding_index values must be contiguous")
        return self
