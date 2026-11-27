import React from 'react';
import { EditorialDefs } from './EditorialDefs';

export const ProblemLeftIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 280 390"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Editorial ink illustration of a citizen comparing two documents with differing details"
  >
    <EditorialDefs idPrefix="prob-l" />

    <rect x="34" y="42" width="212" height="236" fill="url(#prob-l-halftone)" opacity="0.55" />

    {/* Question mark ink squiggle above head */}
    <path
      d="M188 46 C195 36 210 39 208 50 C206 58 196 58 196 66"
      stroke="#c8322b"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="196" cy="74" r="1.8" fill="#c8322b" />

    {/* Character upper torso */}
    <path
      d="M78 308 C80 236 102 204 140 204 C178 204 200 236 204 308 Z"
      fill="#fbf8f2"
      stroke="#14213d"
      strokeWidth="1.8"
    />
    <path d="M140 204 L126 232 L140 244 L154 232 Z" fill="url(#prob-l-hatch)" stroke="#14213d" strokeWidth="1.2" />

    {/* Head tilted slightly downward comparing papers */}
    <path
      d="M112 124 C112 91 168 91 168 124 C168 156 155 178 140 179 C125 178 112 156 112 124 Z"
      fill="#fbf8f2"
      stroke="#14213d"
      strokeWidth="1.8"
    />
    {/* Hair bun/wavy hair */}
    <path
      d="M111 124 C109 98 124 83 142 84 C162 85 172 102 169 124 C161 108 148 105 138 107 C124 110 116 116 111 124 Z"
      fill="#14213d"
    />
    {/* Furrowed brows & downward gaze */}
    <path d="M122 123 L134 126" stroke="#14213d" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M158 123 L146 126" stroke="#14213d" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="129" cy="134" r="2" fill="#14213d" />
    <circle cx="151" cy="134" r="2" fill="#14213d" />
    <path d="M140 134 L138 148 L143 149" stroke="#14213d" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M133 160 Q140 157 148 160" stroke="#14213d" strokeWidth="1.5" strokeLinecap="round" />

    {/* Document Sheet Left (Held in right hand) */}
    <g transform="translate(26 196) rotate(-10)">
      <rect x="0" y="0" width="94" height="114" rx="2" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.6" />
      <rect x="0" y="0" width="94" height="18" fill="url(#prob-l-hatch)" stroke="#14213d" strokeWidth="1.1" />
      <text x="8" y="12" fill="#14213d" fontSize="7.5" fontFamily="IBM Plex Mono, monospace" fontWeight="600">
        RECORD A
      </text>
      <line x1="10" y1="32" x2="78" y2="32" stroke="#14213d" strokeWidth="1.4" />
      <rect x="8" y="40" width="68" height="14" stroke="#c8322b" strokeWidth="1.3" fill="url(#prob-l-red-halftone)" />
      <text x="12" y="50" fill="#14213d" fontSize="7.5" fontFamily="IBM Plex Mono, monospace">
        A. K. NAIR
      </text>
      <line x1="10" y1="68" x2="66" y2="68" stroke="#14213d" strokeWidth="1.1" strokeOpacity="0.6" />
      <line x1="10" y1="78" x2="78" y2="78" stroke="#14213d" strokeWidth="1.1" strokeOpacity="0.6" />
      <line x1="10" y1="88" x2="58" y2="88" stroke="#14213d" strokeWidth="1.1" strokeOpacity="0.6" />
    </g>

    {/* Document Sheet Right (Held in left hand) */}
    <g transform="translate(152 192) rotate(9)">
      <rect x="0" y="0" width="94" height="114" rx="2" fill="#f6f1e7" stroke="#14213d" strokeWidth="1.6" />
      <rect x="0" y="0" width="94" height="18" fill="url(#prob-l-hatch)" stroke="#14213d" strokeWidth="1.1" />
      <text x="8" y="12" fill="#14213d" fontSize="7.5" fontFamily="IBM Plex Mono, monospace" fontWeight="600">
        RECORD B
      </text>
      <line x1="10" y1="32" x2="76" y2="32" stroke="#14213d" strokeWidth="1.4" />
      <rect x="8" y="40" width="76" height="14" stroke="#c8322b" strokeWidth="1.3" fill="url(#prob-l-red-halftone)" />
      <text x="11" y="50" fill="#14213d" fontSize="7.5" fontFamily="IBM Plex Mono, monospace">
        AARAV NAYAR
      </text>
      <line x1="10" y1="68" x2="70" y2="68" stroke="#14213d" strokeWidth="1.1" strokeOpacity="0.6" />
      <line x1="10" y1="78" x2="60" y2="78" stroke="#14213d" strokeWidth="1.1" strokeOpacity="0.6" />
      <line x1="10" y1="88" x2="74" y2="88" stroke="#14213d" strokeWidth="1.1" strokeOpacity="0.6" />
    </g>

    {/* Dashed red comparison arc connecting the two highlighted names */}
    <path
      d="M108 232 Q140 206 168 236"
      stroke="#c8322b"
      strokeWidth="1.6"
      strokeDasharray="3.5 2.5"
      fill="none"
    />
    <text x="128" y="214" fill="#c8322b" fontSize="11" fontFamily="IBM Plex Mono, monospace" fontWeight="700">
      ≠
    </text>

    <text
      x="24"
      y="355"
      fill="#14213d"
      fontSize="10.5"
      fontFamily="IBM Plex Mono, monospace"
      letterSpacing="0.06em"
    >
      FIG. 03 — SPELLING DRIFT
    </text>
    <line x1="24" y1="364" x2="216" y2="364" stroke="#14213d" strokeWidth="0.9" strokeOpacity="0.4" />
  </svg>
);

