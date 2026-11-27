import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { SectionId } from '../types/documents';
import { CARTOON_ASSETS } from './illustrations/EditorialCartoonFrame';

interface NewspaperBackgroundProps {
  activeSection: SectionId;
}

type StripItem =
  | {
      kind: 'scene';
      id: string;
      src: string;
      focusSections: SectionId[];
    }
  | {
      kind: 'cell';
      id: string;
      src: string;
      focusSections: SectionId[];
    };

const cell = (
  id: string,
  prefix: string,
  index: number,
  focusSections: SectionId[]
): StripItem => ({
  kind: 'cell',
  id,
  src: `/src/assets/images/cells/${prefix}_${index}.png`,
  focusSections,
});

const scene = (
  id: string,
  src: string,
  focusSections: SectionId[]
): StripItem => ({ kind: 'scene', id, src, focusSections });

/**
 * 130 distinct ink-trimmed transparent PNG cartoons arranged into 4 strict,
 * non-overlapping vertical strip columns (Outer-Left, Inner-Left, Inner-Right,
 * Outer-Right). Every asset is trimmed right to its black ink boundary so tiles
 * pack tightly without wasted transparent boxes and never overlap.
 */
const OUTER_LEFT_ITEMS: StripItem[] = [
  scene('s-confused', CARTOON_ASSETS.confusedCitizen.src, ['hero']),
  cell('ol-01', 'citizensA', 0, ['hero']),
  cell('ol-02', 'humorous', 0, ['hero', 'problem']),
  cell('ol-03', 'equipment', 3, ['hero']),
  cell('ol-04', 'portraits', 6, ['hero']),
  cell('ol-05', 'bureaucracy', 5, ['hero', 'problem']),
  cell('ol-06', 'citizensA', 1, ['problem']),
  cell('ol-07', 'propsA', 7, ['problem']),
  cell('ol-08', 'crowds', 0, ['problem']),
  cell('ol-09', 'propsB', 4, ['problem']),
  cell('ol-10', 'moreCitizens', 4, ['problem']),
  cell('ol-11', 'expressions', 4, ['problem']),
  cell('ol-12', 'objects', 2, ['problem', 'how-it-works']),
  scene('s-clerk', CARTOON_ASSETS.overworkedClerk.src, ['how-it-works']),
  cell('ol-13', 'antics', 4, ['how-it-works']),
  cell('ol-14', 'crowds', 3, ['how-it-works']),
  cell('ol-15', 'humorous', 6, ['how-it-works']),
  cell('ol-16', 'citizensA', 2, ['how-it-works', 'workspace']),
  cell('ol-17', 'crowds', 6, ['how-it-works', 'workspace']),
  cell('ol-18', 'vignettes', 0, ['workspace']),
  cell('ol-19', 'workers', 3, ['workspace']),
  cell('ol-20', 'vignettes', 6, ['workspace']),
  cell('ol-21', 'moreCitizens', 3, ['workspace']),
  cell('ol-22', 'workers', 1, ['workspace']),
  cell('ol-23', 'expressions', 5, ['workspace', 'report']),
  scene('s-organised', CARTOON_ASSETS.organisedCitizen.src, ['report']),
  cell('ol-24', 'propsA', 6, ['workspace', 'report']),
  cell('ol-25', 'antics', 7, ['report']),
  cell('ol-26', 'bureaucracy', 2, ['report']),
  cell('ol-27', 'crowds', 8, ['report']),
  cell('ol-28', 'moreCitizens', 7, ['report']),
  cell('ol-29', 'portraits', 2, ['report']),
  cell('ol-30', 'objects', 3, ['report']),
  cell('ol-31', 'vignettes', 7, ['report']),
  cell('ol-32', 'expressions', 7, ['report']),
  cell('ol-33', 'humorous', 1, ['report']),
  cell('ol-34', 'stationery', 6, ['report']),
  cell('ol-35', 'bureaucracy', 7, ['report']),
  cell('ol-36', 'aliveDocs', 5, ['report']),
  cell('ol-37', 'portraits', 4, ['report']),
  cell('ol-38', 'crowds', 4, ['report']),
  cell('ol-39', 'antics', 2, ['report']),
  cell('ol-40', 'equipment', 0, ['report']),
  cell('ol-41', 'moreCitizens', 1, ['report']),
  cell('ol-42', 'propsB', 1, ['report']),
];

