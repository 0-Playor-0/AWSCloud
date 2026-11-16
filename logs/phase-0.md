# Phase 0 — Preflight — 2026-11-16
## Built
- HANDOFF.md (verbatim copy), CLAUDE.md (section 12 + git authorship rule), .gitignore (private_samples/, secrets, build output)
- Repo layout dirs per section 11 (engine/, backend/, frontend/, tests/{engine,backend,e2e}/, docs/, logs/)
- .github/workflows/ci.yml skeleton: ruff lint + pytest on push (skips cleanly until tests exist)
## Decisions I made (anything not dictated by HANDOFF.md)
- AWS CLI v1 + SAM CLI installed via pip into a tools venv (no system installer available) · works for SAM deploy · CLI v2 rejected: no network path to its installer
- Git identity set repo-locally to Playor; Claude commit signing disabled for this repo · per user instruction
## Deviations from HANDOFF.md
- none
## Verified facts
- node v22.23.4 · npm 10.9.9 · python 3.13.18 · git 2.43.0 · aws-cli 1.46.3 · SAM CLI 1.172.1
- SAM 1.172.1 supports Lambda runtimes up to python3.14 → plan to pin python3.14 (confirm in Phase 2 against Lambda runtime docs)
- Textract / Bedrock prices: NOT verified — aws.amazon.com is blocked by this session's network policy
## Tests
- none (no product code in Phase 0)
## AWS resources and cost so far
- none created · $0
## Privacy checklist (section 4)
- 1–10: not applicable yet; private_samples/ is git-ignored (7)
## Open issues and risks — BLOCKERS (section 8)
- 8.1 AWS identity: `aws sts get-caller-identity` → InvalidClientTokenId. This cloud session has no valid AWS keys.
  Not done because of this: Textract smoke test, Bedrock model/profile/quota listing, budgets.
- 8.2 Budget-alert email: not supplied.
- Network: aws.amazon.com (pricing/docs) not reachable; AWS API endpoints may also need allowing.
## Questions for the architect
- How should this session get AWS access? Options:
  A) Human adds a dedicated IAM user's keys (least-privilege, deploy-only) as environment variables
     AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in the cloud environment settings, then starts a new session.
  B) Human runs Phase 0 AWS smoke tests + deploys locally; this session only writes code.
  C) Proceed with Phase 1 (engine, no AWS) now while A/B is sorted — HANDOFF allows this.
## Suggestions (not built)
- Allow aws.amazon.com and docs.aws.amazon.com in the environment network so prices/limits can be verified from official docs.
