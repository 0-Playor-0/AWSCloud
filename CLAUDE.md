Project: Namma Check — self-check for mismatches across a person's own ID documents. Hackathon build on AWS Free plan.
Source of truth: HANDOFF.md. Do not change architecture, scope or privacy rules. If blocked, stop and log options.
Workflow: one phase at a time; after each, write logs/phase-N.md (template in HANDOFF.md section 10) and stop.
Privacy: never log or store images, OCR text or field values. Never commit private_samples/. Aadhaar numbers must never reach the server.
Stack: React+Vite+TS+Tailwind+shadcn/ui+Motion · API Gateway HTTP API · one Python Lambda (Powertools, pydantic) · Textract baseline, Bedrock optional · DynamoDB counters · SAM · ap-south-1.
Commands: setup `python3 -m venv .venv && .venv/bin/pip install -e ".[dev]"` · test `.venv/bin/pytest --cov=engine` · lint `.venv/bin/ruff check .` · build/deploy: TBD (Phase 2)
Style: small modules, type hints, table-driven tests, no dead code, no new dependencies without logging the reason.
Cost: every AWS call must be bounded by throttles and the daily cap. Report spend in each log.
Git: commits are authored by Playor only. No Co-Authored-By or other Claude attribution lines unless the user says otherwise.
