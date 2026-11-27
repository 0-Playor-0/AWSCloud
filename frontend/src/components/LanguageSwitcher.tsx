import { useLanguage } from "@/lib/language-context";
import type { Locale } from "@/lib/strings";

const LANGUAGES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "mr", label: "मराठी" },
];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();
  return (
    <label className="flex shrink-0 items-center gap-1">
      <span className="sr-only">{t("language.label")}</span>
      <span aria-hidden="true" className="font-mono text-xs text-ink/70">{t("language.short")}</span>
      <select
        className="min-h-11 rounded-md border border-ink/25 bg-white px-2 py-1 text-xs font-medium"
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {LANGUAGES.map((language) => (
          <option key={language.value} value={language.value}>{language.label}</option>
        ))}
      </select>
    </label>
  );
}
