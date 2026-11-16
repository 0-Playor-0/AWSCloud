import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

import { DocumentList } from "@/components/DocumentList";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Costs } from "@/components/landing/Costs";
import { Counter } from "@/components/landing/Counter";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SectionHead } from "@/components/landing/SectionHead";
import { Wordmark } from "@/components/landing/Wordmark";
import { PurposePicker } from "@/components/PurposePicker";
import { Report } from "@/components/Report";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { compare } from "@/lib/api";
import { describeError, type ShownError } from "@/lib/errors";
import type { Persona } from "@/lib/samples";
import { t } from "@/lib/strings";
import type { Anchor, CompareResponse, DocumentEntry, Purpose } from "@/lib/types";
import { newId } from "@/lib/utils";

// The add-document card pulls in the cropper and OCR loader: load it on first use.
const AddDocument = lazy(() => import("@/components/AddDocument").then((m) => ({ default: m.AddDocument })));

type Stage = "purpose" | "documents" | "report";
const NAV = ["01", "02", "03", "04", "05"] as const;
const MIN_DOCS = 2;
const MAX_DOCS = 6;

export default function App() {
  const [stage, setStage] = useState<Stage>("purpose");
  const [purpose, setPurpose] = useState<Purpose>("general");
  const [docs, setDocs] = useState<DocumentEntry[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [consented, setConsented] = useState(false); // memory only (HANDOFF.md 4.7)
  const [photoOff, setPhotoOff] = useState(false); // set after 429 daily_cap_reached
  const [report, setReport] = useState<CompareResponse | null>(null);
  const [anchor, setAnchor] = useState<Anchor>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ShownError | null>(null);
  const [announce, setAnnounce] = useState("");
  const toolRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // Move focus to the new step's heading so keyboard and screen reader users follow along.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const h = toolRef.current?.querySelector<HTMLElement>("h3[tabindex]");
    h?.focus({ preventScroll: true });
    toolRef.current?.scrollIntoView({ block: "start" });
  }, [stage]);

  const runCompare = async (a: Anchor) => {
    setBusy(true);
    setError(null);
    setAnnounce(t("docs.checking"));
    const res = await compare(purpose, docs, a);
    setBusy(false);
    if (!res.ok) {
      setAnnounce("");
      return setError(describeError(res.error));
    }
    setAnchor(a);
    setReport(res.data);
    setStage("report");
    setAnnounce(t(`report.status.${res.data.summary.status}`));
  };

  const addDoc = (d: Omit<DocumentEntry, "id">) => {
    setDocs((prev) => (prev.length >= MAX_DOCS ? prev : [...prev, { ...d, id: newId() }]));
    setAdding(false);
  };

  const loadSample = (p: Persona) => {
    setDocs(p.docs.map((d) => ({ ...d, id: newId(), source: "sample" })));
    setAdding(false);
    setStage("documents");
  };

  const reset = () => {
    setStage("purpose");
    setDocs([]);
    setReport(null);
    setAnchor({});
    setError(null);
    setAdding(false);
    setEditingId(null);
  };

  const tool = (
    <div ref={toolRef} className="flex scroll-mt-16 flex-col gap-4">
      {stage === "purpose" && (
        <PurposePicker value={purpose} onChange={setPurpose} onContinue={() => setStage("documents")}
          onSampleSet={loadSample} />
      )}

      {stage === "documents" && (
        <section aria-labelledby="docs-title" className="flex flex-col gap-4">
          <h3 id="docs-title" tabIndex={-1} className="display text-3xl focus:outline-none">{t("step.documents")}</h3>
          <p className="text-sm">
            {t(`purpose.${purpose}`)} ·{" "}
            <button className="min-h-11 underline" onClick={() => setStage("purpose")}>{t("docs.back")}</button>
          </p>
          <div className="flex flex-col gap-1">
            <p className="text-sm" id="doc-count">{t("docs.count", { n: docs.length })}</p>
            <Progress value={(docs.length / MAX_DOCS) * 100} aria-labelledby="doc-count" />
          </div>
          <DocumentList docs={docs} editingId={editingId} onEdit={setEditingId}
            onRemove={(id) => setDocs((p) => p.filter((d) => d.id !== id))}
            onSave={(id, fields) => {
              setDocs((p) => p.map((d) => (d.id === id ? { ...d, fields } : d)));
              setEditingId(null);
            }} />
          {adding ? (
            <Suspense fallback={<p role="status">…</p>}>
              <AddDocument photoOff={photoOff} consented={consented} onConsent={() => setConsented(true)}
                onCapReached={() => setPhotoOff(true)} onAdd={addDoc} onCancel={() => setAdding(false)} />
            </Suspense>
          ) : docs.length < MAX_DOCS ? (
            <Button variant="outline" onClick={() => setAdding(true)}>+ {t("docs.add")}</Button>
          ) : (
            <p className="text-sm">{t("docs.max")}</p>
          )}
          {error && <ErrorAlert error={error} onRetry={() => runCompare(anchor)} onDismiss={() => setError(null)} />}
          <Button size="lg" disabled={docs.length < MIN_DOCS || busy || adding} onClick={() => runCompare({})}>
            {busy ? t("docs.checking") : t("docs.check")}
          </Button>
        </section>
      )}

      {stage === "report" && report && (
        <>
          {error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}
          <Report purpose={purpose} report={report} docs={docs} anchor={anchor} busy={busy} onAnchor={runCompare}
            onEdit={() => setStage("documents")} />
        </>
      )}
    </div>
  );

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <a href="#s04-section"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:p-3">
          {t("hero.cta")}
        </a>
        <nav aria-label={t("nav.label")} className="sticky top-0 z-30 border-b border-ink/15 bg-paper/95 backdrop-blur">
          <ul className="mx-auto flex max-w-2xl justify-between px-2 font-mono text-sm">
            {NAV.map((n) => (
              <li key={n}>
                <a href={`#s${n}-section`} className="flex min-h-11 items-center px-2 font-semibold hover:text-stamp">
                  <span aria-hidden="true">{n} //</span>
                  <span className="sr-only">{t(`nav.${n}`)}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mx-auto max-w-2xl px-4 pb-10">
          <main className="flex flex-col gap-20">
            <Hero />
            <Costs />
            <HowItWorks />
            <section aria-labelledby="s04" id="s04-section" className="scroll-mt-16">
              <SectionHead id="s04" kicker={t("try.kicker")} />
              <h2 id="s04" className="sr-only">{t("try.kicker")}</h2>
              <div className="flex items-start justify-between gap-2">
                <p className="mb-4 text-sm text-ink/80">{t("app.positioning")}</p>
                {stage !== "purpose" && <Button size="sm" variant="ghost" onClick={reset}>{t("app.startOver")}</Button>}
              </div>
              {tool}
            </section>
            <Counter />
          </main>
          <div aria-live="polite" className="sr-only">{announce}</div>
          <Wordmark />
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
