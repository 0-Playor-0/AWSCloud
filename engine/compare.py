"""Compare a person's documents field by field and build the report and fix plan."""

from __future__ import annotations

from dataclasses import dataclass
from itertools import combinations
from typing import Any

from . import dates, names
from .messages import (
    ACTION_CHOOSE,
    ACTION_CONFIRM_DOB,
    ACTION_CORRECT,
    DISCLAIMER,
    DOC_LABELS,
    EXPLANATIONS,
    FIELD_LABELS,
)
from .rules import Rule, default_rules

PURPOSES = frozenset({"general", "pan_aadhaar_link", "epf_claim"})
FIELDS = ("name", "dob", "parent_name", "gender")
GENDERS = frozenset({"M", "F", "O"})
SEVERITY_RANK = {"blocking": 0, "risky": 1, "cosmetic": 2}
ACTIONABLE = frozenset({"risky", "blocking"})
LIMITED_DOCS = frozenset({"aadhaar"})  # documents with lifetime update limits

NAME_SEVERITY = {
    "exact": None,
    "format_only": "cosmetic",
    "token_order": "risky",
    "initials_vs_expanded": "risky",
    "missing_token": "risky",
    "spelling_variant": "risky",
    "different": "blocking",
}
DOB_SEVERITY = {
    "exact": None,
    "year_only": "risky",
    "day_month_swapped": "blocking",
    "off_by_small": "blocking",
    "different": "blocking",
}


class EngineInputError(ValueError):
    """Input that the API layer should have rejected."""


@dataclass(frozen=True)
class Doc:
    id: str  # unique label used in findings (doc_type, or doc_type_2 for repeats)
    doc_type: str
    fields: dict[str, str | None]


@dataclass(frozen=True)
class Assessment:
    kind: str
    severity: str
    rule_ids: tuple[str, ...]
    notes: tuple[str, ...]


