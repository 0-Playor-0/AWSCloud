# Phase 4 — Story and polish — 2026-11-16
## Built
- Single page, sticky numbered nav `01 //`–`05 //`, skip link to the tool
  - 01 hero: huge uppercase display type over three short lines; five stacked document slips for one fictional person with **character-level diff** marks; "MISMATCH" stamp lands on scroll
  - 02 what it costs: only facts from `docs/facts.md` (EPF rejections, as reported; UIDAI update limits; PAN–Aadhaar "may fail"), each with its source link; no counts or percentages
  - 03 how it works: 3 steps + privacy promise (on-device OCR wording)
  - 04 try it: the Phase 3 tool, restyled
  - 05 live counter from `/v1/stats` (graceful "not available") + repo link
  - Footer wordmark "Namma Check" in Latin, Kannada, Tamil, Telugu, Malayalam, Devanagari, Bengali
- Report = tear-off **receipt** (CSS mask teeth, mono, dashed rules): purpose, documents, status + stamp, findings with per-character diff against the first document, fix plan, disclaimer
- Design system: paper/ink/stamp/match/amber tokens, `stamp-dark` #a3241e for diff text; self-hosted fonts (Bricolage Grotesque variable, IBM Plex Sans 400/600, IBM Plex Mono 400/600, latin subsets via @fontsource)
- Motion 14.14.0 with `LazyMotion`/`domAnimation` (strict) + `MotionConfig reducedMotion="user"`: scroll reveals and the stamp only; CSS also zeroes animations under `prefers-reduced-motion`
- `lib/diff.ts` (LCS character diff) + tests; add-document card (cropper + OCR loader) lazy-loaded
## Decisions I made
- No React Bits effects (allowed up to two): the stamp and diff carry the story; saves JS
- Diff marks use colour + underline + `<mark>` (not colour alone)
- Wordmark transliterates "Namma" in every script rather than translating it (it is the product name) · **flag: needs native-speaker review** (ಕನ್ನಡ, தமிழ், తెలుగు, മലയാളം, हिन्दी, বাংলা)
- The anchor picker sits under the receipt (an interactive control on a receipt reads oddly)
## Deviations from HANDOFF.md
- Budgets are measured against the local production build (`vite preview` + local API), not the deployed URL (deploy blocked, see phase-3b)
## Verified facts
- npm 2026-11-16: motion 14.14.0, @fontsource-variable/bricolage-grotesque 5.3.0, @fontsource/ibm-plex-sans 5.3.0, @fontsource/ibm-plex-mono 5.3.0, Lighthouse 13.6.0
- Contrast (computed, WCAG 2): ink on paper 14.2; stamp on paper 4.7 / white 5.3; match 4.7 / 5.3; amber-dark on paper 5.3; ink on amber 7.4; stamp-dark on diff highlight 6.0. Replaced every `ink/60` (4.3 on white) with `ink/70`
## Budgets (section 7)
- Lighthouse 13.6.0, mobile, simulated slow 4G (150 ms RTT, 1.6 Mbps, 4× CPU): **Performance 99, Accessibility 100, Best practices 100, SEO 91**
- LCP 0.8 s (budget 2.5 s) · FCP 0.8 s · TBT 120 ms · CLS 0 · total transfer 247 KiB
- Initial JS 124.3 KB gzip (index 123.6 + runtime 0.7; budget 200) · add-document chunk 26.5 KB and Tesseract loader 7.3 KB load on demand · fonts 142 KB (7 woff2)
- axe-core (WCAG 2 A/AA + best practice) clean in 9 states: landing, documents, report, add photo/typed/sample, crop, OCR review, consent dialog
- Keyboard: all controls reachable, visible 3 px focus ring, step changes move focus to the step heading; touch targets ≥44 px (`min-h-11`)
## Tests
- vitest 54 passed · Playwright 16 passed (adds landing sections/counter under reduced motion, receipt diff) · pytest 289 passed · ruff, oxlint clean
## AWS resources and cost so far
- budget `namma-check-monthly` only · $0
## Privacy checklist (section 4)
- 1, 7, 10: the landing privacy promise uses the same wording as the consent text · others unchanged from phase-3b
## Open issues and risks
- Not deployed (SCP blocks CloudFormation): live e2e, smoke, Lighthouse on the real URL pending
- react-easy-crop: crop position by keyboard relies on the library's own arrow-key handling; zoom and shape have explicit controls. Needs a manual keyboard pass on a phone
- First photo use downloads ~7 MB of OCR assets; on slow 4G that is about 35 s once (then cached). The UI shows progress only for recognition, not the download
- Tamil/Telugu/Malayalam/Bengali glyphs rely on the phone's system fonts (not self-hosted, to keep weight down)
## Questions for the architect
1. Approve the wordmark transliterations for review, or drop scripts nobody can check?
2. Add a download progress/size note before the first OCR ("about 7 MB, once")?
## Suggestions (not built)
- Self-host Noto Sans subsets for the wordmark scripts only (~10 KB each, subset to the used glyphs)
- Run the Playwright suite in CI
