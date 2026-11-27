import { useMemo, useState } from "react";

import { DiffText } from "@/components/DiffText";
import { PrintReport } from "@/components/PrintReport";
import { ResolutionRoadmap } from "@/components/ResolutionRoadmap";
import { Stamp } from "@/components/Stamp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/language-context";
import { docLabel } from "@/lib/labels";
import { backendDocumentIds, buildFieldComparisons, fieldComparisonCounts, type FieldComparison } from "@/lib/report";
import type { Anchor, CompareResponse, DocType, DocumentEntry, FieldName, Finding, Purpose, Severity } from "@/lib/types";

interface Props {
  purpose: Purpose;
  report: CompareResponse;
  docs: DocumentEntry[];
  anchor: Anchor;
  busy: boolean;
  generatedAt: Date;
  onAnchor: (a: Anchor) => void;
  onEdit: () => void;
}

const SEVERITY_STYLE: Record<Severity, string> = {
  blocking: "border-stamp/40 bg-stamp/10 text-stamp-dark",
  risky: "border-amber-dark/40 bg-amber/15 text-amber-dark",
  cosmetic: "border-ink/25 bg-ink/5 text-ink",
};

const SEVERITY_ICON: Record<Severity, string> = {
  blocking: "!",
  risky: "?",
  cosmetic: "i",
};

const STATUS_STAMP = {
  all_match: { tone: "match", label: "stamp.match" },
  minor_differences: { tone: "minor", label: "stamp.minor" },
  mismatches_found: { tone: "mismatch", label: "stamp.mismatch" },
} as const;

const rule = <hr className="my-5 border-0 border-t-2 border-dashed border-ink/25" />;

export function Report({ purpose, report, docs, anchor, busy, generatedAt, onAnchor, onEdit }: Props) {
  const t = useT();
  const { summary, findings, fix_plan } = report;
  const comparisons = useMemo(() => buildFieldComparisons(docs, findings), [docs, findings]);
  const orderedComparisons = useMemo(
    () => [...comparisons].sort((a, b) => {
      const rank = { difference: 0, matched: 1, "not-compared": 2 };
      return rank[a.state] - rank[b.state];
    }),
    [comparisons],
  );
  const fieldCounts = fieldComparisonCounts(comparisons);
  const documentIds = backendDocumentIds(docs);
  const fieldsToAnchor = [...new Set(findings.filter((finding) => finding.severity !== "cosmetic").map((finding) => finding.field))];

  return (
    <section aria-labelledby="report-title" className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id="report-title" tabIndex={-1} className="display text-3xl focus:outline-none">{t("step.report")}</h3>
          <p className="mt-1 text-sm text-ink/75">{t("report.fieldCheckHelp")}</p>
        </div>
        <div className="sm:max-w-64 sm:text-right">
          <Button variant="outline" onClick={() => window.print()} aria-describedby="print-help">
            {t("report.print")}
          </Button>
          <p id="print-help" className="mt-1 text-xs text-ink/70">{t("report.printHelp")}</p>
        </div>
      </div>

      <article className="receipt px-4 font-mono text-sm shadow-[0_6px_20px_rgb(20_33_61/0.12)] sm:px-5" aria-label={t("receipt.title")}>
        <p className="text-center text-xs uppercase tracking-[0.3em]">{t("app.title")} · {t("receipt.title")}</p>
        {rule}
        <dl className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-[auto_1fr]">
          <dt className="text-ink/70">{t("receipt.purpose")}</dt>
          <dd>{t(`purpose.${purpose}`)}</dd>
          <dt className="text-ink/70">{t("receipt.documents")}</dt>
          <dd>
            <ul className="flex flex-wrap gap-1.5">
              {documentIds.map((id) => (
                <li key={id} className="rounded border border-ink/20 bg-white px-2 py-0.5 text-xs">{docLabel(id, t)}</li>
              ))}
            </ul>
          </dd>
        </dl>
        {rule}
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center" role="status">
          <div className="min-w-0 flex-1">
            <p className="font-sans text-xl font-semibold" data-testid="report-status">{t(`report.status.${summary.status}`)}</p>
            <p>{t("report.counts", summary.counts)}</p>
            <p className="mt-1 text-xs text-ink/70">{t("report.comparedFields", fieldCounts)}</p>
          </div>
          <Stamp
            key={summary.status}
            label={t(STATUS_STAMP[summary.status].label)}
            tone={STATUS_STAMP[summary.status].tone}
            className="shrink-0 text-lg"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label={t("report.summaryTitle")}>
          {(["blocking", "risky", "cosmetic"] as Severity[]).map((severity) => (
            <div key={severity} className={`flex items-center justify-between gap-2 rounded border px-3 py-2 font-sans ${SEVERITY_STYLE[severity]}`}>
              <span className="text-sm font-semibold">{t(`report.severity.${severity}`)}</span>
              <span className="font-mono text-lg font-semibold">{summary.counts[severity]}</span>
            </div>
          ))}
        </div>

        {rule}
        <div className="font-sans">
          <h4 className="text-lg font-semibold">{t("report.fieldCheckTitle")}</h4>
          <p className="mt-1 text-sm text-ink/70">{t("report.fieldCheckHelp")}</p>
          <p className="mt-2 text-xs text-ink/70">{t("report.valuesNote")}</p>
          <ul className="mt-3 flex flex-col gap-3">
            {orderedComparisons.map((comparison) => <FieldComparisonRow key={comparison.field} comparison={comparison} />)}
          </ul>
        </div>
        {rule}
        <p className="text-center text-xs">{report.disclaimer}</p>
      </article>

      <ResolutionRoadmap guidance={report.guidance} findings={findings} steps={fix_plan} />

      {fieldsToAnchor.length > 0 && (
        <AnchorPicker fields={fieldsToAnchor} docs={docs} anchor={anchor} busy={busy} onApply={onAnchor} />
      )}

      <Button variant="outline" onClick={onEdit}>{t("report.edit")}</Button>

      <PrintReport report={report} docs={docs} purpose={purpose} generatedAt={generatedAt} />
    </section>
  );
}

