import React from 'react';
import { EditorialDefs } from './EditorialDefs';

/**
 * 42+ distinct hand-drawn SVG editorial doodles, ink marks, rubber stamps,
 * teacup rings, fingerprint whorls, arrows, stars, scribbles, and vintage
 * newspaper print marks distributed across the full scrollable canvas.
 */
export const NewspaperDoodlesLayer: React.FC = () => (
  <svg
    viewBox="0 0 1440 4200"
    preserveAspectRatio="xMidYMid slice"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full opacity-60"
  >
    <EditorialDefs idPrefix="mega-doodle" />

    {/* 1–2: Broadsheet edition masthead whispers */}
    <g transform="translate(28 42) rotate(-2)" opacity="0.58">
      <text x="0" y="0" fill="#14213d" fontSize="11" fontFamily="IBM Plex Mono, monospace" letterSpacing="0.14em">
        CITIZEN RECORDS GAZETTE · ILLUSTRATED EDITION
      </text>
      <line x1="0" y1="7" x2="310" y2="7" stroke="#14213d" strokeWidth="1" />
    </g>
    <g transform="translate(1075 38) rotate(1.5)" opacity="0.55">
      <text x="0" y="0" fill="#c8322b" fontSize="10.5" fontFamily="IBM Plex Mono, monospace" letterSpacing="0.12em">
        PUBLIC ASSISTANCE SUPPLEMENT · NO. 14
      </text>
      <line x1="0" y1="7" x2="295" y2="7" stroke="#c8322b" strokeWidth="0.9" strokeDasharray="3 2" />
    </g>

    {/* 3–10: Distinct hand-drawn curved arrows & brackets */}
    <g transform="translate(260 220)" opacity="0.68">
      <path d="M0 16 Q54 -6 108 18" stroke="#c8322b" strokeWidth="1.7" strokeDasharray="4 3" />
      <path d="M100 10 L110 19 L98 24" stroke="#c8322b" strokeWidth="1.7" strokeLinecap="round" />
    </g>
    <g transform="translate(1040 410)" opacity="0.62">
      <path d="M110 8 Q52 -10 4 22" stroke="#14213d" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M12 13 L2 23 L15 26" stroke="#14213d" strokeWidth="1.5" strokeLinecap="round" />
    </g>
    <g transform="translate(145 875)" opacity="0.7">
      <path d="M0 24 Q68 -6 130 14" stroke="#c8322b" strokeWidth="1.8" />
      <path d="M122 6 L132 15 L120 20" stroke="#c8322b" strokeWidth="1.8" strokeLinecap="round" />
      <text x="8" y="42" fill="#14213d" fontSize="10.5" fontFamily="IBM Plex Mono, monospace" fontStyle="italic">
        Initials ≠ Full Name
      </text>
    </g>
    <g transform="translate(1110 1240)" opacity="0.65">
      <path d="M108 26 Q56 0 4 20" stroke="#c8322b" strokeWidth="1.6" strokeDasharray="4 2.5" />
      <path d="M13 12 L2 21 L14 25" stroke="#c8322b" strokeWidth="1.6" strokeLinecap="round" />
    </g>
    <g transform="translate(210 1830)" opacity="0.6">
      <path d="M0 10 C35 32 75 0 112 20" stroke="#14213d" strokeWidth="1.5" strokeDasharray="3 2" />
      <path d="M105 11 L114 21 L101 24" stroke="#14213d" strokeWidth="1.5" strokeLinecap="round" />
    </g>
    <g transform="translate(1070 2360)" opacity="0.68">
      <path d="M98 10 Q48 34 2 14" stroke="#c8322b" strokeWidth="1.7" />
      <path d="M12 10 L1 14 L9 23" stroke="#c8322b" strokeWidth="1.7" strokeLinecap="round" />
    </g>
    <g transform="translate(185 3160)" opacity="0.65">
      <path d="M0 22 Q58 -4 114 14" stroke="#14213d" strokeWidth="1.5" strokeDasharray="4 2" />
      <path d="M106 7 L116 15 L104 20" stroke="#14213d" strokeWidth="1.5" strokeLinecap="round" />
    </g>
    <g transform="translate(1080 3740)" opacity="0.7">
      <path d="M112 6 Q55 32 6 12" stroke="#c8322b" strokeWidth="1.7" strokeDasharray="3 2" />
      <path d="M15 8 L4 12 L12 22" stroke="#c8322b" strokeWidth="1.7" strokeLinecap="round" />
    </g>

    {/* 11–18: Faint Vintage Rubber Stamp Impressions */}
    {[
      { x: 1120, y: 195, r: -8, text: 'CHECK SPELLING', color: '#c8322b', w: 132 },
      { x: 64, y: 635, r: 6, text: 'ORIGINAL COPY', color: '#14213d', w: 128 },
      { x: 1095, y: 970, r: -10, text: 'DOB DRIFT?', color: '#c8322b', w: 108 },
      { x: 88, y: 1475, r: -5, text: 'VERIFY LINE', color: '#14213d', w: 116 },
      { x: 1140, y: 1790, r: 7, text: 'LOCAL OCR', color: '#1f7a4d', w: 104 },
      { x: 52, y: 2490, r: -7, text: 'COUNTER COPY', color: '#14213d', w: 124 },
      { x: 1110, y: 2980, r: -4, text: 'FIX OUTLIER 1ST', color: '#c8322b', w: 142 },
      { x: 120, y: 3680, r: 5, text: 'RECORDS TALLIED', color: '#1f7a4d', w: 142 },
    ].map((st, i) => (
      <g key={`stamp-${i}`} transform={`translate(${st.x} ${st.y}) rotate(${st.r})`} opacity="0.62">
        <rect
          x="0"
          y="0"
          width={st.w}
          height="30"
          rx="1.5"
          stroke={st.color}
          strokeWidth="1.8"
          fill={st.color === '#c8322b' ? 'url(#mega-doodle-red-halftone)' : 'url(#mega-doodle-hatch)'}
        />
        <text
          x="10"
          y="19.5"
          fill={st.color}
          fontSize="11"
          fontFamily="IBM Plex Mono, monospace"
          fontWeight="700"
          letterSpacing="0.09em"
        >
          {st.text}
        </text>
      </g>
    ))}

    {/* 19–24: Faint Chai/Coffee Cup Ring Stains & Fingerprint Whorls */}
    <g transform="translate(310 530)" opacity="0.22">
      <circle cx="32" cy="32" r="28" stroke="#8c5a32" strokeWidth="2.4" strokeDasharray="18 3 9 2" />
      <circle cx="34" cy="31" r="26" stroke="#8c5a32" strokeWidth="0.9" strokeOpacity="0.6" />
    </g>
    <g transform="translate(1070 1510)" opacity="0.2">
      <circle cx="30" cy="30" r="25" stroke="#8c5a32" strokeWidth="2.2" strokeDasharray="14 4 11 2" />
    </g>
    <g transform="translate(270 2860)" opacity="0.22">
      <circle cx="28" cy="28" r="24" stroke="#8c5a32" strokeWidth="2" strokeDasharray="12 3 8 3" />
    </g>
    {/* Fingerprint whorls */}
    {[
      { x: 1185, y: 760, r: 14 },
      { x: 255, y: 1990, r: -18 },
      { x: 1155, y: 3420, r: 9 },
    ].map((fp, i) => (
      <g key={`fp-${i}`} transform={`translate(${fp.x} ${fp.y}) rotate(${fp.r})`} opacity="0.35">
        <ellipse cx="18" cy="24" rx="14" ry="20" stroke="#14213d" strokeWidth="1" strokeDasharray="6 2" />
        <ellipse cx="18" cy="24" rx="10" ry="15" stroke="#14213d" strokeWidth="1" strokeDasharray="5 2" />
        <ellipse cx="18" cy="24" rx="6" ry="10" stroke="#14213d" strokeWidth="1" />
        <path d="M18 19 L18 29" stroke="#14213d" strokeWidth="1" />
      </g>
    ))}

    {/* 25–32: Loose Paperclips, Brass Pins & Torn Form Slips */}
    {[
      { x: 190, y: 360, r: 22 },
      { x: 1210, y: 580, r: -28 },
      { x: 325, y: 1210, r: 15 },
      { x: 1030, y: 1420, r: -12 },
      { x: 135, y: 2150, r: 38 },
      { x: 1245, y: 2490, r: -19 },
      { x: 295, y: 3340, r: 11 },
      { x: 1045, y: 3920, r: -25 },
    ].map((clip, i) => (
      <g key={`clip-${i}`} transform={`translate(${clip.x} ${clip.y}) rotate(${clip.r})`} opacity="0.55">
        <path
          d="M11 0 L11 32 C11 39 0 39 0 32 L0 7 C0 2 7 2 7 7 L7 26"
          stroke="#14213d"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
    ))}

    {/* 33–38: Mini Document Outlines & Folded Corners */}
    {[
      { x: 48, y: 1020, r: -8 },
      { x: 1265, y: 1110, r: 12 },
      { x: 295, y: 1620, r: -6 },
      { x: 1055, y: 2070, r: 9 },
      { x: 65, y: 2920, r: -11 },
      { x: 1250, y: 3190, r: 6 },
    ].map((doc, i) => (
      <g key={`minidoc-${i}`} transform={`translate(${doc.x} ${doc.y}) rotate(${doc.r})`} opacity="0.52">
        <path d="M0 0 L42 0 L52 10 L52 66 L0 66 Z" fill="#fbf8f2" fillOpacity="0.45" stroke="#14213d" strokeWidth="1.3" />
        <path d="M42 0 L42 10 L52 10" stroke="#14213d" strokeWidth="1.1" />
        <line x1="8" y1="20" x2="42" y2="20" stroke="#14213d" strokeWidth="1.3" />
        <line x1="8" y1="30" x2="36" y2="30" stroke="#14213d" strokeWidth="0.9" strokeOpacity="0.65" />
        <line x1="8" y1="40" x2="40" y2="40" stroke="#c8322b" strokeWidth="1.2" />
        <line x1="8" y1="50" x2="30" y2="50" stroke="#14213d" strokeWidth="0.9" strokeOpacity="0.65" />
      </g>
    ))}

    {/* 39–46: Ink Splatters, Editorial Stars, Wavy Underlines & Handwritten Scribbles */}
    {[
      { x: 340, y: 130 },
      { x: 1060, y: 290 },
      { x: 90, y: 490 },
      { x: 1290, y: 880 },
      { x: 260, y: 1390 },
      { x: 1180, y: 1670 },
      { x: 90, y: 2290 },
      { x: 1280, y: 2740 },
      { x: 310, y: 3090 },
      { x: 1090, y: 3560 },
      { x: 85, y: 3940 },
      { x: 1275, y: 4030 },
    ].map((pt, i) => (
      <g key={`star-${i}`} transform={`translate(${pt.x} ${pt.y})`} opacity="0.54">
        <path
          d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z"
          fill={i % 2 === 0 ? '#14213d' : '#c8322b'}
        />
        <circle cx="15" cy="9" r="1.8" fill="#14213d" />
        <circle cx="22" cy="5" r="1.1" fill="#c8322b" />
        <circle cx="-12" cy="11" r="1.2" fill="#14213d" />
        <path d="M-20 18 Q-10 13 0 18 T20 18" stroke="#14213d" strokeWidth="1" strokeOpacity="0.45" />
      </g>
    ))}

    {/* Signature & margin checkmarks */}
    {[
      { x: 245, y: 745 },
      { x: 1170, y: 2210 },
      { x: 240, y: 3510 },
    ].map((sig, i) => (
      <g key={`sig-${i}`} transform={`translate(${sig.x} ${sig.y})`} opacity="0.5">
        <path
          d="M0 12 C8 0 16 20 26 8 C34 -2 42 18 56 6 C66 -2 72 14 88 10"
          stroke="#14213d"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <line x1="0" y1="22" x2="88" y2="22" stroke="#14213d" strokeWidth="0.7" strokeDasharray="2 2" />
      </g>
    ))}
  </svg>
);