const INNER_LEFT_ITEMS: StripItem[] = [
  cell('il-01', 'objects', 0, ['hero']),
  cell('il-02', 'humorous', 2, ['hero']),
  cell('il-03', 'moreCitizens', 1, ['hero']),
  cell('il-04', 'aliveDocs', 0, ['hero']),
  cell('il-05', 'expressions', 1, ['hero']),
  cell('il-06', 'propsA', 0, ['hero', 'problem']),
  cell('il-07', 'expressions', 6, ['hero', 'problem']),
  cell('il-08', 'aliveDocs', 1, ['problem']),
  cell('il-09', 'bureaucracy', 7, ['problem']),
  cell('il-10', 'vignettes', 4, ['problem']),
  cell('il-11', 'portraits', 0, ['problem']),
  cell('il-12', 'humorous', 5, ['problem']),
  cell('il-13', 'propsB', 8, ['problem', 'how-it-works']),
  cell('il-14', 'propsB', 6, ['problem']),
  cell('il-15', 'humorous', 3, ['problem', 'how-it-works']),
  cell('il-16', 'bureaucracy', 1, ['how-it-works']),
  cell('il-17', 'vignettes', 3, ['how-it-works']),
  cell('il-18', 'aliveDocs', 4, ['how-it-works']),
  cell('il-19', 'vignettes', 5, ['how-it-works']),
  cell('il-20', 'antics', 0, ['how-it-works', 'workspace']),
  cell('il-21', 'propsA', 3, ['how-it-works', 'workspace']),
  cell('il-22', 'stationery', 2, ['workspace']),
  cell('il-23', 'propsB', 0, ['workspace']),
  cell('il-24', 'propsA', 4, ['workspace']),
  cell('il-25', 'antics', 3, ['workspace']),
  cell('il-26', 'stationery', 7, ['workspace']),
  cell('il-27', 'propsA', 5, ['workspace']),
  cell('il-28', 'antics', 8, ['report']),
  cell('il-29', 'propsB', 5, ['report']),
  cell('il-30', 'stationery', 0, ['report']),
  cell('il-31', 'aliveDocs', 6, ['report']),
  cell('il-32', 'bureaucracy', 3, ['report']),
  cell('il-33', 'moreCitizens', 2, ['report']),
  cell('il-34', 'equipment', 2, ['report']),
  cell('il-35', 'portraits', 7, ['report']),
  cell('il-36', 'crowds', 5, ['report']),
  cell('il-37', 'citizensA', 3, ['report']),
  cell('il-38', 'workers', 0, ['report']),
  cell('il-39', 'expressions', 2, ['report']),
  cell('il-40', 'stationery', 4, ['report']),
  cell('il-41', 'vignettes', 1, ['report']),
  cell('il-42', 'humorous', 7, ['report']),
  cell('il-43', 'propsA', 2, ['report']),
  cell('il-44', 'bureaucracy', 8, ['report']),
  cell('il-45', 'portraits', 3, ['report']),
  cell('il-46', 'crowds', 1, ['report']),
];

