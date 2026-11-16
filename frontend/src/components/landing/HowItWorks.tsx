import { Reveal } from "@/components/Reveal";
import { t } from "@/lib/strings";

import { SectionHead } from "./SectionHead";

const STEPS = [
  ["how.step1.title", "how.step1.body"],
  ["how.step2.title", "how.step2.body"],
  ["how.step3.title", "how.step3.body"],
] as const;

export function HowItWorks() {
  return (
    <section aria-labelledby="s03" id="s03-section" className="scroll-mt-16">
      <SectionHead id="s03" kicker={t("how.kicker")} title={t("how.title")} />
      <ol className="flex flex-col gap-4">
        {STEPS.map(([title, body], i) => (
          <li key={title}>
            <Reveal className="flex gap-4">
              <span className="display w-12 shrink-0 text-5xl text-stamp" aria-hidden="true">{i + 1}</span>
              <span>
                <span className="block text-lg font-semibold">{t(title)}</span>
                <span className="block">{t(body)}</span>
              </span>
            </Reveal>
          </li>
        ))}
      </ol>
      <Reveal className="mt-6 rounded-md border-2 border-dashed border-match bg-white p-4">
        <h3 className="font-semibold text-match">{t("how.privacyTitle")}</h3>
        <p className="mt-1">{t("how.privacyBody")}</p>
      </Reveal>
    </section>
  );
}
