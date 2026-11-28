import React, { useSyncExternalStore, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { SectionId } from '../types/documents';
import { BORDER_MIN_WIDTH, CARTOONS, illustration } from '../lib/illustrations';

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
  src: illustration(`cells/${prefix}_${index}`),
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
  scene('s-confused', CARTOONS.confusedCitizen, ['hero']),
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
  scene('s-clerk', CARTOONS.overworkedClerk, ['how-it-works']),
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
  scene('s-organised', CARTOONS.organisedCitizen, ['report']),
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



const OUTER_RIGHT_ITEMS: StripItem[] = [
  scene('s-queue', CARTOONS.officeQueue, ['hero', 'problem']),
  cell('or-01', 'aliveDocs', 7, ['hero']),
  cell('or-02', 'humorous', 8, ['hero']),
  cell('or-03', 'equipment', 1, ['hero', 'problem']),
  cell('or-04', 'humorous', 1, ['problem']),
  scene('s-detective', CARTOONS.documentDetective, ['problem']),
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
  scene('s-monster', CARTOONS.paperworkMonster, ['how-it-works', 'workspace']),
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
  illustration('cells/aliveDocs_0'),
  illustration('cells/stationery_2'),
  illustration('cells/portraits_1'),
  illustration('cells/antics_4'),
  illustration('cells/propsA_0'),
  illustration('cells/aliveDocs_3'),
  illustration('cells/humorous_2'),
  illustration('cells/stationery_7'),
  illustration('cells/portraits_4'),
  illustration('cells/propsB_4'),
  illustration('cells/aliveDocs_6'),
  illustration('cells/antics_1'),
  illustration('cells/expressions_0'),
  illustration('cells/stationery_0'),
  illustration('cells/portraits_6'),
  illustration('cells/propsA_3'),
  illustration('cells/aliveDocs_8'),
  illustration('cells/antics_6'),
  illustration('cells/stationery_4'),
  illustration('cells/portraits_2'),
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
              aria-hidden="true"
              loading="lazy"
              decoding="async"
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
            aria-hidden="true"
            loading="lazy"
            decoding="async"
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

function subscribeBorderQuery(onChange: () => void): () => void {
  const query = window.matchMedia(BORDER_MIN_WIDTH);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** True at >= 1024 px. Below that the border is not rendered, so no image is ever requested. */
function useWideEnoughForBorder(): boolean {
  return useSyncExternalStore(
    subscribeBorderQuery,
    () => window.matchMedia(BORDER_MIN_WIDTH).matches,
    () => false,
  );
}

export const NewspaperBackground: React.FC<NewspaperBackgroundProps> = ({
  activeSection,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const wide = useWideEnoughForBorder();
  if (!wide) return null;

  return (
    <div
      aria-hidden="true"
      data-testid="illustrated-border"
      className="no-print hidden lg:block pointer-events-none select-none absolute inset-0 overflow-hidden z-0"
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
      </div>

      {/* RIGHT SIDE: Continuous non-overlapping vertical cartoon strip sheets */}
      <div className="editorial-strip-right absolute top-0 bottom-0 w-[145px] sm:w-[185px] lg:w-[220px] flex flex-row items-stretch overflow-hidden opacity-70">
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
