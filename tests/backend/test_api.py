"""Handler integration tests: every route, every error code, and the log-leak check (4.4)."""

from __future__ import annotations

import io
import json

import pytest

from backend.extractors import ExtractorError, ExtractorThrottled

from .conftest import make_event

COMPARE_BODY = {
    "purpose": "epf_claim",
    "documents": [
        {"doc_type": "aadhaar", "fields": {"name": "K RAVI", "dob": "2007-03-14",
                                           "parent_name": "KRISHNAN", "gender": "M"}},
        {"doc_type": "passbook", "fields": {"name": "RAVI KUMAR", "dob": "2007-03-15",
                                            "parent_name": None, "gender": None}},
    ],
    "anchor": {"name": "aadhaar", "dob": None},
}
AADHAAR_LINES = ["Ravi Kumar K", "DOB: 14/03/2007", "MALE"]


# --- happy paths -----------------------------------------------------------------------------

def test_health(fakes, call) -> None:
    status, body = call("GET", "/v1/health")
    assert status == 200 and body == {"ok": True, "extractor": "client_ocr", "version": "dev"}


def _extract(call, lines: list[str] | None = None, doc_type: str = "aadhaar"):
    body = {"doc_type": doc_type, "ocr_lines": AADHAAR_LINES if lines is None else lines}
    return call("POST", "/v1/extract", body)


def test_extract_contract(fakes, call) -> None:
    status, body = _extract(call)
    assert status == 200
    assert body["fields"] == {
        "name": {"value": "RAVI KUMAR K", "confidence": 0.9},
        "dob": {"value": "2007-03-14", "confidence": 0.9, "precision": "day"},
        "parent_name": {"value": None, "confidence": 0.0},
        "gender": {"value": "M", "confidence": 0.9},
    }
    assert body["warnings"] == []
    assert fakes.extractions == 0  # client_ocr is not metered: no cap, no DynamoDB call


def test_extract_low_confidence_warning(fakes, call) -> None:
    # A passport MRZ with a bad DOB check digit lowers that field's confidence.
    mrz = ["P<INDKUMAR<<RAVI<<<<<<<<<<<<<<<<<<<<<<<<<<<<",
           "Z0000000<0IND0703140M3001019<<<<<<<<<<<<<<00"]
    status, body = _extract(call, mrz, "passport")
    assert status == 200 and "dob_low_confidence" in body["warnings"], body


@pytest.mark.parametrize(
    "confidence,warnings",
    [
        (None, []),                       # optional: absent -> no device-based warnings
        ([0.95, 0.95, 0.95], []),
        ([0.95, 0.74, 0.95], ["dob_low_confidence"]),        # DOB line under 0.75
        ([0.5, 0.95, 0.75], ["name_low_confidence"]),        # 0.75 itself is not low
        ([0.1, 0.1, 0.1], ["name_low_confidence", "dob_low_confidence", "gender_low_confidence"]),
    ],
)
def test_extract_device_confidence_only_drives_warnings(fakes, call, confidence, warnings) -> None:
    body = {"doc_type": "aadhaar", "ocr_lines": AADHAAR_LINES}
    if confidence is not None:
        body["ocr_confidence"] = confidence
    status, out = call("POST", "/v1/extract", body)
    assert status == 200 and out["warnings"] == warnings
    # reported confidences are unchanged by the device values
    assert out["fields"]["name"]["confidence"] == 0.9 and out["fields"]["dob"]["confidence"] == 0.9


@pytest.mark.parametrize(
    "confidence",
    [[0.9], [0.9, 0.9, 0.9, 0.9], [0.9, 1.5, 0.9], [0.9, -0.1, 0.9], ["x", 0.9, 0.9]],
)
def test_extract_bad_confidence_is_invalid(fakes, call, confidence) -> None:
    body = {"doc_type": "aadhaar", "ocr_lines": AADHAAR_LINES, "ocr_confidence": confidence}
    _assert_error(call("POST", "/v1/extract", body), 400, "invalid_request")


def test_extract_client_ocr_ignores_cap(fakes, call) -> None:
    from backend import app as app_module

    app_module.deps.settings.daily_cap = 0
    fakes.fail = True  # counter store down must not matter either
    assert _extract(call)[0] == 200


