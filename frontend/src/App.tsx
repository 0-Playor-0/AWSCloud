import { useEffect, useRef, useState } from "react";

import { AddDocument } from "@/components/AddDocument";
import { DocumentList } from "@/components/DocumentList";
import { ErrorAlert } from "@/components/ErrorAlert";
import { PurposePicker } from "@/components/PurposePicker";
import { Report } from "@/components/Report";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { compare } from "@/lib/api";
import { describeError, type ShownError } from "@/lib/errors";
import type { Persona } from "@/lib/samples";
import { REPO_URL, t } from "@/lib/strings";
import type { Anchor, CompareResponse, DocumentEntry, Purpose } from "@/lib/types";
import { newId } from "@/lib/utils";

type Stage = "purpose" | "documents" | "report";
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
  const mainRef = useRef<HTMLElement>(null);

  // Move focus to the new step's heading so keyboard and screen reader users follow along.
  useEffect(() => {
    mainRef.current?.querySelector<HTMLElement>("h2")?.focus();
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

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-black uppercase tracking-tight">{t("app.title")}</h1>
          {stage !== "purpose" && <Button size="sm" variant="ghost" onClick={reset}>{t("app.startOver")}</Button>}
        </div>
        <p>{t("app.tagline")}</p>
        <p className="text-sm text-ink/70">{t("app.positioning")}</p>
      </header>

      <main ref={mainRef} className="flex flex-col gap-4">
        {stage === "purpose" && (
          <PurposePicker value={purpose} onChange={setPurpose} onContinue={() => setStage("documents")}
            onSampleSet={loadSample} />
        )}

        {stage === "documents" && (
          <section aria-labelledby="docs-title" className="flex flex-col gap-4">
            <h2 id="docs-title" tabIndex={-1} className="text-xl font-bold focus:outline-none">{t("step.documents")}</h2>
            <p className="text-sm">{t(`purpose.${purpose}`)} · <button className="min-h-11 underline" onClick={() => setStage("purpose")}>{t("docs.back")}</button></p>
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
              <AddDocument photoOff={photoOff} consented={consented} onConsent={() => setConsented(true)}
                onCapReached={() => setPhotoOff(true)} onAdd={addDoc} onCancel={() => setAdding(false)} />
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
            <Report report={report} docs={docs} anchor={anchor} busy={busy} onAnchor={runCompare}
              onEdit={() => setStage("documents")} />
          </>
        )}
      </main>

      <div aria-live="polite" className="sr-only">{announce}</div>

      <footer className="mt-auto border-t border-ink/15 pt-4 text-sm text-ink/70">
        <a className="underline" href={REPO_URL} target="_blank" rel="noreferrer">{t("footer.repo")}</a>
      </footer>
    </div>
  );
}
