# Phase 6 — STOPPED at step 0 (remote audit) — 2026-11-28
Stop rule hit: a new commit touches files this phase edits (see "Why I stopped"). No code edits, no merge/rebase/checkout of foreign code, nothing pushed. This file is uncommitted.

## Remote activity
- `git fetch --all --prune`: origin has `main` and `ccr-5fb7aac1-nt02on`, both at **172ec71** (our last commit). **No new commits on any origin branch.** The prune removed only a stale local ref for `claude/upbeat-turing-vra588`, which was already deleted on GitHub
- **Default branch is still `ccr-5fb7aac1-nt02on`**, not `main` (GitHub HEAD). Change it in Settings → General → Default branch
- Collaborators: only `0-Playor-0` (admin). No new collaborators. Issues: none
- **Open PR #1 "Hiralchanges"** by `hdj1738` (not a collaborator), opened 2026-11-27 from fork `hdj1738/AWSCloud:hiralchanges` into `ccr-5fb7aac1-nt02on`. 2 commits, 236 files, +9162/−5759. GitHub: mergeable_state "unstable". Body: "did aws infra audit, resolution guidance engine check and added some features. rebuilt the frontend, added hindi and marathi (needs a bit of work)". Fetched read-only as local ref `refs/audit/pr1` for analysis

### Commit 66f1430 · Hiral D Jadiya · 2026-11-27 11:50 +0530 · "changes done by hiral" · 51 files, +3429/−161
- New resolution-guidance engine (`engine/guidance.py` 364 lines, `engine/guidance.yaml` 360 lines with 7 gov/bank URLs). `engine.compare()` now returns an extra `guidance` key: **an API contract change**. `backend/app.py` re-derives and validates guidance and returns 500 if it does not match. `backend/models.py` adds response models
- template.yaml (**IAM change**): replaces the SAM-generated policy with an explicit `ApiFunctionRole` (logs scoped to the function log group; DynamoDB Get/Update on the counters table only; no wildcards: looks least-privilege). Adds a CloudWatch dashboard (free tier covers 3) and a Lambda duration alarm (≥15 s)
- docs: new `aws-infrastructure.md`, `resolution-guidance.md`; README/build-summary edits. `scripts/preflight.sh` prints budget notifications (its query path `Budget.NotificationsWithSubscribers` looks wrong for `describe-budget`)
- Tests: +`tests/engine/test_guidance.py`, +`tests/test_infrastructure.py`, test_api additions; 34 frontend/src files also touched
- Risk: medium (IAM rewrite, contract change). No secrets

