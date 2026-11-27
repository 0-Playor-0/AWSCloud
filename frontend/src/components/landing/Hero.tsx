import { DiffText } from "@/components/DiffText";
import { Stamp } from "@/components/Stamp";
import { Button } from "@/components/ui/button";
import { docLabel } from "@/lib/labels";
import { useT } from "@/lib/language-context";
import type { DocType } from "@/lib/types";

// One fictional person, five spellings (fields only; no layouts, numbers or emblems).
const SLIPS: { doc: DocType; name: string }[] = [
  { doc: "aadhaar", name: "RAVI KUMAR K" },
  { doc: "pan", name: "K RAVI KUMAR" },
  { doc: "marksheet10", name: "RAVI KUMAR" },
  { doc: "passbook", name: "KUMAR RAVI" },
  { doc: "other", name: "RAVEE KUMAR K" },
];

export function Hero() {
  const t = useT();
  const base = SLIPS[0].name;
  return (
    <section aria-labelledby="s01" id="s01-section" className="scroll-mt-16 pt-6">
      <p className="mb-4 font-mono text-sm font-semibold tracking-wide text-stamp">{t("hero.kicker")}</p>
      <h1 id="s01" className="display text-[clamp(3rem,15vw,6.5rem)]">
        <span className="block">{t("hero.line1")}</span>
        <span className="block text-stamp">{t("hero.line2")}</span>
        <span className="block">{t("hero.line3")}</span>
      </h1>
      <p className="mt-5 max-w-prose text-lg">{t("hero.body")}</p>

      <div className="relative mt-8" role="img" aria-label={t("hero.slipsLabel")}>
        <ol className="flex flex-col gap-0">
          {SLIPS.map((s, i) => (
            <li
              key={s.doc}
              className="relative rounded-sm border border-ink/15 bg-white px-4 py-3 shadow-[0_2px_0_rgb(20_33_61/0.08)]"
              style={{ transform: `rotate(${[-1.2, 0.8, -0.4, 1.1, -0.7][i]}deg)`, marginTop: i ? -6 : 0 }}
            >
              <span className="block font-mono text-[0.7rem] uppercase tracking-widest text-ink/70">{docLabel(s.doc, t)}</span>
              <span className="block font-mono text-lg font-semibold sm:text-xl"><DiffText base={base} value={s.name} /></span>
            </li>
          ))}
        </ol>
        <Stamp label={t("stamp.mismatch")} tone="mismatch" onScroll className="absolute -right-1 top-1/3 text-3xl sm:text-4xl" />
      </div>

      <Button asChild size="lg" className="mt-8 w-full sm:w-auto">
        <a href="#s04-section">{t("hero.cta")}</a>
      </Button>
    </section>
  );
}
