"""Deterministic, privacy-safe resolution guidance tests."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest
import yaml

from engine import compare
from engine.guidance import build_guidance, default_guidance, load_guidance


def doc(doc_type: str, **fields: Any) -> dict[str, Any]:
    values = {
        "name": "SAME NAME",
        "dob": "2007-03-14",
        "parent_name": "SAME PARENT",
        "gender": "M",
    }
    values.update(fields)
    return {"doc_type": doc_type, "fields": values}


def test_catalogue_covers_every_known_mismatch_kind() -> None:
    catalogue = default_guidance()
    assert len(catalogue.entries) == 17
    assert {template.code for template in catalogue.entries.values()} >= {
        "NAME_FORMAT_ONLY",
        "PARENT_NAME_DIFFERENT",
        "DOB_YEAR_ONLY",
        "GENDER_MISMATCH",
    }
    assert catalogue.fallback.code == "GENERIC_MISMATCH"


@pytest.mark.parametrize(
    "field,a,b,code",
    [
        ("name", "RAVI KUMAR", "Ravi Kumar", "NAME_FORMAT_ONLY"),
        ("name", "RAVI KUMAR", "KUMAR RAVI", "NAME_TOKEN_ORDER"),
        ("name", "K RAVI", "RAVI KUMAR", "NAME_INITIALS_VS_EXPANDED"),
        ("name", "RAVI", "RAVI KUMAR", "NAME_MISSING_TOKEN"),
        ("name", "POOJA SHARMA", "PUJA SHARMA", "NAME_SPELLING_VARIANT"),
        ("name", "PRIYA SHARMA", "PRIYA VERMA", "NAME_DIFFERENT"),
        ("parent_name", "ANITA SINGH", "Anita Singh", "PARENT_NAME_FORMAT_ONLY"),
        ("parent_name", "ANITA SINGH", "SINGH ANITA", "PARENT_NAME_TOKEN_ORDER"),
        ("parent_name", "A SINGH", "ANITA SINGH", "PARENT_NAME_INITIALS_VS_EXPANDED"),
        ("parent_name", "ANITA SINGH", "ANITA KUMARI SINGH", "PARENT_NAME_MISSING_TOKEN"),
        ("parent_name", "POOJA SHARMA", "PUJA SHARMA", "PARENT_NAME_SPELLING_VARIANT"),
        ("parent_name", "PRIYA SHARMA", "PRIYA VERMA", "PARENT_NAME_DIFFERENT"),
        ("dob", "2007-03-14", "2007", "DOB_YEAR_ONLY"),
        ("dob", "2007-03-04", "2007-04-03", "DOB_DAY_MONTH_SWAPPED"),
        ("dob", "2007-03-14", "2007-03-15", "DOB_OFF_BY_SMALL"),
        ("dob", "2007-03-14", "2008-04-14", "DOB_DIFFERENT"),
        ("gender", "M", "F", "GENDER_MISMATCH"),
    ],
)
def test_every_known_discrepancy_maps_to_guidance(field: str, a: str, b: str, code: str) -> None:
    first = doc("aadhaar", **{field: a})
    second = doc("pan", **{field: b})
    report = compare("general", [first, second])
    assert len(report["findings"]) == 1
    assert len(report["guidance"]) == 1
    guidance = report["guidance"][0]
    assert guidance["finding_index"] == 0
    assert guidance["code"] == code
    assert guidance["priority"] in {"optional", "review", "review_first"}
    assert guidance["steps"]
    assert guidance["disclaimer"]


@pytest.mark.parametrize(
    "finding",
    [
        {"field": "future_field", "kind": "future_kind", "docs": []},
        {"field": "name", "docs": []},
        {"kind": "different", "docs": []},
    ],
)
def test_unknown_discrepancy_uses_safe_generic_fallback(finding: dict[str, Any]) -> None:
    guidance = build_guidance([finding], "general", {})
    assert len(guidance) == 1
    assert guidance[0]["code"] == "GENERIC_MISMATCH"
    assert guidance[0]["priority"] == "review"
    assert "not recognised" in guidance[0]["summary"]


def test_matching_and_missing_fields_have_no_guidance() -> None:
    matching = compare(
        "general",
        [doc("aadhaar"), doc("pan")],
    )
    missing = compare(
        "general",
        [doc("aadhaar", name=None), doc("pan", name=None, dob=None)],
    )
    assert matching["guidance"] == []
    assert missing["guidance"] == []


def test_guidance_indexes_follow_sorted_findings() -> None:
    report = compare(
        "general",
        [
            doc("aadhaar", name="K RAVI", dob="2007-03-14", gender="M"),
            doc("passbook", name="RAVI KUMAR", dob="2007-03-15", gender="F"),
        ],
    )
    assert [(item["finding_index"], item["code"]) for item in report["guidance"]] == [
        (0, "DOB_OFF_BY_SMALL"),
        (1, "GENDER_MISMATCH"),
        (2, "NAME_INITIALS_VS_EXPANDED"),
    ]


def test_source_selection_uses_involved_documents_and_purpose() -> None:
    report = compare(
        "pan_aadhaar_link",
        [doc("aadhaar", name="K RAVI"), doc("pan", name="RAVI KUMAR")],
    )
    references = report["guidance"][0]["official_references"]
    assert [reference["source_id"] for reference in references] == [
        "uidai_updates",
        "pan_correction",
        "pan_aadhaar_linking",
    ]
    assert all(reference["status"] == "verified" for reference in references)
    assert all(reference["verified_on"] == "2026-11-27" for reference in references)
    assert any("Income Tax Department" in step for step in report["guidance"][0]["steps"])


def test_epf_purpose_adds_official_source_and_step() -> None:
    report = compare(
        "epf_claim",
        [doc("aadhaar", name="K RAVI"), doc("passbook", name="RAVI KUMAR")],
    )
    guidance = report["guidance"][0]
    assert "epfo_member_faq" in {
        reference["source_id"] for reference in guidance["official_references"]
    }
    assert any("EPFO" in step for step in guidance["steps"])


def test_uninvolved_document_sources_are_not_included() -> None:
    report = compare(
        "general",
        [doc("passport", name="K RAVI"), doc("other", name="RAVI KUMAR")],
    )
    references = report["guidance"][0]["official_references"]
    assert [reference["source_id"] for reference in references] == ["passport_change"]


def test_guidance_never_contains_document_values() -> None:
    report = compare(
        "general",
        [
            doc("aadhaar", name="SECRETNAME", dob="1999-12-31"),
            doc("pan", name="OTHERSECRET", dob="2000-01-01"),
        ],
    )
    serialized = json.dumps(report["guidance"])
    assert "SECRETNAME" not in serialized
    assert "OTHERSECRET" not in serialized
    assert "1999-12-31" not in serialized
    assert "2000-01-01" not in serialized


def test_guidance_is_deterministic() -> None:
    documents = [doc("aadhaar", name="K RAVI"), doc("pan", name="RAVI KUMAR")]
    assert compare("general", documents) == compare("general", documents)


def _catalogue_data() -> dict[str, Any]:
    path = Path(__file__).resolve().parents[2] / "engine" / "guidance.yaml"
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def _write_catalogue(tmp_path: Path, data: dict[str, Any]) -> Path:
    path = tmp_path / "guidance.yaml"
    path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
    return path


@pytest.mark.parametrize(
    "mutate,error",
    [
        (lambda data: data["sources"]["uidai_updates"].update(status="maybe"), "status"),
        (lambda data: data["sources"].pop("uidai_updates"), "every approved source"),
        (lambda data: data["sources"]["uidai_updates"].update(url="http://example.test"), "HTTPS"),
        (
            lambda data: data["sources"]["uidai_updates"].update(
                url="https://example.test/official"
            ),
            "approved official host",
        ),
        (
            lambda data: data["document_sources"].update(aadhaar=["missing_source"]),
            "unknown source",
        ),
        (lambda data: data["guidance"].pop(), "pairs mismatch"),
        (lambda data: data["guidance"][0].update(code=data["guidance"][1]["code"]), "duplicate"),
        (lambda data: data["guidance"][0].update(steps=[]), "must not be empty"),
        (lambda data: data["fallback"].update(priority="review_first"), "urgency"),
    ],
)
def test_invalid_catalogue_is_rejected(tmp_path: Path, mutate, error: str) -> None:
    data = _catalogue_data()
    mutate(data)
    with pytest.raises(ValueError, match=error):
        load_guidance(_write_catalogue(tmp_path, data))


@pytest.mark.parametrize(
    "claim",
    [
        "Your identity has been verified.",
        "Your identity has been successfully verified.",
        "You are eligible to make the correction.",
        "You are legally eligible to apply.",
        "You qualify for the correction.",
        "The correction will be granted.",
        "The correction is guaranteed.",
        "The correction is assured.",
    ],
)
def test_unsupported_claims_are_rejected(tmp_path: Path, claim: str) -> None:
    data = _catalogue_data()
    data["guidance"][0]["recommended_action"] = claim
    with pytest.raises(ValueError, match="unsupported claim"):
        load_guidance(_write_catalogue(tmp_path, data))


def test_source_needing_verification_is_explicit(tmp_path: Path) -> None:
    data = _catalogue_data()
    data["sources"]["uidai_updates"].update(status="needs_verification", verified_on=None)
    catalogue = load_guidance(_write_catalogue(tmp_path, data))
    guidance = build_guidance(
        [{"field": "name", "kind": "different", "docs": ["aadhaar"]}],
        "general",
        {"aadhaar": "aadhaar"},
        catalogue,
    )
    reference = guidance[0]["official_references"][0]
    assert reference["status"] == "needs_verification"
    assert reference["verified_on"] is None
