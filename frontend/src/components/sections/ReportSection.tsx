import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, Printer, ArrowUp } from 'lucide-react';
import {
  AppLanguage,
  ComparisonReport,
  MatchSeverity,
  SectionId,
} from '../../types/documents';
import { UI_COPY } from '../../utils/i18n';
import { HealthScore } from '../HealthScore';

interface ReportSectionProps {
  language: AppLanguage;
  report: ComparisonReport;
  onJumpTo: (id: SectionId) => void;
}

const SEVERITY_META: Record<
  MatchSeverity,
  {
    label: string;
    textClass: string;
    borderClass: string;
    bgClass: string;
    Icon: React.FC<{ className?: string }>;
  }
> = {
  match: {
    label: 'MATCH',
    textClass: 'text-[#1f7a4d]',
    borderClass: 'border-[#1f7a4d]/35',
    bgClass: 'bg-[#1f7a4d]/[0.06]',
    Icon: CheckCircle2,
  },
  variation: {
    label: 'MINOR VARIATION',
    textClass: 'text-[#9e630d]',
    borderClass: 'border-[#e9a23b]/60',
    bgClass: 'bg-[#e9a23b]/[0.12]',
    Icon: Info,
  },
  mismatch: {
    label: 'MISMATCH',
    textClass: 'text-[#c8322b]',
    borderClass: 'border-[#c8322b]/45',
    bgClass: 'bg-[#c8322b]/[0.06]',
    Icon: AlertTriangle,
  },
  incomplete: {
    label: 'NEEDS MORE DATA',
    textClass: 'text-[#14213d]/70',
    borderClass: 'border-[#14213d]/25',
    bgClass: 'bg-[#14213d]/[0.04]',
    Icon: Info,
  },
};

