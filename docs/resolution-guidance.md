# Resolution guidance

Namma Check now adds deterministic resolution guidance to every comparison. The guidance is
static, source-linked text selected by the discrepancy type; it does not change the comparison
result, severity, findings, fix plan, or disclaimer.

## API contract

`POST /v1/compare` keeps every existing top-level response field and adds one field:

```json
{
  "summary": { "status": "mismatches_found", "counts": { "blocking": 0, "risky": 1, "cosmetic": 0 } },
  "findings": [
    {
      "field": "name",
      "kind": "initials_vs_expanded",
      "severity": "risky",
      "docs": ["aadhaar", "pan"],
      "values": { "aadhaar": "A MEHRA", "pan": "ARJUN MEHRA" },
      "explanation": "One document uses initials where the other spells the words out.",
      "rule_ids": []
    }
  ],
  "fix_plan": [
    {
      "step": 1,
      "doc": null,
      "action": "Decide which document shows your correct name, then mark it as correct",
      "caution": null,
      "source_url": null
    }
  ],
  "guidance": [
    {
      "finding_index": 0,
      "code": "NAME_INITIALS_VS_EXPANDED",
      "title": "Initials and expanded name differ",
      "summary": "One document uses initials where the other spells the name out.",
      "priority": "review",
      "why_it_matters": "Initials are common in Indian records, but some applications require the expanded name.",
      "recommended_action": "Confirm the expansion from an original document and check whether the intended service requires the full form.",
      "steps": [
        "Confirm the full name from an original supporting document.",
        "Check whether the intended service requires initials or the expanded name.",
        "If an issuer's record is wrong, use that issuer's current correction process."
      ],
      "official_references": [
        {
          "source_id": "uidai_updates",
          "label": "UIDAI: Enrolment & Update",
          "url": "https://uidai.gov.in/en/enrolment-and-update",
          "authority": "Unique Identification Authority of India (UIDAI)",
          "status": "verified",
          "verified_on": "2026-11-27"
        },
        {
          "source_id": "pan_correction",
          "label": "UTIITSL: Changes or correction in PAN data",
          "url": "https://www.pan.utiitsl.com/PAN/csf.html",
          "authority": "UTIITSL (authorised PAN service provider)",
          "status": "verified",
          "verified_on": "2026-11-27"
        }
      ],
      "disclaimer": "General advice only. It does not verify identity or determine eligibility. Official links contain the issuer's requirements; the issuing authority decides whether and how a correction is allowed."
    }
  ],
  "disclaimer": "Self-check only. Not legal advice. Authorities decide."
}
```

The example is synthetic. `finding_index` is the zero-based index of the related item in
`findings`. Guidance is omitted for matching or unavailable fields because those fields do not
produce findings. `official_references` can be empty when no relevant document source is known.

### Item fields

| Field | Type | Meaning |
|---|---|---|
| `finding_index` | integer | Zero-based index into `findings`; entries are contiguous and ordered. |
| `code` | string | Stable identifier for the field and discrepancy kind. |
| `title` | string | Short label for the discrepancy. |
| `summary` | string | Plain-English description of the detected kind. |
| `priority` | `optional`, `review`, `review_first` | Suggested order of attention, not a claim that an application will be rejected. |
| `why_it_matters` | string | General consequence of strict or literal comparison. |
| `recommended_action` | string | The safe next action. |
| `steps` | array of strings | Ordered, practical checks. |
| `official_references` | array of reference objects | Relevant issuer or authority sources with verification metadata. |
| `disclaimer` | string | Limits on the advice. |

The API validates the guidance response schema before returning it and recomputes the
expected guidance from the findings, purpose, document types, and source catalogue. Missing
guidance, a code attached to the wrong finding, altered source metadata, invalid priorities,
non-HTTPS reference URLs, and a guidance/findings count mismatch fail closed with the normal
`500 internal_error` response. No validation exception or source data is returned to the client.

## Discrepancy coverage

The catalogue covers every non-exact discrepancy kind produced by the comparison engine:

- Name and parent or guardian name: `format_only`, `token_order`, `initials_vs_expanded`,
  `missing_token`, `spelling_variant`, and `different`.
- Date of birth: `year_only`, `day_month_swapped`, `off_by_small`, and `different`.
- Gender: `gender_mismatch`.

