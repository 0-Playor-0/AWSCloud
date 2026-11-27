import { useState } from "react";

import { FieldForm } from "@/components/FieldForm";
import { PhotoInput } from "@/components/PhotoInput";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { docLabel } from "@/lib/labels";
import { PERSONAS } from "@/lib/samples";
import { useT } from "@/lib/language-context";
import { DOC_TYPES, FIELD_NAMES, type DocFields, type DocType, type DocumentEntry, type ExtractResponse, type FieldName } from "@/lib/types";

type Mode = "photo" | "typed" | "sample";
const LOW = 0.8;

interface Props {
  photoOff: boolean;
  consented: boolean;
  onConsent: () => void;
  onCapReached: () => void;
  onAdd: (doc: Omit<DocumentEntry, "id">) => void;
  onCancel: () => void;
}

function fromExtract(res: ExtractResponse): { fields: DocFields; low: FieldName[] } {
  const f = res.fields;
  const gender = f.gender.value;
  return {
    fields: {
      name: f.name.value,
      dob: f.dob.value,
      parent_name: f.parent_name.value,
      gender: gender === "M" || gender === "F" || gender === "O" ? gender : null,
    },
    low: FIELD_NAMES.filter(
      (n) => res.warnings.includes(`${n}_low_confidence`) || (f[n].value !== null && f[n].confidence < LOW),
    ),
  };
}

export function AddDocument({ photoOff, consented, onConsent, onCapReached, onAdd, onCancel }: Props) {
  const t = useT();
  const [docType, setDocType] = useState<DocType>("aadhaar");
  const [mode, setMode] = useState<Mode>(photoOff ? "typed" : "photo");
  const [extracted, setExtracted] = useState<{ fields: DocFields; low: FieldName[] } | null>(null);
  const [capNotice, setCapNotice] = useState(false);
  const shownMode = photoOff && mode === "photo" ? "typed" : mode;

  const capReached = () => {
    onCapReached();
    setCapNotice(true);
    setMode("typed");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("add.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <label className={shownMode === "sample" && !extracted ? "hidden" : "flex flex-col gap-1"}>
          <span className="text-sm font-medium">{t("add.docType")}</span>
          <select className="min-h-11 rounded-md border border-ink/30 bg-white px-3" value={docType}
            disabled={extracted !== null}
            onChange={(e) => setDocType(e.target.value as DocType)}>
            {DOC_TYPES.map((d) => <option key={d} value={d}>{docLabel(d, t)}</option>)}
          </select>
        </label>

        {extracted ? (
          <FieldForm
            initial={extracted.fields}
            lowConfidence={extracted.low}
            title={t("fields.confirmTitle")}
            submitLabel={t("fields.save")}
            onSubmit={(fields) => onAdd({ doc_type: docType, source: "photo", fields })}
            onCancel={() => setExtracted(null)}
          />
        ) : (
          <Tabs value={shownMode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList>
              <TabsTrigger value="photo" disabled={photoOff}>{t("add.mode.photo")}</TabsTrigger>
              <TabsTrigger value="typed">{t("add.mode.typed")}</TabsTrigger>
              <TabsTrigger value="sample">{t("add.mode.sample")}</TabsTrigger>
            </TabsList>
            {(photoOff || capNotice) && (
              <Alert variant="warning" role="status" className="mt-3">{t("photo.capOff")}</Alert>
            )}
            <TabsContent value="photo">
              <PhotoInput key={docType} docType={docType} consented={consented} onConsent={onConsent}
                onCapReached={capReached} onExtracted={(r) => setExtracted(fromExtract(r))}
                onUseTyped={() => setMode("typed")} />
            </TabsContent>
            <TabsContent value="typed">
              <FieldForm key={docType} title={t("fields.typeTitle")} submitLabel={t("fields.save")}
                onSubmit={(fields) => onAdd({ doc_type: docType, source: "typed", fields })} />
            </TabsContent>
            <TabsContent value="sample">
              <SamplePicker onAdd={(doc) => onAdd({ ...doc, source: "sample" })} />
            </TabsContent>
          </Tabs>
        )}

        <Button variant="ghost" onClick={onCancel} className="self-start">{t("add.cancel")}</Button>
      </CardContent>
    </Card>
  );
}

function SamplePicker({ onAdd }: { onAdd: (doc: { doc_type: DocType; fields: DocFields }) => void }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink/80">{t("sample.notice")}</p>
      {PERSONAS.flatMap((p) =>
        p.docs.map((d, i) => (
          <SampleCard key={`${p.id}-${i}`} persona={p.name} doc={d} onAdd={() => onAdd(d)} />
        )),
      )}
    </div>
  );
}

export function SampleCard({ persona, doc, onAdd }: { persona: string; doc: { doc_type: DocType; fields: DocFields }; onAdd?: () => void }) {
  const t = useT();
  const f = doc.fields;
  return (
    <div className="relative rounded-md border-2 border-dashed border-ink/30 bg-paper p-3">
      <span className="absolute right-2 top-2 rotate-6 rounded border-2 border-stamp px-1 text-xs font-bold tracking-widest text-stamp">
        {t("sample.badge")}
      </span>
      <p className="text-sm font-semibold">{persona} · {docLabel(doc.doc_type, t)}</p>
      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 font-mono text-sm">
        {f.name && <><dt className="text-ink/70">{t("fields.name")}</dt><dd>{f.name}</dd></>}
        {f.dob && <><dt className="text-ink/70">{t("fields.dob")}</dt><dd>{f.dob}</dd></>}
        {f.parent_name && <><dt className="text-ink/70">{t("report.field.parent_name")}</dt><dd>{f.parent_name}</dd></>}
        {f.gender && <><dt className="text-ink/70">{t("fields.gender")}</dt><dd>{f.gender}</dd></>}
      </dl>
      {onAdd && <Button size="sm" variant="outline" className="mt-2" onClick={onAdd}>{t("sample.add")}</Button>}
    </div>
  );
}
