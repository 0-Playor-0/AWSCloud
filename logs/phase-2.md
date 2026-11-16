# Phase 2 — Backend (local-deploy mode) — 2026-11-16
## Phase 0 AWS re-run
- `aws sts get-caller-identity` → InvalidClientTokenId. Keys in this container are 14-char placeholders (`prox…`), no AWS_DEFAULT_REGION. Per instruction: no retry → **local-deploy mode** (I write code/tests/template; human runs AWS commands and pastes output)
- Textract smoke, Bedrock models/profiles/quotas, Lambda concurrency limit, budget: moved into `scripts/preflight.sh` for the human to run
## Built
- Engine: Aadhaar caution on "confirm full date of birth" steps is now conditional: "If you need to correct it, date of birth can be updated only once." (source_url kept)
- `backend/`: `app.py` (Powertools HTTP resolver, 4 routes, contract errors, one metadata-only log line per request), `models.py` (pydantic), `imaging.py` (base64 + JPEG magic + SOF dimension parse, no image library), `guard.py` (ID-number guard), `counters.py` (DynamoDB daily cap + stats), `extractors/` (Extractor protocol, `textract`), `parsers/` (Aadhaar, PAN old/new, Class 10, passport MRZ + visual, passbook, other/portal)
- `template.yaml` (SAM): HTTP API (throttle 2 rps / burst 5, CORS from `AllowedOrigins`, metadata-only access log), one Lambda (python3.14, x86_64, 512 MB, 20 s, reserved concurrency param, JSON logs), `nc_counters` table (on-demand, TTL), 14-day log retention, deploy blocked outside ap-south-1 (template Rule)
- `Makefile` (SAM makefile build: copies engine/ + backend/, installs Linux cp314 wheels) · `samconfig.toml` · `backend/requirements.txt`
- `scripts/preflight.sh` (Phase 0 checks + budget), `scripts/smoke_api.sh` (curl every route and error code), `scripts/make_images.py` (synthetic JPEGs)
- Tests: `tests/backend/` (parsers from 18 OCR fixtures, guard, imaging, Stubber tests for DynamoDB + Textract, handler integration for every error code, log-leak test)
## Decisions I made (anything not dictated by HANDOFF.md)
- Extra error codes the contract doesn't list: `400 invalid_request` (schema/JSON/content-type), `413 request_too_large` (compare body > 32 KB), `404 not_found`, `500 internal_error` · all in contract shape
- Aadhaar-like 12-digit check runs on EVERY doc type; PAN-format check only on aadhaar/other (as specified) · a 12-digit bank account number in a passbook crop also triggers a re-crop. Regex requires a first digit of 2–9 (Aadhaar never starts with 0/1)
- Daily cap uses the IST day; counter store down → extract fails closed (502) so cost stays bounded; compare stays 200 (stats best effort)
- Textract Bad/Unsupported/InvalidParameter → `422 unreadable`; Throttling → `429 throttled`; other errors → `502`
- Validation errors report field paths only (pydantic messages can echo input values)
- Powertools drops None-valued keys, so log lines omit `doc_type`/`error_code` when absent
- x86_64, not arm64 · wheels are pinned to the Linux x86_64 platform tag so the build is the same on any dev machine without Docker
- Python 3.14 locally (installed via uv) to match the Lambda runtime; CI → 3.14
- Dev deps added: boto3 (Stubber tests), pillow (synthetic test images), cfn-lint (template lint in CI)
- PAN parser never returns a gender (PAN cards don't show one); passport parser prefers MRZ (check digit validated; bad check → confidence 0.5 → warning)
## Deviations from HANDOFF.md
- `429 throttled` from API Gateway's own throttling returns `{"message":"Too Many Requests"}`, not our error shape: HTTP APIs have no gateway-response customisation. Our handler only emits `throttled` when Textract throttles. Frontend must map a bare 429 → throttled. Approve?
- "Done when" (curl against the deployed API) needs the human: see "What you run"
## Verified facts
- SAM CLI 1.172.1 lists python3.14 · aws-lambda-powertools 3.40.0 · pydantic 2.14.3 · boto3 1.44.3 · pillow 13.0.0 · cfn-lint 1.60.1 (PyPI, 2026-11-16)
- `sam validate --lint` clean · `cfn-lint` clean · `sam build` OK (16 MB package); built package answered health/compare/stats in-process
- Textract DetectDocumentText ≈ $0.0015/page (architect); 300/day cap ≈ $0.45/day worst case
## Tests
- `.venv/bin/pytest --cov=engine --cov=backend` · 279 passed, 0 failed · coverage 97% (engine 100%)
- `.venv/bin/ruff check .` clean
## AWS resources and cost so far
- none created · $0
## Privacy checklist (section 4)
- 1 crop: frontend (Phase 3) · 2 no persistence: pass (no S3, no temp files; DynamoDB holds counters only) · 3 ID guard: pass (tested; discards fields, match never logged) · 4 logging: pass (allow-listed keys; leak test covers extract, compare, validation error, guard hit, bad enum, unexpected exception) · 5 transport: HTTPS-only endpoint, CORS restricted; CloudFront origin added in Phase 5 · 6 Bedrock: not built · 7 consent: Phase 3 · 8 injection: pass (OCR text only ever becomes the 4 fields; fixture test) · 9 samples: Phase 3 · 10 honest claims: no privacy text yet
## What you run (local-deploy mode), then paste the output back
1. `python3.14 -m venv .venv && .venv/bin/pip install -e ".[dev]"` (Pillow is needed by the scripts)
2. `scripts/preflight.sh <your-alert-email>`; optionally `BEDROCK_MODEL_ID=<id from the list> scripts/preflight.sh`
3. If preflight shows ConcurrentExecutions ≤ 100: deploy with `ReservedConcurrency=0`
4. `sam build && sam deploy --parameter-overrides GitSha=$(git rev-parse --short HEAD) [ReservedConcurrency=0]`
5. `scripts/smoke_api.sh <ApiUrl from the deploy output>`; then `sam deploy --parameter-overrides ExtractDailyCap=0 ...`, rerun, expect 429 daily_cap_reached; then redeploy with the cap back at 300
## Open issues and risks
- New accounts often have a Lambda concurrency limit of 10; reserving 5 then fails (AWS keeps 100 unreserved). Parameter added; preflight reports the limit
- Parsers are tuned on synthetic OCR; real layouts need the manual `private_samples/` run
- Aadhaar name = Latin line above the DOB line; a crop with extra Latin text above it may pick the wrong line (user confirms fields anyway)
## Questions for the architect
1. Approve the extra error codes (invalid_request, request_too_large, not_found, internal_error)?
2. Approve the bare-429 mapping for API Gateway throttling?
3. Keep the 12-digit guard on all doc types (privacy first), or limit it to aadhaar/other?
## Suggestions (not built)
- Deploy from GitHub Actions with an OIDC role, so no long-lived keys sit on a laptop or in an environment
- CloudWatch alarm on `counter_unavailable` (planned alarms land in Phase 5)
