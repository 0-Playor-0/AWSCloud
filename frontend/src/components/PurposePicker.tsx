import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PERSONAS, type Persona } from "@/lib/samples";
import { useT } from "@/lib/language-context";
import { PURPOSES, type Purpose } from "@/lib/types";

interface Props {
  value: Purpose;
  onChange: (p: Purpose) => void;
  onContinue: () => void;
  onSampleSet: (p: Persona) => void;
}

export function PurposePicker({ value, onChange, onContinue, onSampleSet }: Props) {
  const t = useT();
  return (
    <section aria-labelledby="purpose-title" className="flex flex-col gap-4">
      <h3 id="purpose-title" tabIndex={-1} className="display text-3xl focus:outline-none">{t("step.purpose")}</h3>
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">{t("step.purpose")}</legend>
        {PURPOSES.map((p) => (
          <label key={p} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-ink/20 bg-white p-3 has-[:checked]:border-ink has-[:checked]:ring-1 has-[:checked]:ring-ink">
            <input type="radio" name="purpose" value={p} checked={value === p} className="mt-1 size-5"
              onChange={() => onChange(p)} />
            <span>
              <span className="block font-medium">{t(`purpose.${p}`)}</span>
              <span className="block text-sm text-ink/70">{t(`purpose.${p}.desc`)}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <Button size="lg" onClick={onContinue}>{t("purpose.continue")}</Button>

      <Card>
        <CardHeader>
          <CardTitle>{t("purpose.trySample")}</CardTitle>
          <CardDescription>{t("sample.notice")}</CardDescription>
        </CardHeader>
        <CardContent>
          {PERSONAS.map((p) => (
            <div key={p.id} className="flex flex-col gap-1 border-t border-ink/10 pt-3 first:border-0 first:pt-0">
              <p className="text-sm text-ink/80">{t(p.storyKey)}</p>
              <Button variant="outline" onClick={() => onSampleSet(p)}>
                {t("sample.addSet", { persona: p.name })}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