const INNER_RIGHT_ITEMS: StripItem[] = [
  cell('ir-01', 'propsA', 1, ['hero']),
  cell('ir-02', 'stationery', 6, ['hero']),
  cell('ir-03', 'aliveDocs', 3, ['hero', 'problem']),
  cell('ir-04', 'moreCitizens', 8, ['hero', 'problem']),
  cell('ir-05', 'propsB', 1, ['hero', 'problem']),
  cell('ir-06', 'propsA', 2, ['hero', 'problem']),
  cell('ir-07', 'moreCitizens', 6, ['problem']),
  cell('ir-08', 'portraits', 3, ['problem']),
  cell('ir-09', 'expressions', 0, ['problem']),
  cell('ir-10', 'stationery', 1, ['problem']),
  cell('ir-11', 'moreCitizens', 0, ['problem']),
  cell('ir-12', 'propsA', 8, ['problem']),
  cell('ir-13', 'portraits', 1, ['problem', 'how-it-works']),
  cell('ir-14', 'antics', 5, ['how-it-works']),
  cell('ir-15', 'stationery', 8, ['how-it-works']),
  cell('ir-16', 'humorous', 7, ['how-it-works']),
  cell('ir-17', 'aliveDocs', 2, ['how-it-works']),
  cell('ir-18', 'antics', 1, ['workspace']),
  cell('ir-19', 'bureaucracy', 6, ['workspace']),
  cell('ir-20', 'antics', 2, ['workspace']),
  cell('ir-21', 'stationery', 4, ['workspace']),
  cell('ir-22', 'expressions', 3, ['workspace']),
  cell('ir-23', 'portraits', 4, ['workspace']),
  cell('ir-24', 'bureaucracy', 4, ['workspace']),
  cell('ir-25', 'objects', 1, ['workspace', 'report']),
  cell('ir-26', 'portraits', 8, ['workspace', 'report']),
  cell('ir-27', 'moreCitizens', 2, ['report']),
  cell('ir-28', 'expressions', 7, ['report']),
  cell('ir-29', 'portraits', 7, ['report']),
  cell('ir-30', 'aliveDocs', 8, ['report']),
  cell('ir-31', 'vignettes', 7, ['report']),
  cell('ir-32', 'objects', 2, ['report']),
  cell('ir-33', 'workers', 1, ['report']),
  cell('ir-34', 'crowds', 0, ['report']),
  cell('ir-35', 'propsA', 7, ['report']),
  cell('ir-36', 'humorous', 4, ['report']),
  cell('ir-37', 'equipment', 1, ['report']),
  cell('ir-38', 'vignettes', 2, ['report']),
  cell('ir-39', 'expressions', 8, ['report']),
  cell('ir-40', 'antics', 6, ['report']),
  cell('ir-41', 'propsB', 3, ['report']),
  cell('ir-42', 'crowds', 7, ['report']),
  cell('ir-43', 'stationery', 3, ['report']),
  cell('ir-44', 'moreCitizens', 5, ['report']),
  cell('ir-45', 'portraits', 5, ['report']),
  cell('ir-46', 'bureaucracy', 0, ['report']),
];

