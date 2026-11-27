import React from 'react';
import { EditorialDefs } from './EditorialDefs';

export const ReportLeftIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 280 390"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Editorial ink illustration of a citizen calmly reviewing a neat, organised summary sheet"
  >
    <EditorialDefs idPrefix="rep-l" />

    <circle cx="140" cy="148" r="88" fill="url(#rep-l-halftone)" opacity="0.65" />

    {/* Calm Citizen Torso */}
    <path
      d="M72 316 C75 242 96 206 140 206 C184 206 205 242 208 316 Z"
      fill="#fbf8f2"
      stroke="#14213d"
      strokeWidth="1.8"
    />
    <path d="M120 206 L140 228 L160 206" stroke="#14213d" strokeWidth="1.6" fill="none" />

    {/* Head with serene expression */}
    <path
      d="M112 126 C112 93 168 93 168 126 C168 158 155 180 140 181 C125 180 112 158 112 126 Z"
      fill="#fbf8f2"
      stroke="#14213d"
      strokeWidth="1.8"
    />
    <path
      d="M111 124 C109 96 125 82 142 83 C162 84 171 100 169 124 C162 110 148 106 134 108 C121 110 115 117 111 124 Z"
      fill="#14213d"
    />
    <circle cx="129" cy="133" r="2" fill="#14213d" />
    <circle cx="151" cy="133" r="2" fill="#14213d" />
    <path d="M121 122 Q129 119 136 122" stroke="#14213d" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M144 122 Q151 119 159 122" stroke="#14213d" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M140 133 L138 147 L143 148" stroke="#14213d" strokeWidth="1.4" strokeLinecap="round" />
    {/* Gentle smile */}
    <path d="M131 157 Q140 164 149 157" stroke="#14213d" strokeWidth="1.6" strokeLinecap="round" />

    {/* Single-page neat checklist report held cleanly */}
    <g transform="translate(86 218) rotate(-4)">
      <rect x="0" y="0" width="112" height="104" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.7" />
      <line x1="12" y1="16" x2="96" y2="16" stroke="#14213d" strokeWidth="1.8" />
      {/* Checklist items */}
      <path d="M14 34 L18 38 L25 29" stroke="#1f7a4d" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="34" y1="34" x2="92" y2="34" stroke="#14213d" strokeWidth="1.2" />

      <path d="M14 52 L18 56 L25 47" stroke="#1f7a4d" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="34" y1="52" x2="86" y2="52" stroke="#14213d" strokeWidth="1.2" />

      <circle cx="19" cy="70" r="4" stroke="#c8322b" strokeWidth="1.5" />
      <line x1="34" y1="70" x2="94" y2="70" stroke="#c8322b" strokeWidth="1.3" />

      {/* Paperclip at corner */}
      <path d="M88 -6 L88 12 C88 17 95 17 95 12 L95 -2" stroke="#14213d" strokeWidth="1.4" strokeLinecap="round" />
    </g>

    <text
      x="26"
      y="355"
      fill="#14213d"
      fontSize="10.5"
      fontFamily="IBM Plex Mono, monospace"
      letterSpacing="0.06em"
    >
      FIG. 09 — CLEAR NEXT STEPS
    </text>
    <line x1="26" y1="364" x2="218" y2="364" stroke="#14213d" strokeWidth="0.9" strokeOpacity="0.4" />
  </svg>
);

export const ReportRightIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 280 390"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Editorial ink illustration of a clerk hand stamping a printed summary beside neatly tied folders"
  >
    <EditorialDefs idPrefix="rep-r" />

    <rect x="38" y="48" width="204" height="236" fill="url(#rep-r-halftone)" opacity="0.55" />

    {/* Printed Summary Receipt Slip */}
    <g transform="translate(46 154) rotate(-5)">
      <path
        d="M0 0 L144 0 L144 134 L132 128 L120 134 L108 128 L96 134 L84 128 L72 134 L60 128 L48 134 L36 128 L24 134 L12 128 L0 134 Z"
        fill="#fbf8f2"
        stroke="#14213d"
        strokeWidth="1.7"
      />
      <line x1="14" y1="20" x2="128" y2="20" stroke="#14213d" strokeWidth="1.8" />
      <line x1="14" y1="34" x2="104" y2="34" stroke="#14213d" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="14" y1="48" x2="118" y2="48" stroke="#14213d" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="14" y1="62" x2="90" y2="62" stroke="#14213d" strokeWidth="1" strokeOpacity="0.6" />

      {/* Bold Red Stamp Impression */}
      <g transform="translate(22 76) rotate(-7)">
        <rect x="0" y="0" width="96" height="30" rx="1.5" stroke="#c8322b" strokeWidth="2" fill="url(#rep-r-red-halftone)" />
        <text x="11" y="19" fill="#c8322b" fontSize="10.5" fontFamily="IBM Plex Mono, monospace" fontWeight="700" letterSpacing="0.09em">
          REVIEWED
        </text>
      </g>
    </g>

    {/* Clerk Cuff & Hand holding Rubber Stamp descending */}
    <g transform="translate(116 42)">
      {/* Coat sleeve */}
      <path d="M62 0 L122 14 L108 66 L48 52 Z" fill="#14213d" />
      <path d="M46 52 L106 66 L102 78 L42 64 Z" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.5" />
      {/* Hand & stamp handle */}
      <path
        d="M44 66 C30 70 24 84 34 94 C42 102 64 102 76 92 C86 84 88 74 78 68"
        fill="#fbf8f2"
        stroke="#14213d"
        strokeWidth="1.6"
      />
      <path d="M36 96 L40 120 L66 120 L70 96" fill="#ebe3d3" stroke="#14213d" strokeWidth="1.5" />
      <rect x="24" y="120" width="58" height="10" rx="1.5" fill="#14213d" />
    </g>

    {/* Neatly tied stack of archival files on right */}
    <g transform="translate(174 236)">
      <rect x="0" y="28" width="76" height="14" fill="#ebe3d3" stroke="#14213d" strokeWidth="1.3" />
      <rect x="2" y="14" width="72" height="14" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.3" />
      <rect x="4" y="0" width="68" height="14" fill="#f6f1e7" stroke="#14213d" strokeWidth="1.3" />
      {/* Cotton twine tie */}
      <line x1="38" y1="-2" x2="38" y2="44" stroke="#c8322b" strokeWidth="1.5" />
      <path d="M38 0 Q30 -8 24 -2 M38 0 Q46 -8 52 -2" stroke="#c8322b" strokeWidth="1.3" fill="none" />
    </g>

    <text
      x="38"
      y="355"
      fill="#14213d"
      fontSize="10.5"
      fontFamily="IBM Plex Mono, monospace"
      letterSpacing="0.06em"
    >
      FIG. 10 — READY TO FILE
    </text>
    <line x1="38" y1="364" x2="236" y2="364" stroke="#14213d" strokeWidth="0.9" strokeOpacity="0.4" />
  </svg>
);
