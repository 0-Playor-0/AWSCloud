"""Handler integration tests: every route, every error code, and the log-leak check (4.4)."""

from __future__ import annotations

import io
import json

import pytest

from backend.extractors import ExtractorError, ExtractorThrottled
from backend.parsers import OcrLine

from .conftest import jpeg_b64, make_event

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
AADHAAR_LINES = [OcrLine("Ravi Kumar K", 0.97), OcrLine("DOB: 14/03/2007", 0.6),
                 OcrLine("MALE", 0.98)]


# --- happy paths -----------------------------------------------------------------------------

def test_health(fakes, call) -> None:
    status, body = call("GET", "/v1/health")
    assert status == 200 and body == {"ok": True, "extractor": "textract", "version": "dev"}


def test_extract_contract(fakes, call) -> None:
    counters, extractor = fakes
    extractor.lines = AADHAAR_LINES
    status, body = call("POST", "/v1/extract", {"doc_type": "aadhaar", "image_b64": jpeg_b64()})
    assert status == 200
    assert body["fields"] == {
        "name": {"value": "RAVI KUMAR K", "confidence": 0.97},
        "dob": {"value": "2007-03-14", "confidence": 0.6, "precision": "day"},
        "parent_name": {"value": None, "confidence": 0.0},
        "gender": {"value": "M", "confidence": 0.98},
    }
    assert body["warnings"] == ["dob_low_confidence"]
    assert counters.extractions == 1


def test_compare_contract_and_stats(fakes, call) -> None:
    counters, _ = fakes
    status, body = call("POST", "/v1/compare", COMPARE_BODY)
    assert status == 200
    assert set(body) == {"summary", "findings", "fix_plan", "disclaimer"}
    assert body["summary"]["status"] == "mismatches_found"
    assert body["summary"]["counts"] == {"blocking": 2, "risky": 0, "cosmetic": 0}
    assert counters.checks == [True]
    assert call("GET", "/v1/stats") == (200, {"checks": 1, "checks_with_mismatch": 1})


def test_compare_never_capped(fakes, call) -> None:
    counters, _ = fakes
    counters.cap_left = 0
    assert call("POST", "/v1/compare", COMPARE_BODY)[0] == 200


def test_compare_survives_counter_outage(fakes, call) -> None:
    counters, _ = fakes
    counters.fail = True
    assert call("POST", "/v1/compare", COMPARE_BODY)[0] == 200


# --- every error code ------------------------------------------------------------------------

def _extract(call, image_b64: str | None = None, doc_type: str = "aadhaar"):
    return call("POST", "/v1/extract", {"doc_type": doc_type, "image_b64": image_b64 or jpeg_b64()})


def _assert_error(result, status: int, code: str) -> None:
    got_status, body = result
    assert got_status == status, body
    assert set(body) == {"error"} and body["error"]["code"] == code
    assert body["error"]["message"] and body["error"]["hint"]


def test_400_invalid_image(fakes, call) -> None:
    _assert_error(_extract(call, "@@@not-base64@@@"), 400, "invalid_image")


def test_413_image_too_large_dimensions(fakes, call) -> None:
    _assert_error(_extract(call, jpeg_b64(1700, 400)), 413, "image_too_large")


def test_413_image_too_large_body(fakes, call) -> None:
    _assert_error(_extract(call, "A" * 2_300_000), 413, "image_too_large")


def test_422_id_number_detected_discards_fields(fakes, call) -> None:
    _, extractor = fakes
    extractor.lines = [*AADHAAR_LINES, OcrLine("9999 9999 9999", 0.99)]
    status, body = _extract(call)
    _assert_error((status, body), 422, "id_number_detected")
    assert "RAVI" not in json.dumps(body)


def test_422_unreadable(fakes, call) -> None:
    _, extractor = fakes
    extractor.lines = [OcrLine("~ | 12 ..", 0.3), OcrLine("--", 0.2)]
    _assert_error(_extract(call), 422, "unreadable")


def test_429_daily_cap_reached_skips_extractor(fakes, call) -> None:
    counters, extractor = fakes
    counters.cap_left = 0
    _assert_error(_extract(call), 429, "daily_cap_reached")
    assert extractor.calls == 0


def test_429_cap_env_zero(fakes, call) -> None:
    from backend import app as app_module

    app_module.deps.settings.daily_cap = 0
    _assert_error(_extract(call), 429, "daily_cap_reached")


def test_429_throttled(fakes, call) -> None:
    fakes[1].error = ExtractorThrottled
    _assert_error(_extract(call), 429, "throttled")


def test_502_extractor_failed(fakes, call) -> None:
    fakes[1].error = ExtractorError
    _assert_error(_extract(call), 502, "extractor_failed")


def test_502_when_cap_store_down_fails_closed(fakes, call) -> None:
    counters, extractor = fakes
    counters.fail = True
    _assert_error(_extract(call), 502, "extractor_failed")
    assert extractor.calls == 0


@pytest.mark.parametrize(
    "body",
    [
        {"doc_type": "voter_id", "image_b64": "AAAA"},
        {"doc_type": "aadhaar"},
        {"doc_type": "aadhaar", "image_b64": "AAAA", "extra": 1},
    ],
)
def test_400_invalid_request_extract(fakes, call, body) -> None:
    _assert_error(call("POST", "/v1/extract", body), 400, "invalid_request")


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
    fakes[0].fail = True
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
    _, extractor = fakes
    extractor.lines = [*AADHAAR_LINES, OcrLine("Father: KRISHNAN", 0.9)]
    call("POST", "/v1/extract", {"doc_type": "aadhaar", "image_b64": jpeg_b64()})
    call("POST", "/v1/compare", COMPARE_BODY)
    bad = json.loads(json.dumps(COMPARE_BODY))
    bad["documents"][0]["fields"]["dob"] = "RAVI KUMAR 2007-03-14"
    call("POST", "/v1/compare", bad)                                   # validation error
    extractor.lines = [*AADHAAR_LINES, OcrLine("9999 9999 9999", 0.99)]
    call("POST", "/v1/extract", {"doc_type": "aadhaar", "image_b64": jpeg_b64()})  # guard hit
    call("POST", "/v1/extract", {"doc_type": "RAVI KUMAR", "image_b64": "x"})      # bad enum

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