def test_compare_contract_and_stats(fakes, call) -> None:
    counters = fakes
    status, body = call("POST", "/v1/compare", COMPARE_BODY)
    assert status == 200
    assert set(body) == {"summary", "findings", "fix_plan", "guidance", "disclaimer"}
    assert body["summary"]["status"] == "mismatches_found"
    assert body["summary"]["counts"] == {"blocking": 2, "risky": 0, "cosmetic": 0}
    assert [item["code"] for item in body["guidance"]] == [
        "NAME_INITIALS_VS_EXPANDED",
        "DOB_OFF_BY_SMALL",
    ]
    assert [item["finding_index"] for item in body["guidance"]] == [0, 1]
    assert "RAVI" not in json.dumps(body["guidance"])
    assert counters.checks == [True]
    assert call("GET", "/v1/stats") == (200, {"checks": 1, "checks_with_mismatch": 1})


def test_compare_all_match_returns_empty_guidance(fakes, call) -> None:
    body = {
        "purpose": "general",
        "documents": [
            {"doc_type": "aadhaar", "fields": {"name": "RAVI KUMAR", "dob": "2007-03-14"}},
            {"doc_type": "pan", "fields": {"name": "RAVI KUMAR", "dob": "2007-03-14"}},
        ],
    }
    status, response = call("POST", "/v1/compare", body)
    assert status == 200
    assert response["findings"] == []
    assert response["guidance"] == []


@pytest.mark.parametrize(
    "mutate",
    [
        lambda guidance: guidance[0].update(priority="critical"),
        lambda guidance: guidance[0]["official_references"][0].update(url="http://example.test"),
        lambda guidance: guidance[0]["official_references"][0].update(verified_on="2026-99-99"),
        lambda guidance: guidance[0].update(unexpected="value"),
    ],
)
def test_compare_rejects_invalid_guidance_with_safe_error(
    fakes, call, monkeypatch, mutate
) -> None:
    from backend import app as app_module

    _, valid = call("POST", "/v1/compare", COMPARE_BODY)
    invalid = valid
    mutate(invalid["guidance"])
    monkeypatch.setattr(app_module.engine, "compare", lambda *a, **k: invalid)

    status, error = call("POST", "/v1/compare", COMPARE_BODY)
    _assert_error((status, error), 500, "internal_error")
    assert "RAVI" not in json.dumps(error)


def test_compare_requires_guidance_for_every_finding(fakes, call, monkeypatch) -> None:
    from backend import app as app_module

    _, valid = call("POST", "/v1/compare", COMPARE_BODY)
    valid["guidance"] = valid["guidance"][:1]
    monkeypatch.setattr(app_module.engine, "compare", lambda *a, **k: valid)

    _assert_error(call("POST", "/v1/compare", COMPARE_BODY), 500, "internal_error")


def test_compare_never_capped(fakes, call) -> None:
    counters = fakes
    counters.cap_left = 0
    assert call("POST", "/v1/compare", COMPARE_BODY)[0] == 200


def test_compare_survives_counter_outage(fakes, call) -> None:
    counters = fakes
    counters.fail = True
    assert call("POST", "/v1/compare", COMPARE_BODY)[0] == 200


# --- every error code ------------------------------------------------------------------------

def _assert_error(result, status: int, code: str) -> None:
    got_status, body = result
    assert got_status == status, body
    assert set(body) == {"error"} and body["error"]["code"] == code
    assert body["error"]["message"] and body["error"]["hint"]


def test_422_id_number_detected_discards_fields(fakes, call) -> None:
    status, body = _extract(call, [*AADHAAR_LINES, "9999 9999 9999"])
    _assert_error((status, body), 422, "id_number_detected")
    assert "RAVI" not in json.dumps(body)


PASSBOOK_LINES = ["Customer Name: RAVI KUMAR", "DOB: 14/03/2007"]


@pytest.mark.parametrize(
    "doc_type,number,status",
    [
        ("aadhaar", "9999 9999 9998", 422),     # any 12 digits on an Aadhaar crop
        ("other", "1111 1111 1111", 422),
        ("passbook", "9999 9999 9999", 422),    # Verhoeff-valid: looks like Aadhaar
        ("passbook", "9999 9999 9998", 200),    # plain 12-digit account number
        ("marksheet10", "1111 1111 1115", 422),
        ("marksheet10", "1111 1111 1111", 200),
    ],
)
def test_id_guard_by_doc_type_never_echoes_digits(fakes, call, logbuf, doc_type: str,
                                                  number: str, status: int) -> None:
    got_status, body = _extract(call, [*PASSBOOK_LINES, f"A/c {number}"], doc_type)
    assert got_status == status
    if status == 422:
        assert body["error"]["code"] == "id_number_detected"
    digits = number.replace(" ", "")
    for blob in (json.dumps(body), logbuf.getvalue()):
        assert number not in blob and digits not in blob and number[:4] + " " not in blob


