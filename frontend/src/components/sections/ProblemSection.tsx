import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AppLanguage } from '../../types/documents';
import { UI_COPY } from '../../utils/i18n';

interface ProblemSectionProps {
  language: AppLanguage;
}

const BACKEND_COSTS = [
  {
    code: 'CASE 01',
    title: 'A rejected PF claim',
    docA: { label: 'Aadhaar / Bank', value: 'Name or DOB mismatch' },
    docB: { label: 'EPF Portal', value: 'Claim rejected at verification' },
    impact:
      'EPF claims are commonly rejected when the name, date of birth, Aadhaar or bank details do not match.',
    sourceLabel: 'Source (as reported)',
  },
  {
    code: 'CASE 02',
    title: 'Limited chances to fix Aadhaar',
    docA: { label: 'Name updates', value: 'Only 2 times in a lifetime' },
    docB: { label: 'DOB / Gender', value: 'Only 1 change allowed' },
    impact:
      'You can change your name on Aadhaar only twice in a lifetime, and your date of birth or gender only once.',
    sourceLabel: 'Source',
  },
  {
    code: 'CASE 03',
    title: 'PAN–Aadhaar linking',
    docA: { label: 'PAN Record', value: 'Name / DOB / Gender' },
    docB: { label: 'Aadhaar Record', value: 'Differs from PAN' },
    impact: 'Linking may fail when the name, date of birth or gender differ between the two.',
    sourceLabel: null,
  },
];

export const ProblemSection: React.FC<ProblemSectionProps> = ({ language }) => {
  const prefersReducedMotion = useReducedMotion();
  const t = UI_COPY[language].problem;

  return (
    <section
      id="problem"
      data-section="problem"
      className="py-12 sm:py-14 border-b border-[#14213d]/15"
    >
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
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
        <p className="mt-3 text-[15px] leading-[1.65] text-[#14213d]/80">
          {t.intro}
        </p>
      </motion.div>

      <div className="mt-7 space-y-3.5">
        {BACKEND_COSTS.map((item, idx) => (
          <motion.article
            key={item.code}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.35,
              delay: prefersReducedMotion ? 0 : idx * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="border border-[#14213d]/20 bg-[#fbf8f2] p-4"
          >
            <div className="flex items-center justify-between border-b border-[#14213d]/10 pb-2 mb-3">
              <h3 className="font-sans text-base font-bold text-[#14213d]">
                {item.title}
              </h3>
              <span className="font-mono text-[10.5px] tracking-wider text-[#14213d]/55">
                {item.code}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
              <div className="border border-[#14213d]/15 bg-[#f6f1e7] px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-[#14213d]/55">
                  {item.docA.label}
                </div>
                <div className="mt-0.5 font-medium text-[#14213d]">{item.docA.value}</div>
              </div>
              <div className="border border-[#c8322b]/35 bg-[#c8322b]/[0.04] px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-[#c8322b]">
                  {item.docB.label}
                </div>
                <div className="mt-0.5 font-medium text-[#14213d]">{item.docB.value}</div>
              </div>
            </div>

            <p className="mt-2.5 text-[13px] leading-relaxed text-[#14213d]/75">
              {item.impact}
              {item.sourceLabel && (
                <span className="ml-2 font-mono text-[11px] underline decoration-[#14213d]/40 text-[#14213d]/65">
                  {item.sourceLabel}
                </span>
              )}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
};
