import React from 'react';
import { EditorialDefs } from './EditorialDefs';

export const HeroLeftIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 280 390"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Editorial ink illustration of an Indian citizen holding a folder full of identity documents"
  >
    <EditorialDefs idPrefix="hero-l" />

    {/* Background halftone circle behind character */}
    <circle cx="142" cy="148" r="88" fill="url(#hero-l-halftone)" />
    <circle
      cx="142"
      cy="148"
      r="88"
      stroke="#14213d"
      strokeWidth="0.8"
      strokeDasharray="3 4"
      strokeOpacity="0.35"
    />

    {/* Floating paper slip top-left */}
    <g transform="translate(20 34) rotate(-9)">
      <rect x="0" y="0" width="54" height="68" rx="1.5" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.4" />
      <line x1="9" y1="14" x2="42" y2="14" stroke="#14213d" strokeWidth="1.2" />
      <line x1="9" y1="22" x2="36" y2="22" stroke="#14213d" strokeWidth="0.9" strokeOpacity="0.55" />
      <line x1="9" y1="29" x2="44" y2="29" stroke="#14213d" strokeWidth="0.9" strokeOpacity="0.55" />
      <rect x="9" y="38" width="18" height="16" fill="url(#hero-l-hatch)" stroke="#14213d" strokeWidth="0.9" />
      <circle cx="40" cy="48" r="6" stroke="#c8322b" strokeWidth="1.2" strokeDasharray="2 1.5" />
    </g>

    {/* Paperclip sketch */}
    <path
      d="M226 56 L226 84 C226 91 215 91 215 84 L215 52 C215 47 222 47 222 52 L222 78"
      stroke="#14213d"
      strokeWidth="1.4"
      strokeLinecap="round"
    />

    {/* Citizen Torso & Cotton Kurta */}
    <path
      d="M72 325 C75 245 92 212 118 202 L166 202 C194 212 210 245 214 325 Z"
      fill="#fbf8f2"
      stroke="#14213d"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* Kurta shading */}
    <path
      d="M76 323 C82 260 95 228 112 212 L120 268 L96 323 Z"
      fill="url(#hero-l-hatch)"
    />
    {/* Mandarin collar & placket */}
    <path
      d="M122 198 L142 214 L162 198"
      stroke="#14213d"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M142 214 L142 254" stroke="#14213d" strokeWidth="1.5" />
    <circle cx="142" cy="228" r="1.8" fill="#14213d" />
    <circle cx="142" cy="240" r="1.8" fill="#14213d" />

    {/* Neck */}
    <path
      d="M128 181 L128 202 C136 208 148 208 156 202 L156 181"
      fill="#f6f1e7"
      stroke="#14213d"
      strokeWidth="1.7"
    />

    {/* Head & Expressive Face */}
    <path
      d="M113 130 C112 96 172 96 171 130 C172 161 159 184 142 185 C125 184 112 161 113 130 Z"
      fill="#fbf8f2"
      stroke="#14213d"
      strokeWidth="1.8"
    />
    {/* Hair with editorial ink strokes */}
    <path
      d="M111 132 C108 106 122 86 144 87 C167 88 176 108 172 132 C169 116 159 109 143 110 C128 111 117 118 111 132 Z"
      fill="#14213d"
    />
    <path d="M125 94 C135 88 152 89 162 97" stroke="#f6f1e7" strokeWidth="1" strokeOpacity="0.6" />

    {/* Ears */}
    <path d="M112 134 C106 134 106 149 113 150" stroke="#14213d" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M171 134 C177 134 177 149 170 150" stroke="#14213d" strokeWidth="1.6" strokeLinecap="round" />

    {/* Round spectacles */}
    <circle cx="129" cy="138" r="9.5" stroke="#14213d" strokeWidth="1.6" fill="#f6f1e7" fillOpacity="0.5" />
    <circle cx="155" cy="138" r="9.5" stroke="#14213d" strokeWidth="1.6" fill="#f6f1e7" fillOpacity="0.5" />
    <path d="M138.5 137 Q142 134 145.5 137" stroke="#14213d" strokeWidth="1.5" />
    <line x1="114" y1="136" x2="119.5" y2="137" stroke="#14213d" strokeWidth="1.4" />
    <line x1="164.5" y1="137" x2="170" y2="136" stroke="#14213d" strokeWidth="1.4" />

    {/* Thoughtful eyes & brows */}
    <path d="M121 125 Q129 121 136 125" stroke="#14213d" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M148 126 Q156 123 163 127" stroke="#14213d" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="130" cy="139" r="1.9" fill="#14213d" />
    <circle cx="154" cy="139" r="1.9" fill="#14213d" />

    {/* Nose, moustache & slight contemplative mouth */}
    <path d="M142 139 L139 152 L145 153" stroke="#14213d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M131 161 Q142 156 153 161" stroke="#14213d" strokeWidth="2.1" strokeLinecap="round" />
    <path d="M136 168 Q142 170 148 167" stroke="#14213d" strokeWidth="1.4" strokeLinecap="round" />

    {/* Tied Manila Folder held in front with sticking-out documents */}
    <g transform="translate(88 228)">
      {/* Sticking out papers */}
      <path d="M12 10 L22 -24 L86 -16 L78 16" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.4" />
      <path d="M36 12 L48 -28 L108 -14 L98 18" fill="#f6f1e7" stroke="#14213d" strokeWidth="1.4" />
      <line x1="54" y1="-16" x2="92" y2="-8" stroke="#c8322b" strokeWidth="1.3" />
      <line x1="51" y1="-8" x2="86" y2="-1" stroke="#14213d" strokeWidth="1" strokeOpacity="0.5" />

      {/* Folder body */}
      <path
        d="M4 12 L106 4 L112 78 L10 86 Z"
        fill="#ebe3d3"
        stroke="#14213d"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M4 12 L106 4 L112 78 L10 86 Z" fill="url(#hero-l-hatch)" />
      {/* Folder flap & string tie (dori) */}
      <path d="M4 12 L58 46 L106 4" stroke="#14213d" strokeWidth="1.5" fill="#f6f1e7" fillOpacity="0.6" />
      <circle cx="58" cy="45" r="3.5" fill="#c8322b" stroke="#14213d" strokeWidth="1.2" />
      <path d="M58 45 C65 62 76 68 85 58" stroke="#c8322b" strokeWidth="1.2" strokeLinecap="round" />

      {/* Fingers gripping folder */}
      <path
        d="M-6 42 C2 38 14 40 16 47 C18 54 6 58 -4 55"
        fill="#fbf8f2"
        stroke="#14213d"
        strokeWidth="1.6"
      />
      <path
        d="M116 34 C106 31 96 35 96 42 C96 49 108 51 118 47"
        fill="#fbf8f2"
        stroke="#14213d"
        strokeWidth="1.6"
      />
    </g>

    {/* Hand-drawn editorial arrow & caption */}
    <path
      d="M214 218 Q242 204 226 178"
      stroke="#c8322b"
      strokeWidth="1.4"
      strokeDasharray="3 2.5"
      fill="none"
    />
    <path d="M222 183 L226 176 L232 182" stroke="#c8322b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />

    <text
      x="22"
      y="355"
      fill="#14213d"
      fontSize="10.5"
      fontFamily="IBM Plex Mono, monospace"
      letterSpacing="0.06em"
    >
      FIG. 01 — EVERYDAY RECORDS
    </text>
    <line x1="22" y1="364" x2="212" y2="364" stroke="#14213d" strokeWidth="0.9" strokeOpacity="0.4" />
  </svg>
);