def _clean(field: str, value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise EngineInputError(f"{field} must be a string or null")
    if field in {"name", "parent_name"}:
        return None if names.is_blank(value) else value.strip()
    if not value.strip():
        return None
    if field == "dob":
        try:
            dates.parse(value)
        except ValueError as exc:
            raise EngineInputError(str(exc)) from exc
        return value.strip()
    gender = value.strip().upper()
    if gender not in GENDERS:
        raise EngineInputError("gender must be M, F, O or null")
    return gender


def _parse_documents(documents: list[dict[str, Any]]) -> list[Doc]:
    if not 2 <= len(documents) <= 6:
        raise EngineInputError("2 to 6 documents are required")
    seen: dict[str, int] = {}
    docs: list[Doc] = []
    for item in documents:
        doc_type = item.get("doc_type")
        if doc_type not in DOC_LABELS:
            raise EngineInputError("unknown doc_type")
        seen[doc_type] = seen.get(doc_type, 0) + 1
        doc_id = doc_type if seen[doc_type] == 1 else f"{doc_type}_{seen[doc_type]}"
        raw = item.get("fields") or {}
        docs.append(Doc(doc_id, doc_type, {f: _clean(f, raw.get(f)) for f in FIELDS}))
    return docs


def _base_kind(field: str, a: str, b: str) -> tuple[str, str | None]:
    if field in {"name", "parent_name"}:
        kind = names.classify(a, b)
        return kind, NAME_SEVERITY[kind]
    if field == "dob":
        kind = dates.classify(a, b)
        return kind, DOB_SEVERITY[kind]
    return ("exact", None) if a == b else ("gender_mismatch", "blocking")


def _apply_rules(
    purpose: str, field: str, doc_types: set[str], severity: str, rules: dict[str, Rule]
) -> tuple[str, list[str], list[str]]:
    rule_ids: list[str] = []
    notes: list[str] = []
    for rule in rules.values():
        effect = rule.effect
        if effect.get("purpose") != purpose:
            continue
        if effect["type"] == "raise_severity":
            if (
                rule.has_source
                and effect["field"] == field
                and effect["involves_doc"] in doc_types
                and severity == effect["from"]
            ):
                severity = effect["to"]
                rule_ids.append(rule.id)
        elif (
            effect["type"] == "annotate"
            and field in effect["fields"]
            and set(effect["involves_docs"]) <= doc_types
            and severity in ACTIONABLE
        ):
            rule_ids.append(rule.id)
            notes.append(rule.statement)
    return severity, rule_ids, notes


def assess(
    purpose: str, field: str, a: Doc, b: Doc, rules: dict[str, Rule]
) -> Assessment | None:
    """Assess one field between two documents. None when equal or a value is missing."""
    va, vb = a.fields[field], b.fields[field]
    if va is None or vb is None:
        return None
    kind, severity = _base_kind(field, va, vb)
    if severity is None:
        return None
    severity, rule_ids, notes = _apply_rules(
        purpose, field, {a.doc_type, b.doc_type}, severity, rules
    )
    return Assessment(kind, severity, tuple(rule_ids), tuple(notes))


def _anchor_doc(docs: list[Doc], anchor: dict[str, Any], field: str) -> Doc | None:
    wanted = anchor.get(field)
    if wanted is None:
        return None
    if wanted not in DOC_LABELS:
        raise EngineInputError("unknown anchor doc_type")
    return next((d for d in docs if d.doc_type == wanted and d.fields[field] is not None), None)


def _pairs(docs: list[Doc], anchor_doc: Doc | None) -> list[tuple[Doc, Doc]]:
    if anchor_doc is None:
        return list(combinations(docs, 2))
    return [(anchor_doc, d) for d in docs if d is not anchor_doc]


def _finding(field: str, a: Doc, b: Doc, result: Assessment) -> dict[str, Any]:
    explanation = EXPLANATIONS[result.kind].format(field=FIELD_LABELS[field])
    explanation = " ".join([explanation, *result.notes])
    return {
        "field": field,
        "kind": result.kind,
        "severity": result.severity,
        "docs": [a.id, b.id],
        "values": {a.id: a.fields[field], b.id: b.fields[field]},
        "explanation": explanation,
        "rule_ids": list(result.rule_ids),
    }


def _change_steps(
    purpose: str,
    field: str,
    docs: list[Doc],
    anchor_doc: Doc | None,
    rules: dict[str, Rule],
) -> list[dict[str, Any]]:
    """Steps that change documents to match the anchor. Year-only DOBs are never changed."""
    label = FIELD_LABELS[field]
    if anchor_doc is None:
        return [{"doc": None, "action": ACTION_CHOOSE.format(field=label)}]
    steps = []
    for doc in docs:
        if doc is anchor_doc:
            continue
        result = assess(purpose, field, anchor_doc, doc, rules)
        if result is None or result.severity not in ACTIONABLE or result.kind == "year_only":
            continue
        action = ACTION_CORRECT.format(
            field=label, doc=DOC_LABELS[doc.doc_type], anchor=DOC_LABELS[anchor_doc.doc_type]
        )
        steps.append({"doc": doc.id, "doc_type": doc.doc_type, "action": action})
    return steps


def _confirm_steps(docs: list[Doc], year_only_findings: list[dict[str, Any]]) -> list[dict]:
    """For year-only DOBs with a matching year: confirm the full date on that record."""
    by_id = {d.id: d for d in docs}
    targets: list[Doc] = []
    for finding in year_only_findings:
        for doc_id in finding["docs"]:
            doc = by_id[doc_id]
            if dates.parse(doc.fields["dob"] or "").year_only and doc not in targets:
                targets.append(doc)
    return [
        {
            "doc": d.id,
            "doc_type": d.doc_type,
            "action": ACTION_CONFIRM_DOB.format(doc=DOC_LABELS[d.doc_type]),
        }
        for d in targets
    ]


def _fix_plan(
    purpose: str,
    docs: list[Doc],
    anchor: dict[str, Any],
    findings: list[dict[str, Any]],
    rules: dict[str, Rule],
) -> list[dict[str, Any]]:
    steps: list[dict[str, Any]] = []
    for field in FIELDS:
        actionable = [f for f in findings if f["field"] == field and f["severity"] in ACTIONABLE]
        if any(f["kind"] != "year_only" for f in actionable):
            anchor_doc = _anchor_doc(docs, anchor, field)
            steps.extend(_change_steps(purpose, field, docs, anchor_doc, rules))
        steps.extend(_confirm_steps(docs, [f for f in actionable if f["kind"] == "year_only"]))
    # Documents with no update limits first; Aadhaar (limited updates) last. Stable otherwise.
    steps.sort(key=lambda s: s.get("doc_type") in LIMITED_DOCS)
    limits = rules["R-AADHAAR-LIMITS"]
    plan = []
    for number, step in enumerate(steps, start=1):
        limited = step.get("doc_type") in LIMITED_DOCS
        plan.append(
            {
                "step": number,
                "doc": step["doc"],
                "action": step["action"],
                "caution": limits.statement if limited else None,
                "source_url": limits.source_url if limited else None,
            }
        )
    return plan


def compare(
    purpose: str,
    documents: list[dict[str, Any]],
    anchor: dict[str, Any] | None = None,
    rules: dict[str, Rule] | None = None,
) -> dict[str, Any]:
    """Compare 2–6 documents. Pure function: no I/O beyond the cached rules file."""
    if purpose not in PURPOSES:
        raise EngineInputError("unknown purpose")
    rules = rules or default_rules()
    anchor = anchor or {}
    docs = _parse_documents(documents)

    findings: list[dict[str, Any]] = []
    for field in FIELDS:
        for a, b in _pairs(docs, _anchor_doc(docs, anchor, field)):
            result = assess(purpose, field, a, b, rules)
            if result is not None:
                findings.append(_finding(field, a, b, result))
    plan = _fix_plan(purpose, docs, anchor, findings, rules)

    findings.sort(key=lambda f: SEVERITY_RANK[f["severity"]])
    counts = {s: sum(f["severity"] == s for f in findings) for s in SEVERITY_RANK}
    if counts["blocking"] or counts["risky"]:
        status = "mismatches_found"
    elif counts["cosmetic"]:
        status = "minor_differences"
    else:
        status = "all_match"

    return {
        "summary": {"status": status, "counts": counts},
        "findings": findings,
        "fix_plan": plan,
        "disclaimer": DISCLAIMER,
    }
