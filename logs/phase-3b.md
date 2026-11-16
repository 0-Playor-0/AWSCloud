# Phase 3b — On-device OCR change, git rewrite, AWS retry — 2026-11-16
## AWS (one retry, AdministratorAccess attached)
- Identity OK (IAM user `namma-check-deploy`). The account is **already a member of an AWS Organization** (`o-7kavccgtqi`) whose service control policy explicitly denies calls that AdministratorAccess would allow. I created no Organization and enabled nothing
- Allowed: bedrock:ListFoundationModels, bedrock:ListInferenceProfiles, budgets read/create, organizations:DescribeOrganization
- Denied by SCP `p-ab78f5qb` (explicit deny): lambda:GetAccountSettings, bedrock:GetModelInvocationLoggingConfiguration, servicequotas:ListServiceQuotas, **cloudformation:CreateChangeSet**
- `sam deploy` exact error: `Failed to create managed resources: An error occurred (AccessDenied) when calling the CreateChangeSet operation: User: arn:aws:iam::<account>:user/namma-check-deploy is not authorized to perform: cloudformation:CreateChangeSet on resource: arn:aws:cloudformation:ap-south-1:<account>:stack/aws-sam-cli-managed-default/* with an explicit deny in a service control policy: arn:aws:organizations::<account>:policy/o-7kavccgtqi/service_control_policy/p-ab78f5qb`
- Result: not deployed; smoke test and live e2e not run. All testing ran against the local API (real handler)
- Textract: removed, not tested · Lambda concurrency limit: unknown (SCP) · Bedrock quotas: unknown (SCP) · invocation logging config: unknown (SCP)
- Bedrock in ap-south-1, on-demand with image input: nvidia.nemotron-nano-12b-v2, moonshotai.kimi-k2.5, google.gemma-3-{4b,12b,27b}-it, mistral.mistral-large-3-675b-instruct, mistral.ministral-3-{3b,8b,14b}-instruct, mistral.magistral-small-2509, qwen.qwen3-vl-235b-a22b (+ titan-embed-image)
- India-only (`in.`) profiles: in.anthropic.claude-{sonnet-5, opus-5, haiku-4-5}, in.openai.gpt-5.6-{terra,luna}, in.moonshotai.kimi-k3, kimi-k3.1. Also many `apac.`/`global.` profiles (not allowed by HANDOFF)
- Budget: `namma-check-monthly` **created**, $50/month limit, email alerts at $10/$25/$50 actual (the email is not in the repo). Current spend $0.00
- Resources created: the budget only · spend: $0
## Git
- Branch history rewritten with git-filter-repo: author/committer → `Playor <72272267+0-Playor-0@users.noreply.github.com>`, and the one file mention of the old address replaced. Force-pushed with lease. 0 occurrences left on the branch. No other remote branch carried the old commits. Local git config now uses the no-reply address
## Built (architecture change)
- Frontend: Tesseract.js 7.0.0 (English, LSTM-only, `best_int` model 2.9 MB) lazy-loaded on the first crop. `scripts/copy-ocr-assets.mjs` copies worker + 3 LSTM cores + model into `public/ocr/` at dev/build (git-ignored); `langPath`/`corePath`/`workerPath` point there, `workerBlobURL: false`, so no CDN
- Flow: pick → crop (stays on device) → OCR on device with progress → **review**: crop + exact lines, untick any line → consent (new text) → POST text → confirm fields. `browser-image-compression` removed
- `lib/sanitize.ts`: removes 4-4-4 grouped digits and runs of 9+ digits, collapses spaces, max 40 lines × 120 chars; tells the user how many numbers were removed. Dates are kept
- Backend: `POST /v1/extract {doc_type, ocr_lines}` (1–40 strings, ≤120 chars), body ≤32 KB → `413 request_too_large`. `client_ocr` extractor (default) runs the existing parsers + ID guard on the text. Cap only for `metered` extractors (none built). Removed: `textract.py`, `imaging.py`, `invalid_image`, `image_too_large`, Textract IAM statement, `make_images.py`, Pillow
- HANDOFF.md sections 3, 4, 5, 7 updated (plus CLAUDE.md stack/privacy lines); `docs/build-summary.md` records why Textract was removed
## Decisions I made
- Client sends no per-line OCR confidence (the contract has `string[]`); the server uses a fixed 0.9, so warnings now only come from parser checks (e.g. a bad MRZ check digit) · alternative: extend the contract with confidences
- Users can untick lines before sending · this goes beyond "shows the text" but only reduces what is sent
- Blank/unreadable OCR is handled on the device (no request) with the `unreadable` message
- `local_api.py` now uses the real `client_ocr` extractor (no fakes except counters)
## Deviations from HANDOFF.md
- Phase 3 "done when" (live API) still unmet: deploy blocked by the SCP (see Questions)
## Verified facts
- npm 2026-11-16: tesseract.js 7.0.0 (+ tesseract.js-core 7.0.0), @tesseract.js-data/eng 1.0.0 (4.0.0_best_int). OCR payload on first photo use: worker 0.1 MB + core ~3.9 MB + model 2.9 MB (cached afterwards)
## Tests
- pytest 289 passed, coverage 99% · ruff, cfn-lint, `sam validate --lint`, `sam build` clean
- vitest 54 passed (adds sanitize table, request-body shape, diff) · Playwright 16 passed (Pixel 7). Real Tesseract runs in the photo tests. Every photo test records all requests and asserts: same origin only (no CDN), no body over 8 KB, no `data:image`, JPEG/PNG base64 signature or long base64 run
## Privacy checklist (section 4)
- 1 photos stay on device: pass (e2e asserts no image data leaves) · 2 no persistence: pass · 3 guard: client strip + server guard, pass · 4 logging: pass (log-leak test kept, uses ocr_lines) · 5 transport: CORS unchanged · 6 Bedrock: off · 7 consent: new text, pass · 8 injection: pass · 9 samples: pass · 10 honest claims: the consent text now matches the code; the stats counter is not part of extraction
## Questions for the architect
1. The account is inside an Organization whose SCP blocks CloudFormation. Is this an event/sponsor-managed account? Options: (a) ask the org admin to allow CloudFormation, Lambda, API Gateway, DynamoDB, Logs, IAM role creation in ap-south-1; (b) use a different standalone Free plan account; (c) deploy without CloudFormation (direct API calls): **not recommended**, it breaks the SAM/IaC rule
2. OK to keep the fixed 0.9 line confidence, or extend the contract with per-line confidences from Tesseract?
