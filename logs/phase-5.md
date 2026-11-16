# Phase 5 — Ship and harden (+ review items A, B) — 2026-11-16
**Public URL: https://d3glxkvs4n9ily.cloudfront.net** · API: https://lc3eksjo9h.execute-api.ap-southeast-2.amazonaws.com
## Built
- A1 `/v1/extract` takes optional `ocr_confidence` (0–1 per line, same length as `ocr_lines`). The server parses twice: once at fixed 0.9 for reported confidences (unchanged), once with the device values only to add `<field>_low_confidence` for fields from lines under 0.75. Contract in HANDOFF.md §3
- A2 Photo tab shows "one-time download of about 7 MB" with a **Type it instead** button. The read button says "Download (about 7 MB, one time) and read". Byte progress (MB of MB), then recognition progress. The client prefetches exactly the files the worker uses (it picks the SIMD or plain core itself). OCR files now live under `/ocr/t7.0.0-c7.0.0-e1.0.0/` with `Cache-Control: public,max-age=31536000,immutable`. Tesseract's IndexedDB model cache is off (`cacheMethod: none`)
- A3 `frontend/src/lib/wordmark.ts`: one list with `enabled`/`verified` per script; all 6 Indic entries unverified (docs/facts.md "Wordmark")
- B Region `ap-southeast-2`, set once in `samconfig.toml`; `scripts/region.sh` reads it for every script. Template guard `SingleRegion` uses `DeployRegion`; Lambda takes its region from the runtime; `tests/test_region.py` fails if the template default or any repo file names another region. Privacy text: "processed on AWS in Sydney, Australia, and not stored". All India/Mumbai claims removed (consent, landing, HANDOFF, CLAUDE.md, docs)
- Phase 5 (template.yaml): private S3 bucket (SSE, public access blocked, HTTPS-only policy), CloudFront + OAC (PriceClass_200 for Indian edges, HTTP/2+3, compression, managed CachingOptimized), response-headers policy (CSP with no third-party hosts, HSTS, nosniff, frame DENY, no-referrer, Permissions-Policy). CORS = the CloudFront origin only. Alarms → SNS email: Lambda errors, Lambda throttles, API 5xx rate (metric math, ≥10 req), counter-store failures (log metric filter)
- `scripts/deploy_site.sh` (build with ApiUrl, sync with cache rules, invalidate index), `scripts/smoke_api.sh` now checks the site origin is allowed and others rejected; Playwright `E2E_API_URL` / `E2E_BASE_URL` modes; README.md, docs/privacy.md, docs/build-summary.md
## Decisions I made
- CSP `connect-src` uses `https://*.execute-api.<region>.amazonaws.com`: naming the exact API would create a template cycle (API CORS → distribution → headers policy → API) · alternative rejected: route `/v1` through CloudFront (changes the architecture)
- Dropped the optional dev CORS origin: SAM mangled a conditional `AllowOrigins` and API Gateway silently kept the old list. Now one fixed value; local dev uses the local API
- Alarm email passed only as a deploy parameter (`AlarmEmail`), never in the repo or samconfig
- The model `.gz` is uploaded as `application/octet-stream` without Content-Encoding (Tesseract unzips it)
## Deviations from HANDOFF.md
- none new. Note: unknown API routes return API Gateway's own `{"message":"Not Found"}` (no catch-all route, to keep junk traffic off Lambda); the client treats it as a generic error
## AWS (ap-southeast-2)
- Read-only check: `cloudformation list-stacks` and `s3api list-buckets` allowed
- Preflight: Lambda ConcurrentExecutions **400** (unreserved 400) → reserved concurrency 5 kept. Bedrock (info only, stays off): 14 image-input models on demand. Profiles: `au.*` Anthropic (incl. sonnet-5, opus-5, haiku-4-5/5-5) plus `apac.*`/`global.*`. Invocation logging: not configured. Quotas listed (e.g. Nova Lite 20 rpm, Gemma 3 1000 rpm)
- Denied once, my mistake: one command ran without the region script and hit ap-south-1 (SCP deny on DescribeStackResource). Re-run in ap-southeast-2 worked. No workaround of any deny was attempted
- Network: this cloud session's proxy blocked `*.cloudfront.net`; a personal environment "AWSCloud" allowing only `d3glxkvs4n9ily.cloudfront.net` was created (approved via prompt). Not an AWS change
## Verified facts
- Live headers: CSP/HSTS/frame/referrer/permissions present on `/`; `index.html` `no-cache`; OCR model 2,952,873 bytes, immutable 1 y; bucket direct access 403; CORS: site origin allowed, `localhost:5173` and `evil.example` rejected
- Lambda logs on AWS: one JSON line per request with only allow-listed keys (+ Powertools `xray_trace_id`); `error_code` is top-level so the metric filter matches
## Tests
- pytest 301 passed (cov 99%) · ruff, cfn-lint, `sam validate --lint` clean · vitest 55 passed · oxlint clean
- `scripts/smoke_api.sh <ApiUrl> <SiteUrl>`: 14/14 PASS. Throttle burst (40 parallel): 429s from API Gateway and some 503s from Lambda's reserved concurrency
- Playwright (Pixel 7): local 17/17; local site → live API 17/17; **public URL 17/17** (real Tesseract OCR under the production CSP; no request to any host but the site and the API; no image data in any body)
- Lighthouse 13.6.0 on the public URL (mobile, simulated slow 4G): **Performance 99, Accessibility 100, Best practices 100, SEO 100**; LCP 0.8 s, TBT 120 ms, CLS 0, 247 KiB. Initial JS 124.7 KB gzip
## AWS resources and cost so far
- Stack `namma-check` (ap-southeast-2): HTTP API + `$default` stage, Lambda + role + 4 permissions, DynamoDB `nc_counters`, 2 log groups (14 d) + metric filter, S3 site bucket + policy, CloudFront distribution + OAC + headers policy, SNS topic, 4 alarms (all OK). Plus `aws-sam-cli-managed-default` (SAM artifact bucket) and budget `namma-check-monthly` ($50, alerts $10/$25/$50)
- Spend: **$0.00** actual per AWS Budgets (data can lag ~24 h). Expected: within Free plan (CloudFront 1 TB, Lambda 1 M req, 10 alarms, S3 ~11.6 MB)
## Privacy checklist (section 4)
- 1 photos stay on device: pass (public-URL e2e) · 2 no persistence: pass · 3 guard: pass (smoke) · 4 logging: pass (checked on AWS) · 5 transport: pass (HTTPS only, CORS = site, private bucket) · 6 Bedrock: off · 7 consent: Sydney wording · 8 injection: pass · 9 samples: pass · 10 honest claims: docs/privacy.md matches the code
## Open issues and risks
- **Confirm the SNS subscription** email from AWS, or alarms notify no one
- "Works from another network": tested from this cloud container only; please open the URL on a phone over mobile data
- 503s under bursts (Lambda concurrency 5) show the generic "try again" message
- The OCR worker relies on `'wasm-unsafe-eval'` in the CSP (needed for WebAssembly)
- No LICENSE file (public repo)
## Questions for the architect
1. Which license should the public repo use?
2. Keep reserved concurrency at 5 (some 503s in bursts) or raise it to 10 now that the account limit is 400?
## Suggestions (not built)
- Run the Playwright suite in CI against the public URL after each deploy
- A custom domain (Route 53 costs money; out of Free plan scope)
