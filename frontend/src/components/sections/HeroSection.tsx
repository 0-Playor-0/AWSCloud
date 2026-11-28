import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, FileCheck2 } from 'lucide-react';
import { AppLanguage, SectionId } from '../../types/documents';
import { UI_COPY } from '../../utils/i18n';
import { MagnifierHeading } from '../MagnifierHeading';

interface HeroSectionProps {
  language: AppLanguage;
  onJumpTo: (id: SectionId) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ language, onJumpTo }) => {
  const prefersReducedMotion = useReducedMotion();
  const t = UI_COPY[language].hero;

  const fadeUp = (delay: number) =>
    prefersReducedMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          // Slide only, no fade: the hero text is the LCP element and must paint immediately.
          initial: { opacity: 1, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.42, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section
      id="hero"
      data-section="hero"
      className="pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-[#14213d]/15"
    >
      {/* Editorial broadsheet dateline — unboxed metadata */}
      <motion.div
        {...fadeUp(0)}
        className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] tracking-[0.09em] text-[#14213d]/65 uppercase"
      >
        <span>{t.datelineA}</span>
        <span aria-hidden="true">·</span>
        <span>{t.datelineB}</span>
        <span aria-hidden="true">·</span>
        <span className="text-[#c8322b] font-medium">{t.datelineC}</span>
      </motion.div>

      {/* Main Headline in Anton with red "mismatches" + interactive magnifying glass cursor */}
      <motion.div {...fadeUp(0.06)}>
        <MagnifierHeading
          as="h1"
          wrapperClassName="mt-4"
          lensSize={124}
          zoom={1.72}
          className="font-anton uppercase text-[clamp(2.35rem,5vw,3.55rem)] leading-[1.03] tracking-[0.02em] text-[#14213d] [text-wrap:balance]"
        >
          {t.headlineBefore}
          <span className="text-[#c8322b]">{t.headlineRed}</span>
          {t.headlineAfter}
        </MagnifierHeading>
      </motion.div>

      {/* Supporting copy */}
      <motion.p
        {...fadeUp(0.12)}
        className="mt-4 text-[16px] leading-[1.65] text-[#14213d]/80 max-w-[56ch]"
      >
        {t.subtitle}
      </motion.p>

      {/* Primary CTA & secondary jump */}
      <motion.div
        {...fadeUp(0.18)}
        className="mt-7 flex flex-wrap items-center gap-4"
      >
        <button
          type="button"
          onClick={() => onJumpTo('workspace')}
          className="inline-flex items-center gap-2.5 bg-[#14213d] px-5 py-3 text-sm font-semibold text-[#f6f1e7] transition-colors hover:bg-[#1e3056] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8322b] cursor-pointer"
        >
          <FileCheck2 className="h-4 w-4" aria-hidden="true" />
          <span>{t.primaryCta}</span>
        </button>

        <button
          type="button"
          onClick={() => onJumpTo('report')}
          className="inline-flex items-center gap-1.5 border border-[#14213d]/30 bg-[#fbf8f2] px-4 py-3 text-sm font-medium text-[#14213d] transition-colors hover:border-[#14213d] hover:bg-[#ebe3d3]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8322b] cursor-pointer"
        >
          <span>{t.secondaryCta}</span>
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </motion.div>

      {/* Paper notice slip aligned with backend privacy guarantees */}
      <motion.div
        {...fadeUp(0.24)}
        className="mt-7 border border-[#14213d]/20 bg-[#fbf8f2] px-4 py-3 text-[12.5px] leading-relaxed text-[#14213d]/80"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#14213d]/10 pb-1.5 mb-1.5">
          <span className="font-mono text-[10.5px] font-semibold tracking-wider text-[#14213d] uppercase">
            {t.noticeTitle}
          </span>
          <span className="font-mono text-[10.5px] text-[#1f7a4d] font-medium">
            {t.noticeBadge}
          </span>
        </div>
        {t.noticeBody}
      </motion.div>
    </section>
  );
};