const OUTER_RIGHT_ITEMS: StripItem[] = [
  scene('s-queue', CARTOON_ASSETS.officeQueue.src, ['hero', 'problem']),
  cell('or-01', 'aliveDocs', 7, ['hero']),
  cell('or-02', 'humorous', 8, ['hero']),
  cell('or-03', 'equipment', 1, ['hero', 'problem']),
  cell('or-04', 'humorous', 1, ['problem']),
  scene('s-detective', CARTOON_ASSETS.documentDetective.src, ['problem']),
  cell('or-05', 'bureaucracy', 0, ['problem']),
  cell('or-06', 'propsB', 3, ['problem']),
  cell('or-07', 'crowds', 2, ['problem']),
  cell('or-08', 'propsB', 7, ['problem']),
  cell('or-09', 'crowds', 4, ['problem']),
  cell('or-10', 'vignettes', 1, ['problem', 'how-it-works']),
  cell('or-11', 'citizensA', 3, ['problem', 'how-it-works']),
  cell('or-12', 'antics', 6, ['how-it-works']),
  cell('or-13', 'crowds', 7, ['how-it-works']),
  cell('or-14', 'equipment', 0, ['how-it-works']),
  cell('or-15', 'expressions', 2, ['how-it-works']),
  cell('or-16', 'crowds', 1, ['how-it-works', 'workspace']),
  cell('or-17', 'workers', 0, ['how-it-works', 'workspace']),
  scene('s-monster', CARTOON_ASSETS.paperworkMonster.src, ['how-it-works', 'workspace']),
  cell('or-18', 'stationery', 3, ['workspace']),
  cell('or-19', 'humorous', 4, ['workspace']),
  cell('or-20', 'crowds', 5, ['workspace']),
  cell('or-21', 'moreCitizens', 5, ['workspace']),
  cell('or-22', 'expressions', 8, ['workspace']),
  cell('or-23', 'aliveDocs', 5, ['workspace']),
  cell('or-24', 'vignettes', 2, ['workspace', 'report']),
  cell('or-25', 'workers', 2, ['report']),
  cell('or-26', 'antics', 1, ['report']),
  cell('or-27', 'equipment', 2, ['report']),
  cell('or-28', 'bureaucracy', 8, ['report']),
  cell('or-29', 'propsB', 2, ['report']),
  cell('or-30', 'vignettes', 8, ['report']),
  cell('or-31', 'stationery', 5, ['report']),
  cell('or-32', 'portraits', 0, ['report']),
  cell('or-33', 'citizensA', 0, ['report']),
  cell('or-34', 'objects', 3, ['report']),
  cell('or-35', 'humorous', 6, ['report']),
  cell('or-36', 'propsA', 4, ['report']),
  cell('or-37', 'antics', 4, ['report']),
  cell('or-38', 'moreCitizens', 4, ['report']),
  cell('or-39', 'expressions', 4, ['report']),
  cell('or-40', 'workers', 3, ['report']),
  cell('or-41', 'vignettes', 0, ['report']),
  cell('or-42', 'stationery', 7, ['report']),
];

const EDGE_PEEKER_SRCS = [
  '/src/assets/images/cells/aliveDocs_0.png',
  '/src/assets/images/cells/stationery_2.png',
  '/src/assets/images/cells/portraits_1.png',
  '/src/assets/images/cells/antics_4.png',
  '/src/assets/images/cells/propsA_0.png',
  '/src/assets/images/cells/aliveDocs_3.png',
  '/src/assets/images/cells/humorous_2.png',
  '/src/assets/images/cells/stationery_7.png',
  '/src/assets/images/cells/portraits_4.png',
  '/src/assets/images/cells/propsB_4.png',
  '/src/assets/images/cells/aliveDocs_6.png',
  '/src/assets/images/cells/antics_1.png',
  '/src/assets/images/cells/expressions_0.png',
  '/src/assets/images/cells/stationery_0.png',
  '/src/assets/images/cells/portraits_6.png',
  '/src/assets/images/cells/propsA_3.png',
  '/src/assets/images/cells/aliveDocs_8.png',
  '/src/assets/images/cells/antics_6.png',
  '/src/assets/images/cells/stationery_4.png',
  '/src/assets/images/cells/portraits_2.png',
];

