import { FieldForm } from "@/components/FieldForm";
import { Button } from "@/components/ui/button";
import { docLabel } from "@/lib/labels";
import { useT } from "@/lib/language-context";
import type { DocFields, DocumentEntry } from "@/lib/types";

interface Props {
  docs: DocumentEntry[];
  editingId: string | null;
  onEdit: (id: string | null) => void;
  onSave: (id: string, fields: DocFields) => void;
  onRemove: (id: string) => void;
}

export function DocumentList({ docs, editingId, onEdit, onSave, onRemove }: Props) {
  const t = useT();
  if (docs.length === 0) return <p className="text-sm text-ink/70">{t("docs.empty")}</p>;
  return (
    <ul className="flex flex-col gap-2" aria-label={t("step.documents")}>
      {docs.map((d) => {
        const label = docLabel(d.doc_type, t);
        return (
          <li key={d.id} className="rounded-md border border-ink/20 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {label} <span className="text-xs font-normal text-ink/70">· {t(`docs.source.${d.source}`)}</span>
                </p>
                <p className="break-all font-mono text-sm">
                  {[d.fields.name, d.fields.dob, d.fields.parent_name, d.fields.gender].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="sm" variant="outline" aria-label={t("docs.edit", { doc: label })}
                  onClick={() => onEdit(editingId === d.id ? null : d.id)}>✎</Button>
                <Button size="sm" variant="outline" aria-label={t("docs.remove", { doc: label })}
                  onClick={() => onRemove(d.id)}>✕</Button>
              </div>
            </div>
            {editingId === d.id && (
              <div className="mt-3 border-t border-ink/10 pt-3">
                <FieldForm initial={d.fields} title={t("fields.typeTitle")} submitLabel={t("fields.update")}
                  onSubmit={(f) => onSave(d.id, f)} onCancel={() => onEdit(null)} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
