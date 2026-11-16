# Build summary

Services used and why. Region: ap-southeast-2 (Sydney) for everything; it is configured once in
`samconfig.toml`. The account is a "new experience" project pinned to this region by a control
policy. Photos never leave the phone; the text and typed details that are sent are processed on
AWS in Sydney and not stored.

| Piece | Service | Why |
|---|---|---|
| API | API Gateway HTTP API | Cheapest managed HTTPS front door; route throttling (2 rps, burst 5) bounds cost |
| Logic | One Lambda (Python 3.14, Powertools, pydantic) | Pay per request; parsers, ID guard and comparison engine in one function |
| Counters | DynamoDB on-demand table `nc_counters` | Anonymous aggregate counts only; daily cap for a future metered extractor |
| Logs | CloudWatch Logs (14-day retention) | Metadata only: request id, route, doc_type, status, latency, extractor, error code |
| Photo reading | **None on AWS**: Tesseract.js in the browser | The image never leaves the phone |

## Why Textract was removed (2026-11-16)

Phases 0–3 used Amazon Textract `DetectDocumentText` on an uploaded crop. It was removed before any deploy:

- AWS AI services such as Textract may store and use content to improve the service unless an
  AWS Organizations AI-services opt-out policy is attached. Without it, the promise
  "the image is discarded" could not be guaranteed.
- Setting that policy requires an AWS Organization, and creating one ends the account's Free
  plan credits. If credits end, the account closes and the demo URL dies.
- So photo reading moved to the device: Tesseract.js (English) runs in the browser on the crop,
  long digit runs are removed, and only text lines are sent to `/v1/extract`, where the same
  deterministic parsers and the ID-number guard run (defence in depth).

Consequences: no Textract IAM permission, no image handling on the server, no image error
codes, no daily cap for the default extractor (`client_ocr` costs nothing per call; throttling
still applies). `bedrock` stays a documented future option, off, same region only.

Rule: never create an AWS Organization or enable IAM Identity Center for this project.
