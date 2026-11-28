# Namma Check

A self-check for mismatches across your own ID documents (Aadhaar, PAN, Class 10 marksheet,
passport, bank passbook). It shows where your name, date of birth, parent name or gender differ,
how risky each difference is, and which document to fix first.

**Live:** https://d3glxkvs4n9ily.cloudfront.net

It does not verify identity, does not contact any government system and is not legal advice.

The report gives an **Identity Health Score** (100 − 25 per blocking − 10 per risky − 2 per cosmetic
difference; our estimate, not an official score), per-difference guidance with links to the issuer,
a character-level diff of what differs, and a **Download report (PDF)** button (the browser's print
to PDF; nothing is uploaded). Screenshots: [logs/phase-6/](logs/phase-6/).

## How it works

- **On your phone:** choose a photo; self-hosted Tesseract.js reads the text in the browser; long
  numbers are removed; you see and can untick every line before explicitly consenting to send it.
  Or type the details, or try a sample.
- **On AWS (Sydney, `ap-southeast-2`):** one Lambda parses the text into four fields and compares
  documents with a deterministic, tested rules engine (`engine/`, every rule with a source). Nothing
  is stored except anonymous counts. See [docs/privacy.md](docs/privacy.md).

```
Phone (crop + OCR) ──text──▶ API Gateway HTTP API ─▶ Lambda (Python) ─▶ DynamoDB (counts only)
      ▲
      └── static site: CloudFront ─▶ private S3
```

Services and why: [docs/build-summary.md](docs/build-summary.md). AWS operations and deployment:
[docs/aws-infrastructure.md](docs/aws-infrastructure.md). Sourced facts: [docs/facts.md](docs/facts.md).
Full spec: [HANDOFF.md](HANDOFF.md).

## Repo layout

| Path | What |
|---|---|
| `engine/` | Pure comparison logic and `rules.yaml` |
| `backend/` | Lambda handler, parsers, ID guard, validation, counters |
| `frontend/` | Newspaper-style React + Vite + TypeScript site with self-hosted fonts and OCR |
| `tests/` | Python unit and integration tests; Playwright e2e lives in `frontend/e2e/` |
| `template.yaml` | Everything on AWS (SAM) |
| `scripts/` | Preflight, site deploy, API smoke test, local API |

## Develop locally

Needs Python 3.14, Node 22, Git.

```bash
python3.14 -m venv .venv && .venv/bin/pip install -e ".[dev]"
```

```bash
.venv/bin/pytest --cov=engine --cov=backend && .venv/bin/ruff check .
```

```bash
cd frontend && npm ci && npm test && npm run lint && npm run build
```

Run the site against a local copy of the API (the real handler; counters in memory):

```bash
.venv/bin/python scripts/local_api.py
```

```bash
cd frontend && npm run dev
```

End-to-end tests (Playwright; starts both servers itself):

```bash
cd frontend && npx playwright install chromium && npm run e2e
```

## Deploy your own

Needs an AWS account, the AWS CLI and SAM CLI, and credentials for an IAM user (not root).

1. Set your region once in `samconfig.toml` (`region = "..."`) and the matching `DeployRegion`
   default in `template.yaml` (a test checks they agree).
2. Check the account and create budget alerts:
   ```bash
   scripts/preflight.sh you@example.com
   ```
3. Deploy the API, site bucket, CloudFront, dashboard and alarms (the email receives alarm notifications;
   confirm the subscription email from AWS SNS):
   ```bash
   sam build && sam deploy --parameter-overrides GitSha=$(git rev-parse --short HEAD) AlarmEmail=you@example.com
   ```
   On an existing stack, SAM keeps each parameter's previous value unless you pass it: the
   template defaults apply only to the first deploy. To change limits later, pass them
   explicitly, e.g. `ReservedConcurrency=10 ThrottleRate=10 ThrottleBurst=20`. If
   `scripts/preflight.sh` shows a Lambda concurrency limit of 100 or less, use
   `ReservedConcurrency=0`.
4. Build and publish the site:
   ```bash
   scripts/deploy_site.sh
   ```
5. Smoke-test the API (URLs are in the stack outputs):
   ```bash
   scripts/smoke_api.sh <ApiUrl> <SiteUrl>
   ```
6. Run the e2e suite against your public site:
   ```bash
   cd frontend && E2E_BASE_URL=<SiteUrl> E2E_API_URL=<ApiUrl> npm run e2e
   ```

Cost is bounded by API throttling (10 requests/s, burst 20), Lambda reserved concurrency (20), CloudFront
caching and the absence of any paid per-request AI service; budget alerts email you at $10, $25
and $50.

## License

MIT, see [LICENSE](LICENSE). Third-party software, the OCR model and fonts keep their own
licenses: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) (regenerate with
`.venv/bin/python scripts/third_party_notices.py` after `sam build`).
