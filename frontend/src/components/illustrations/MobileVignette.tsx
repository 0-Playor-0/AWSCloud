import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CartoonAssetConfig } from './EditorialCartoonFrame';

interface MobileVignetteProps {
  cartoon?: CartoonAssetConfig;
  children?: React.ReactNode;
  caption?: string;
}

/**
 * Compact editorial cartoon frame shown on mobile & tablet (< lg)
 * between sections so the single-column experience includes the actual
 * editorial cartoons without creating side columns or horizontal overflow.
 */
export const MobileVignette: React.FC<MobileVignetteProps> = ({
  cartoon,
  children,
  caption,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <motion.figure
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="lg:hidden mx-auto my-6 max-w-[280px] text-center"
    >
      {cartoon && !imgFailed ? (
        <img
          src={cartoon.src}
          alt={cartoon.alt}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="mx-auto w-full h-auto cartoon-blend"
        />
      ) : (
        <div className="mx-auto w-full border border-[#14213d]/15 bg-[#fbf8f2]/80 p-3">
          {children}
        </div>
      )}
      <figcaption className="mt-1.5 border-t border-[#14213d]/15 pt-1.5 font-mono text-[10px] tracking-wider text-[#14213d]/70 uppercase">
        {caption || cartoon?.figLabel}
      </figcaption>
    </motion.figure>
  );
};
