import React from 'react';
import { EditorialDefs } from './EditorialDefs';

export const ProcessLeftIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 280 390"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Editorial ink illustration of a magnifying glass scanning a document and extracting text lines"
  >
    <EditorialDefs idPrefix="proc-l" />

    <circle cx="140" cy="170" r="92" fill="url(#proc-l-halftone)" opacity="0.6" />

    {/* Printed paper sheet being inspected */}
    <g transform="translate(52 64) rotate(-3)">
      <rect x="0" y="0" width="166" height="220" rx="2" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.7" />
      <rect x="0" y="0" width="166" height="26" fill="url(#proc-l-hatch)" stroke="#14213d" strokeWidth="1.2" />
      <text x="12" y="17" fill="#14213d" fontSize="8.5" fontFamily="IBM Plex Mono, monospace" fontWeight="600">
        OCR EXTRACT · LOCAL
      </text>

      {/* Text rows with checkmarks */}
      <line x1="16" y1="46" x2="128" y2="46" stroke="#14213d" strokeWidth="1.5" />
      <line x1="16" y1="62" x2="110" y2="62" stroke="#14213d" strokeWidth="1.2" strokeOpacity="0.65" />
      <line x1="16" y1="78" x2="136" y2="78" stroke="#14213d" strokeWidth="1.2" strokeOpacity="0.65" />

      {/* Highlighted scanned zone */}
      <rect x="12" y="96" width="142" height="58" fill="#f6f1e7" stroke="#14213d" strokeWidth="1" strokeDasharray="3 2" />
      <text x="20" y="114" fill="#14213d" fontSize="8.5" fontFamily="IBM Plex Mono, monospace">
        NAME: AARAV NAIR
      </text>
      <text x="20" y="130" fill="#14213d" fontSize="8.5" fontFamily="IBM Plex Mono, monospace">
        DOB : 14/08/1996
      </text>
      <text x="20" y="145" fill="#1f7a4d" fontSize="8" fontFamily="IBM Plex Mono, monospace">
        ✓ LINE CONFIRMED
      </text>

      <line x1="16" y1="176" x2="124" y2="176" stroke="#14213d" strokeWidth="1.1" strokeOpacity="0.55" />
      <line x1="16" y1="192" x2="96" y2="192" stroke="#14213d" strokeWidth="1.1" strokeOpacity="0.55" />
    </g>

    {/* Magnifying glass overlaying the extracted block */}
    <g transform="translate(116 146)">
      <circle cx="52" cy="52" r="46" fill="#fbf8f2" fillOpacity="0.45" stroke="#14213d" strokeWidth="3.2" />
      <circle cx="52" cy="52" r="40" stroke="#14213d" strokeWidth="1" />
      {/* Enlarged ink lines inside lens */}
      <line x1="26" y1="42" x2="78" y2="42" stroke="#14213d" strokeWidth="2.4" />
      <line x1="26" y1="54" x2="70" y2="54" stroke="#c8322b" strokeWidth="2.1" />
      <line x1="26" y1="66" x2="62" y2="66" stroke="#14213d" strokeWidth="1.8" strokeOpacity="0.7" />
      {/* Glint arc */}
      <path d="M24 30 A34 34 0 0 1 48 18" stroke="#14213d" strokeWidth="1.2" strokeLinecap="round" />
      {/* Handle */}
      <path d="M84 85 L122 126" stroke="#14213d" strokeWidth="9" strokeLinecap="round" />
      <path d="M84 85 L122 126" stroke="#ebe3d3" strokeWidth="4" strokeLinecap="round" />
    </g>

    <text
      x="28"
      y="355"
      fill="#14213d"
      fontSize="10.5"
      fontFamily="IBM Plex Mono, monospace"
      letterSpacing="0.06em"
    >
      FIG. 05 — LINE EXTRACTION
    </text>
    <line x1="28" y1="364" x2="220" y2="364" stroke="#14213d" strokeWidth="0.9" strokeOpacity="0.4" />
  </svg>
);

export const ProcessRightIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 280 390"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Editorial ink illustration of two sheets being compared with a red stamp marking a discrepancy"
  >
    <EditorialDefs idPrefix="proc-r" />

    <rect x="34" y="54" width="212" height="232" fill="url(#proc-r-halftone)" opacity="0.55" />

    {/* Sheet 1 (Upper-left) */}
    <g transform="translate(34 72)">
      <rect x="0" y="0" width="114" height="148" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.6" />
      <line x1="12" y1="22" x2="96" y2="22" stroke="#14213d" strokeWidth="1.8" />
      <line x1="12" y1="38" x2="88" y2="38" stroke="#14213d" strokeWidth="1.1" strokeOpacity="0.65" />
      <rect x="10" y="54" width="92" height="18" stroke="#1f7a4d" strokeWidth="1.2" fill="#f6f1e7" />
      <text x="16" y="66" fill="#14213d" fontSize="8" fontFamily="IBM Plex Mono, monospace">
        14/08/1996
      </text>
      <line x1="12" y1="90" x2="92" y2="90" stroke="#14213d" strokeWidth="1.1" strokeOpacity="0.65" />
      <line x1="12" y1="106" x2="72" y2="106" stroke="#14213d" strokeWidth="1.1" strokeOpacity="0.65" />
    </g>

    {/* Sheet 2 (Lower-right) */}
    <g transform="translate(132 132)">
      <rect x="0" y="0" width="114" height="148" fill="#f6f1e7" stroke="#14213d" strokeWidth="1.6" />
      <line x1="12" y1="22" x2="96" y2="22" stroke="#14213d" strokeWidth="1.8" />
      <line x1="12" y1="38" x2="88" y2="38" stroke="#14213d" strokeWidth="1.1" strokeOpacity="0.65" />
      <rect x="10" y="54" width="92" height="18" stroke="#c8322b" strokeWidth="1.4" fill="url(#proc-r-red-halftone)" />
      <text x="16" y="66" fill="#c8322b" fontSize="8" fontFamily="IBM Plex Mono, monospace" fontWeight="600">
        04/08/1996
      </text>
      <line x1="12" y1="90" x2="92" y2="90" stroke="#14213d" strokeWidth="1.1" strokeOpacity="0.65" />
      <line x1="12" y1="106" x2="72" y2="106" stroke="#14213d" strokeWidth="1.1" strokeOpacity="0.65" />
    </g>

    {/* Hand-drawn comparison bracket & connector */}
    <path
      d="M142 135 C166 135 166 196 142 196"
      stroke="#c8322b"
      strokeWidth="1.6"
      strokeDasharray="3 2"
      fill="none"
    />

    {/* Red Stamp Callout */}
    <g transform="translate(46 254) rotate(-6)">
      <rect x="0" y="0" width="92" height="28" rx="1.5" stroke="#c8322b" strokeWidth="1.8" fill="#fbf8f2" />
      <text x="10" y="18" fill="#c8322b" fontSize="9.5" fontFamily="IBM Plex Mono, monospace" fontWeight="700" letterSpacing="0.08em">
        CHECK FIELD
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
      FIG. 06 — SIDE-BY-SIDE DIFF
    </text>
    <line x1="38" y1="364" x2="236" y2="364" stroke="#14213d" strokeWidth="0.9" strokeOpacity="0.4" />
  </svg>
);