def test_422_unreadable(fakes, call) -> None:
    _assert_error(_extract(call, ["~ | 12 ..", "--"]), 422, "unreadable")


def test_429_daily_cap_reached_skips_metered_extractor(metered, call) -> None:
    counters, extractor = metered
    counters.cap_left = 0
    _assert_error(_extract(call), 429, "daily_cap_reached")
    assert extractor.calls == 0


def test_429_cap_env_zero_metered(metered, call) -> None:
    from backend import app as app_module

    app_module.deps.settings.daily_cap = 0
    _assert_error(_extract(call), 429, "daily_cap_reached")


def test_metered_extractor_consumes_cap(metered, call) -> None:
    counters, extractor = metered
    assert _extract(call)[0] == 200
    assert counters.extractions == 1 and extractor.calls == 1


def test_429_throttled(metered, call) -> None:
    metered[1].error = ExtractorThrottled
    _assert_error(_extract(call), 429, "throttled")


def test_502_extractor_failed(metered, call) -> None:
    metered[1].error = ExtractorError
    _assert_error(_extract(call), 502, "extractor_failed")


def test_502_when_cap_store_down_fails_closed(metered, call) -> None:
    counters, extractor = metered
    counters.fail = True
    _assert_error(_extract(call), 502, "extractor_failed")
    assert extractor.calls == 0


@pytest.mark.parametrize(
    "body",
    [
        {"doc_type": "voter_id", "ocr_lines": ["RAVI"]},
        {"doc_type": "aadhaar"},
        {"doc_type": "aadhaar", "ocr_lines": []},
        {"doc_type": "aadhaar", "ocr_lines": ["x"] * 41},
        {"doc_type": "aadhaar", "ocr_lines": ["x" * 121]},
        {"doc_type": "aadhaar", "ocr_lines": [7]},
        {"doc_type": "aadhaar", "ocr_lines": ["RAVI"], "extra": 1},
        {"doc_type": "aadhaar", "image_b64": "/9j/4AAQ"},  # images are no longer accepted
    ],
)
def test_400_invalid_request_extract(fakes, call, body) -> None:
    _assert_error(call("POST", "/v1/extract", body), 400, "invalid_request")


def test_413_extract_too_large(fakes, call) -> None:
    _assert_error(call("POST", "/v1/extract", raw_body=" " * 40_000), 413, "request_too_large")


@pytest.mark.parametrize(
    "mutate",
    [
        lambda b: b.update(purpose="visa"),
        lambda b: b.update(documents=b["documents"][:1]),
        lambda b: b.update(documents=b["documents"] * 4),
        lambda b: b["documents"][0]["fields"].update(dob="14/03/2007"),
        lambda b: b["documents"][0]["fields"].update(gender="X"),
        lambda b: b["documents"][0]["fields"].update(name="A" * 101),
        lambda b: b.update(anchor={"name": "voter_id"}),
    ],
)
def test_400_invalid_request_compare(fakes, call, mutate) -> None:
    body = json.loads(json.dumps(COMPARE_BODY))
    mutate(body)
    _assert_error(call("POST", "/v1/compare", body), 400, "invalid_request")


def test_400_wrong_content_type(fakes, call) -> None:
    _assert_error(call("POST", "/v1/compare", COMPARE_BODY, content_type="text/plain"),
                  400, "invalid_request")


@pytest.mark.parametrize("raw", ["{not json", "[1, 2]", ""])
def test_400_bad_json(fakes, call, raw) -> None:
    _assert_error(call("POST", "/v1/compare", raw_body=raw), 400, "invalid_request")


def test_413_compare_too_large(fakes, call) -> None:
    _assert_error(call("POST", "/v1/compare", raw_body=" " * 40_000), 413, "request_too_large")


def test_404_unknown_route(fakes, call) -> None:
    _assert_error(call("GET", "/v1/nope"), 404, "not_found")


