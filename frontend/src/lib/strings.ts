import en from "../strings/en.json";

export type StringKey = keyof typeof en;

const table: Record<string, string> = en;

/** Look up a UI string and fill {placeholders}. */
export function t(key: StringKey, vars: Record<string, string | number> = {}): string {
  return table[key].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

/** For keys built at runtime (e.g. `doc.${type}`); falls back to the key itself. */
export function tKey(key: string, vars: Record<string, string | number> = {}): string {
  return key in table ? t(key as StringKey, vars) : key;
}

export function hasKey(key: string): key is StringKey {
  return key in table;
}

export const REPO_URL = "https://github.com/0-Playor-0/AWSCloud";