export const HeroRightIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 280 390"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Editorial ink illustration of a desk with generic ID cards, fountain pen, and rubber stamp"
  >
    <EditorialDefs idPrefix="hero-r" />

    {/* Halftone backdrop */}
    <rect x="44" y="54" width="196" height="232" rx="2" fill="url(#hero-r-halftone)" opacity="0.7" />

    {/* Desk blotter mat */}
    <path
      d="M26 105 L248 86 L262 296 L38 312 Z"
      fill="#fbf8f2"
      stroke="#14213d"
      strokeWidth="1.7"
    />
    <path d="M32 112 L242 94" stroke="#14213d" strokeWidth="0.7" strokeOpacity="0.3" />

    {/* Generic Aadhaar-like document card (no real numbers) */}
    <g transform="translate(46 122) rotate(-6)">
      <rect x="0" y="0" width="132" height="82" rx="3" fill="#f6f1e7" stroke="#14213d" strokeWidth="1.6" />
      {/* Top tricolor-inspired muted editorial rule */}
      <line x1="6" y1="10" x2="126" y2="10" stroke="#e9a23b" strokeWidth="2.2" />
      <line x1="6" y1="14" x2="126" y2="14" stroke="#14213d" strokeWidth="0.8" />
      <line x1="6" y1="17" x2="126" y2="17" stroke="#1f7a4d" strokeWidth="1.6" />
      {/* Portrait silhouette box */}
      <rect x="10" y="25" width="28" height="34" fill="url(#hero-r-hatch)" stroke="#14213d" strokeWidth="1.1" />
      <circle cx="24" cy="37" r="5.5" stroke="#14213d" strokeWidth="1.2" fill="#fbf8f2" />
      <path d="M15 56 C15 47 33 47 33 56" stroke="#14213d" strokeWidth="1.2" fill="#fbf8f2" />
      {/* Abstract redacted text lines */}
      <line x1="46" y1="30" x2="112" y2="30" stroke="#14213d" strokeWidth="2" />
      <line x1="46" y1="39" x2="96" y2="39" stroke="#14213d" strokeWidth="1.3" strokeOpacity="0.65" />
      <line x1="46" y1="48" x2="106" y2="48" stroke="#14213d" strokeWidth="1.3" strokeOpacity="0.65" />
      {/* Generic masked ID blocks */}
      <rect x="26" y="66" width="22" height="6" rx="1" fill="#14213d" fillOpacity="0.25" />
      <rect x="54" y="66" width="22" height="6" rx="1" fill="#14213d" fillOpacity="0.25" />
      <rect x="82" y="66" width="22" height="6" rx="1" fill="#14213d" fillOpacity="0.25" />
    </g>

    {/* Generic PAN-like document card overlapping */}
    <g transform="translate(106 184) rotate(5)">
      <rect x="0" y="0" width="128" height="78" rx="3" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.6" />
      <rect x="0" y="0" width="128" height="16" fill="url(#hero-r-hatch)" stroke="#14213d" strokeWidth="1.1" />
      <text x="10" y="11" fill="#14213d" fontSize="7.5" fontFamily="IBM Plex Mono, monospace" fontWeight="600">
        TAX / ID CARD
      </text>
      <rect x="94" y="24" width="24" height="28" fill="url(#hero-r-crosshatch)" stroke="#14213d" strokeWidth="1" />
      <line x1="10" y1="28" x2="80" y2="28" stroke="#14213d" strokeWidth="1.9" />
      <line x1="10" y1="38" x2="72" y2="38" stroke="#14213d" strokeWidth="1.2" strokeOpacity="0.7" />
      <line x1="10" y1="48" x2="54" y2="48" stroke="#14213d" strokeWidth="1.2" strokeOpacity="0.7" />
      {/* Red editorial circle around differing initial */}
      <ellipse cx="45" cy="28" rx="14" ry="8" stroke="#c8322b" strokeWidth="1.5" strokeDasharray="3 1.5" />
    </g>

    {/* Classic Fountain Pen angled across right corner */}
    <g transform="translate(194 44) rotate(24)">
      <path d="M8 0 L16 0 L15 92 L9 92 Z" fill="#14213d" />
      <path d="M9 92 L15 92 L12 110 Z" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.3" />
      <line x1="12" y1="97" x2="12" y2="109" stroke="#14213d" strokeWidth="1" />
      <rect x="7" y="24" width="10" height="4" fill="#e9a23b" stroke="#14213d" strokeWidth="0.9" />
    </g>

    {/* Wooden Rubber Stamp + Red Ink Impression */}
    <g transform="translate(46 232)">
      <rect x="6" y="42" width="44" height="10" rx="1.5" fill="#ebe3d3" stroke="#14213d" strokeWidth="1.5" />
      <path d="M18 42 L22 22 C17 18 17 8 28 8 C39 8 39 18 34 22 L38 42 Z" fill="#fbf8f2" stroke="#14213d" strokeWidth="1.5" />
      <path d="M22 22 L34 22" stroke="#14213d" strokeWidth="1" />
    </g>

    {/* Faint red stamped seal beside stamp */}
    <g transform="translate(118 274) rotate(-8)">
      <rect x="0" y="0" width="76" height="22" rx="1.5" stroke="#c8322b" strokeWidth="1.6" fill="url(#hero-r-red-halftone)" />
      <text x="8" y="14.5" fill="#c8322b" fontSize="9" fontFamily="IBM Plex Mono, monospace" fontWeight="600" letterSpacing="0.09em">
        VERIFY FIRST
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
      FIG. 02 — OVERLAPPING IDS
    </text>
    <line x1="38" y1="364" x2="236" y2="364" stroke="#14213d" strokeWidth="0.9" strokeOpacity="0.4" />
  </svg>
);
