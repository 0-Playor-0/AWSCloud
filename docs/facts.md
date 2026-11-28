# Facts used on the site

Section 02 ("what it costs") may only use facts listed here, each with its source. Wording on the
site must not be stronger than the source. Reviewed by: (pending human review).

| ID | Fact (as shown on the site) | Source | Status |
|---|---|---|---|
| F-AADHAAR-LIMITS | Aadhaar allows a name update twice in a lifetime and a date-of-birth or gender update once; more needs an exception process. | UIDAI FAQ: https://uidai.gov.in/en/1045-english-uk/faqs/enrolment-update/myaadhaar-online-update-service/13905-how-many-times-aadhaar-data-can-be-updated.html | verified (rule R-AADHAAR-LIMITS) |
| F-EPF-REJECTIONS | EPF claims are commonly rejected for a mismatch in date of birth, Aadhaar details or bank details. Name differences are not singled out by the source, so the site says a name difference "may" lead to rejection (name findings stay risky for EPF). | Minister of State for Labour, written reply, 9 Mar 2026, as reported by Outlook Money: https://www.outlookmoney.com/retirement/pension/epf-claim-settlement-why-epfo-rejects-the-claims-and-what-subscribers-can-do | secondary (rule R-EPF-MISMATCH, reworded 2026-11-28) |
| F-PAN-AADHAAR | PAN–Aadhaar linking may fail when name, date of birth or gender differ. | Candidate pages (not yet read): Income Tax e-filing FAQ, UIDAI PAN–Aadhaar FAQ (see logs/phase-1.md) | unverified: site says "may" |

No counts or percentages are shown on the site until a primary source for them is added here.

## Guidance links (`engine/guidance.yaml`, field `guidance` in `/v1/compare`)

The guidance engine (from PR #1) shows generic next steps per finding kind and links to the issuer's
own page. The links below were marked `verified` by Hiral on 2026-11-27; they were **not re-checked**
in Phase 6b (no network access to these hosts from the build machine). Guidance text states no fact
beyond "may"/"can" wording, except where a row above supports it.

| Source id | Page | Used for |
|---|---|---|
| uidai_updates | https://uidai.gov.in/en/enrolment-and-update | Aadhaar findings |
| pan_correction | https://www.pan.utiitsl.com/PAN/csf.html | PAN findings |
| passport_change | https://www.passportindia.gov.in/psp/FaqServicesAvailable | Passport findings |
| cbse_correction | https://www.cbse.gov.in/cbsenew/exam_corr.html | Class 10 findings |
| rbi_kyc | https://www.rbi.org.in/commonperson/English/Scripts/FAQs.aspx?Id=3782 | Bank passbook findings |
| pan_aadhaar_linking | https://www.incometax.gov.in/iec/foportal/help/e-filing-link-aadhaar-faq | PAN–Aadhaar purpose |
| epfo_member_faq | https://www.epfo.gov.in/faq-epfo/ | EPF purpose |

Wording changed in Phase 6b to "may" (no source on file):
- PAN–Aadhaar step no longer says "the Income Tax Department says…"; it says linking may fail and a
  correction may be needed (F-PAN-AADHAAR is unverified).
- "some applications require the expanded name" → "may require"; "some services compare the full date
  literally" → "may compare"; "some applications use gender as a matching field" → "may use".
- Client-side preview (`frontend/src/utils/comparisonEngine.ts`): "linking fails" → "may fail";
  "full date is required" → "may need the full date"; EPF text matches F-EPF-REJECTIONS; "often faster
  than editing Aadhaar" → "may be faster".

## Wordmark (footer)

Config: `frontend/src/lib/wordmark.ts` (one list; `enabled` switches a script off, `verified`
records a native-speaker check). "Namma" is transliterated, not translated, because it is the
product name.

| Script | Text | Status |
|---|---|---|
| Kannada | ನಮ್ಮ ಚೆಕ್ | **unverified** |
| Tamil | நம்ம செக் | **unverified** |
| Telugu | నమ్మ చెక్ | **unverified** |
| Malayalam | നമ്മ ചെക്ക് | **unverified** |
| Devanagari | नम्मा चेक | **unverified** |
| Bengali | নম্মা চেক | **unverified** |
