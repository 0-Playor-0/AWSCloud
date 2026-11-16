# Phase 1 — Engine — 2026-11-16
## Built
- `engine/` pure package: `names.py` (normalise + 7 name kinds), `dates.py` (5 DOB kinds), `compare.py` (report, purpose rules, fix plan), `rules.py` (loader + validation), `messages.py` (all user text), `rules.yaml` (3 seed rules only)
- Public API: `engine.compare(purpose, documents, anchor=None) -> dict` matching the `/v1/compare` 200 shape; raises `EngineInputError` on bad input
- `tests/engine/`: `cases.yaml` table (73 classification cases + 6 bad DOBs), report/fix-plan tests, rules tests, Hypothesis property tests, purity test (no boto3/network imports)
- `pyproject.toml` (pinned deps, ruff config); CI now installs `.[dev]`, runs ruff + pytest with coverage ≥95%
## Decisions I made (anything not dictated by HANDOFF.md)
- `exact` = identical after trimming/collapsing spaces; `format_only` = same letters once case, punctuation, spaces and honorifics are removed · the spec defines both as "same after normalisation"; this is the only reading where `format_only` can fire
- Honorifics stripped only from the front of a name · seed list contains KUMARI, but the spec's `missing_token` example ANITA KUMARI SINGH needs a middle KUMARI kept
- Initials: a single letter matches a token starting with it; one-to-one matching, any order. Equal token count → `initials_vs_expanded`; shorter side fully matched → `missing_token` (so "R SHARMA" vs "RAJESH KUMAR SHARMA" is `missing_token`)
- `spelling_variant`: exactly one differing token per side (order-insensitive), Levenshtein ≤ 2, shorter token ≥ 3 letters · stops "K RAVI"/"R RAVI" (different initials) being called a spelling variant
- DOB `year_only` severity = risky (spec only says it is not blocking); year-only with a different year = `different`
- `parent_name` uses the same name classifier and severities as `name`
- Pairing: if the field has an anchor, each document is compared with the anchor document only; otherwise all pairs
- Fix plan covers risky + blocking fields only (cosmetic = usually tolerated). No anchor → one step with `doc: null` ("Decide which document shows your correct …")
- Duplicate doc types get ids `other`, `other_2`, … in `docs`/`values`/`doc`
- `rule_ids` only ever contain seed rule ids, so most findings have `[]`
- R-PAN-AADHAAR-LINK annotates risky/blocking name/DOB/gender findings between PAN and Aadhaar with its "may fail" statement; it never changes severity
- Hypothesis added as a dev dependency · the handoff asks for property tests
- PyYAML is the engine's only runtime dependency · needed to read `rules.yaml`
## Deviations from HANDOFF.md
- none. The contract example shows `rule_ids: ["R-NAME-INITIALS"]`, which is not a seed rule; I don't emit it (see questions)
## Verified facts
- PyYAML 6.0.3 · pytest 9.2.0 · pytest-cov 7.1.0 · hypothesis 6.170.15 · ruff 0.17.5 (pip, 2026-11-16)
- R-PAN-AADHAAR-LINK candidate official sources (found by search; pages NOT read, network blocks them):
  https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/%20Link%20Aadhaar-faq
  https://uidai.gov.in/en/media-resources/brand-aadhaar/logo/292-english-uk/faqs/your-aadhaar/pan-aadhaar.html
  The search summary says name, gender and DOB should match in both. Rule stays `unverified` / `source_url: null` until someone reads a page
## Tests
- `.venv/bin/pytest --cov=engine` · 124 passed, 0 failed · coverage 100% (308 statements)
- `.venv/bin/ruff check .` · clean
- Every name kind and DOB kind is covered (asserted by tests); symmetry + identical→all_match properties hold
## AWS resources and cost so far
- none · $0 (AWS keys still pending; Phase 0 AWS checks to be re-run in a new session)
## Privacy checklist (section 4)
- 8: engine output carries only the user's confirmed field values, never OCR text · 1–7, 9, 10: not applicable to this phase
## Open issues and risks
- Transliteration variants beyond edit distance 2 (LAKSHMI/LAXMI = 3) are classed `different` → blocking. Test pins this as a known gap
- Initials matching is by first letter only, so "K RAVI" also matches "RAVI KANNAN" (by design: the engine can't know which K)
## Questions for the architect
1. Should kind-level rule ids (e.g. `R-NAME-INITIALS`, as in the contract example) exist? They would have no source, so they could only label findings, never raise severity
2. Is `year_only` = risky correct?
3. Can someone confirm one of the two PAN–Aadhaar URLs above so R-PAN-AADHAAR-LINK can be marked verified?
## Suggestions (not built)
- A small transliteration equivalence table (KSH↔X, OO↔U, EE↔I, W↔V, PH↔F) applied before edit distance, with each pair sourced
