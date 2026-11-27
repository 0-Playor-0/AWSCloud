import React from 'react';
import { EditorialDefs } from './EditorialDefs';

export const WorkspaceLeftIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 280 390"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Editorial ink illustration of a hand placing an identity document into an indexed folder under a desk lamp"
  >
    <EditorialDefs idPrefix="work-l" />

    {/* Warm lamp light cone */}
    <path d="M98 110 L24 270 L196 270 Z" fill="url(#work-l-halftone)" opacity="0.5" />

    {/* Classic Banker / Clerk Desk Lamp */}
    <g transform="translate(52 38)">
      <path d="M36 90 L36 32 Q36 14 54 14 L76 14" stroke="#14213d" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <rect x="20" y="88" width="32" height="8" rx="1.5" fill="#ebe3d3" stroke="#14213d" strokeWidth="1.5" />
      {/* Lamp Shade */}
      <path d="M56 14 L106 14 L120 44 L44 44 Z" fill="#14213d" />
      <path d="M44 44 L120 44" stroke="#e9a23b" strokeWidth="2.5" />
      <line x1="62" y1="22" x2="100" y2="22" stroke="#f6f1e7" strokeWidth="0.9" strokeOpacity="0.45" />
    </g>

    {/* Indexed Manila File Folder */}
    <g transform="translate(48 188)">
      {/* Folder back tab */}
      <path
        d="M0 14 L12 0 L68 0 L78 14 L178 14 L178 128 L0 128 Z"
        fill="#ebe3d3"
        stroke="#14213d"
        strokeWidth="1.7"
      />
      <text x="16" y="11" fill="#14213d" fontSize="7.5" fontFamily="IBM Plex Mono, monospace" fontWeight="600">
        01 / CITIZEN
      </text>

      {/* Sheet being slid inside */}
      <g transform="translate(30 -44) rotate(5)">
        <rect x="0" y="0" width="114" height="96" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.6" />
        <line x1="14" y1="20" x2="96" y2="20" stroke="#14213d" strokeWidth="1.7" />
        <line x1="14" y1="34" x2="82" y2="34" stroke="#14213d" strokeWidth="1.2" strokeOpacity="0.65" />
        <line x1="14" y1="48" x2="92" y2="48" stroke="#14213d" strokeWidth="1.2" strokeOpacity="0.65" />
        <circle cx="92" cy="68" r="10" stroke="#1f7a4d" strokeWidth="1.4" />
        <path d="M87 68 L91 72 L98 63" stroke="#1f7a4d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Hand gripping top corner of sheet */}
      <path
        d="M156 122 C176 112 198 118 206 134 C194 142 174 144 156 138"
        fill="#fbf8f2"
        stroke="#14213d"
        strokeWidth="1.6"
      />

      {/* Folder Front Cover */}
      <path
        d="M0 32 L178 32 L178 128 L0 128 Z"
        fill="#f6f1e7"
        stroke="#14213d"
        strokeWidth="1.8"
      />
      <path d="M0 32 L178 32 L178 128 L0 128 Z" fill="url(#work-l-hatch)" opacity="0.55" />
      <rect x="28" y="64" width="122" height="32" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.2" />
      <line x1="40" y1="76" x2="136" y2="76" stroke="#14213d" strokeWidth="1.4" />
      <line x1="40" y1="86" x2="108" y2="86" stroke="#c8322b" strokeWidth="1.1" />
    </g>

    <text
      x="26"
      y="355"
      fill="#14213d"
      fontSize="10.5"
      fontFamily="IBM Plex Mono, monospace"
      letterSpacing="0.06em"
    >
      FIG. 07 — ORGANISE INPUTS
    </text>
    <line x1="26" y1="364" x2="218" y2="364" stroke="#14213d" strokeWidth="0.9" strokeOpacity="0.4" />
  </svg>
);

export const WorkspaceRightIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 280 390"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Editorial ink illustration of a vintage typewriter and neatly stacked document folders"
  >
    <EditorialDefs idPrefix="work-r" />

    <rect x="38" y="48" width="204" height="236" fill="url(#work-r-halftone)" opacity="0.55" />

    {/* Paper rolled into vintage typewriter */}
    <g transform="translate(46 58)">
      <path d="M46 0 L142 0 L142 86 L46 86 Z" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.6" />
      <line x1="58" y1="18" x2="130" y2="18" stroke="#14213d" strokeWidth="1.5" />
      <line x1="58" y1="30" x2="120" y2="30" stroke="#14213d" strokeWidth="1.1" strokeOpacity="0.7" />
      <line x1="58" y1="42" x2="126" y2="42" stroke="#14213d" strokeWidth="1.1" strokeOpacity="0.7" />
      <line x1="58" y1="54" x2="104" y2="54" stroke="#c8322b" strokeWidth="1.3" />

      {/* Platen Roller */}
      <rect x="20" y="76" width="148" height="18" rx="4" fill="#14213d" />
      <rect x="8" y="81" width="12" height="8" rx="2" fill="#ebe3d3" stroke="#14213d" strokeWidth="1.3" />
      <rect x="168" y="81" width="12" height="8" rx="2" fill="#ebe3d3" stroke="#14213d" strokeWidth="1.3" />

      {/* Typewriter Chassis */}
      <path
        d="M16 94 L172 94 L186 156 L2 156 Z"
        fill="#f6f1e7"
        stroke="#14213d"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M16 94 L172 94 L186 156 L2 156 Z" fill="url(#work-r-hatch)" opacity="0.5" />
      <rect x="46" y="102" width="96" height="16" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.2" />

      {/* Mechanical Keys Rows */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <circle key={`r1-${i}`} cx={28 + i * 22} cy={130} r="4.8" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.2" />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={`r2-${i}`} cx={39 + i * 22} cy={143} r="4.8" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.2" />
      ))}
    </g>

    {/* Neat Stack of Document Folders below */}
    <g transform="translate(52 246)">
      <path d="M0 32 L176 32 L166 56 L10 56 Z" fill="#ebe3d3" stroke="#14213d" strokeWidth="1.5" />
      <path d="M6 16 L170 16 L176 32 L0 32 Z" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.5" />
      <path d="M14 0 L162 0 L170 16 L6 16 Z" fill="#f6f1e7" stroke="#14213d" strokeWidth="1.5" />
      <rect x="64" y="-8" width="48" height="10" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.2" />
      <text x="72" y="-1" fill="#c8322b" fontSize="6.5" fontFamily="IBM Plex Mono, monospace" fontWeight="600">
        MANUAL
      </text>
    </g>

    <text
      x="38"
      y="355"
      fill="#14213d"
      fontSize="10.5"
      fontFamily="IBM Plex Mono, monospace"
      letterSpacing="0.06em"
    >
      FIG. 08 — VERIFY ENTRIES
    </text>
    <line x1="38" y1="364" x2="236" y2="364" stroke="#14213d" strokeWidth="0.9" strokeOpacity="0.4" />
  </svg>
);