export const ReportSection: React.FC<ReportSectionProps> = ({
  language,
  report,
  onJumpTo,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const t = UI_COPY[language].report;
  const purposeTitle = UI_COPY[language].purposes[report.purpose].title;
  const guidance = report.guidance ?? [];
  const fixPlan = report.fixPlan ?? [];

  const stampConfig =
    report.overallStatus === 'aligned'
      ? { label: 'RECORDS ALIGNED', colorClass: 'text-[#1f7a4d] border-[#1f7a4d]' }
      : report.overallStatus === 'needs_review'
        ? { label: 'MINOR VARIATIONS', colorClass: 'text-[#9e630d] border-[#e9a23b]' }
        : { label: 'DISCREPANCY FOUND', colorClass: 'text-[#c8322b] border-[#c8322b]' };

  return (
    <section
      id="report"
      data-section="report"
      className="py-12 sm:py-16 border-b border-[#14213d]/15"
    >
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="font-mono text-[11px] tracking-[0.1em] text-[#c8322b] uppercase font-semibold">
          {t.kicker}
        </p>
        <h2 className="mt-2 font-anton uppercase text-[28px] sm:text-[34px] leading-[1.08] tracking-[0.02em] text-[#14213d] [text-wrap:balance]">
          {t.headingBefore}
          <span className="text-[#c8322b]">{t.headingRed}</span>
          {t.headingAfter}
        </h2>
      </motion.div>

      {/* Receipt-inspired paper slip */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mt-7 relative"
      >
        {/* Top serrated receipt edge */}
        <div className="h-3 w-full receipt-edge-top" aria-hidden="true" />

        <div className="border-x border-[#14213d]/25 bg-[#fbf8f2] px-5 py-6 sm:px-7 sm:py-7 shadow-[0_8px_24px_rgba(20,33,61,0.06)]">
          {/* Receipt Masthead & Animated Rubber Stamp */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-dashed border-[#14213d]/25 pb-5">
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#14213d]/70">
                {t.slipTitle}
              </div>
              <h3 className="mt-1 font-sans text-xl font-extrabold text-[#14213d]">
                {purposeTitle}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-[#14213d]/70">
                <span>Checked {report.generatedAtLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{report.checkedCount} documents</span>
                {report.redactedNumberCount > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#1f7a4d]">
                      {report.redactedNumberCount} long ID(s) stripped
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Restrained Animated Rubber Stamp */}
            <motion.div
              key={stampConfig.label}
              initial={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 0, scale: 1.24, rotate: -10 }
              }
              whileInView={{ opacity: 1, scale: 1, rotate: -4 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.32, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className={`rubber-stamp px-3 py-1.5 font-mono text-[11px] font-bold uppercase ${stampConfig.colorClass} bg-[#fbf8f2]/90`}
            >
              {stampConfig.label}
            </motion.div>
          </div>

          {/* Identity Health Score beside the summary count strip */}
          <div className="flex flex-wrap items-center gap-4 border-b border-[#14213d]/15 py-4">
          <HealthScore counts={report.severityCounts} />
          <div className="grid min-w-[14rem] flex-1 grid-cols-3 gap-2 text-center">
            <div>
              <div className="font-mono text-xl font-bold text-[#1f7a4d] tabular-nums">
                {report.matchCount}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#14213d]/65">
                Matched
              </div>
            </div>
            <div className="border-x border-[#14213d]/15">
              <div className="font-mono text-xl font-bold text-[#9e630d] tabular-nums">
                {report.variationCount}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#14213d]/65">
                Variations
              </div>
            </div>
            <div>
              <div className="font-mono text-xl font-bold text-[#c8322b] tabular-nums">
                {report.mismatchCount}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#14213d]/65">
                Mismatches
              </div>
            </div>
          </div>
          </div>

          {/* Priority Guidance Box */}
          <div className="mt-5 border border-[#14213d]/25 bg-[#f6f1e7] p-4">
            <div className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-[#c8322b]">
              {t.recommendedFirst}
            </div>
            <div className="mt-1 font-sans text-lg font-bold text-[#14213d]">
              {report.priorityAction.reviewFirstDoc}
            </div>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#14213d]/80">
              {report.priorityAction.reason}
            </p>
            <ul className="mt-3 space-y-1.5 border-t border-[#14213d]/10 pt-2.5">
              {report.priorityAction.steps.map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[13px] leading-snug text-[#14213d]/85"
                >
                  <span className="font-mono text-[11px] font-semibold text-[#14213d]/70 mt-0.5 tabular-nums">
                    0{i + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {report.resultSource === 'preview' && (
            <div className="mt-4 border border-[#e9a23b]/60 bg-[#e9a23b]/[0.10] px-3.5 py-3 text-xs leading-relaxed text-[#7a5200]">
              Preview only — run the comparison to replace this sample calculation with the backend result.
            </div>
          )}

          {guidance.length > 0 && (
            <section className="mt-6" aria-labelledby="backend-guidance-title">
              <h4
                id="backend-guidance-title"
                className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#14213d]/70"
              >
                Guidance for each difference
              </h4>
              <div className="mt-3 space-y-3">
                {guidance.map((item) => (
                  <article
                    key={`${item.finding_index}-${item.code}`}
                    className="border border-[#14213d]/20 bg-[#f6f1e7]/70 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h5 className="font-sans text-sm font-bold text-[#14213d]">{item.title}</h5>
                      <span className="border border-[#14213d]/20 bg-[#fbf8f2] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#14213d]/65">
                        {item.priority.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-[#14213d]/80">
                      {item.summary}
                    </p>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-[#14213d]/80">
                      <strong className="font-semibold">Why it matters:</strong> {item.why_it_matters}
                    </p>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-[#14213d]/80">
                      <strong className="font-semibold">Suggested next step:</strong>{' '}
                      {item.recommended_action}
                    </p>
                    <ol className="mt-3 list-decimal space-y-1 pl-5 text-[12px] leading-relaxed text-[#14213d]/80">
                      {item.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    {item.official_references.length > 0 && (
                      <div className="mt-3 border-t border-[#14213d]/10 pt-2.5">
                        <div className="font-mono text-[9.5px] uppercase tracking-wider text-[#14213d]/70">
                          Official references
                        </div>
                        <ul className="mt-1.5 space-y-1">
                          {item.official_references.map((reference) => (
                            <li key={reference.source_id} className="text-[11px] leading-relaxed">
                              <a
                                href={reference.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-[#14213d] underline decoration-[#14213d]/35 underline-offset-2 hover:decoration-[#14213d]"
                              >
                                {reference.label}
                              </a>
                              <span className="text-[#14213d]/70"> · {reference.authority}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="mt-3 font-mono text-[9.5px] leading-relaxed text-[#14213d]/70">
                      {item.disclaimer}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {fixPlan.length > 0 && (
            <section className="mt-6" aria-labelledby="backend-fix-plan-title">
              <h4
                id="backend-fix-plan-title"
                className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#14213d]/70"
              >
                Fix plan
              </h4>
              <ol className="mt-3 space-y-2">
                {fixPlan.map((step) => (
                  <li key={step.step} className="border-l-2 border-[#c8322b]/55 pl-3 text-[12.5px] leading-relaxed text-[#14213d]/80">
                    {step.action}
                    {step.caution && (
                      <span className="mt-1 block font-mono text-[10px] text-[#8f2520]">{step.caution}</span>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Field-by-Field Comparison Cards with token-level diff highlights */}
          <div className="mt-6 space-y-4">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#14213d]/70">
              {t.fieldBreakdown}
            </div>

            {report.fields.map((fieldResult, idx) => {
              const meta = SEVERITY_META[fieldResult.severity];
              const StatusIcon = meta.Icon;

              return (
                <motion.div
                  key={fieldResult.field}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.3,
                    delay: prefersReducedMotion ? 0 : idx * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="border border-[#14213d]/20 bg-[#fbf8f2] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#14213d]/10 pb-2.5">
                    <h4 className="font-sans text-base font-bold text-[#14213d]">
                      {fieldResult.label}
                    </h4>

                    <span
                      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${meta.textClass} ${meta.borderClass} ${meta.bgClass}`}
                    >
                      <StatusIcon className="h-3 w-3" aria-hidden="true" />
                      <span>{meta.label}</span>
                    </span>
                  </div>

                  <p className="mt-2 text-[13px] leading-relaxed text-[#14213d]/75">
                    {fieldResult.summary}
                  </p>

                  {/* Tabular document value comparison list with token-level red underlines */}
                  <dl className="mt-3 divide-y divide-[#14213d]/10 border-t border-[#14213d]/10">
                    {fieldResult.values.map((val) => (
                      <div
                        key={val.docId}
                        className={`flex flex-wrap items-baseline justify-between gap-2 py-2 px-2 font-mono text-xs ${
                          val.isOutlier ? 'bg-[#c8322b]/[0.05]' : ''
                        }`}
                      >
                        <dt className="text-[11px] uppercase tracking-wider text-[#14213d]/65 shrink-0">
                          {val.docLabel}
                        </dt>
                        <dd
                          className={`text-right tabular-nums ${
                            val.isOutlier
                              ? 'font-semibold text-[#14213d]'
                              : 'text-[#14213d]'
                          }`}
                        >
                          {val.diffSegments ? (
                            <span>
                              {val.diffSegments.map((seg, i) =>
                                seg.isDiff ? (
                                  <span
                                    key={i}
                                    className="bg-[#c8322b]/15 text-[#c8322b] border-b-2 border-[#c8322b] px-0.5"
                                  >
                                    {seg.text}
                                  </span>
                                ) : (
                                  <span key={i}>{seg.text}</span>
                                )
                              )}
                            </span>
                          ) : (
                            <span className={val.isOutlier ? 'text-[#c8322b]' : ''}>
                              {val.rawValue}
                            </span>
                          )}
                          {val.isOutlier && (
                            <span className="ml-2 text-[10px] uppercase tracking-wider text-[#c8322b]">
                              [Outlier]
                            </span>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </motion.div>
              );
            })}
          </div>

          {/* Receipt Footer Disclaimer & Actions */}
          <div className="mt-6 border-t-2 border-dashed border-[#14213d]/20 pt-4">
            <p className="font-mono text-[10.5px] leading-relaxed text-[#14213d]/65">
              NOTE: This does not verify your identity, does not contact any government system,
              and is not legal advice. Photos stay on your device; long ID numbers are stripped
              before text comparison on AWS (Sydney, Australia) without storage.
            </p>

            <p className="print-only mt-3 font-mono text-[11px] text-[#14213d]/80">
              Namma Check · {window.location.origin} · printed {report.generatedAtLabel}
            </p>

            <div className="no-print mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onJumpTo('workspace')}
                className="inline-flex items-center gap-1.5 border border-[#14213d]/30 bg-[#f6f1e7] px-3.5 py-2 text-xs font-semibold text-[#14213d] hover:border-[#14213d] cursor-pointer"
              >
                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.editDocs}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 bg-[#14213d] px-4 py-2 text-xs font-semibold text-[#f6f1e7] hover:bg-[#1e3056] cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.printReport}</span>
                <span className="sr-only"> (download as PDF from the print dialog)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom serrated receipt edge */}
        <div className="h-3 w-full receipt-edge-bottom" aria-hidden="true" />
      </motion.div>
    </section>
  );
};
