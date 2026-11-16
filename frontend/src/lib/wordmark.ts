// Footer wordmark: "Namma Check" per script. Single switch list (HANDOFF.md section 7).
// All non-Latin entries are UNVERIFIED transliterations (see docs/facts.md, "Wordmark"): set
// `enabled: false` to hide one, and `verified: true` only after a native speaker has checked it.

export interface WordmarkScript {
  lang: string; // BCP 47, sets the lang attribute for correct shaping and screen readers
  script: string;
  text: string;
  verified: boolean;
  enabled: boolean;
}

export const WORDMARK: WordmarkScript[] = [
  { lang: "en", script: "Latin", text: "Namma Check", verified: true, enabled: true },
  { lang: "kn", script: "Kannada", text: "ನಮ್ಮ ಚೆಕ್", verified: false, enabled: true },
  { lang: "ta", script: "Tamil", text: "நம்ம செக்", verified: false, enabled: true },
  { lang: "te", script: "Telugu", text: "నమ్మ చెక్", verified: false, enabled: true },
  { lang: "ml", script: "Malayalam", text: "നമ്മ ചെക്ക്", verified: false, enabled: true },
  { lang: "hi", script: "Devanagari", text: "नम्मा चेक", verified: false, enabled: true },
  { lang: "bn", script: "Bengali", text: "নম্মা চেক", verified: false, enabled: true },
];
