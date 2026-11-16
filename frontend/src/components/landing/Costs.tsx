import { Reveal } from "@/components/Reveal";
import { t, type StringKey } from "@/lib/strings";

import { SectionHead } from "./SectionHead";

// Only facts listed in docs/facts.md, worded no stronger than their sources.
const ITEMS: { title: StringKey; body: StringKey; url: string | null; reported: boolean }[] = [
  {
    title: "costs.epf.title", body: "costs.epf.body", reported: true,
    url: "https://www.outlookmoney.com/retirement/pension/epf-claim-settlement-why-epfo-rejects-the-claims-and-what-subscribers-can-do",
  },
  {
    title: "costs.aadhaar.title", body: "costs.aadhaar.body", reported: false,
    url: "https://uidai.gov.in/en/1045-english-uk/faqs/enrolment-update/myaadhaar-online-update-service/13905-how-many-times-aadhaar-data-can-be-updated.html",
  },
  { title: "costs.link.title", body: "costs.link.body", reported: false, url: null },
];

export function Costs() {
  return (
    <section aria-labelledby="s02" id="s02-section" className="scroll-mt-16">
      <SectionHead id="s02" kicker={t("costs.kicker")} title={t("costs.title")} />
      <ul className="flex flex-col gap-4">
        {ITEMS.map((it) => (
          <li key={it.title}>
            <Reveal className="border-l-4 border-stamp bg-white/70 py-3 pl-4 pr-3">
              <h3 className="text-lg font-semibold">{t(it.title)}</h3>
              <p className="mt-1">{t(it.body)}</p>
              {it.url && (
                <a className="mt-1 inline-block min-h-11 py-2 text-sm underline" href={it.url} target="_blank" rel="noreferrer">
                  {t(it.reported ? "costs.sourceReported" : "costs.source")}
                </a>
              )}
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
