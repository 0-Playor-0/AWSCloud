# Phase 3 — Frontend core (+ Phase 2 review, AWS attempt) — 2026-11-16
## Section A — AWS (one attempt)
- aws CLI and SAM were not installed in this container; installed with `uv tool` (aws-cli 1.46.3, SAM CLI 1.172.1)
- `aws sts get-caller-identity` → OK: IAM user `namma-check-deploy` (not root), region ap-south-1
- `scripts/preflight.sh <email>` → every call after STS is AccessDenied: lambda:GetAccountSettings, textract:DetectDocumentText, bedrock:ListFoundationModels / ListInferenceProfiles / GetModelInvocationLoggingConfiguration, servicequotas:ListServiceQuotas, budgets:ModifyBudget / ViewBudget. Also denied: cloudformation:ListStacks, lambda:ListFunctions, dynamodb:ListTables, iam:List*; s3:ListAllMyBuckets is an **explicit deny**
- Result: identity works, but the user has no permissions → no build/deploy/smoke/cap test. Per instruction: no credential debugging; Phase 3 built against a local API (below)
- Textract works: **unknown** (denied) · Bedrock models/profiles/quotas: **unknown** (denied) · Lambda concurrency limit: **unknown** (denied)
- **Budget NOT created** (denied). It must exist before the first deploy
- Resources created: none · spend: $0
- Needed on the deploy user (human, IAM console): CloudFormation (stack + changesets for `namma-check*`), S3 (SAM artifact bucket; remove the explicit deny or scope it), Lambda, API Gateway, DynamoDB, Logs, IAM role create/pass for the function role, textract:DetectDocumentText, bedrock list/get read-only, servicequotas:List*, lambda:GetAccountSettings, budgets:ModifyBudget/ViewBudget. Options: (a) attach a scoped policy I draft next session, (b) attach AWS managed policies for these services temporarily, (c) deploy from GitHub Actions with an OIDC role (suggestion from Phase 2)
## Section B — Phase 2 review (applied)
- B1: HANDOFF.md contract now lists `400 invalid_request`, `413 request_too_large`, `404 not_found`, `500 internal_error`, and that a bare API Gateway 429 means `throttled`
- B2: `backend/guard.py`: aadhaar/other → any 12-digit number (any first digit) or PAN format rejects; other doc types → only Verhoeff-valid 12-digit numbers reject. Returns a bool only. HANDOFF.md 4.3 updated to match (4.10 honest claims). Tests: 21-row guard table, Verhoeff vectors, and a 6-row handler test that asserts the digits never appear in the response body or logs
- B3: the choice was left as a placeholder in the instructions → **left as is** (non-destructive default). History still carries the author email on all commits. Say "switch" and give the no-reply address to rewrite
## Built (Phase 3)
- `frontend/` Vite 8 + React 19 + TS 7 + Tailwind 4: purpose picker; add-document card (doc type + tabs Photo / Type it / Sample); crop (react-easy-crop, 3:1 or 4:3) → canvas re-encode → browser-image-compression (≤1600 px, ≤1.4 MB JPEG, lazy-loaded) → "This exact image will be sent" preview; Aadhaar guidance; consent dialog before first upload (memory only, upload continues on "I understand", nothing sent on "Not now"); field confirmation with low-confidence hints and year-only DOB; document list with edit/remove (2–6); report (status, counts, findings with per-doc values in mono, fix plan with caution + source); "Which document is correct?" anchor picker → re-compare; 3 fictional sample personas; all strings in `src/strings/en.json`
- Errors: `lib/api.ts` classifies replies: contract body → its code; bare 429 → `throttled`; any other non-contract reply or bad 2xx shape → `unexpected` (generic retry); fetch failure/30 s timeout → `network`. Extract retries once on 502. `daily_cap_reached` disables the Photo tab for the session and switches to typed mode
- `scripts/local_api.py`: the real Lambda handler behind a stdlib HTTP server, fake extractor (fixed fictional OCR lines; crop width 200–299 px → synthetic ID number, <200 px → blank) and in-memory counters; `--cap N`
- CI: new `frontend` job (lint, unit tests, build)
## Decisions I made
- shadcn/ui components (Button, Card, Dialog, Tabs, Alert, Progress) written by hand in shadcn style on `radix-ui` · the shadcn registry host is blocked by this container's network
- Motion and self-hosted fonts not added yet · Phase 3 is functional styling; they land in Phase 4 (no unused deps)
- Consent copy says the server keeps "only anonymous counts" · the earlier draft "nothing is saved" would be false (DynamoDB counters)
- e2e specs live in `frontend/e2e/` (not `tests/e2e/`) so they resolve `@playwright/test` from `frontend/node_modules`
## Deviations from HANDOFF.md
- Phase 3 "done when" says "against the live API": done against the local API (real handler, fake AWS) because AWS access is blocked. Needs a re-run once deployed (`E2E_BASE_URL=... npm run e2e` points the default project at it)
- e2e folder location (above). Approve?
## Verified facts
- npm, 2026-11-16, pinned exact: react/react-dom 19.3.1 · vite 8.3.8 · typescript 7.0.2 · tailwindcss + @tailwindcss/vite 4.3.5 · radix-ui 1.8.1 · react-easy-crop 6.2.5 · browser-image-compression 2.0.2 (last release 2023; works, lazy-loaded) · cva 0.7.1 · clsx 2.1.1 · tailwind-merge 3.7.0 · vitest 5.1.0 · @playwright/test 1.63.0 (matches the preinstalled Chromium) · oxlint 1.94.0
- Build: initial JS 114 KB gzip (budget 200), CSS 4.6 KB, compression chunk 20 KB on demand
- Palette contrast on white: ink 16:1, stamp red ≈5:1, green ≈5.3:1 (AA); amber text uses #8a5a00 (≈5.9:1); amber #E9A23B only as a badge background under ink text
## Tests
- `.venv/bin/pytest --cov=engine --cov=backend` · 301 passed · ruff clean
- `npm test` (vitest) · 34 passed · `npm run lint` clean · `npm run build` OK
- `npm run e2e` (Playwright, Pixel 7 viewport, local API) · 14 passed: sample flow, typed flow + anchor, all-match, photo flow (consent gate, ≤1600 px preview, extract, confirm, consent remembered), id_number_detected, unreadable, consent declined, bare 429 / non-contract 503 / contract 400 with retry, validation, no horizontal scroll, and with **cap = 0**: typed and sample flows work, Photo tab disabled
## AWS resources and cost so far
- none · $0
## Privacy checklist (section 4)
- 1 crop: pass (canvas re-encode strips EXIF; exact preview shown; Aadhaar guidance) · 2 no persistence: pass (no browser storage; object URLs revoked) · 3 ID guard: pass (B2) · 4 logging: pass (frontend logs nothing) · 5 transport: CORS unchanged, CloudFront in Phase 5 · 6 Bedrock: not built · 7 consent: pass (memory only) · 8 injection: pass · 9 samples: pass (field sets only, marked SAMPLE, no numbers/layouts) · 10 honest claims: see open issue 2
## Open issues and risks
1. AWS: deploy user has no permissions and no budget exists (section A). Nothing can deploy until fixed
2. Textract may use content to improve AWS services unless an AWS Organizations AI-services opt-out policy is set. Not verified (network); if true, the consent text "the image is discarded" needs that opt-out to stay honest
3. Fake extractor ignores the image; real parser behaviour on real crops is still untested
## Questions for the architect
1. Which AWS permission option (a/b/c in section A)?
2. Approve `frontend/e2e/` as the e2e location?
3. Git history: switch to a no-reply address and rewrite, or leave?
## Suggestions (not built)
- Run the Playwright suite in CI (needs Python + browser setup; ~2 min)
- Lazy-load react-easy-crop with the Photo tab to cut initial JS further (Phase 4 performance pass)
