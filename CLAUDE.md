Project: Namma Check — self-check for mismatches across a person's own ID documents. Hackathon build on AWS Free plan.
Source of truth: HANDOFF.md. Do not change architecture, scope or privacy rules. If blocked, stop and log options.
Workflow: one phase at a time; after each, write logs/phase-N.md (template in HANDOFF.md section 10) and stop.
Privacy: never log or store images, OCR text or field values. Never commit private_samples/. Aadhaar numbers and images must never reach the server. Never create an AWS Organization, enable Organizations features, multi-region or IAM Identity Center, or change the account plan. Never claim data stays in India.
Stack: React+Vite+TS+Tailwind+shadcn/ui+Motion · API Gateway HTTP API · one Python Lambda (Powertools, pydantic) · on-device OCR (Tesseract.js), Bedrock optional (off) · DynamoDB counters · SAM · ap-southeast-2 (Sydney; set once in samconfig.toml; the account allows no other region).
Commands: setup (Python 3.14) `python3.14 -m venv .venv && .venv/bin/pip install -e ".[dev]"` · test `.venv/bin/pytest --cov=engine --cov=backend` · lint `.venv/bin/ruff check .` · build `sam build` · deploy (human, local) `sam deploy --parameter-overrides GitSha=$(git rev-parse --short HEAD)` · AWS checks `scripts/preflight.sh <email>` · API smoke `scripts/smoke_api.sh <ApiUrl>`
Style: small modules, type hints, table-driven tests, no dead code, no new dependencies without logging the reason.
Cost: every AWS call must be bounded by throttles and the daily cap. Report spend in each log.
Git: commits are authored by Playor only. No Co-Authored-By or other Claude attribution lines unless the user says otherwise.
