# Build summary

Services used and why. Region: ap-southeast-2 (Sydney) for everything; it is configured once in
`samconfig.toml`. The account is a "new experience" project pinned to this region by a control
policy. Photos never leave the phone; the text and typed details that are sent are processed on
AWS in Sydney and not stored.

| Piece | Service | Why |
|---|---|---|
| API | API Gateway HTTP API | Cheapest managed HTTPS front door; route throttling (10 rps, burst 20) bounds cost |
| Logic | One Lambda (Python 3.14, Powertools, pydantic) | Pay per request; parsers, ID guard and comparison engine in one function |
| Counters | DynamoDB on-demand table `nc_counters` | Anonymous aggregate counts only; daily cap for a future metered extractor |
| Logs | CloudWatch Logs (14-day retention) | Metadata only: request id, route, doc_type, status, latency, extractor, error code |
| Operations | CloudWatch dashboard | API traffic/errors/latency, Lambda invocations/errors/duration/throttles/concurrency and DynamoDB consumption |
| Photo reading | **None on AWS**: Tesseract.js in the browser | The image never leaves the phone |
| Site hosting | S3 (private, encrypted, public access blocked) | Stores the static build only; reachable only through CloudFront (Origin Access Control) |
| CDN + HTTPS | CloudFront (PriceClass_200, includes India edges) | Free HTTPS URL, edge caching near users, security headers (CSP, HSTS, frame-deny) |
| Alerts | CloudWatch alarms + SNS email | Lambda errors, throttles and excessive duration; API 5xx rate; counter-store failures |
| Least privilege | Explicit Lambda execution role | Writes only to this function's log group and reads/writes only the counter table |
| Cost guard | AWS Budgets | Email alerts at $10, $25, $50 actual spend |

## Frontend (newspaper design, Phase 6b)

- Built from PR #1 (Hiral) and hardened: exact dependency pins, oxlint + vitest + Playwright,
  privacy e2e checks (no ID-like numbers in request bodies, no web-storage/IndexedDB writes, no
  third-party hosts, consent before the first send).
- **Identity Health Score** (client-side, from the backend's counts): 100 − 25 per blocking − 10 per
  risky − 2 per cosmetic, floored at 0; Ready 90–100 / Needs fixes 60–89 / Likely rejected < 60.
  Shown only for backend results; "Our estimate, not an official score."
- **Download report**: a report-only print stylesheet and `window.print()`; the browser saves a PDF.
  No PDF library, no network call, no photos.
- Border illustrations: 130 PNGs (31.3 MB) → 90 WebP (1.87 MB), desktop only, lazy.
- A client-side preview engine (`frontend/src/utils/comparisonEngine.ts`) renders a labelled
  "Preview only" report for the sample before the user runs the real check; the backend engine
  (`engine/`) is the source of truth for every result after that.

## Cost controls

- API Gateway throttling: 10 requests/s, burst 20 (bare `429` beyond that).
- Lambda reserved concurrency 20, 512 MB, 20 s timeout (extra load gets `503`). The site retries a
  `503` or throttled `429` once after a short backoff before showing "try again".
- No paid per-request AI service: OCR runs on the phone. The daily cap stays wired for a future
  metered extractor (Bedrock, off).
- CloudFront caches hashed assets and the versioned OCR files for a year, so repeat visits cost
  almost nothing; `index.html` is revalidated.
- Logs kept 14 days.
- The operations dashboard uses only standard AWS service metrics: no custom metric ingestion.
- The Lambda role is explicit and resource-scoped; it has no access to S3, Bedrock, Textract,
  KMS, Secrets Manager or other service APIs.

## Why Textract was removed (2026-11-16)

Phases 0–3 used Amazon Textract `DetectDocumentText` on an uploaded crop. It was removed before any deploy:

- AWS AI services such as Textract may store and use content to improve the service unless an
  AWS Organizations AI-services opt-out policy is attached. Without it, the promise
  "the image is discarded" could not be guaranteed.
- Setting that policy requires an AWS Organization, and creating one ends the account's Free
  plan credits. If credits end, the account closes and the demo URL dies.
- So photo reading moved to the device: Tesseract.js (English) runs in the browser on the chosen
  photo, long digit runs are removed, and only text lines are sent to `/v1/extract`, where the same
  deterministic parsers and the ID-number guard run (defence in depth).

Consequences: no Textract IAM permission, no image handling on the server, no image error
codes, no daily cap for the default extractor (`client_ocr` costs nothing per call; throttling
still applies). `bedrock` stays a documented future option, off, same region only.

Rule: never create an AWS Organization or enable IAM Identity Center for this project.
