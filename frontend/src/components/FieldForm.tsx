import { useId, useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/language-context";
import type { DocFields, FieldName, Gender } from "@/lib/types";

const MAX_NAME = 100;

interface Props {
  initial?: DocFields;
  title: string;
  submitLabel: string;
  lowConfidence?: FieldName[];
  onSubmit: (fields: DocFields) => void;
  onCancel?: () => void;
}

interface Draft {
  name: string;
  parent_name: string;
  dob: string; // YYYY-MM-DD from <input type=date>
  dobYear: string;
  yearOnly: boolean;
  gender: Gender | "";
}

function toDraft(f?: DocFields): Draft {
  const dob = f?.dob ?? "";
  const yearOnly = /^\d{4}$/.test(dob);
  return {
    name: f?.name ?? "",
    parent_name: f?.parent_name ?? "",
    dob: yearOnly ? "" : dob,
    dobYear: yearOnly ? dob : "",
    yearOnly,
    gender: f?.gender ?? "",
  };
}

function validDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

function validate(d: Draft, t: (key: string) => string): { fields?: DocFields; error?: string } {
  const name = d.name.trim() || null;
  const parent = d.parent_name.trim() || null;
  if ((name?.length ?? 0) > MAX_NAME || (parent?.length ?? 0) > MAX_NAME) return { error: t("fields.tooLong") };
  let dob: string | null = null;
  if (d.yearOnly) {
    if (d.dobYear && !/^(19|20)\d{2}$/.test(d.dobYear)) return { error: t("fields.badYear") };
    dob = d.dobYear || null;
  } else if (d.dob) {
    if (!validDate(d.dob)) return { error: t("fields.badDate") };
    dob = d.dob;
  }
  const fields: DocFields = { name, dob, parent_name: parent, gender: d.gender || null };
  if (!Object.values(fields).some((v) => v !== null)) return { error: t("fields.needOne") };
  return { fields };
}

export function FieldForm({ initial, title, submitLabel, lowConfidence = [], onSubmit, onCancel }: Props) {
  const t = useT();
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [error, setError] = useState<string | null>(null);
  const id = useId();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const low = (f: FieldName) => lowConfidence.includes(f);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = validate(draft, t);
    if (r.error) return setError(r.error);
    setError(null);
    onSubmit(r.fields!);
  };

  const input = "min-h-11 w-full rounded-md border border-ink/30 bg-white px-3 font-mono text-base";
  const hint = (f: FieldName) =>
    low(f) ? (
      <p id={`${id}-${f}-low`} className="text-sm font-medium text-amber-dark">
        {t("fields.lowConfidence")}
      </p>
    ) : null;
  const describedBy = (f: FieldName) => (low(f) ? `${id}-${f}-low` : undefined);

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate aria-labelledby={`${id}-title`}>
      <p id={`${id}-title`} className="text-sm font-medium">
        {title} <span className="font-normal text-ink/70">{t("fields.optional")}</span>
      </p>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("fields.name")}</span>
        <input className={input} value={draft.name} maxLength={MAX_NAME} autoComplete="off"
          aria-describedby={describedBy("name")} onChange={(e) => set("name", e.target.value)} />
        {hint("name")}
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t("fields.dob")}</legend>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" className="size-5" checked={draft.yearOnly}
            onChange={(e) => set("yearOnly", e.target.checked)} />
          {t("fields.dobYearOnly")}
        </label>
        {draft.yearOnly ? (
          <label className="flex flex-col gap-1">
            <span className="text-sm">{t("fields.dobYear")}</span>
            <input className={input} inputMode="numeric" maxLength={4} value={draft.dobYear}
              aria-describedby={describedBy("dob")} onChange={(e) => set("dobYear", e.target.value.replace(/\D/g, ""))} />
          </label>
        ) : (
          <input type="date" className={input} value={draft.dob} aria-label={t("fields.dob")}
            min="1900-01-01" max="2099-12-31" aria-describedby={describedBy("dob")}
            onChange={(e) => set("dob", e.target.value)} />
        )}
        {hint("dob")}
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("fields.parent_name")}</span>
        <input className={input} value={draft.parent_name} maxLength={MAX_NAME} autoComplete="off"
          aria-describedby={describedBy("parent_name")} onChange={(e) => set("parent_name", e.target.value)} />
        {hint("parent_name")}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("fields.gender")}</span>
        <select className={input} value={draft.gender} aria-describedby={describedBy("gender")}
          onChange={(e) => set("gender", e.target.value as Gender | "")}>
          <option value="">{t("fields.gender.none")}</option>
          <option value="M">{t("fields.gender.M")}</option>
          <option value="F">{t("fields.gender.F")}</option>
          <option value="O">{t("fields.gender.O")}</option>
        </select>
        {hint("gender")}
      </label>

      {error && <Alert variant="destructive" role="alert">{error}</Alert>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit">{submitLabel}</Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>{t("add.cancel")}</Button>}
      </div>
    </form>
  );
}
