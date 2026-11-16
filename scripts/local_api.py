"""Local API for frontend development: the real Lambda handler behind a stdlib HTTP server.

Extraction is the real client_ocr path (it needs no AWS). Only the DynamoDB counter store is
replaced, by an in-memory one. Nothing is logged except the handler's own metadata-only line.

    .venv/bin/python scripts/local_api.py [--port 8787]
"""

from __future__ import annotations

import argparse
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend import app as app_module  # noqa: E402


class MemoryCounters:
    def __init__(self) -> None:
        self.checks = 0
        self.mismatches = 0

    def consume_extraction(self, cap: int) -> bool:  # metered extractors only; none locally
        return cap > 0

    def record_check(self, mismatch: bool) -> None:
        self.checks += 1
        self.mismatches += int(mismatch)

    def stats(self) -> dict[str, int]:
        return {"checks": self.checks, "checks_with_mismatch": self.mismatches}


def _event(method: str, path: str, headers: dict[str, str], body: str | None) -> dict[str, Any]:
    route = f"{method} {path}"
    return {
        "version": "2.0",
        "routeKey": route,
        "rawPath": path,
        "rawQueryString": "",
        "headers": {k.lower(): v for k, v in headers.items()},
        "requestContext": {
            "http": {"method": method, "path": path, "protocol": "HTTP/1.1",
                     "sourceIp": "127.0.0.1", "userAgent": "local"},
            "requestId": "local", "routeKey": route, "stage": "$default",
        },
        "body": body,
        "isBase64Encoded": False,
    }


class Handler(BaseHTTPRequestHandler):
    def _dispatch(self) -> None:
        length = int(self.headers.get("content-length") or 0)
        body = self.rfile.read(length).decode("utf-8", "replace") if length else None
        path = self.path.split("?", 1)[0]
        result = app_module.handler(_event(self.command, path, dict(self.headers), body), None)
        payload = (result.get("body") or "").encode()
        self.send_response(result["statusCode"])
        for key, value in (result.get("headers") or {}).items():
            self.send_header(key, value)
        self.send_header("content-length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    do_GET = do_POST = _dispatch

    def log_message(self, *_: Any) -> None:  # the handler already logs metadata only
        pass


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8787)
    args = ap.parse_args()
    app_module.deps.settings.version = "local"
    app_module.deps.counters = MemoryCounters()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"local API on http://127.0.0.1:{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
