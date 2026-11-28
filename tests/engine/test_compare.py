"""Report, purpose rules and fix-plan tests for engine.compare."""

from typing import Any

import pytest

from engine import EngineInputError, compare
from engine.rules import default_rules

LIMITS = default_rules()["R-AADHAAR-LIMITS"]


def doc(doc_type: str, name=None, dob=None, parent_name=None, gender=None) -> dict[str, Any]:
    return {
        "doc_type": doc_type,
        "fields": {"name": name, "dob": dob, "parent_name": parent_name, "gender": gender},
    }


def test_all_match() -> None:
    r = compare("general", [doc("aadhaar", "RAVI KUMAR", "2007-03-14", gender="M"),
                            doc("pan", "RAVI KUMAR", "2007-03-14", gender="M")])
    assert r["summary"] == {"status": "all_match",
                            "counts": {"blocking": 0, "risky": 0, "cosmetic": 0}}
    assert r["findings"] == [] and r["fix_plan"] == []
    assert r["disclaimer"] == "Self-check only. Not legal advice. Authorities decide."


def test_cosmetic_only_is_minor() -> None:
    r = compare("general", [doc("aadhaar", "R.K. SHARMA"), doc("pan", "R K SHARMA")])
    assert r["summary"]["status"] == "minor_differences"
    assert r["summary"]["counts"]["cosmetic"] == 1
    assert r["fix_plan"] == []  # cosmetic differences need no fix


def test_finding_shape_matches_contract() -> None:
    r = compare("general", [doc("aadhaar", "K RAVI"), doc("pan", "RAVI KUMAR")])
    (f,) = r["findings"]
    assert f["field"] == "name" and f["kind"] == "initials_vs_expanded"
    assert f["severity"] == "risky" and f["docs"] == ["aadhaar", "pan"]
    assert f["values"] == {"aadhaar": "K RAVI", "pan": "RAVI KUMAR"}
    assert isinstance(f["explanation"], str) and f["rule_ids"] == []
    assert r["summary"]["status"] == "mismatches_found"


@pytest.mark.parametrize(
    "field,a,b,severity",
    [
        ("dob", "2007-03-14", "2007-03-15", "blocking"),
        ("dob", "2007-03-04", "2007-04-03", "blocking"),
        ("dob", "2007", "2007-03-14", "risky"),
        ("gender", "M", "F", "blocking"),
        ("parent_name", "S KUMAR", "SURESH KUMAR", "risky"),
        ("name", "PRIYA SHARMA", "PRIYA VERMA", "blocking"),
    ],
)
def test_field_severity(field: str, a: str, b: str, severity: str) -> None:
    r = compare("general", [doc("aadhaar", **{field: a}), doc("pan", **{field: b})])
    assert [f["severity"] for f in r["findings"]] == [severity]


def test_missing_values_ignored() -> None:
    r = compare("general", [doc("aadhaar", "RAVI KUMAR", None, gender=None),
                            doc("marksheet10", None, "2007-03-14", gender="M")])
    assert r["summary"]["status"] == "all_match"


def test_blank_strings_treated_as_missing() -> None:
    r = compare("general", [doc("aadhaar", "  ", " ", gender=" "), doc("pan", "RAVI", "2007")])
    assert r["summary"]["status"] == "all_match"


def test_findings_sorted_by_severity() -> None:
    r = compare("general", [doc("aadhaar", "R.K. SHARMA", "2007-03-14", gender="M"),
                            doc("pan", "R K SHARMA", "2007-03-15", gender="M"),
                            doc("passport", "RAJESH K SHARMA", "2007-03-14", gender="M")])
    severities = [f["severity"] for f in r["findings"]]
    assert severities == sorted(severities, key=["blocking", "risky", "cosmetic"].index)


def test_duplicate_doc_types_get_unique_ids() -> None:
    r = compare("general", [doc("other", "RAVI"), doc("other", "RAVI KUMAR")])
    assert r["findings"][0]["docs"] == ["other", "other_2"]


def test_anchor_compares_against_anchor_only() -> None:
    docs = [doc("aadhaar", "RAVI KUMAR"), doc("pan", "RAVI KUMAR"), doc("passbook", "K RAVI")]
    unanchored = compare("general", docs)
    anchored = compare("general", docs, {"name": "pan"})
    assert len(unanchored["findings"]) == 2  # aadhaar–passbook and pan–passbook
    assert [f["docs"] for f in anchored["findings"]] == [["pan", "passbook"]]


