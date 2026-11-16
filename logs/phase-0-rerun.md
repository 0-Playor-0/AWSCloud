# Phase 0 re-run + Phase 1 review changes — 2026-11-16
## Built (Phase 1 review changes, all approved by the architect)
- 1 · `rule_ids` = sourced seed rules only, may be empty. HANDOFF.md contract example now shows `"rule_ids": []`
- 2 · Year-only DOB, same year → risky; fix step is "Confirm your full date of birth on your <doc>; it shows only the year", on the year-only record, and never a "Correct …" step (even when a full-date anchor exists). Different year → `different`, blocking, normal change step
- 3 · `names.transliterate()` with the 11 approved equivalences (KSH~X, SH~S, PH~F, TH~T, DH~D, W~V, EE~I, OO~U, AA~A, doubled consonant~single, trailing Y~I). Only used as a last check before `different` → `spelling_variant`; never produces exact/format_only
- 4 · R-PAN-AADHAAR-LINK unchanged (unverified, "may fail")
- 5 · EXTRACT_DAILY_CAP stays 300 (used in Phase 2)
## Decisions I made
- Transliteration compares whole names: every token folded, then the token multisets must be equal. So "JOSEPH THOMAS"/"JOSEF TOMAS" (two variant tokens) → spelling_variant
- Confirm-DOB step on Aadhaar still carries the R-AADHAAR-LIMITS caution (adding a full DOB is a DOB update)
- Changed expected result: "POOJA SHARMA"/"PUJA SHARMMA" was `different`, now `spelling_variant` (OO~U + doubled consonant), as the new rule intends
## Deviations from HANDOFF.md
- HANDOFF.md edited only where instructed (rule_ids example)
## Phase 0 AWS checks — BLOCKED
- Identity: `aws sts get-caller-identity` → InvalidClientTokenId
- Cause: the environment now lists AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_DEFAULT_REGION, but this container started before they were added. It still has 14-character placeholder values and no AWS_DEFAULT_REGION. Variables only load when a session starts
- Network: NOT blocked. STS, Textract, Bedrock, Budgets, CloudFormation, S3, DynamoDB, Lambda, API Gateway v2 and Service Quotas endpoints all answered (auth errors, not proxy refusals)
- Textract smoke, Bedrock listing/quotas, budgets: not run (no valid credentials)
## Verified facts
- Textract DetectDocumentText ≈ $0.0015/page (architect, AWS pricing page; I can't reach aws.amazon.com to confirm)
## Tests
- `.venv/bin/pytest` · 154 passed, 0 failed · engine coverage 100% · ruff clean
## AWS resources and cost so far
- none · $0
## Privacy checklist (section 4)
- 8: pass (engine output never includes OCR text) · others not applicable yet
## Options (need one)
- A) Start a NEW session on this environment. It loads the keys; it re-runs Phase 0 checks and, if Textract works, continues into Phase 2 (recommended)
- B) Paste nothing in chat; if keys must be rotated, update the environment variables first, then A
