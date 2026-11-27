"""Load deterministic resolution guidance and attach it to comparison findings."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from functools import cache
from pathlib import Path
from typing import Any

import yaml

from . import dates, names
from .messages import DOC_LABELS

GUIDANCE_PATH = Path(__file__).with_name("guidance.yaml")
PRIORITIES = frozenset({"optional", "review", "review_first"})
SOURCE_STATUSES = frozenset({"verified", "needs_verification"})
PURPOSES = frozenset({"general", "pan_aadhaar_link", "epf_claim"})
DOCUMENT_TYPES = tuple(DOC_LABELS)

_CODE = re.compile(r"^[A-Z][A-Z0-9_]*$")
_SOURCE_ID = re.compile(r"^[a-z][a-z0-9_]*$")
_HTTPS_URL = re.compile(r"^https://[A-Za-z0-9.-]+(?::[0-9]+)?(?:[/?#][^\s]*)?$")
_FORBIDDEN_CLAIMS = (
    "guaranteed correction",
    "identity is verified",
    "identity verified",
    "legally eligible",
    "will be corrected",
)


@dataclass(frozen=True)
class Source:
    source_id: str
    label: str
    url: str
    authority: str
    status: str
    verified_on: str | None


@dataclass(frozen=True)
class GuidanceTemplate:
    field: str
    kind: str
    code: str
    title: str
    summary: str
    priority: str
    why_it_matters: str
    recommended_action: str
    steps: tuple[str, ...]


@dataclass(frozen=True)
class GuidanceCatalogue:
    disclaimer: str
    sources: dict[str, Source]
    document_sources: dict[str, tuple[str, ...]]
    purpose_sources: dict[str, tuple[str, ...]]
    purpose_steps: dict[str, tuple[str, ...]]
    entries: dict[tuple[str, str], GuidanceTemplate]
    fallback: GuidanceTemplate


def _mapping(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict) or not all(isinstance(key, str) for key in value):
        raise ValueError(f"{label} must be a mapping")
    return value


def _require_keys(item: dict[str, Any], expected: set[str], label: str) -> None:
    missing = expected - item.keys()
    unknown = item.keys() - expected
    if missing or unknown:
        raise ValueError(f"{label}: missing {sorted(missing)}, unknown {sorted(unknown)}")


def _text(item: dict[str, Any], key: str, label: str) -> str:
    value = item.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{label}.{key} must be non-empty text")
    return value.strip()


def _texts(value: Any, label: str) -> tuple[str, ...]:
    if not isinstance(value, list):
        raise ValueError(f"{label} must be a list")
    if any(not isinstance(item, str) or not item.strip() for item in value):
        raise ValueError(f"{label} must contain non-empty text")
    return tuple(item.strip() for item in value)


def _source_ids(value: Any, sources: dict[str, Source], label: str) -> tuple[str, ...]:
    items = _texts(value, label)
    if len(set(items)) != len(items):
        raise ValueError(f"{label} contains duplicate source ids")
    unknown = set(items) - sources.keys()
    if unknown:
        raise ValueError(f"{label} has unknown source ids: {sorted(unknown)}")
    return items


def _source(source_id: str, item: Any) -> Source:
    label = f"source {source_id}"
    item = _mapping(item, label)
    _require_keys(item, {"label", "url", "authority", "status", "verified_on"}, label)
    source_url = _text(item, "url", label)
    if not _HTTPS_URL.fullmatch(source_url):
        raise ValueError(f"{label}.url must be an HTTPS URL without credentials")
    status = _text(item, "status", label)
    if status not in SOURCE_STATUSES:
        raise ValueError(f"{label}.status is invalid")
    verified_on = item.get("verified_on")
    if verified_on is not None:
        if not isinstance(verified_on, str):
            raise ValueError(f"{label}.verified_on must be an ISO date or null")
        try:
            date.fromisoformat(verified_on)
        except ValueError:
            raise ValueError(f"{label}.verified_on must be an ISO date") from None
    if status == "verified" and verified_on is None:
        raise ValueError(f"{label}.verified_on is required for a verified source")
    if status == "needs_verification" and verified_on is not None:
        raise ValueError(f"{label}.verified_on must be null until verification")
    return Source(
        source_id=source_id,
        label=_text(item, "label", label),
        url=source_url,
        authority=_text(item, "authority", label),
        status=status,
        verified_on=verified_on,
    )


def _template(item: Any, label: str) -> GuidanceTemplate:
    item = _mapping(item, label)
    required = {
        "field",
        "kind",
        "code",
        "title",
        "summary",
        "priority",
        "why_it_matters",
        "recommended_action",
        "steps",
    }
    _require_keys(item, required, label)
    code = _text(item, "code", label)
    if not _CODE.fullmatch(code):
        raise ValueError(f"{label}.code must be uppercase")
    priority = _text(item, "priority", label)
    if priority not in PRIORITIES:
        raise ValueError(f"{label}.priority is invalid")
    template = GuidanceTemplate(
        field=_text(item, "field", label),
        kind=_text(item, "kind", label),
        code=code,
        title=_text(item, "title", label),
        summary=_text(item, "summary", label),
        priority=priority,
        why_it_matters=_text(item, "why_it_matters", label),
        recommended_action=_text(item, "recommended_action", label),
        steps=_texts(item.get("steps"), f"{label}.steps"),
    )
    claims = " ".join(
        (
            template.title,
            template.summary,
            template.why_it_matters,
            template.recommended_action,
            *template.steps,
        )
    ).lower()
    if any(claim in claims for claim in _FORBIDDEN_CLAIMS):
        raise ValueError(f"{label} contains an unsupported claim")
    return template


def _expected_pairs() -> set[tuple[str, str]]:
    pairs = {
        (field, kind)
        for field in ("name", "parent_name")
        for kind in names.NAME_KINDS
        if kind != "exact"
    }
    pairs.update(("dob", kind) for kind in dates.DOB_KINDS if kind != "exact")
    pairs.add(("gender", "gender_mismatch"))
    return pairs


def load_guidance(path: Path = GUIDANCE_PATH) -> GuidanceCatalogue:
    """Load and strictly validate the static guidance catalogue."""
    raw = _mapping(yaml.safe_load(path.read_text(encoding="utf-8")), "guidance")
    _require_keys(
        raw,
        {
            "version",
            "disclaimer",
            "sources",
            "document_sources",
            "purpose_sources",
            "purpose_steps",
            "guidance",
            "fallback",
        },
        "guidance",
    )
    if raw["version"] != 1:
        raise ValueError("guidance.version must be 1")

    source_items = _mapping(raw["sources"], "guidance.sources")
    sources: dict[str, Source] = {}
    for source_id, item in source_items.items():
        if not _SOURCE_ID.fullmatch(source_id):
            raise ValueError(f"invalid source id: {source_id}")
        sources[source_id] = _source(source_id, item)

    document_source_items = _mapping(raw["document_sources"], "guidance.document_sources")
    if set(document_source_items) != set(DOCUMENT_TYPES):
        raise ValueError("guidance.document_sources must cover every document type")
    document_sources = {
        doc_type: _source_ids(items, sources, f"guidance.document_sources.{doc_type}")
        for doc_type, items in document_source_items.items()
    }

    purpose_source_items = _mapping(raw["purpose_sources"], "guidance.purpose_sources")
    if set(purpose_source_items) != PURPOSES:
        raise ValueError("guidance.purpose_sources must cover every purpose")
    purpose_sources = {
        purpose: _source_ids(items, sources, f"guidance.purpose_sources.{purpose}")
        for purpose, items in purpose_source_items.items()
    }

    purpose_step_items = _mapping(raw["purpose_steps"], "guidance.purpose_steps")
    if set(purpose_step_items) != PURPOSES:
        raise ValueError("guidance.purpose_steps must cover every purpose")
    purpose_steps: dict[str, tuple[str, ...]] = {}
    for purpose, items in purpose_step_items.items():
        steps = _texts(items, f"guidance.purpose_steps.{purpose}")
        claims = " ".join(steps).lower()
        if any(claim in claims for claim in _FORBIDDEN_CLAIMS):
            raise ValueError(f"guidance.purpose_steps.{purpose} contains an unsupported claim")
        purpose_steps[purpose] = steps

    if not isinstance(raw["guidance"], list):
        raise ValueError("guidance.guidance must be a list")
    entries: dict[tuple[str, str], GuidanceTemplate] = {}
    codes: set[str] = set()
    for number, item in enumerate(raw["guidance"], start=1):
        template = _template(item, f"guidance.guidance[{number}]")
        key = (template.field, template.kind)
        if key in entries:
            raise ValueError(f"duplicate guidance for {key}")
        if template.code in codes:
            raise ValueError(f"duplicate guidance code: {template.code}")
        entries[key] = template
        codes.add(template.code)
    expected = _expected_pairs()
    if set(entries) != expected:
        missing = expected - entries.keys()
        extra = entries.keys() - expected
        raise ValueError(
            f"guidance pairs mismatch: missing {sorted(missing)}, extra {sorted(extra)}"
        )

    fallback = _template(raw["fallback"], "guidance.fallback")
    if (fallback.field, fallback.kind) != ("unknown", "unknown"):
        raise ValueError("guidance.fallback must use the unknown field and kind")
    if fallback.code in codes:
        raise ValueError("guidance.fallback code must be unique")
    if fallback.priority == "review_first":
        raise ValueError("guidance.fallback must not claim review-first urgency")

    disclaimer = _text(raw, "disclaimer", "guidance")
    return GuidanceCatalogue(
        disclaimer=disclaimer,
        sources=sources,
        document_sources=document_sources,
        purpose_sources=purpose_sources,
        purpose_steps=purpose_steps,
        entries=entries,
        fallback=fallback,
    )


@cache
def default_guidance() -> GuidanceCatalogue:
    return load_guidance()


def _references(
    catalogue: GuidanceCatalogue, doc_types: set[str], purpose: str
) -> list[dict[str, Any]]:
    source_ids: list[str] = []
    for doc_type in DOCUMENT_TYPES:
        if doc_type in doc_types:
            source_ids.extend(catalogue.document_sources[doc_type])
    source_ids.extend(catalogue.purpose_sources.get(purpose, ()))
    unique = list(dict.fromkeys(source_ids))
    return [
        {
            "source_id": source.source_id,
            "label": source.label,
            "url": source.url,
            "authority": source.authority,
            "status": source.status,
            "verified_on": source.verified_on,
        }
        for source in (catalogue.sources[source_id] for source_id in unique)
    ]


def build_guidance(
    findings: list[dict[str, Any]],
    purpose: str,
    document_types: dict[str, str],
    catalogue: GuidanceCatalogue | None = None,
) -> list[dict[str, Any]]:
    """Build one guidance item per finding, using only static text and source metadata."""
    if purpose not in PURPOSES:
        raise ValueError("unknown purpose")
    catalogue = catalogue or default_guidance()
    guidance: list[dict[str, Any]] = []
    for index, finding in enumerate(findings):
        field = finding.get("field") if isinstance(finding.get("field"), str) else ""
        kind = finding.get("kind") if isinstance(finding.get("kind"), str) else ""
        template = catalogue.entries.get((field, kind), catalogue.fallback)
        involved = {
            document_types[doc_id]
            for doc_id in finding.get("docs", [])
            if isinstance(doc_id, str) and doc_id in document_types
        }
        steps = [*template.steps, *catalogue.purpose_steps.get(purpose, ())]
        guidance.append(
            {
                "finding_index": index,
                "code": template.code,
                "title": template.title,
                "summary": template.summary,
                "priority": template.priority,
                "why_it_matters": template.why_it_matters,
                "recommended_action": template.recommended_action,
                "steps": steps,
                "official_references": _references(catalogue, involved, purpose),
                "disclaimer": catalogue.disclaimer,
            }
        )
    return guidance


__all__ = [
    "PURPOSES",
    "GuidanceCatalogue",
    "GuidanceTemplate",
    "Source",
    "build_guidance",
    "default_guidance",
    "load_guidance",
]