# --- purpose rules ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "docs,severity,rule_ids,note",
    [
        # Name findings stay risky for EPF (no longer raised to blocking) and say "may be rejected".
        ([("aadhaar", "K RAVI"), ("passbook", "RAVI KUMAR")], "risky", ["R-EPF-MISMATCH"],
         "may be rejected"),
        ([("pan", "K RAVI"), ("passbook", "RAVI KUMAR")], "risky", ["R-EPF-MISMATCH"],
         "may be rejected"),
        # Cosmetic findings get no annotation.
        ([("aadhaar", "R.K. SHARMA"), ("pan", "RK SHARMA")], "cosmetic", [], None),
    ],
)
def test_epf_name_findings(docs, severity, rule_ids, note) -> None:
    f = compare("epf_claim", [doc(t, n) for t, n in docs])["findings"][0]
    assert f["severity"] == severity and f["rule_ids"] == rule_ids
    if note:
        assert note in f["explanation"]
        assert "commonly rejected" not in f["explanation"]  # the source does not cover names


def test_epf_name_never_raised_above_general() -> None:
    docs = [doc("aadhaar", "K RAVI"), doc("passbook", "RAVI KUMAR")]
    general = compare("general", docs)["findings"][0]["severity"]
    assert compare("epf_claim", docs)["findings"][0]["severity"] == general == "risky"


def test_epf_dob_stays_blocking_with_sourced_statement() -> None:
    docs = [doc("aadhaar", "RAVI", dob="2007-03-14"), doc("passbook", "RAVI", dob="2007-04-14")]
    f = compare("epf_claim", docs)["findings"][0]
    assert f["field"] == "dob" and f["severity"] == "blocking"
    assert f["rule_ids"] == ["R-EPF-MISMATCH"]
    assert "commonly rejected when the date of birth, Aadhaar details or bank details" in (
        f["explanation"]
    )


def test_pan_aadhaar_link_annotates_with_may() -> None:
    f = compare("pan_aadhaar_link", [doc("aadhaar", "K RAVI"), doc("pan", "RAVI KUMAR")])
    finding = f["findings"][0]
    assert finding["rule_ids"] == ["R-PAN-AADHAAR-LINK"]
    assert "may fail" in finding["explanation"]
    assert finding["severity"] == "risky"  # unverified rule never raises severity


def test_pan_aadhaar_link_ignores_other_pairs() -> None:
    f = compare("pan_aadhaar_link", [doc("passport", "K RAVI"), doc("pan", "RAVI KUMAR")])
    assert f["findings"][0]["rule_ids"] == []


# --- fix plan --------------------------------------------------------------------------------

def test_fix_plan_without_anchor_asks_user() -> None:
    r = compare("general", [doc("aadhaar", "K RAVI"), doc("pan", "RAVI KUMAR")])
    (step,) = r["fix_plan"]
    assert step["doc"] is None and "Decide which document" in step["action"]


def test_fix_plan_anchor_aadhaar_never_changes_aadhaar() -> None:
    r = compare("general", [doc("aadhaar", "RAVI KUMAR"), doc("pan", "K RAVI"),
                            doc("passbook", "RAVI KUMAAR")], {"name": "aadhaar"})
    assert [s["doc"] for s in r["fix_plan"]] == ["pan", "passbook"]
    assert all(s["caution"] is None for s in r["fix_plan"])


def test_fix_plan_anchor_pan_changes_aadhaar_last_with_caution() -> None:
    r = compare("general", [doc("aadhaar", "K RAVI"), doc("pan", "RAVI KUMAR"),
                            doc("passbook", "RAVI")], {"name": "pan"})
    plan = r["fix_plan"]
    assert [s["doc"] for s in plan] == ["passbook", "aadhaar"]
    assert [s["step"] for s in plan] == [1, 2]
    assert plan[1]["caution"] == LIMITS.statement
    assert plan[1]["source_url"] == LIMITS.source_url
    assert plan[1]["action"] == "Correct name on your Aadhaar to match your PAN card"


def test_fix_plan_every_aadhaar_step_has_caution() -> None:
    r = compare("general", [doc("aadhaar", "K RAVI", "2007-03-14", gender="F"),
                            doc("passport", "RAVI KUMAR", "2007-03-15", gender="M")],
                {"name": "passport", "dob": "passport", "gender": "passport"})
    assert len(r["fix_plan"]) == 3
    assert all(s["doc"] == "aadhaar" and s["caution"] == LIMITS.statement for s in r["fix_plan"])


