import { t } from "@/lib/strings";

// Transliterations of "Namma Check", flagged for native-speaker review (see logs/phase-4.md).
const SCRIPTS: { lang: string; text: string }[] = [
  { lang: "en", text: "Namma Check" },
  { lang: "kn", text: "ನಮ್ಮ ಚೆಕ್" },
  { lang: "ta", text: "நம்ம செக்" },
  { lang: "te", text: "నమ్మ చెక్" },
  { lang: "ml", text: "നമ്മ ചെക്ക്" },
  { lang: "hi", text: "नम्मा चेक" },
  { lang: "bn", text: "নম্মা চেক" },
];

export function Wordmark() {
  return (
    <footer className="mt-16 border-t-2 border-ink pt-6">
      <ul aria-label={t("footer.wordmarkLabel")} className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        {SCRIPTS.map((s, i) => (
          <li key={s.lang} lang={s.lang} className={i === 0 ? "display text-3xl" : "text-xl font-semibold text-ink/80"}>
            {s.text}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink/70">{t("footer.note")}</p>
    </footer>
  );
}
