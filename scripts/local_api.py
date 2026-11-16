"""Local API for frontend development: the real Lambda handler behind a stdlib HTTP server.

AWS is replaced by fakes: an in-memory counter store and an extractor that returns fixed,
fictional OCR lines per doc type (the image is ignored). Nothing is logged except the
handler's own metadata-only line.

    .venv/bin/python scripts/local_api.py [--port 8787] [--cap 300]

Test hooks (synthetic, dev only): a crop narrower than 300 px reads as containing a fake
12-digit ID number (-> 422 id_number_detected); narrower than 200 px reads as blank
(-> 422 unreadable).
"""

from __future__ import annotations

import argparse
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend import app as app_module  # noqa: E402
from backend import imaging  # noqa: E402
from backend.extractors import Extraction  # noqa: E402
from backend.parsers import OcrLine, parse  # noqa: E402

FAKE_LINES: dict[str, list[str]] = {
    "aadhaar": ["SAMPLE", "Ravi Kumar K", "DOB: 14/03/2007", "MALE"],
    "pan": ["SAMPLE", "Name", "RAVI KUMAR", "Father's Name", "KRISHNAN K",
            "Date of Birth", "14/03/2007"],
    "marksheet10": ["SAMPLE", "Name of Candidate: K RAVI KUMAR",
                    "Father's Name: KRISHNAN", "Date of Birth: 14-03-2007"],
    "passport": ["SAMPLE", "Surname", "KUMAR", "Given Name(s)", "RAVI",
                 "Date of Birth", "14/03/2007", "Sex", "M"],
    "passbook": ["SAMPLE", "Customer Name: RAVI KUMAR", "DOB: 14-Mar-2007"],
    "other": ["SAMPLE", "Member Name: RAVI KUMAR K", "Date of Birth: 14/03/2007", "Gender: Male"],
}
FAKE_ID_LINE = "9999 9999 9999"  # synthetic


class MemoryCounters:
    def __init__(self) -> None:
        self.extractions = 0
        self.checks = 0
        self.mismatches = 0

    def consume_extraction(self, cap: int) -> bool:
        if self.extractions >= cap:
            return False
        self.extractions += 1
        return True

    def record_check(self, mismatch: bool) -> None:
        self.checks += 1
        self.mismatches += int(mismatch)

    def stats(self) -> dict[str, int]:
        return {"checks": self.checks, "checks_with_mismatch": self.mismatches}


class FakeExtractor:
    name = "local-fake"

    def extract(self, doc_type: str, image: bytes) -> Extraction:
        width = (imaging.jpeg_size(image) or (0, 0))[0]
        texts = [] if width < 200 else list(FAKE_LINES[doc_type])
        if 200 <= width < 300:
            texts.append(FAKE_ID_LINE)
        lines = [OcrLine(t, 0.95) for t in texts]
        return Extraction("\n".join(texts), parse(doc_type, lines))


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
    ap.add_argument("--cap", type=int, default=300, help="daily extraction cap (0 = forced off)")
    args = ap.parse_args()
    app_module.deps.settings.daily_cap = args.cap
    app_module.deps.settings.version = "local"
    app_module.deps.settings.extractor = FakeExtractor.name
    app_module.deps.extractor = FakeExtractor()
    app_module.deps.counters = MemoryCounters()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"local API on http://127.0.0.1:{args.port} (cap {args.cap})", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
