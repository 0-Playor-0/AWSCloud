import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AppLanguage } from '../../types/documents';
import { UI_COPY } from '../../utils/i18n';

interface HowItWorksSectionProps {
  language: AppLanguage;
}

const STEPS = [
  {
    num: '01',
    tag: 'On your device',
    title: 'Add your documents',
    detail: 'Type the details, try a sample, or choose a photo. The photo is read on your phone.',
  },
  {
    num: '02',
    tag: 'Verify text',
    title: 'Confirm what we read',
    detail: 'You check every field before anything is compared.',
  },
  {
    num: '03',
    tag: 'Actionable order',
    title: 'Get a fix plan',
    detail: 'See what differs, how risky it is, and which document to fix first.',
  },
];

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ language }) => {
  const prefersReducedMotion = useReducedMotion();
  const t = UI_COPY[language].howItWorks;

  return (
    <section
      id="how-it-works"
      data-section="how-it-works"
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
      </motion.div>

      <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {STEPS.map((step, idx) => (
          <motion.div
            key={step.num}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.34,
              delay: prefersReducedMotion ? 0 : idx * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="border border-[#14213d]/20 bg-[#fbf8f2] p-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-baseline justify-between border-b border-[#14213d]/10 pb-2 mb-2.5">
                <span className="font-mono text-xs font-semibold text-[#c8322b] tabular-nums">
                  STEP {step.num}
                </span>
                <span className="font-mono text-[10px] text-[#14213d]/70 uppercase">
                  {step.tag}
                </span>
              </div>
              <h3 className="font-sans text-[16px] font-bold text-[#14213d]">
                {step.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[#14213d]/78">
                {step.detail}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Privacy promise box matching backend screenshot 3 */}
      <div className="mt-4 border-2 border-dashed border-[#1f7a4d]/70 bg-[#fbf8f2] px-4 py-3.5">
        <div className="font-sans text-sm font-bold text-[#1f7a4d]">
          {t.privacyTitle}
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#14213d]/85">
          {t.privacyBody}
        </p>
      </div>
    </section>
  );
};
