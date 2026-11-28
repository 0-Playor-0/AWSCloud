import React from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { SectionId } from '../../types/documents';
import { HeroLeftIllustration, HeroRightIllustration } from './HeroIllustrations';
import { ProblemLeftIllustration, ProblemRightIllustration } from './ProblemIllustrations';
import { ProcessLeftIllustration, ProcessRightIllustration } from './ProcessIllustrations';
import { WorkspaceLeftIllustration, WorkspaceRightIllustration } from './WorkspaceIllustrations';
import { ReportLeftIllustration, ReportRightIllustration } from './ReportIllustrations';

interface EditorialMarginStageProps {
  side: 'left' | 'right';
  activeSection: SectionId;
}

const SECTION_MARGIN_NOTES: Record<SectionId, { leftNote: string; rightNote: string; issueTag: string }> = {
  hero: {
    leftNote: 'Citizen records: often issued years apart by separate offices.',
    rightNote: 'Check spelling, initials & birth dates before counter submission.',
    issueTag: 'DISPATCH 01 · INTRODUCTION',
  },
  problem: {
    leftNote: 'Even one swapped digit or middle initial can halt verification.',
    rightNote: 'Mismatch between older school certificates and newer IDs is common.',
    issueTag: 'DISPATCH 02 · WHY IT HAPPENS',
  },
  'how-it-works': {
    leftNote: 'Browser-side line review keeps documents on your own device.',
    rightNote: 'Normalises spacing, casing & date formats automatically.',
    issueTag: 'DISPATCH 03 · METHODOLOGY',
  },
  workspace: {
    leftNote: 'Untick noisy OCR lines or edit any field directly in the form.',
    rightNote: 'Try a sample profile or enter details from your own cards.',
    issueTag: 'DISPATCH 04 · WORKBENCH',
  },
  report: {
    leftNote: 'Advisory summary only — not an official government certificate.',
    rightNote: 'Tackle the single outlier record first to save visits.',
    issueTag: 'DISPATCH 05 · SUMMARY',
  },
};

export const EditorialMarginStage: React.FC<EditorialMarginStageProps> = ({ side, activeSection }) => {
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();

  // Subtle compositor-only parallax on supporting marginalia
  const scrapShiftY = useTransform(scrollY, [0, 2400], side === 'left' ? [0, -28] : [0, 24]);
  const mainShiftY = useTransform(scrollY, [0, 2400], side === 'left' ? [0, 14] : [0, -14]);

  const renderIllustration = () => {
    if (side === 'left') {
      switch (activeSection) {
        case 'hero':
          return <HeroLeftIllustration className="w-full h-auto" />;
        case 'problem':
          return <ProblemLeftIllustration className="w-full h-auto" />;
        case 'how-it-works':
          return <ProcessLeftIllustration className="w-full h-auto" />;
        case 'workspace':
          return <WorkspaceLeftIllustration className="w-full h-auto" />;
        case 'report':
          return <ReportLeftIllustration className="w-full h-auto" />;
      }
    } else {
      switch (activeSection) {
        case 'hero':
          return <HeroRightIllustration className="w-full h-auto" />;
        case 'problem':
          return <ProblemRightIllustration className="w-full h-auto" />;
        case 'how-it-works':
          return <ProcessRightIllustration className="w-full h-auto" />;
        case 'workspace':
          return <WorkspaceRightIllustration className="w-full h-auto" />;
        case 'report':
          return <ReportRightIllustration className="w-full h-auto" />;
      }
    }
  };

  const note = SECTION_MARGIN_NOTES[activeSection];

  return (
    <aside
      aria-hidden="true"
      className="hidden lg:flex flex-col justify-between sticky top-24 select-none pointer-events-none"
    >
      {/* Subtle newspaper column rule & dispatch tag */}
      <div className="mb-3 flex items-center justify-between border-b border-[#14213d]/15 pb-1.5">
        <span className="font-mono text-[10px] tracking-[0.12em] text-[#14213d]/60 uppercase">
          {side === 'left' ? note.issueTag : 'MARGINALIA · EDITION IN'}
        </span>
        <span className="font-mono text-[10px] text-[#c8322b]/80">
          {side === 'left' ? '§' : '¶'}
        </span>
      </div>

      {/* Main animated illustration frame */}
      <motion.div
        style={prefersReducedMotion ? undefined : { y: mainShiftY }}
        className="relative"
      >
        {/* Subtle halftone margin wash */}
        <div
          className={`absolute inset-4 rounded-sm halftone-margin opacity-45 -z-10 ${
            side === 'left' ? '-rotate-1' : 'rotate-1'
          }`}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={`${side}-${activeSection}`}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    x: side === 'left' ? -18 : 18,
                    y: 8,
                  }
            }
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    x: side === 'left' ? -12 : 12,
                    y: -8,
                  }
            }
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderIllustration()}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Supporting floating newspaper clipping / margin note */}
      <motion.div
        style={prefersReducedMotion ? undefined : { y: scrapShiftY }}
        className="mt-4 border border-[#14213d]/20 bg-[#fbf8f2]/90 px-3.5 py-2.5 shadow-[2px_2px_0px_rgba(20,33,61,0.08)]"
      >
        <div className="flex items-center justify-between border-b border-[#14213d]/10 pb-1 mb-1.5">
          <span className="font-mono text-[9.5px] tracking-widest text-[#c8322b] uppercase font-semibold">
            {side === 'left' ? 'Editorial Note' : 'Desk Reminder'}
          </span>
          <span className="font-mono text-[9px] text-[#14213d]/45">NC-26</span>
        </div>
        <p className="text-[11.5px] leading-snug text-[#14213d]/80 italic">
          {side === 'left' ? note.leftNote : note.rightNote}
        </p>
      </motion.div>
    </aside>
  );
};
