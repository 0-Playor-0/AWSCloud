import { createPortal } from "react-dom";

import { useLanguage, useT } from "@/lib/language-context";
import { docLabel } from "@/lib/labels";
import { backendDocumentIds, buildFieldComparisons, groupGuidance } from "@/lib/report";
import type { CompareResponse, DocumentEntry, Purpose, Severity } from "@/lib/types";

const SEVERITY_ORDER: Severity[] = ["blocking", "risky", "cosmetic"];
const PRIORITY_RANK = { review_first: 0, review: 1, optional: 2 } as const;

function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function PrintReport({
  report,
  docs,
  purpose,
  generatedAt,
}: {
  report: CompareResponse;
  docs: DocumentEntry[];
  purpose: Purpose;
  generatedAt: Date;
}) {
  const t = useT();
  const { locale } = useLanguage();
  const comparisons = buildFieldComparisons(docs, report.findings);
  const different = comparisons.filter((item) => item.state === "difference");
  const matched = comparisons.filter((item) => item.state === "matched");
  const documentLabels = backendDocumentIds(docs).map((id) => docLabel(id, t));
  const guidanceGroups = groupGuidance(report.guidance, report.findings)
    .sort((a, b) => PRIORITY_RANK[a.item.priority] - PRIORITY_RANK[b.item.priority]);
  const date = new Intl.DateTimeFormat(locale === "en" ? "en-IN" : `${locale}-IN`, { dateStyle: "long" })
    .format(generatedAt);

  return createPortal(
    <div className="print-report">
      <header>
        <p className="print-kicker">{t("report.printKicker")}</p>
        <h1>{t("report.printTitle")}</h1>
        <dl className="print-meta">
          <div><dt>{t("receipt.purpose")}</dt><dd>{t(`purpose.${purpose}`)}</dd></div>
          <div><dt>{t("report.generated")}</dt><dd>{date}</dd></div>
        </dl>
      </header>

      <section>
        <h2>{t("report.printSummary")}</h2>
        <p><strong>{t(`report.status.${report.summary.status}`)}</strong></p>
        <p>{t("report.counts", report.summary.counts)}</p>
        <p><strong>{t("report.printDocuments")}:</strong> {documentLabels.join(", ")}</p>
      </section>

      <section>
        <h2>{t("report.printFields")}</h2>
        {different.length === 0 ? (
          <p>{t("report.noFindings")}</p>
        ) : (
          <ul>
            {different.flatMap((comparison) => comparison.findings.map((finding) => {
              const severity = SEVERITY_ORDER.find((item) => finding.severity === item) ?? finding.severity;
              return (
                <li key={`${comparison.field}-${finding.docs.join("-")}-${severity}`}>
                  <strong>{t(`report.field.${comparison.field}`)}</strong> — {t(`report.severity.${severity}`)}: {" "}
                  {finding.docs.map((id) => docLabel(id, t)).join(" ↔ ")}
                </li>
              );
            }))}
          </ul>
        )}
        {matched.length > 0 && (
          <>
            <h2>{t("report.printMatched")}</h2>
            <p>{matched.map((item) => t(`report.field.${item.field}`)).join(", ")}</p>
          </>
        )}
      </section>

      <section>
        <h2>{t("report.printGuidance")}</h2>
        {guidanceGroups.length === 0 ? (
          <p>{t("report.printNoGuidance")}</p>
        ) : (
          <ol className="print-guidance">
            {guidanceGroups.map((group) => {
              const item = group.item;
              return (
                <li key={item.code}>
                  <p>
                    <strong>{item.title}</strong> — {t(`report.priority.${item.priority}`)}
                    {item.code === "GENERIC_MISMATCH" && ` · ${t("report.guidanceGeneric")}`}
                  </p>
                  {group.comparisons.length > 0 && (
                    <p>{t("report.relatedComparison")}: {group.comparisons.map((comparison) => comparison.docs.map((id) => docLabel(id, t)).join(" ↔ ")).join(" · ")}</p>
                  )}
                  <p>{item.summary}</p>
                  <p><strong>{t("report.whyItMatters")}</strong> {item.why_it_matters}</p>
                  <p><strong>{t("report.recommendedAction")}</strong> {item.recommended_action}</p>
                  <div className="print-checklist">
                    <p><strong>{t("report.checklist")}</strong></p>
                    <ol>
                      {item.steps.map((step, index) => <li key={index}>{step}</li>)}
                    </ol>
                  </div>
                  {group.references.length > 0 && (
                    <p>
                      <strong>{t("report.officialReference")}</strong>: {" "}
                      {group.references.map((reference) => `${reference.label} (${sourceHost(reference.url)})`).join("; ")}
                    </p>
                  )}
                  <p><strong>{t("report.guidanceLimits")}</strong> {item.disclaimer}</p>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section>
        <h2>{t("report.printActions")}</h2>
        {report.fix_plan.length === 0 ? (
          <p>{t("report.printNoActions")}</p>
        ) : (
          <ol>
            {report.fix_plan.map((step) => (
              <li key={step.step}>
                {step.doc ? (
                  <strong>{docLabel(step.doc, t)}: {step.action}</strong>
                ) : (
                  <><strong>{t("report.decisionNeeded")} · {t("report.genericGuidance")}</strong> {step.action}</>
                )}
                {step.caution && <span> {t("report.caution")} {step.caution}</span>}
                {step.source_url && <span> ({sourceHost(step.source_url)})</span>}
              </li>
            ))}
          </ol>
        )}
      </section>

      <footer>
        <p><strong>{t("report.disclaimerSelfCheck")}</strong></p>
        <p>{report.disclaimer}</p>
        <p>{t("report.printNoUpdates")}</p>
      </footer>
    </div>,
    document.body,
  );
}