function FieldComparisonRow({ comparison }: { comparison: FieldComparison }) {
  const t = useT();
  if (comparison.state === "difference") {
    return (
      <li data-state="difference" className="rounded-md border border-stamp/30 border-l-4 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h5 className="font-semibold">{t(`report.field.${comparison.field}`)}</h5>
          <span className="inline-flex items-center gap-1 rounded border border-stamp/40 bg-stamp/10 px-2 py-0.5 text-xs font-bold uppercase text-stamp-dark">
            <span aria-hidden="true">≠</span> {t("report.difference")}
          </span>
        </div>
        <div className="mt-2 flex flex-col gap-3">
          {comparison.findings.map((finding, index) => <FindingItem key={`${finding.docs.join("-")}-${index}`} finding={finding} />)}
        </div>
      </li>
    );
  }

  if (comparison.state === "matched") {
    return (
      <li data-state="matched" className="rounded-md border border-match/30 bg-match/5 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h5 className="font-semibold">{t(`report.field.${comparison.field}`)}</h5>
          <span className="inline-flex items-center gap-1 rounded border border-match/40 bg-white px-2 py-0.5 text-xs font-bold uppercase text-match">
            <span aria-hidden="true">✓</span> {t("report.matched")}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink/75">{t("report.matchedHelp")}</p>
        <p className="mt-1 text-xs text-ink/70">
          {t("report.checkedIn", { docs: comparison.providedDocIds.map((id) => docLabel(id, t)).join(", ") })}
        </p>
      </li>
    );
  }

  return (
    <li data-state="not-compared" className="rounded-md border border-ink/20 bg-ink/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h5 className="font-semibold">{t(`report.field.${comparison.field}`)}</h5>
        <span className="inline-flex items-center gap-1 rounded border border-ink/25 bg-white px-2 py-0.5 text-xs font-bold uppercase text-ink/75">
          <span aria-hidden="true">–</span> {t("report.notCompared")}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink/75">{t("report.notComparedHelp")}</p>
    </li>
  );
}

function FindingItem({ finding }: { finding: Finding }) {
  const t = useT();
  const firstDoc = finding.docs[0];
  const secondDoc = finding.docs[1];
  const base = firstDoc ? finding.values[firstDoc] ?? null : null;
  const value = secondDoc ? finding.values[secondDoc] ?? "" : "";
  return (
    <div data-severity={finding.severity} className="rounded border border-ink/15 bg-paper/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-bold uppercase ${SEVERITY_STYLE[finding.severity]}`}>
          <span aria-hidden="true">{SEVERITY_ICON[finding.severity]}</span>
          {t(`report.severity.${finding.severity}`)}
        </span>
        <span className="font-sans text-sm font-medium">
          {t("report.difference")}: {docLabel(firstDoc, t)} ↔ {docLabel(secondDoc, t)}
        </span>
      </div>
      <p className="mt-1 font-sans text-xs text-ink/70">
        <strong>{t("report.whyItMatters")}</strong> {t(`report.severity.${finding.severity}.desc`)}
      </p>
      <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="min-w-0 rounded border border-ink/15 bg-white p-2">
          <dt className="font-sans text-xs font-semibold uppercase tracking-wide text-ink/70">{docLabel(firstDoc, t)}</dt>
          <dd className="mt-1 break-all font-mono text-base">{base}</dd>
        </div>
        <div className="min-w-0 rounded border border-ink/15 bg-white p-2">
          <dt className="font-sans text-xs font-semibold uppercase tracking-wide text-ink/70">{docLabel(secondDoc, t)}</dt>
          <dd className="mt-1 break-all font-mono text-base"><DiffText base={base} value={value} /></dd>
        </div>
      </dl>
      <p className="mt-3 font-sans">{finding.explanation}</p>
    </div>
  );
}

function AnchorPicker({ fields, docs, anchor, busy, onApply }: {
  fields: FieldName[];
  docs: DocumentEntry[];
  anchor: Anchor;
  busy: boolean;
  onApply: (a: Anchor) => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState<Anchor>(anchor);
  const types = [...new Set(docs.map((doc) => doc.doc_type))];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("report.anchorTitle")}</CardTitle>
        <p className="text-sm text-ink/70">{t("report.anchorHelp")}</p>
      </CardHeader>
      <CardContent>
        {fields.map((field) => (
          <label key={field} className="flex flex-col gap-1">
            <span className="text-sm font-medium">{t("report.anchorFor", { field: t(`report.field.${field}`).toLowerCase() })}</span>
            <select
              className="min-h-11 rounded-md border border-ink/30 bg-white px-3"
              value={draft[field] ?? ""}
              onChange={(event) => setDraft({ ...draft, [field]: (event.target.value || null) as DocType | null })}
            >
              <option value="">{t("report.anchorNone")}</option>
              {types.map((type) => <option key={type} value={type}>{docLabel(type, t)}</option>)}
            </select>
          </label>
        ))}
        <Button onClick={() => onApply(draft)} disabled={busy}>{busy ? t("docs.checking") : t("report.anchorApply")}</Button>
      </CardContent>
    </Card>
  );
}
