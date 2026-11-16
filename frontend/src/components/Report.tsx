import { useState } from "react";

import { DiffText } from "@/components/DiffText";
import { Stamp } from "@/components/Stamp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { docLabel } from "@/lib/labels";
import { t } from "@/lib/strings";
import type { Anchor, CompareResponse, DocType, DocumentEntry, FieldName, Finding, Purpose, Severity } from "@/lib/types";

interface Props {
  purpose: Purpose;
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

const STATUS_STAMP = {
  all_match: { tone: "match", label: "stamp.match" },
  minor_differences: { tone: "minor", label: "stamp.minor" },
  mismatches_found: { tone: "mismatch", label: "stamp.mismatch" },
} as const;

const rule = <hr className="my-4 border-0 border-t-2 border-dashed border-ink/25" />;

export function Report({ purpose, report, docs, anchor, busy, onAnchor, onEdit }: Props) {
  const { summary, findings, fix_plan } = report;
  const fieldsToAnchor = [...new Set(
    findings.filter((f) => f.severity !== "cosmetic").map((f) => f.field),
  )];
  return (
    <section aria-labelledby="report-title" className="flex flex-col gap-4">
      <h3 id="report-title" tabIndex={-1} className="display text-3xl focus:outline-none">{t("step.report")}</h3>

      <article className="receipt px-5 font-mono text-sm shadow-[0_6px_20px_rgb(20_33_61/0.12)]" aria-label={t("receipt.title")}>
        <p className="text-center text-xs uppercase tracking-[0.3em]">{t("app.title")} · {t("receipt.title")}</p>
        {rule}
        <dl className="grid grid-cols-[auto_1fr] gap-x-3">
          <dt className="text-ink/70">{t("receipt.purpose")}</dt><dd>{t(`purpose.${purpose}`)}</dd>
          <dt className="text-ink/70">{t("receipt.documents")}</dt><dd>{docs.map((d) => docLabel(d.doc_type)).join(", ")}</dd>
        </dl>
        {rule}
        <div className="relative pr-28" role="status">
          <p className="font-sans text-xl font-semibold" data-testid="report-status">{t(`report.status.${summary.status}`)}</p>
          <p>{t("report.counts", summary.counts)}</p>
          <Stamp key={summary.status} label={t(STATUS_STAMP[summary.status].label)} tone={STATUS_STAMP[summary.status].tone}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-lg" />
        </div>
        {rule}
        <h3 className="mb-2 font-sans text-base font-semibold">{t("report.findings")}</h3>
        {findings.length === 0 ? (
          <p>{t("report.noFindings")}</p>
        ) : (
          <>
            <p className="mb-3 text-xs text-ink/70">{t("receipt.diffLegend")}</p>
            <ul className="flex flex-col gap-4">
              {findings.map((f, i) => <FindingItem key={i} finding={f} />)}
            </ul>
          </>
        )}
        {rule}
        <h3 className="mb-2 font-sans text-base font-semibold">{t("report.fixPlan")}</h3>
        {fix_plan.length === 0 ? (
          <p>{t("report.noFixPlan")}</p>
        ) : (
          <ol className="flex flex-col gap-3 font-sans">
            {fix_plan.map((s) => (
              <li key={s.step} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-sm text-paper">{s.step}</span>
                <div>
                  {s.doc && <p className="font-semibold">{docLabel(s.doc)}</p>}
                  <p>{s.action}</p>
                  {s.caution && <p className="mt-1 font-medium text-stamp"><strong>{t("report.caution")}</strong> {s.caution}</p>}
                  {s.source_url && (
                    <a className="inline-block min-h-11 py-2 underline" href={s.source_url} target="_blank" rel="noreferrer">
                      {t("report.source")}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
        {rule}
        <p className="text-center text-xs">{report.disclaimer}</p>
      </article>

      {fieldsToAnchor.length > 0 && (
        <AnchorPicker fields={fieldsToAnchor} docs={docs} anchor={anchor} busy={busy} onApply={onAnchor} />
      )}

      <Button variant="outline" onClick={onEdit}>{t("report.edit")}</Button>
    </section>
  );
}

function FindingItem({ finding: f }: { finding: Finding }) {
  const base = f.values[f.docs[0]] ?? null;
  return (
    <li data-severity={f.severity}>
      <div className="flex flex-wrap items-center gap-2 font-sans">
        <span className={`rounded border px-2 py-0.5 text-xs font-bold uppercase ${SEVERITY_STYLE[f.severity]}`}>
          {t(`report.severity.${f.severity}`)}
        </span>
        <span className="font-semibold">{t(`report.field.${f.field}`)}</span>
      </div>
      <p className="mt-1 font-sans text-xs text-ink/70">{t(`report.severity.${f.severity}.desc`)}</p>
      <dl className="mt-2 flex flex-col gap-1">
        {f.docs.map((d, i) => (
          <div key={d} className="flex flex-col border-l-2 border-ink/20 pl-2">
            <dt className="text-xs uppercase tracking-wider text-ink/70">{docLabel(d)}</dt>
            <dd className="break-all text-base">
              {i === 0 ? f.values[d] : <DiffText base={base} value={f.values[d] ?? ""} />}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 font-sans">{f.explanation}</p>
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