export const ProblemRightIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 280 390"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Editorial ink illustration of an old filing cabinet overflowing with paper forms"
  >
    <EditorialDefs idPrefix="prob-r" />

    <circle cx="152" cy="184" r="96" fill="url(#prob-r-halftone)" opacity="0.65" />

    {/* Tall steel office filing cabinet */}
    <g transform="translate(68 58)">
      {/* Side 3D depth */}
      <path d="M120 0 L144 14 L144 252 L120 266 Z" fill="url(#prob-r-crosshatch)" stroke="#14213d" strokeWidth="1.6" />
      <path d="M0 0 L24 14 L144 14 L120 0 Z" fill="#ebe3d3" stroke="#14213d" strokeWidth="1.6" />

      {/* Main cabinet front */}
      <rect x="0" y="0" width="120" height="266" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.8" />

      {/* Drawer 1 (Closed) */}
      <rect x="8" y="12" width="104" height="72" fill="#f6f1e7" stroke="#14213d" strokeWidth="1.4" />
      <rect x="44" y="24" width="32" height="14" stroke="#14213d" strokeWidth="1.2" fill="#fbf8f2" />
      <line x1="50" y1="31" x2="70" y2="31" stroke="#14213d" strokeWidth="1" />
      <path d="M48 52 L72 52 C74 52 74 58 72 58 L48 58 C46 58 46 52 48 52 Z" fill="url(#prob-r-hatch)" stroke="#14213d" strokeWidth="1.2" />

      {/* Drawer 2 (Pulled open & overflowing with files!) */}
      <g transform="translate(-14 96)">
        {/* Overflowing papers */}
        <path d="M12 8 L22 -24 L98 -20 L92 12" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.3" />
        <path d="M26 8 L34 -30 L110 -14 L102 14" fill="#ebe3d3" stroke="#14213d" strokeWidth="1.3" />
        <path d="M44 10 L58 -26 L122 -6 L112 18" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.3" />
        <line x1="62" y1="-12" x2="104" y2="-4" stroke="#c8322b" strokeWidth="1.3" />
        {/* Drawer box */}
        <rect x="0" y="8" width="112" height="72" fill="#f6f1e7" stroke="#14213d" strokeWidth="1.7" />
        <rect x="38" y="22" width="36" height="14" stroke="#14213d" strokeWidth="1.2" fill="#fbf8f2" />
        <text x="43" y="32" fill="#14213d" fontSize="7" fontFamily="IBM Plex Mono, monospace">
          KYC-09
        </text>
        <path d="M44 48 L68 48 C70 48 70 54 68 54 L44 54 C42 54 42 48 44 48 Z" fill="#14213d" fillOpacity="0.2" stroke="#14213d" strokeWidth="1.2" />
      </g>

      {/* Drawer 3 (Closed) */}
      <rect x="8" y="182" width="104" height="72" fill="#f6f1e7" stroke="#14213d" strokeWidth="1.4" />
      <rect x="44" y="196" width="32" height="14" stroke="#14213d" strokeWidth="1.2" fill="#fbf8f2" />
      <line x1="50" y1="203" x2="70" y2="203" stroke="#14213d" strokeWidth="1" />
      <path d="M48 222 L72 222 C74 222 74 228 72 228 L48 228 C46 228 46 222 48 222 Z" fill="url(#prob-r-hatch)" stroke="#14213d" strokeWidth="1.2" />
    </g>

    {/* Loose slipping sheet floating beside cabinet */}
    <g transform="translate(26 238) rotate(-18)">
      <rect x="0" y="0" width="46" height="58" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.3" />
      <line x1="8" y1="14" x2="36" y2="14" stroke="#14213d" strokeWidth="1.1" />
      <line x1="8" y1="22" x2="30" y2="22" stroke="#14213d" strokeWidth="0.9" strokeOpacity="0.6" />
      <path d="M12 36 L34 46 M34 36 L12 46" stroke="#c8322b" strokeWidth="1.2" />
    </g>

    {/* Red office tape ribbon */}
    <path
      d="M174 166 C206 168 228 192 206 210 C190 222 174 202 198 194 C222 186 244 216 232 246"
      stroke="#c8322b"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />

    <text
      x="38"
      y="355"
      fill="#14213d"
      fontSize="10.5"
      fontFamily="IBM Plex Mono, monospace"
      letterSpacing="0.06em"
    >
      FIG. 04 — ARCHIVE CLUTTER
    </text>
    <line x1="38" y1="364" x2="236" y2="364" stroke="#14213d" strokeWidth="0.9" strokeOpacity="0.4" />
  </svg>
);
