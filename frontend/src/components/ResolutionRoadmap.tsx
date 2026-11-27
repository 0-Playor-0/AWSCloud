import { useLanguage, useT } from "@/lib/language-context";
import { docLabel } from "@/lib/labels";
import { groupGuidance } from "@/lib/report";
import type { Finding, FixStep, GuidanceItem, GuidancePriority } from "@/lib/types";

const PRIORITY_RANK: Record<GuidancePriority, number> = {
  review_first: 0,
  review: 1,
  optional: 2,
};

const PRIORITY_STYLE: Record<GuidancePriority, string> = {
  optional: "border-match/40 bg-match/5 text-match",
  review: "border-amber-dark/40 bg-amber/15 text-amber-dark",
  review_first: "border-ink bg-ink text-paper",
};

const PRIORITY_ICON: Record<GuidancePriority, string> = {
  optional: "i",
  review: "?",
  review_first: "↑",
};

function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function isGovernmentSource(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "gov.in" || host.endsWith(".gov.in");
  } catch {
    return false;
  }
}

function verifiedDate(value: string | null, locale: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === "en" ? "en-IN" : `${locale}-IN`, { dateStyle: "medium" }).format(date);
}

export function ResolutionRoadmap({
  guidance,
  findings,
  steps,
}: {
  guidance: GuidanceItem[];
  findings: Finding[];
  steps: FixStep[];
}) {
  const t = useT();
  const { locale } = useLanguage();
  const orderedGuidance = groupGuidance(guidance, findings)
    .map((group, order) => ({ group, order }))
    .sort((a, b) => PRIORITY_RANK[a.group.item.priority] - PRIORITY_RANK[b.group.item.priority] || a.order - b.order)
    .map(({ group }) => group);

  return (
    <section aria-labelledby="roadmap-title" className="flex flex-col gap-5">
      <header>
        <h3 id="roadmap-title" className="font-sans text-xl font-semibold">{t("report.roadmapTitle")}</h3>
        <p className="mt-1 text-sm text-ink/75">{t("report.roadmapHelp")}</p>
        <p className="mt-1 text-sm text-ink/75">{t("report.roadmapPriority")}</p>
      </header>

      {orderedGuidance.length > 0 ? (
        <section aria-labelledby="guidance-title" className="flex flex-col gap-3">
          <h4 id="guidance-title" className="font-sans text-lg font-semibold">{t("report.guidanceTitle")}</h4>
          <ol className="flex flex-col gap-4" aria-label={t("report.guidanceTitle")}>
            {orderedGuidance.map((group) => {
              const item = group.item;
              const generic = item.code === "GENERIC_MISMATCH";
              return (
                <li key={item.code} className="rounded-md border border-ink/20 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      {generic && (
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/70">
                          {t("report.guidanceGeneric")}
                        </p>
                      )}
                      <h5 className="font-semibold break-words">{item.title}</h5>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded border px-2 py-0.5 text-xs font-bold uppercase ${PRIORITY_STYLE[item.priority]}`}>
                      <span aria-hidden="true">{PRIORITY_ICON[item.priority]}</span>
                      {t(`report.priority.${item.priority}`)}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-ink/75">{item.summary}</p>
                  {group.comparisons.length > 0 && (
                    <p className="mt-1 text-xs text-ink/70">
                      {t("report.relatedComparison")}: {group.comparisons.map((comparison) => comparison.docs.map((id) => docLabel(id, t)).join(" ↔ ")).join(" · ")}
                    </p>
                  )}

                  <div className="mt-3 rounded border-l-4 border-ink/25 bg-ink/5 p-3">
                    <p className="text-sm"><strong>{t("report.whyItMatters")}</strong> {item.why_it_matters}</p>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-semibold">{t("report.recommendedAction")}</p>
                    <p className="mt-1 text-sm">{item.recommended_action}</p>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-semibold">{t("report.checklist")}</p>
                    <ol className="mt-2 flex flex-col gap-2">
                      {item.steps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full border border-ink/30 font-mono text-xs">
                            {index + 1}
                          </span>
                          <span className="break-words">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="mt-4 border-t border-ink/10 pt-3">
                    <p className="text-sm font-semibold">{t("report.officialReference")}</p>
                    {group.references.length === 0 ? (
                      <p className="mt-1 text-sm text-ink/70">{t("report.noOfficialReference")}</p>
                    ) : (
                      <ul className="mt-2 flex flex-col gap-3">
                        {group.references.map((reference) => {
                          const date = verifiedDate(reference.verified_on, locale);
                          return (
                            <li key={reference.source_id}>
                              <a
                                className="inline-flex min-h-11 items-center underline"
                                href={reference.url}
                                target="_blank"
                                rel="noreferrer noopener"
                              >
                                {reference.label} <span aria-hidden="true">↗</span>
                                <span className="ml-1 font-mono text-xs text-ink/70">({sourceHost(reference.url)})</span>
                              </a>
                              <p className="text-xs text-ink/75">{t("report.authority")}: {reference.authority}</p>
                              <p className={`text-xs font-medium ${reference.status === "verified" ? "text-match" : "text-amber-dark"}`}>
                                {reference.status === "verified" && date
                                  ? t("report.verifiedSource", { date })
                                  : t("report.needsVerification")}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <p className="mt-3 border-t border-ink/10 pt-3 text-xs text-ink/70">
                    <strong>{t("report.guidanceLimits")}</strong> {item.disclaimer}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      ) : (
        <div className="rounded-md border border-match/30 bg-match/5 p-4 text-sm">
          <p className="font-semibold text-match">✓ {t("report.noFixPlan")}</p>
        </div>
      )}

      {(orderedGuidance.length > 0 || steps.length > 0) && (
      <section aria-labelledby="fix-plan-title" className="flex flex-col gap-3">
        <div>
          <h4 id="fix-plan-title" className="font-sans text-lg font-semibold">{t("report.fixPlan")}</h4>
          <p className="mt-1 text-sm text-ink/75">{t("report.fixPlanHelp")}</p>
        </div>

        {steps.length === 0 ? (
          <p className="text-sm text-ink/75">
            {orderedGuidance.length === 0 ? t("report.noFixPlan") : t("report.noDocumentSteps")}
          </p>
        ) : (
          <ol className="flex flex-col gap-3" aria-label={t("report.fixPlan")}>
            {steps.map((step) => {
              const generic = step.doc === null;
              return (
                <li key={step.step} className="rounded-md border border-ink/20 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-sm font-semibold text-paper"
                    >
                      {step.step}
                    </span>
                    <div className="min-w-0 flex-1">
                      {generic ? (
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-dark">
                          {t("report.decisionNeeded")}
                        </p>
                      ) : (
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink/70">
                          {t("report.target")}: {docLabel(step.doc!, t)}
                        </p>
                      )}
                      <p className="mt-1 font-medium break-words">{step.action}</p>
                      {generic && (
                        <p className="mt-1 text-sm text-ink/75">{t("report.genericGuidance")}</p>
                      )}
                      {step.caution && (
                        <p className="mt-3 rounded border-l-4 border-amber-dark bg-amber/15 p-2 text-sm">
                          <strong>{t("report.caution")}</strong> {step.caution}
                        </p>
                      )}
                      {step.source_url && (
                        <p className="mt-3 text-sm">
                          <a
                            className="inline-flex min-h-11 items-center underline"
                            href={step.source_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={`${t(isGovernmentSource(step.source_url) ? "report.governmentReference" : "report.reference")}: ${sourceHost(step.source_url)} (${t("report.opensNewTab")})`}
                          >
                            {t(isGovernmentSource(step.source_url) ? "report.governmentReference" : "report.reference")}
                            <span aria-hidden="true" className="ml-1">↗</span>
                            <span className="ml-1 font-mono text-xs text-ink/70">({sourceHost(step.source_url)})</span>
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
      )}
    </section>
  );
}
