import React, { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

export interface CartoonAssetConfig {
  id: string;
  src: string;
  alt: string;
  figLabel: string;
  caption: string;
  noteTag: string;
  noteText: string;
  fallbackNode?: React.ReactNode;
}

export const CARTOON_ASSETS = {
  confusedCitizen: {
    id: 'confused-citizen',
    src: '/src/assets/images/cartoon_confused_citizen_1795762591101.png',
    alt: 'Editorial ink cartoon of a confused Indian citizen at a desk surrounded by piles of Aadhaar, PAN, and form documents',
    figLabel: 'CARTOON 01 · THE CONFUSED CITIZEN',
    caption: 'When every document spells your name differently.',
    noteTag: 'Desk Observation',
    noteText: 'Two forms in hand, three stacks left to check.',
  },
  officeQueue: {
    id: 'office-queue',
    src: '/src/assets/images/cartoon_office_queue_1795762591695.png',
    alt: 'Editorial ink cartoon of Indian citizens waiting in a long queue with folders outside an administrative office counter',
    figLabel: 'CARTOON 02 · THE OFFICE QUEUE',
    caption: 'Nobody wants a second trip to the counter.',
    noteTag: 'Queue Reality',
    noteText: 'Catching typos at home saves hours in line.',
  },
  overworkedClerk: {
    id: 'overworked-clerk',
    src: '/src/assets/images/cartoon_overworked_clerk_1795762592596.png',
    alt: 'Editorial ink cartoon of a fictional Indian office clerk peeking from behind towering stacks of tied paper files holding a rubber stamp',
    figLabel: 'CARTOON 03 · THE OVERWORKED CLERK',
    caption: 'Your papers are one stack among thousands.',
    noteTag: 'Counter Note',
    noteText: 'Clear, aligned entries get stamped faster.',
  },
  documentDetective: {
    id: 'document-detective',
    src: '/src/assets/images/cartoon_document_detective_1795762593345.png',
    alt: 'Editorial ink cartoon of a citizen acting as a detective inspecting two identity sheets with a magnifying glass and red discrepancy marks',
    figLabel: 'CARTOON 04 · THE DOCUMENT DETECTIVE',
    caption: 'Spot the exact letter or digit that drifted.',
    noteTag: 'Closer Look',
    noteText: 'A single swapped digit can stall verification.',
  },
  paperworkMonster: {
    id: 'paperwork-monster',
    src: '/src/assets/images/cartoon_paperwork_monster_1795762594026.png',
    alt: 'Editorial ink cartoon of a playful giant monster made of folders, paperclips, and stamps while a citizen calmly organises the bottom stack',
    figLabel: 'CARTOON 05 · THE PAPERWORK MONSTER',
    caption: 'Taming years of loose records, one step at a time.',
    noteTag: 'Method',
    noteText: 'Four calm steps keep the paper monster small.',
  },
  organisedCitizen: {
    id: 'organised-citizen',
    src: '/src/assets/images/cartoon_organised_citizen_1795762593639.png',
    alt: 'Editorial ink cartoon of a satisfied smiling Indian citizen holding a neatly tied folder beside a stamped checklist report and tidy filing cabinet',
    figLabel: 'CARTOON 06 · THE ORGANISED CITIZEN',
    caption: 'Clarity first. Ready for submission.',
    noteTag: 'Resolution',
    noteText: 'One checklist tells you exactly what to fix first.',
  },
} as const;

interface EditorialCartoonFrameProps {
  cartoon: CartoonAssetConfig;
  side: 'left' | 'right';
  immediate?: boolean;
  bleedOutward?: boolean;
  fallback?: React.ReactNode;
}

export const EditorialCartoonFrame: React.FC<EditorialCartoonFrameProps> = ({
  cartoon,
  side,
  immediate = false,
  bleedOutward = true,
  fallback,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [imgFailed, setImgFailed] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Subtle vertical parallax on the cartoon vs floating clipping note
  const cartoonY = useTransform(scrollYProgress, [0, 1], side === 'left' ? [18, -18] : [-14, 20]);
  const noteY = useTransform(scrollYProgress, [0, 1], side === 'left' ? [-12, 16] : [14, -14]);

  const enterProps = immediate
    ? {
        initial: prefersReducedMotion
          ? { opacity: 1 }
          : { opacity: 0, x: side === 'left' ? -22 : 22 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.48, delay: 0.12, ease: [0.16, 1, 0.3, 1] as const },
      }
    : {
        initial: prefersReducedMotion
          ? { opacity: 1 }
          : { opacity: 0, x: side === 'left' ? -20 : 20, y: 14 },
        whileInView: { opacity: 1, x: 0, y: 0 },
        viewport: { once: true, amount: 0.18 },
        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
      };

  const bleedClass = bleedOutward
    ? side === 'left'
      ? 'lg:-ml-5 xl:-ml-8'
      : 'lg:-mr-5 xl:-mr-8'
    : '';

  return (
    <aside
      ref={containerRef}
      aria-label={cartoon.figLabel}
      className={`hidden lg:flex flex-col select-none ${bleedClass}`}
    >
      {/* Dispatch rule header */}
      <div className="mb-2 flex items-center justify-between border-b border-[#14213d]/20 pb-1">
        <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-[#14213d]/70 uppercase">
          {cartoon.figLabel}
        </span>
        <span className="font-mono text-[10px] text-[#c8322b] font-semibold">
          {side === 'left' ? '§' : '¶'}
        </span>
      </div>

      {/* Main Cartoon Artwork with seamless parchment blending */}
      <motion.div
        {...enterProps}
        style={prefersReducedMotion ? undefined : { y: cartoonY }}
        className="relative"
      >
        {/* Subtle halftone shadow backing */}
        <div
          aria-hidden="true"
          className={`absolute inset-x-4 inset-y-6 halftone-margin opacity-35 -z-10 ${
            side === 'left' ? '-rotate-2' : 'rotate-2'
          }`}
        />

        {!imgFailed ? (
          <img
            src={cartoon.src}
            alt={cartoon.alt}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-auto cartoon-blend pointer-events-none"
          />
        ) : (
          <div className="w-full border border-[#14213d]/20 bg-[#fbf8f2] p-3">
            {fallback}
          </div>
        )}

        {/* Newspaper Caption */}
        <p className="mt-1.5 border-t border-[#14213d]/15 pt-1.5 font-mono text-[10.5px] leading-snug text-[#14213d]/75">
          {cartoon.caption}
        </p>
      </motion.div>

      {/* Supporting Floating Newspaper Margin Note */}
      <motion.div
        style={prefersReducedMotion ? undefined : { y: noteY }}
        className={`mt-4 border border-[#14213d]/20 bg-[#fbf8f2]/90 px-3 py-2.5 shadow-[2px_2px_0px_rgba(20,33,61,0.08)] max-w-[240px] ${
          side === 'left' ? 'self-start -rotate-1' : 'self-end rotate-1'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#14213d]/10 pb-1 mb-1">
          <span className="font-mono text-[9.5px] font-semibold uppercase tracking-widest text-[#c8322b]">
            {cartoon.noteTag}
          </span>
          <span className="font-mono text-[9px] text-[#14213d]/45">ED. NOTE</span>
        </div>
        <p className="text-[11.5px] leading-snug italic text-[#14213d]/80">
          {cartoon.noteText}
        </p>
      </motion.div>
    </aside>
  );
};
