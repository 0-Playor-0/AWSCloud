import en from "../strings/en.json";
import hi from "../strings/hi.json";
import mr from "../strings/mr.json";

export type StringKey = keyof typeof en;
export type Locale = "en" | "hi" | "mr";

const tables: Record<Locale, Record<string, string>> = {
  en,
  hi,
  mr,
};

function interpolate(value: string, vars: Record<string, string | number>): string {
  return value.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

/** Look up an English UI string and fill {placeholders}. */
export function t(key: StringKey, vars: Record<string, string | number> = {}): string {
  return interpolate(en[key], vars);
}

/** Look up a UI string in the requested language, falling back to English and then the key. */
export function translate(locale: Locale, key: string, vars: Record<string, string | number> = {}): string {
  const value = tables[locale]?.[key] ?? en[key as StringKey] ?? key;
  return interpolate(value, vars);
}

/** For keys built at runtime (e.g. `doc.${type}`); falls back to the key itself. */
export function tKey(key: string, vars: Record<string, string | number> = {}): string {
  return key in en ? t(key as StringKey, vars) : key;
}

export function hasKey(key: string): key is StringKey {
  return key in en;
}

export const REPO_URL = "https://github.com/0-Playor-0/AWSCloud";
