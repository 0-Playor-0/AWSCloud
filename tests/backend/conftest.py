"""Shared fixtures: realistic HTTP API v2 events and fake dependencies."""

from __future__ import annotations

import json
from collections.abc import Callable
from typing import Any

import pytest

from backend import app as app_module
from backend.extractors import Extraction, ExtractorError, ExtractorThrottled
from backend.extractors.client_ocr import ClientOcrExtractor
from backend.parsers import OcrLine, parse


def make_event(method: str, path: str, body: Any = None, content_type: str = "application/json",
               raw_body: str | None = None) -> dict[str, Any]:
    text = raw_body if raw_body is not None else (None if body is None else json.dumps(body))
    headers = {"host": "api.example.test"}
    if content_type:
        headers["content-type"] = content_type
    return {
        "version": "2.0",
        "routeKey": f"{method} {path}",
        "rawPath": path,
        "rawQueryString": "",
        "headers": headers,
        "requestContext": {
            "accountId": "000000000000",
            "apiId": "testapi",
            "domainName": "api.example.test",
            "http": {"method": method, "path": path, "protocol": "HTTP/1.1",
                     "sourceIp": "192.0.2.1", "userAgent": "pytest"},
            "requestId": "req-test-1",
            "routeKey": f"{method} {path}",
            "stage": "$default",
            "time": "16/Nov/2026:10:00:00 +0000",
            "timeEpoch": 1794823200000,
        },
        "body": text,
        "isBase64Encoded": False,
    }


class FakeCounters:
    def __init__(self, cap_left: int = 1000, fail: bool = False) -> None:
        self.cap_left = cap_left
        self.fail = fail
        self.extractions = 0
        self.checks: list[bool] = []

    def consume_extraction(self, cap: int) -> bool:
        if self.fail:
            raise RuntimeError("dynamodb down")
        if cap <= 0 or self.cap_left <= 0:
            return False
        self.cap_left -= 1
        self.extractions += 1
        return True

    def record_check(self, mismatch: bool) -> None:
        if self.fail:
            raise RuntimeError("dynamodb down")
        self.checks.append(mismatch)

    def stats(self) -> dict[str, int]:
        if self.fail:
            raise RuntimeError("dynamodb down")
        return {"checks": len(self.checks), "checks_with_mismatch": sum(self.checks)}


class FakeMeteredExtractor:
    """Stands in for a paid extractor (future bedrock): the daily cap applies to it."""

    name = "fake_metered"
    metered = True

    def __init__(self) -> None:
        self.error: type[Exception] | None = None
        self.calls = 0

    def extract(self, doc_type: str, lines: list[str]) -> Extraction:
        self.calls += 1
        if self.error:
            raise self.error("simulated")
        return Extraction("\n".join(lines), parse(doc_type, [OcrLine(x, 0.95) for x in lines]))


@pytest.fixture
def fakes(monkeypatch: pytest.MonkeyPatch) -> FakeCounters:
    """Default deployment: client_ocr extractor (real), fake counters."""
    counters = FakeCounters()
    monkeypatch.setattr(app_module, "deps", app_module.Deps())
    app_module.deps.counters = counters
    app_module.deps.extractor = ClientOcrExtractor()
    return counters


@pytest.fixture
def metered(fakes: FakeCounters) -> tuple[FakeCounters, FakeMeteredExtractor]:
    extractor = FakeMeteredExtractor()
    app_module.deps.extractor = extractor
    app_module.deps.settings.extractor = extractor.name
    return fakes, extractor


@pytest.fixture
def call() -> Callable[..., tuple[int, dict[str, Any]]]:
    def _call(method: str, path: str, body: Any = None, **kw: Any) -> tuple[int, dict[str, Any]]:
        res = app_module.handler(make_event(method, path, body, **kw), None)
        return res["statusCode"], json.loads(res["body"])

    return _call


__all__ = ["ExtractorError", "ExtractorThrottled", "make_event"]