def test_fix_plan_skips_cosmetic_docs() -> None:
    r = compare("general", [doc("aadhaar", "RAVI KUMAR"), doc("pan", "Ravi Kumar"),
                            doc("passbook", "K RAVI")], {"name": "aadhaar"})
    assert [s["doc"] for s in r["fix_plan"]] == ["passbook"]


def test_fix_plan_anchor_missing_value_falls_back_to_ask() -> None:
    r = compare("general", [doc("aadhaar", "K RAVI"), doc("pan", "RAVI KUMAR"),
                            doc("passport", None, "2007-03-14")], {"name": "passport"})
    assert [s["doc"] for s in r["fix_plan"]] == [None]


def test_fix_plan_mixed_fields_orders_unlimited_docs_first() -> None:
    r = compare("general", [doc("aadhaar", "K RAVI", "2007-03-14"),
                            doc("pan", "RAVI KUMAR", "2007-03-14"),
                            doc("marksheet10", "RAVI KUMAR", "2007-04-14")],
                {"name": "pan", "dob": "aadhaar"})
    assert [(s["doc"], s["step"]) for s in r["fix_plan"]] == [("marksheet10", 1), ("aadhaar", 2)]


def test_year_only_with_matching_year_asks_to_confirm_not_change() -> None:
    r = compare("general", [doc("pan", dob="2007-03-14"), doc("marksheet10", dob="2007")])
    (finding,) = r["findings"]
    assert finding["kind"] == "year_only" and finding["severity"] == "risky"
    (step,) = r["fix_plan"]  # no "decide which document" step: nothing needs changing
    assert step["doc"] == "marksheet10"
    assert step["action"].startswith("Confirm your full date of birth")
    assert "Correct" not in step["action"]


def test_year_only_never_changed_even_with_full_date_anchor() -> None:
    r = compare("general", [doc("pan", dob="2007-03-14"), doc("aadhaar", dob="2007")],
                {"dob": "pan"})
    (step,) = r["fix_plan"]
    assert step["doc"] == "aadhaar" and step["action"].startswith("Confirm")
    assert step["caution"] == "If you need to correct it, date of birth can be updated only once."
    assert step["source_url"] == LIMITS.source_url


def test_confirm_step_on_non_aadhaar_has_no_caution() -> None:
    r = compare("general", [doc("pan", dob="2007-03-14"), doc("marksheet10", dob="2007")])
    assert r["fix_plan"][0]["caution"] is None


def test_year_only_with_different_year_is_blocking_change() -> None:
    r = compare("general", [doc("pan", dob="2007-03-14"), doc("marksheet10", dob="2006")],
                {"dob": "pan"})
    assert r["findings"][0]["kind"] == "different"
    assert r["findings"][0]["severity"] == "blocking"
    assert [s["action"] for s in r["fix_plan"]] == [
        "Correct date of birth on your Class 10 marksheet to match your PAN card"
    ]


def test_year_only_plus_real_dob_mismatch() -> None:
    r = compare("general", [doc("pan", dob="2007-03-14"), doc("passport", dob="2007-03-15"),
                            doc("marksheet10", dob="2007")], {"dob": "pan"})
    assert [(s["doc"], s["action"].split()[0]) for s in r["fix_plan"]] == [
        ("passport", "Correct"), ("marksheet10", "Confirm")
    ]


# --- input errors ----------------------------------------------------------------------------

@pytest.mark.parametrize(
    "purpose,documents,anchor",
    [
        ("visa", [doc("pan", "A"), doc("aadhaar", "A")], None),
        ("general", [doc("pan", "A")], None),
        ("general", [doc("pan", "A")] * 7, None),
        ("general", [doc("pan", "A"), doc("voter_id", "A")], None),
        ("general", [doc("pan", dob="14/03/2007"), doc("aadhaar")], None),
        ("general", [doc("pan", gender="X"), doc("aadhaar")], None),
        ("general", [doc("pan", name=123), doc("aadhaar")], None),
        ("general", [doc("pan", "A"), doc("aadhaar", "A")], {"name": "voter_id"}),
    ],
)
def test_invalid_input_rejected(purpose, documents, anchor) -> None:
    with pytest.raises(EngineInputError):
        compare(purpose, documents, anchor)
