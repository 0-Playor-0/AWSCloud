import { m } from "motion/react";

import { cn } from "@/lib/utils";

const TONE = { mismatch: "text-stamp", match: "text-match", minor: "text-amber-dark" } as const;

interface Props {
  label: string;
  tone: keyof typeof TONE;
  className?: string;
  /** Land when scrolled into view (hero) instead of on mount (report). */
  onScroll?: boolean;
}

/** Decorative rubber stamp; the same status is always given in text elsewhere. */
export function Stamp({ label, tone, className, onScroll = false }: Props) {
  const landed = { opacity: 0.92, scale: 1, rotate: -8 };
  return (
    <m.span
      aria-hidden="true"
      className={cn("stamp pointer-events-none inline-block select-none", TONE[tone], className)}
      initial={{ opacity: 0, scale: 2.4, rotate: -20 }}
      {...(onScroll ? { whileInView: landed, viewport: { once: true, amount: 0.8 } } : { animate: landed })}
      transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.15 }}
    >
      {label}
    </m.span>
  );
}
