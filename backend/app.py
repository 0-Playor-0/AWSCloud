"""Lambda entry point: /v1/extract, /v1/compare, /v1/health, /v1/stats.

Privacy (HANDOFF.md section 4): images never reach the server (OCR runs in the browser).
Request bodies, OCR text and field values are never logged or stored. One log line per
request carries only: request_id, route, doc_type, status, latency_ms, extractor, error_code.
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, field
from typing import Any

from aws_lambda_powertools import Logger
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver, Response, content_types
from pydantic import ValidationError

import engine

from . import errors, guard
from .counters import CounterStore, DynamoCounters
from .errors import ApiError
from .extractors import Extractor, ExtractorError, ExtractorThrottled, get_extractor
from .models import CompareRequest, ExtractRequest, GuidanceResponse
from .parsers import FIELD_NAMES, Fields

MAX_EXTRACT_BODY = 32_000  # 40 lines x 120 chars, with room for JSON escapes
MAX_COMPARE_BODY = 32_000
LOW_CONFIDENCE = 0.8

logger = Logger(service="namma-check", log_uncaught_exceptions=False)
app = APIGatewayHttpResolver()


@dataclass
class Settings:
    extractor: str = field(default_factory=lambda: os.environ.get("EXTRACTOR", "client_ocr"))
    daily_cap: int = field(
        default_factory=lambda: int(os.environ.get("EXTRACT_DAILY_CAP", "300"))
    )
    table: str = field(default_factory=lambda: os.environ.get("TABLE_NAME", "nc_counters"))
    version: str = field(default_factory=lambda: os.environ.get("GIT_SHA", "dev"))


class Deps:
    """Lazily created clients; tests replace these attributes."""

    def __init__(self) -> None:
        self.settings = Settings()
        self._extractor: Extractor | None = None
        self._counters: CounterStore | None = None

    @property
    def extractor(self) -> Extractor:
        if self._extractor is None:
            self._extractor = get_extractor(self.settings.extractor)
        return self._extractor

    @extractor.setter
    def extractor(self, value: Extractor) -> None:
        self._extractor = value

    @property
    def counters(self) -> CounterStore:
        if self._counters is None:
            import boto3

            self._counters = DynamoCounters(
                boto3.client("dynamodb"), self.settings.table  # region from the Lambda runtime
            )
        return self._counters

    @counters.setter
    def counters(self, value: CounterStore) -> None:
        self._counters = value


deps = Deps()
_log_ctx: dict[str, Any] = {}  # reset per request; only metadata goes here


def _json_body(max_bytes: int, too_large: ApiError) -> dict[str, Any]:
    headers = {k.lower(): v for k, v in (app.current_event.headers or {}).items()}
    if not headers.get("content-type", "").lower().startswith("application/json"):
        raise errors.invalid_request("Content-Type must be application/json.")
    body = app.current_event.decoded_body or ""
    if len(body) > max_bytes:
        raise too_large
    try:
        data = json.loads(body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise errors.invalid_request("Body is not valid JSON.") from None
    if not isinstance(data, dict):
        raise errors.invalid_request("Body must be a JSON object.")
    return data


def _validate[M](model: type[M], data: dict[str, Any]) -> M:
    try:
        return model.model_validate(data)  # type: ignore[attr-defined]
    except ValidationError as exc:
        # Report field locations only: pydantic messages can echo input values.
        where = sorted({".".join(str(p) for p in e["loc"]) for e in exc.errors()})
        raise errors.invalid_request(f"Invalid or missing: {', '.join(where)}.") from None


def _fields_response(fields: Fields, low_confidence: frozenset[str]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    warnings: list[str] = []
    for name in FIELD_NAMES:
        fv = getattr(fields, name)
        entry: dict[str, Any] = {"value": fv.value, "confidence": fv.confidence}
        if name == "dob":
            entry["precision"] = fv.precision
        out[name] = entry
        if fv.value is not None and (fv.confidence < LOW_CONFIDENCE or name in low_confidence):
            warnings.append(f"{name}_low_confidence")
    return {"fields": out, "warnings": warnings}


@app.post("/v1/extract")
def extract() -> dict[str, Any]:
    req = _validate(ExtractRequest, _json_body(MAX_EXTRACT_BODY, errors.request_too_large()))
    _log_ctx["doc_type"] = req.doc_type  # validated enum value only
    extractor = deps.extractor
    if extractor.metered:  # the daily cap bounds paid extraction only (bedrock)
        try:
            allowed = deps.counters.consume_extraction(deps.settings.daily_cap)
        except Exception:
            raise errors.extractor_failed() from None  # fail closed: the cap bounds cost
        if not allowed:
            raise errors.daily_cap_reached()
    try:
        result = extractor.extract(req.doc_type, req.ocr_lines, req.ocr_confidence)
    except ExtractorThrottled:
        raise errors.throttled() from None
    except ExtractorError:
        raise errors.extractor_failed() from None
    if guard.contains_id_number(req.doc_type, result.raw_text):
        del result  # discard everything, including parsed fields
        raise errors.id_number_detected()
    if result.fields.empty():
        raise errors.unreadable()
    return _fields_response(result.fields, result.low_confidence)


@app.post("/v1/compare")
def compare() -> dict[str, Any]:
    req = _validate(CompareRequest, _json_body(MAX_COMPARE_BODY, errors.request_too_large()))
    try:
        report = engine.compare(
            req.purpose,
            [d.model_dump() for d in req.documents],
            req.anchor.model_dump() if req.anchor else None,
        )
    except engine.EngineInputError:
        raise errors.invalid_request("The documents could not be compared.") from None
    try:
        validated_guidance = GuidanceResponse.model_validate({"guidance": report["guidance"]})
        if len(validated_guidance.guidance) != len(report["findings"]):
            raise ValueError("guidance does not match findings")
        report["guidance"] = validated_guidance.model_dump(mode="json")["guidance"]
    except (KeyError, TypeError, ValueError):
        raise errors.internal_error() from None
    try:
        deps.counters.record_check(report["summary"]["status"] == "mismatches_found")
    except Exception:
        _log_ctx["error_code"] = "counter_unavailable"  # stats are best effort
    return report


@app.get("/v1/health")
def health() -> dict[str, Any]:
    return {"ok": True, "extractor": deps.settings.extractor, "version": deps.settings.version}


@app.get("/v1/stats")
def stats() -> dict[str, int]:
    try:
        return deps.counters.stats()
    except Exception:
        raise errors.internal_error() from None


def _error_response(err: ApiError) -> Response:
    _log_ctx["error_code"] = err.code
    return Response(
        status_code=err.status,
        content_type=content_types.APPLICATION_JSON,
        body=json.dumps(err.body()),
    )


@app.exception_handler(ApiError)
def handle_api_error(err: ApiError) -> Response:
    return _error_response(err)


@app.exception_handler(Exception)
def handle_unexpected(_: Exception) -> Response:
    return _error_response(errors.internal_error())


@app.not_found
def handle_not_found(_: Exception) -> Response:
    return _error_response(errors.not_found())


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    start = time.perf_counter()
    _log_ctx.clear()
    try:
        response = app.resolve(event, context)
    except Exception:  # malformed event: answer in contract shape, log nothing from it
        err = errors.internal_error()
        _log_ctx["error_code"] = err.code
        response = {
            "statusCode": err.status,
            "headers": {"Content-Type": content_types.APPLICATION_JSON},
            "body": json.dumps(err.body()),
            "isBase64Encoded": False,
        }
    request_ctx = event.get("requestContext") or {}
    logger.info(
        "request",
        request_id=request_ctx.get("requestId"),
        route=event.get("routeKey") or event.get("rawPath"),
        doc_type=_log_ctx.get("doc_type"),
        status=response.get("statusCode"),
        latency_ms=round((time.perf_counter() - start) * 1000),
        extractor=deps.settings.extractor,
        error_code=_log_ctx.get("error_code"),
    )
    return response