const EdgePeekerTile: React.FC<{
  src: string;
  side: 'left' | 'right';
  index: number;
  prefersReducedMotion: boolean | null;
}> = ({ src, side, index, prefersReducedMotion }) => {
  const [failed, setFailed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  if (failed) return null;

  const isLeft = side === 'left';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`pointer-events-auto cursor-pointer absolute bottom-0 translate-y-1/2 z-10 w-[44%] max-w-[86px] ${
        isLeft ? 'left-0 -translate-x-[50%]' : 'right-0 translate-x-[50%]'
      } ${isHovered ? 'z-30' : ''}`}
    >
      {/* Layer 1: Smooth scroll-into-view lift */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 0.9 } : { opacity: 0.45, scale: 0.94, y: 8 }}
        whileInView={prefersReducedMotion ? { opacity: 0.9 } : { opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: false, amount: 0.04 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.78, ease: [0.22, 1, 0.36, 1] }
        }
      >
        {/* Layer 2: Smooth hover darken, peek-out & lift */}
        <motion.div
          animate={{
            opacity: isHovered ? 1 : 0.9,
            x: prefersReducedMotion ? 0 : isHovered ? (isLeft ? 8 : -8) : 0,
            scale: prefersReducedMotion ? 1 : isHovered ? 1.08 : 1,
          }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Layer 3: Continuous gentle mirror-repeat character sway */}
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    rotate: isHovered ? [-2.4, 2.4] : [-1, 1],
                    y: isHovered ? [-2, 1.5] : [-1, 1],
                  }
            }
            transition={
              prefersReducedMotion
                ? undefined
                : {
                    duration: isHovered ? 1.45 : 3.6 + (index % 4) * 0.4,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                  }
            }
            className="transition-[filter] duration-400 ease-out"
            style={
              prefersReducedMotion
                ? undefined
                : {
                    filter: isHovered
                      ? 'drop-shadow(0 7px 14px rgba(14, 16, 20, 0.32))'
                      : 'drop-shadow(0 3px 6px rgba(14, 16, 20, 0.18))',
                  }
            }
          >
            <img
              src={src}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setFailed(true)}
              className={`w-full h-auto block cartoon-blend ${
                isHovered ? 'cartoon-blend-hovered' : ''
              }`}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

const StripCartoonTile: React.FC<{
  item: StripItem;
  index: number;
  activeSection: SectionId;
  prefersReducedMotion: boolean | null;
}> = ({ item, index, activeSection, prefersReducedMotion }) => {
  const [failed, setFailed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  if (failed) return null;

  const isFocused = item.focusSections.includes(activeSection);
  const baseOpacity =
    item.kind === 'scene'
      ? isFocused
        ? 1
        : 0.88
      : isFocused
        ? 0.98
        : 0.85;

  const motionVariant = index % 4;
  const idleSway =
    motionVariant === 0
      ? { y: [-1.5, 1.5], rotate: [-0.6, 0.6] }
      : motionVariant === 1
        ? { rotate: [-0.9, 0.9], y: [-1, 1] }
        : motionVariant === 2
          ? { scale: [0.992, 1.014], y: [-1.2, 1.2] }
          : { x: [-1, 1], rotate: [0.7, -0.7] };

  const hoverSway =
    motionVariant % 2 === 0
      ? { y: [-2.5, 2], rotate: [-2.2, 2.2] }
      : { x: [-2, 2], y: [-2, 1.5], rotate: [2, -2] };

  const idleDuration = 3.2 + (index % 5) * 0.45;

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={
        prefersReducedMotion
          ? { opacity: 1 }
          : { opacity: 0.22, y: 12, scale: 0.96 }
      }
      whileInView={
        prefersReducedMotion
          ? { opacity: 1 }
          : { opacity: 1, y: 0, scale: 1 }
      }
      viewport={{ once: false, amount: 0.04 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : {
              duration: 0.85,
              delay: (index % 3) * 0.04,
              ease: [0.22, 1, 0.36, 1],
            }
      }
      className={`pointer-events-auto cursor-pointer w-full shrink-0 px-1.5 relative ${
        isHovered ? 'z-20' : 'z-0'
      }`}
    >
      {/* Smooth hover scale, lift & ink opacity transition */}
      <motion.div
        animate={{
          opacity: isHovered ? 1 : baseOpacity,
          scale: prefersReducedMotion ? 1 : isHovered ? 1.07 : 1,
          y: prefersReducedMotion ? 0 : isHovered ? -4 : 0,
        }}
        transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Continuous fluid mirror-repeat character motion */}
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : isHovered
                ? hoverSway
                : idleSway
          }
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  duration: isHovered ? 1.45 : idleDuration,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                }
          }
          className="transition-[filter] duration-400 ease-out"
          style={
            prefersReducedMotion
              ? undefined
              : {
                  filter: isHovered
                    ? 'drop-shadow(0 8px 16px rgba(14, 16, 20, 0.32))'
                    : 'drop-shadow(0 3px 6px rgba(14, 16, 20, 0.18))',
                }
          }
        >
          <img
            src={item.src}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className={`w-full h-auto block cartoon-blend ${
              isHovered ? 'cartoon-blend-hovered' : ''
            }`}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const VerticalCartoonColumn: React.FC<{
  items: StripItem[];
  activeSection: SectionId;
  prefersReducedMotion: boolean | null;
  edgeSide?: 'left' | 'right';
  className?: string;
}> = ({ items, activeSection, prefersReducedMotion, edgeSide, className = '' }) => (
  <div className={`flex flex-col gap-2.5 py-1 overflow-hidden ${className}`}>
    {items.map((item, idx) => (
      <div key={item.id} className="relative w-full shrink-0">
        <StripCartoonTile
          item={item}
          index={idx}
          activeSection={activeSection}
          prefersReducedMotion={prefersReducedMotion}
        />
        {edgeSide && idx < items.length - 1 && (
          <EdgePeekerTile
            src={
              EDGE_PEEKER_SRCS[
                (idx * 3 + (edgeSide === 'right' ? 7 : 0)) % EDGE_PEEKER_SRCS.length
              ]
            }
            side={edgeSide}
            index={idx}
            prefersReducedMotion={prefersReducedMotion}
          />
        )}
      </div>
    ))}
  </div>
);

