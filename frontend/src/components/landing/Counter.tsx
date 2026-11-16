import { useEffect, useState } from "react";

import { stats, type Stats } from "@/lib/api";
import { REPO_URL, t } from "@/lib/strings";

import { SectionHead } from "./SectionHead";

export function Counter() {
  const [data, setData] = useState<Stats | null | "error">(null);
  useEffect(() => {
    let live = true;
    stats().then((r) => live && setData(r.ok ? r.data : "error"));
    return () => {
      live = false;
    };
  }, []);
  const fmt = (n: number) => n.toLocaleString("en-IN");
  return (
    <section aria-labelledby="s05" id="s05-section" className="scroll-mt-16">
      <SectionHead id="s05" kicker={t("count.kicker")} />
      <h2 id="s05" className="sr-only">{t("count.kicker")}</h2>
      {data === "error" ? (
        <p>{t("count.unavailable")}</p>
      ) : (
        <dl className="grid grid-cols-2 gap-4" aria-busy={data === null}>
          <div>
            <dd className="display text-6xl" data-testid="count-checks">{data ? fmt(data.checks) : "–"}</dd>
            <dt className="font-mono text-sm">{t("count.checks")}</dt>
          </div>
          <div>
            <dd className="display text-6xl text-stamp">{data ? fmt(data.checks_with_mismatch) : "–"}</dd>
            <dt className="font-mono text-sm">{t("count.mismatch")}</dt>
          </div>
        </dl>
      )}
      <a className="mt-6 inline-block min-h-11 py-2 underline" href={REPO_URL} target="_blank" rel="noreferrer">{t("count.repo")}</a>
    </section>
  );
}