def test_500_stats_unavailable(fakes, call) -> None:
    fakes.fail = True
    _assert_error(call("GET", "/v1/stats"), 500, "internal_error")


def test_500_unexpected_exception(fakes, call, monkeypatch) -> None:
    from backend import app as app_module

    def boom(*_a, **_k):
        raise RuntimeError("SECRET-RAVI-KUMAR")

    monkeypatch.setattr(app_module.engine, "compare", boom)
    _assert_error(call("POST", "/v1/compare", COMPARE_BODY), 500, "internal_error")


def test_500_malformed_event(fakes) -> None:
    from backend import app as app_module

    res = app_module.handler({"version": "2.0", "rawPath": "/v1/health"}, None)
    assert res["statusCode"] == 500
    assert json.loads(res["body"])["error"]["code"] == "internal_error"


# --- logging (HANDOFF 4.4) -------------------------------------------------------------------

ALLOWED_LOG_KEYS = {"request_id", "route", "doc_type", "status", "latency_ms", "extractor",
                    "error_code"}
POWERTOOLS_KEYS = {"level", "location", "message", "timestamp", "service", "sampling_rate",
                   "cold_start", "function_name", "function_memory_size", "function_arn",
                   "function_request_id", "xray_trace_id"}
SECRET_VALUES = ["RAVI", "KUMAR", "KRISHNAN", "2007-03-14", "9999 9999 9999", "SECRET"]


@pytest.fixture
def logbuf():
    """Point the Powertools JSON handler at a buffer for the duration of a test."""
    from backend import app as app_module

    buf = io.StringIO()
    handler = app_module.logger.registered_handler
    old = handler.setStream(buf)
    yield buf
    handler.setStream(old)


def _log_records(buf: io.StringIO) -> list[dict]:
    return [json.loads(x) for x in buf.getvalue().splitlines() if x.strip()]


def test_logs_contain_no_field_values(fakes, call, logbuf, monkeypatch) -> None:
    """Fails if any log record contains a value from any test payload."""
    call("POST", "/v1/extract", {"doc_type": "aadhaar",
                                 "ocr_lines": [*AADHAAR_LINES, "Father: KRISHNAN"]})
    call("POST", "/v1/compare", COMPARE_BODY)
    bad = json.loads(json.dumps(COMPARE_BODY))
    bad["documents"][0]["fields"]["dob"] = "RAVI KUMAR 2007-03-14"
    call("POST", "/v1/compare", bad)                                   # validation error
    call("POST", "/v1/extract",
         {"doc_type": "aadhaar", "ocr_lines": [*AADHAAR_LINES, "9999 9999 9999"]})  # guard hit
    call("POST", "/v1/extract", {"doc_type": "RAVI KUMAR", "ocr_lines": ["RAVI KUMAR"]})  # enum

    from backend import app as app_module

    monkeypatch.setattr(app_module.engine, "compare",
                        lambda *a, **k: (_ for _ in ()).throw(RuntimeError("SECRET RAVI")))
    call("POST", "/v1/compare", COMPARE_BODY)                         # unexpected exception

    records = _log_records(logbuf)
    assert len(records) == 6
    blob = json.dumps(records)
    for value in SECRET_VALUES:
        assert value not in blob, f"log leaked {value!r}"
    for record in records:
        assert set(record) <= ALLOWED_LOG_KEYS | POWERTOOLS_KEYS, set(record)
    assert [r.get("error_code") for r in records] == [
        None, None, "invalid_request", "id_number_detected", "invalid_request", "internal_error"
    ]
    assert records[3]["doc_type"] == "aadhaar" and records[4].get("doc_type") is None


def test_event_body_never_logged_with_debug(fakes, call, logbuf) -> None:
    from backend import app as app_module

    app_module.logger.setLevel("DEBUG")
    try:
        call("POST", "/v1/compare", COMPARE_BODY)
    finally:
        app_module.logger.setLevel("INFO")
    records = _log_records(logbuf)
    assert records and "KRISHNAN" not in json.dumps(records)


def test_base64_encoded_body_accepted(fakes, call) -> None:
    import base64

    from backend import app as app_module

    event = make_event("POST", "/v1/compare", COMPARE_BODY)
    event["body"] = base64.b64encode(event["body"].encode()).decode()
    event["isBase64Encoded"] = True
    assert app_module.handler(event, None)["statusCode"] == 200
