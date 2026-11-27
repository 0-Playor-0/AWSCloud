import { createContext, useContext } from "react";

import type { Locale } from "./strings";

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

export interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}

export function useT(): TFunction {
  return useLanguage().t;
}
