"""Property tests: comparison is symmetric; identical inputs give all_match."""

from hypothesis import given
from hypothesis import strategies as st

from engine import compare, dates, names

token = st.one_of(
    st.text(alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ", min_size=1, max_size=9),
    st.sampled_from(["MR", "SMT", "KUMARI", "K", "R", "RAVI", "KUMAR", "SHARMA"]),
)
name = st.lists(token, min_size=1, max_size=7).map(" ".join)
dob = st.one_of(
    st.dates().filter(lambda d: d.year >= 1000).map(lambda d: d.isoformat()),
    st.integers(1900, 2025).map(str),
)
gender = st.sampled_from(["M", "F", "O", None])
doc_type = st.sampled_from(["aadhaar", "pan", "marksheet10", "passport", "passbook", "other"])
fields = st.fixed_dictionaries(
    {"name": st.one_of(name, st.none()), "dob": st.one_of(dob, st.none()),
     "parent_name": st.one_of(name, st.none()), "gender": gender}
)
purpose = st.sampled_from(["general", "pan_aadhaar_link", "epf_claim"])


@given(name, name)
def test_name_classify_symmetric(a: str, b: str) -> None:
    assert names.classify(a, b) == names.classify(b, a)


@given(dob, dob)
def test_dob_classify_symmetric(a: str, b: str) -> None:
    assert dates.classify(a, b) == dates.classify(b, a)


@given(purpose, doc_type, doc_type, fields, fields)
def test_compare_symmetric(p: str, ta: str, tb: str, fa: dict, fb: dict) -> None:
    def key(report: dict) -> tuple:
        return (
            report["summary"],
            sorted((f["field"], f["kind"], f["severity"]) for f in report["findings"]),
        )

    forward = compare(p, [{"doc_type": ta, "fields": fa}, {"doc_type": tb, "fields": fb}])
    backward = compare(p, [{"doc_type": tb, "fields": fb}, {"doc_type": ta, "fields": fa}])
    assert key(forward) == key(backward)


@given(purpose, st.lists(doc_type, min_size=2, max_size=6), fields)
def test_identical_inputs_all_match(p: str, types: list[str], f: dict) -> None:
    report = compare(p, [{"doc_type": t, "fields": f} for t in types])
    assert report["summary"]["status"] == "all_match"
    assert report["findings"] == [] and report["fix_plan"] == []
