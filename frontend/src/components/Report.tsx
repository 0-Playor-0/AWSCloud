import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { docLabel } from "@/lib/labels";
import { t } from "@/lib/strings";
import type { Anchor, CompareResponse, DocType, DocumentEntry, FieldName, Finding, Severity } from "@/lib/types";

interface Props {
  report: CompareResponse;
  docs: DocumentEntry[];
  anchor: Anchor;
  busy: boolean;
  onAnchor: (a: Anchor) => void;
  onEdit: () => void;
}

const SEVERITY_STYLE: Record<Severity, string> = {
  blocking: "border-stamp bg-stamp text-white",
  risky: "border-amber-dark bg-amber text-ink",
  cosmetic: "border-ink/30 bg-white text-ink",
};

const STATUS_VARIANT = { all_match: "success", minor_differences: "warning", mismatches_found: "destructive" } as const;

export function Report({ report, docs, anchor, busy, onAnchor, onEdit }: Props) {
  const { summary, findings, fix_plan } = report;
  const fieldsToAnchor = [...new Set(
    findings.filter((f) => f.severity !== "cosmetic").map((f) => f.field),
  )];
  return (
    <section aria-labelledby="report-title" className="flex flex-col gap-4">
      <h2 id="report-title" tabIndex={-1} className="text-xl font-bold focus:outline-none">{t("step.report")}</h2>

      <Alert variant={STATUS_VARIANT[summary.status]} role="status">
        <p className="text-lg font-bold" data-testid="report-status">{t(`report.status.${summary.status}`)}</p>
        <p className="text-sm">{t("report.counts", summary.counts)}</p>
      </Alert>

      <Card>
        <CardHeader><CardTitle>{t("report.findings")}</CardTitle></CardHeader>
        <CardContent>
          {findings.length === 0 ? (
            <p className="text-sm">{t("report.noFindings")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {findings.map((f, i) => <FindingItem key={i} finding={f} />)}
            </ul>
          )}
        </CardContent>
      </Card>

      {fieldsToAnchor.length > 0 && (
        <AnchorPicker fields={fieldsToAnchor} docs={docs} anchor={anchor} busy={busy} onApply={onAnchor} />
      )}

      <Card>
        <CardHeader><CardTitle>{t("report.fixPlan")}</CardTitle></CardHeader>
        <CardContent>
          {fix_plan.length === 0 ? (
            <p className="text-sm">{t("report.noFixPlan")}</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {fix_plan.map((s) => (
                <li key={s.step} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-sm text-paper">{s.step}</span>
                  <div className="text-sm">
                    {s.doc && <p className="font-semibold">{docLabel(s.doc)}</p>}
                    <p>{s.action}</p>
                    {s.caution && <p className="mt-1 font-medium text-stamp"><strong>{t("report.caution")}</strong> {s.caution}</p>}
                    {s.source_url && (
                      <a className="mt-1 inline-block underline" href={s.source_url} target="_blank" rel="noreferrer">
                        {t("report.source")}
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-ink/80">{report.disclaimer}</p>
      <Button variant="outline" onClick={onEdit}>{t("report.edit")}</Button>
    </section>
  );
}

function FindingItem({ finding: f }: { finding: Finding }) {
  return (
    <li className="rounded-md border border-ink/15 p-3" data-severity={f.severity}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded border px-2 py-0.5 text-xs font-bold uppercase ${SEVERITY_STYLE[f.severity]}`}>
          {t(`report.severity.${f.severity}`)}
        </span>
        <span className="font-semibold">{t(`report.field.${f.field}`)}</span>
      </div>
      <p className="mt-1 text-xs text-ink/70">{t(`report.severity.${f.severity}.desc`)}</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        {f.docs.map((d) => (
          <div key={d} className="contents">
            <dt className="text-ink/70">{docLabel(d)}</dt>
            <dd className="break-all font-mono">{f.values[d]}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-sm">{f.explanation}</p>
    </li>
  );
}

function AnchorPicker({ fields, docs, anchor, busy, onApply }: {
  fields: FieldName[];
  docs: DocumentEntry[];
  anchor: Anchor;
  busy: boolean;
  onApply: (a: Anchor) => void;
}) {
  const [draft, setDraft] = useState<Anchor>(anchor);
  const types = [...new Set(docs.map((d) => d.doc_type))];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("report.anchorTitle")}</CardTitle>
        <p className="text-sm text-ink/70">{t("report.anchorHelp")}</p>
      </CardHeader>
      <CardContent>
        {fields.map((f) => (
          <label key={f} className="flex flex-col gap-1">
            <span className="text-sm font-medium">{t("report.anchorFor", { field: t(`report.field.${f}`).toLowerCase() })}</span>
            <select className="min-h-11 rounded-md border border-ink/30 bg-white px-3" value={draft[f] ?? ""}
              onChange={(e) => setDraft({ ...draft, [f]: (e.target.value || null) as DocType | null })}>
              <option value="">{t("report.anchorNone")}</option>
              {types.map((d) => <option key={d} value={d}>{docLabel(d)}</option>)}
            </select>
          </label>
        ))}
        <Button onClick={() => onApply(draft)} disabled={busy}>{busy ? t("docs.checking") : t("report.anchorApply")}</Button>
      </CardContent>
    </Card>
  );
}