### Commit 2e0de5b · Hiral D Jadiya · 2026-11-27 17:38 +0530 · "feat: replace frontend with newspaper experience" · 236 files, +7523/−7388
- **Replaces the whole frontend**: deletes every component (Report, Stamp, DiffText, PhotoInput, landing/*, shadcn ui/*), `lib/diff.ts`, `lib/samples.ts`, `lib/wordmark.ts`, `strings/en.json`, tsconfig.app/node. New "newspaper" design, i18n in `utils/i18n.ts` (adds Hindi, Marathi)
- **Dependency changes**: removes radix-ui/shadcn stack, cva, clsx, tailwind-merge, react-easy-crop, Bricolage font, oxlint, vitest. Adds lucide-react, @fontsource/anton, @fontsource/playfair-display, tsx. motion goes **14.14.0 → ^12** (a downgrade). **All pins become `^` ranges** (we pin exact). `lint` is now only `tsc --noEmit`. The dev server binds `0.0.0.0:3000`
- **~31 MB of PNG illustrations** added under `frontend/src/assets/images/` (cartoons 1.7–1.9 MB each). Some are referenced as `'/src/assets/images/...'` string paths, which Vite does not bundle, so they will likely 404 in a production build. Provenance/licence of the art is not stated (originality rule)
- **Deleted tests**: `e2e/flows.spec.ts` (239 lines: consent, number stripping, own-origin-only, no image data, retry, cap, receipt) and `helpers.ts`, replaced by a 99-line `frontend.spec.ts` that keeps a subset (on-device OCR + consent, no `data:image` in the body). `lib/diff.test.ts` deleted. `tests/test_region.py` narrowed (it no longer scans the strings JSON, which is gone)
- Privacy check: no localStorage/cookies/analytics, no third-party hosts in src, `sanitizeLines` (long-number stripping) still used, consent text keeps the Sydney wording. No secrets found (scan for AWS keys, GitHub tokens, private keys, passwords, 12-digit numbers)
- Risk: **high** for scope and stack (CLAUDE.md stack names shadcn/ui and Bricolage/Plex; the design identity changes; the HANDOFF section 7 budgets are likely broken by 31 MB of images), test coverage loss, unpinned deps
- No `.github/workflows` changes in either commit

## Why I stopped
- Phase 6 edits `engine` rules/tests (EPF), the report UI (Stamp, Report, receipt), App layout, the e2e suite and docs. PR #1 rewrites or deletes exactly these files, and changes the `/v1/compare` response. Doing Phase 6 on `main` now means one of the two pieces of work must be redone or hand-merged
- Nothing is on `main`, and no secrets were added; the stop is only for the file overlap

## Options (architect decides)
1. **Proceed with Phase 6 on current `main`, leave PR #1 open**; the contributor rebases later (large conflicts; their frontend would need to adopt the score/print/stamp work)
2. **Review PR #1 first**, then accept it in part. For example: take commit 66f1430's IAM role, dashboard, duration alarm and guidance engine after review, and decline the frontend replacement. Then run Phase 6 on top
3. **Adopt the newspaper frontend** (2e0de5b) as the new base after fixes: exact pins, restore oxlint/vitest and the deleted privacy e2e tests, bundle or drop the 31 MB images, confirm the art licence. Then redo the Phase 6 UI items on it
- My recommendation: option 2. 66f1430's infra work is small and checkable; 2e0de5b conflicts with the stack and budget rules and drops tests

## Anything you must do by hand
- Set the GitHub default branch to `main`
- Decide on PR #1 (options above); I have not commented on it

# Phase 6b — PR #1 adopted, hardened, Phase 6 finished — 2026-11-28
## Merge
- `main` fast-forwarded to 6bbe981 (audit log), then `git merge --no-ff refs/audit/pr1` → **merge 71f6490** (Playor). Hiral's 66f1430 and 2e0de5b kept with their own authorship. PR head unchanged since the audit (2e0de5b). `ccr-5fb7aac1-nt02on` untouched
## Tests: before → after
- Before the merge (172ec71): pytest 301 · vitest 64 · Playwright 19
- Right after the merge (71f6490), before fixes:
  - pytest 361 passed; ruff, cfn-lint, type-check clean
  - unit (tsx) 7/7; build OK but **0 images bundled**
  - Playwright **0/3: browsers failed to launch**, because `^1.63.0` resolved to 1.65.1. With 1.63.0 pinned, Hiral's 3/3 pass
- After: **pytest 363** · **vitest 71** · **Playwright 18/18** locally and 18/18 on the public URL · oxlint, type-check, ruff, cfn-lint clean
  - vitest: Hiral 7 + 47 restored + 1 diff-adapter + 16 score
  - Playwright: Hiral 3 + 9 privacy/border/retry + 6 layout/score/print
- Unit tests not restored: `describeError` (15) and `docLabel` (3); those modules were removed, and the new UI shows the server's own message and hint
## Images (2a)
- **31.27 MB (130 PNG) → 2.48 MB (130 WebP, cartoons ≤400 px, cells ≤240 px, q45, lossy alpha) → 1.87 MB (90 WebP)**
  - The 40 dropped files were used only by the two "inner" strip columns, which were always `hidden`; those columns are no longer rendered
- Imported via `import.meta.glob` (hashed, never inlined). Removed the Vite plugin that copied all of `src/assets` into `dist`
- `<img loading="lazy" decoding="async" alt="" aria-hidden="true">`
- The border is rendered only at ≥1024 px (`matchMedia` + `hidden lg:block`). e2e checks: no `<img>` and no `.webp` request at 390 and 1023 px
- Originals deleted (no history rewrite). Timestamps removed from the cartoon file names (they contained 12-digit runs)
## Dependencies (2b)
- All pins exact. Motion **14.14.0** restored (works). Playwright **1.63.0** (matches the installed browser). oxlint 1.94.0 + `.oxlintrc.json` restored; `npm run lint` = oxlint + type-check
- **vitest 5.1.2, not 5.1.0**: npm 10.9.9 crashes on 5.1.0/5.1.1 (`Cannot read properties of null (reading 'edgesOut')` in peer resolution), even with a fresh lockfile; 5.1.2 resolves. `tsx` removed
- Lockfile regenerated for the same reason
## Privacy, notices, sample (2c–2e)
- `e2e/privacy.spec.ts` ported from the old suite:
  - no 12-digit or 4-4-4 numbers (and no image data or bodies over 8 KB) in any request body;
  - no localStorage, sessionStorage or IndexedDB writes (init-script hooks);
  - own hosts only;
  - consent required before the first send, and declining sends nothing;
  - one busy 503 / bare 429 is retried quietly
- THIRD_PARTY_NOTICES regenerated (Anton, Playfair Display, IBM Plex, lucide-react ISC, Motion 14). Row **"Illustrations: [SOURCE PENDING — ask Hiral]"**
- Sample Aadhaar line is now "Aadhaar No: XXXX XXXX 7721 (redacted on send)"
  - e2e: no 12-digit or 4-4-4 text is rendered anywhere
  - The only remaining 12-digit strings in the repo are synthetic guard-test fixtures (`9999…`, `1111…`) and `scripts/smoke_api.sh`; they are needed to test the ID guard
## Commit 1 review (2f)
- **IAM:** `ApiFunctionRole` grants logs only on the function's own log group and DynamoDB Get/UpdateItem on the counters table. No wildcards: least privilege OK
- Dashboard and duration alarm: free tier, metadata only. OK
- Guidance claims changed to "may" (no source in docs/facts.md):
  - PAN–Aadhaar step no longer says "the Income Tax Department says…";
  - "some applications **may** require the expanded name" (name and parent name);
  - "some services **may** compare the full date literally";
  - "some applications **may** use gender as a matching field"
- Client preview (`utils/comparisonEngine.ts`):
  - "linking fails" → "may fail";
  - "full date is required" → "may need";
  - EPF text matches the source;
  - "often faster than editing Aadhaar" → "may be faster"
- The 7 official links are listed in docs/facts.md as marked `verified` by Hiral (2026-11-27), **not re-checked** here
- HANDOFF §3 contract shows `guidance`. §4 item 11: guidance never holds field values or OCR text, is not logged, and is re-derived server-side
## Phase 6 items (3)
- **EPF:** R-EPF-MISMATCH statement = DOB, Aadhaar or bank details (per the source). Effect changed from `raise_severity` to an annotation:
  - name findings stay risky with "An EPF claim **may be rejected**…";
  - DOB findings stay blocking with the sourced statement
  - 4 table tests. Hiral's API test expectations updated (counts 1 blocking + 1 risky; DOB guidance now sorts first)
- **Stamp:** no overflow in the new design at 390×844 (rAF-sampled `scrollWidth ≤ innerWidth` through the animation, before and after a real check, plus a full-page scroll). Tests kept, no fix needed
- **Health Score:** `lib/healthScore.ts`, SVG ring beside the tally, band label, "Our estimate, not an official score.", a "How it's calculated" disclosure; in print too
  - Backend results only; the preview shows "Appears after you run the check"
  - 16 unit tests (formula + band edges) and an e2e test
- **Counter:** hidden when the count is 0 (e2e with stubbed 0 and 5)
- **Download report:** button renamed (en) "Download report (PDF)"
  - The print CSS shows `#report` only, forces reveal animations visible, and prints a line with the site URL and date
  - e2e with `emulateMedia print`
- Reserved concurrency **20** (passed explicitly; template default also 20)
## Lighthouse (mobile)
- Live Phase 5: 99/100/100/100
- As merged (local): **45/96/100/91**, LCP 86.8 s, 30.9 MB
- After, local: **99–100/100/100/100**
- After, public URL: **98–99/100/100/100**, LCP 0.8 s, TBT 130–150 ms, CLS 0, 331 KiB
- Fixes:
  - hero text slides without fading (it is the LCP element);
  - `text-[#14213d]/45–60` → `/70` (AA);
  - `content-visibility: auto` on below-fold sections (style/layout 484 ms → about 1/3);
  - `robots.txt`
## Decisions
- Kept Hiral's client-side preview engine (`utils/comparisonEngine.ts`, 683 lines). It is labelled "Preview only", but it duplicates `engine/` and can disagree. **Question:** remove it, or keep it as a labelled preview?
- EPF: a materially *different* name (e.g. a surname change) stays blocking, as for every purpose; only the old risky→blocking raise was removed
- The score, print-URL line and "Download report (PDF)" text are English only; hi/mr need translations (like the existing hard-coded report labels)
- Design system documented in HANDOFF **§7**; §10 is the log template, so nothing changed there
- Dead code removed: `EditorialCartoonFrame`, `MobileVignette`, `EditorialMarginStage`, `NewspaperDoodles`
## Deploy (ap-southeast-2)
- `sam deploy` with `GitSha=eae143f AlarmEmail=<deploy-time> ReservedConcurrency=20 ThrottleRate=10 ThrottleBurst=20 ExtractDailyCap=300 DeployRegion=ap-southeast-2`
  - Added: `LambdaHighDurationAlarm`, `OperationsDashboard` (`namma-check-operations`)
  - Modified: `ApiFunctionRole`, `ApiFunction`, `HttpApi`
- Live: concurrency 20, throttle 10/20, 5 alarms OK
- `deploy_site.sh`: 122 objects, 13.7 MB (OCR engine + model ≈ 11 MB)
- `smoke_api.sh`: 14/14 PASS
  - 60-request burst: mostly 503 (cold Lambdas at the 20 cap) plus some 429
  - Every 503/429 carries CORS headers, and the client retries once
- Spend this month: **$0.00** (AWS Budgets)
- Phone check: live URL at 390 px, no horizontal scroll (layout e2e on the public URL)
## Screenshots
- `logs/phase-6/{landing,documents,report,print-view}-{390x844,1440x900}.jpg` (2×, JPEG q78)
## Ojas must do by hand
1. **Alarm email:** the SNS subscription was never confirmed and AWS has removed it, so alarms notify nobody. Re-subscribe, then click the email: `aws sns subscribe --region ap-southeast-2 --topic-arn <AlarmTopic ARN> --protocol email --notification-endpoint <your email>`
2. Set the GitHub default branch to `main` (Settings → General). Close PR #1
3. Ask Hiral for the illustrations' source and licence; update THIRD_PARTY_NOTICES (script) and HANDOFF §7
4. Hindi/Marathi translations for the new strings; native review of the wordmark scripts
5. Decide on the client-side preview engine (see Decisions)
