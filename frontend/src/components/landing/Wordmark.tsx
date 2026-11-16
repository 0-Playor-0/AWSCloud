import { t } from "@/lib/strings";
import { WORDMARK } from "@/lib/wordmark";

export function Wordmark() {
  const shown = WORDMARK.filter((w) => w.enabled);
  const unverified = shown.some((w) => !w.verified);
  return (
    <footer className="mt-16 border-t-2 border-ink pt-6">
      <ul aria-label={t("footer.wordmarkLabel")} className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        {shown.map((w, i) => (
          <li key={w.lang} lang={w.lang} className={i === 0 ? "display text-3xl" : "text-xl font-semibold text-ink/80"}>
            {w.text}
          </li>
        ))}
      </ul>
      {unverified && <p className="mt-3 text-xs text-ink/70">{t("footer.note")}</p>}
    </footer>
  );
}