export const NewspaperBackground: React.FC<NewspaperBackgroundProps> = ({
  activeSection,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="no-print pointer-events-none select-none absolute inset-0 overflow-hidden z-0"
    >
      {/* Subtle horizontal broadsheet fold rules across the full parchment canvas */}
      <div className="absolute inset-0 w-full">
        {[12, 26, 40, 54, 68, 82].map((pct) => (
          <div
            key={pct}
            style={{ top: `${pct}%` }}
            className="absolute inset-x-0 h-px bg-[#14213d]/[0.05]"
          />
        ))}
      </div>

      {/* LEFT SIDE: Continuous non-overlapping vertical cartoon strip sheets */}
      <div className="editorial-strip-left absolute top-0 bottom-0 w-[145px] sm:w-[185px] lg:w-[220px] flex flex-row items-stretch overflow-hidden opacity-70">
        <VerticalCartoonColumn
          items={OUTER_LEFT_ITEMS}
          activeSection={activeSection}
          prefersReducedMotion={prefersReducedMotion}
          edgeSide="left"
          className="flex-1 min-w-0 border-r border-[#14213d]/[0.07]"
        />
        <VerticalCartoonColumn
          items={INNER_LEFT_ITEMS}
          activeSection={activeSection}
          prefersReducedMotion={prefersReducedMotion}
          className="hidden flex-1 min-w-0 border-r border-[#14213d]/[0.07]"
        />
      </div>

      {/* RIGHT SIDE: Continuous non-overlapping vertical cartoon strip sheets */}
      <div className="editorial-strip-right absolute top-0 bottom-0 w-[145px] sm:w-[185px] lg:w-[220px] flex flex-row items-stretch overflow-hidden opacity-70">
        <VerticalCartoonColumn
          items={INNER_RIGHT_ITEMS}
          activeSection={activeSection}
          prefersReducedMotion={prefersReducedMotion}
          className="hidden flex-1 min-w-0 border-l border-[#14213d]/[0.07]"
        />
        <VerticalCartoonColumn
          items={OUTER_RIGHT_ITEMS}
          activeSection={activeSection}
          prefersReducedMotion={prefersReducedMotion}
          edgeSide="right"
          className="flex-1 min-w-0 border-l border-[#14213d]/[0.07]"
        />
      </div>
    </div>
  );
};