Codes are field-specific, for example `NAME_INITIALS_VS_EXPANDED`,
`PARENT_NAME_INITIALS_VS_EXPANDED`, and `DOB_OFF_BY_SMALL`. An unknown runtime field/kind
combination passed to the guidance builder uses the safe `GENERIC_MISMATCH` fallback instead of
inventing advice. Adding a new discrepancy kind to the comparison engine intentionally requires
an atomic catalogue update; the loader fails closed if known-pair coverage is missing.

`review_first` means “verify the underlying record before changing anything.” It does not claim
that a correction is legally possible, that identity has been verified, or that a correction will
be granted. Formatting-only differences use `optional`; no guidance uses `critical`.

## Source selection

`engine/guidance.yaml` contains both the guidance catalogue and the source registry. References
are selected from the document types involved in the finding. Purpose-specific references and
steps are then added:

- `pan_aadhaar_link` adds the Income Tax Department linking FAQ.
- `epf_claim` adds the EPFO member FAQ and a reminder to follow EPFO's current official guidance
  for a differing EPF or UAN record.

The registry currently contains these sources, verified on **2026-11-27**:

| Source ID | Authority | URL |
|---|---|---|
| `uidai_updates` | Unique Identification Authority of India (UIDAI) | <https://uidai.gov.in/en/enrolment-and-update> |
| `pan_correction` | UTIITSL, an authorised PAN service provider | <https://www.pan.utiitsl.com/PAN/csf.html> |
| `passport_change` | Ministry of External Affairs, Passport Seva | <https://www.passportindia.gov.in/psp/FaqServicesAvailable> |
| `cbse_correction` | Central Board of Secondary Education (CBSE) | <https://www.cbse.gov.in/cbsenew/exam_corr.html> |
| `rbi_kyc` | Reserve Bank of India (RBI) | <https://www.rbi.org.in/commonperson/English/Scripts/FAQs.aspx?Id=3782> |
| `pan_aadhaar_linking` | Income Tax Department, Ministry of Finance | <https://www.incometax.gov.in/iec/foportal/help/e-filing-link-aadhaar-faq> |
| `epfo_member_faq` | Employees' Provident Fund Organisation (EPFO) | <https://www.epfo.gov.in/faq-epfo/> |

The CBSE page was confirmed through official indexed content on the verification date; a direct
automated fetch returned HTTP 403. That limitation is recorded rather than treating a failed
fetch as a successful verification.

A source that cannot be verified must use `status: needs_verification` and
`verified_on: null`. The loader rejects unknown source IDs, duplicate codes, missing known-pair
coverage, empty step lists, non-HTTPS URLs, hosts outside the approved official domains, invalid
dates, unsupported priority values, and common affirmative forms of identity, eligibility, or
guarantee claims. Static copy still requires human source and safety review when it is edited.

## Privacy and safety

- Guidance is assembled from static text and source metadata. It never copies document values,
  names, dates, OCR text, or free-form user text into guidance.
- No new logging, storage, database writes, cookies, or browser persistence were added.
- The existing request-size limit, metadata-only logs, and no-persistence controls still apply.
- The guidance disclaimer repeats that this is general advice, not identity verification or an
  eligibility decision. Authorities decide whether and how to correct a record.
- The backend guidance schema is strict: unknown fields inside guidance or references, invalid
  priorities, non-HTTPS references, mismatched codes or source metadata, and malformed guidance
  are rejected rather than passed through.

## Bedrock decision

The optional Bedrock layer is **deferred and is not implemented in this change**. Deterministic
guidance is the supported path. Model availability, account access, IAM permission, region support,
and cost still need explicit confirmation before any live invocation.

If it is approved later, its privacy-safe extension contract is:

1. Send only catalogue identifiers and enums: discrepancy code, purpose, document type, template
   ID, and source IDs. Never send OCR text, document values, names, dates, or identifying data.
2. Accept only a schema-validated response built from approved static text and source IDs. The
   model must not invent URLs, authorities, legal claims, eligibility decisions, or guarantees.
3. On timeout, service error, invalid schema, or prohibited claim, discard the model result and
   return the deterministic guidance unchanged.
4. Use the same AWS region only, do not log model invocation payloads, and test the adapter with a
   mock model before enabling it.
5. Keep the deterministic path as the fallback even when the model is available.

No Bedrock call is made by this implementation.
