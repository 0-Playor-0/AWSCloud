import React, { useRef, useState } from 'react';

interface MagnifierHeadingProps {
  as?: 'h1' | 'h2';
  wrapperClassName?: string;
  className?: string;
  zoom?: number;
  lensSize?: number;
  children: React.ReactNode;
}

/**
 * Interactive editorial magnifying-glass cursor for headings.
 * Moving a mouse cursor over the heading swaps the pointer for a circular
 * magnifying lens with handle that renders crisp zoomed heading text beneath it.
 */
export const MagnifierHeading: React.FC<MagnifierHeadingProps> = ({
  as = 'h1',
  wrapperClassName = '',
  className = '',
  zoom = 1.68,
  lensSize = 116,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverState, setHoverState] = useState<{
    active: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
  }>({
    active: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const Tag = as;
  const radius = lensSize / 2;

  const updatePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setHoverState({
      active: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    });
  };

  const handlePointerLeave = () => {
    setHoverState((prev) => ({ ...prev, active: false }));
  };

  return (
    <div
      ref={containerRef}
      onPointerEnter={updatePointer}
      onPointerMove={updatePointer}
      onPointerLeave={handlePointerLeave}
      className={`relative select-text ${wrapperClassName} ${hoverState.active ? 'cursor-none' : ''}`}
    >
      <Tag className={className}>{children}</Tag>

      {hoverState.active && hoverState.width > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-40"
          style={{
            left: hoverState.x - radius,
            top: hoverState.y - radius,
            width: lensSize,
            height: lensSize,
          }}
        >
          {/* Circular glass lens clipping exact zoomed vector copy of the heading */}
          <div
            className="relative h-full w-full overflow-hidden rounded-full bg-[#fcfaf5] shadow-[0_10px_28px_rgba(20,33,61,0.24),inset_0_0_16px_rgba(20,33,61,0.08)]"
            style={{
              border: '3px solid #14213d',
            }}
          >
            {/* Zoomed heading clone mathematically aligned to cursor coordinates */}
            <div
              style={{
                width: hoverState.width,
                height: hoverState.height,
                transformOrigin: '0 0',
                transform: `translate3d(${radius - hoverState.x * zoom}px, ${radius - hoverState.y * zoom}px, 0) scale(${zoom})`,
              }}
            >
              <Tag className={`${className} !mt-0`}>{children}</Tag>
            </div>

            {/* Subtle optical brass inner bezel, glass glint & micro-reticle */}
            <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-[#e9a23b]/65" />
            <div
              className="pointer-events-none absolute -top-2 -left-2 h-1/2 w-2/3 rounded-full opacity-45"
              style={{
                background:
                  'radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 70%)',
              }}
            />
            <div className="pointer-events-none absolute left-1/2 top-1.5 h-2 w-px -translate-x-1/2 bg-[#c8322b]/35" />
            <div className="pointer-events-none absolute left-1/2 bottom-1.5 h-2 w-px -translate-x-1/2 bg-[#c8322b]/35" />
            <div className="pointer-events-none absolute top-1/2 left-1.5 h-px w-2 -translate-y-1/2 bg-[#c8322b]/35" />
            <div className="pointer-events-none absolute top-1/2 right-1.5 h-px w-2 -translate-y-1/2 bg-[#c8322b]/35" />
          </div>

          {/* Magnifying glass handle extending bottom-right */}
          <svg
            width="54"
            height="54"
            viewBox="0 0 54 54"
            fill="none"
            className="pointer-events-none absolute"
            style={{
              left: lensSize - 17,
              top: lensSize - 17,
            }}
          >
            {/* Brass neck collar */}
            <path
              d="M4 9 L9 4 L17 12 L12 17 Z"
              fill="#e9a23b"
              stroke="#14213d"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Inked wooden/navy handle */}
            <path
              d="M14 18 L18 14 L48 44 C50 46 50 49 48 50.5 C46.5 52 43.5 52 41.5 50 Z"
              fill="#14213d"
              stroke="#14213d"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <line
              x1="21"
              y1="19"
              x2="43"
              y2="41"
              stroke="#fbf8f2"
              strokeOpacity="0.35"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
