import React from 'react';

/**
 * Shared SVG pattern & filter definitions so all Indian newspaper editorial
 * illustrations share identical ink line weights, halftone screens, and cross-hatching.
 */
export const EditorialDefs: React.FC<{ idPrefix: string }> = ({ idPrefix }) => (
  <defs>
    {/* Fine diagonal ink hatching for shadows */}
    <pattern
      id={`${idPrefix}-hatch`}
      width="6"
      height="6"
      patternTransform="rotate(38 0 0)"
      patternUnits="userSpaceOnUse"
    >
      <line x1="0" y1="0" x2="0" y2="6" stroke="#14213d" strokeWidth="0.7" strokeOpacity="0.28" />
    </pattern>

    {/* Dense cross-hatch for deep ink folds / metal cabinets */}
    <pattern
      id={`${idPrefix}-crosshatch`}
      width="6"
      height="6"
      patternUnits="userSpaceOnUse"
    >
      <path
        d="M0 6 L6 0 M-1 1 L1 -1 M5 7 L7 5"
        stroke="#14213d"
        strokeWidth="0.7"
        strokeOpacity="0.24"
      />
      <path
        d="M0 0 L6 6 M-1 5 L1 7 M5 -1 L7 1"
        stroke="#14213d"
        strokeWidth="0.6"
        strokeOpacity="0.18"
      />
    </pattern>

    {/* Newspaper halftone screen */}
    <pattern
      id={`${idPrefix}-halftone`}
      width="7"
      height="7"
      patternUnits="userSpaceOnUse"
    >
      <circle cx="2" cy="2" r="1.05" fill="#14213d" fillOpacity="0.16" />
    </pattern>

    {/* Muted red halftone accent */}
    <pattern
      id={`${idPrefix}-red-halftone`}
      width="8"
      height="8"
      patternUnits="userSpaceOnUse"
    >
      <circle cx="2.5" cy="2.5" r="1.15" fill="#c8322b" fillOpacity="0.18" />
    </pattern>
  </defs>
);
