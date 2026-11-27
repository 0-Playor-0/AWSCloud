import { hasKey, translate, type Locale } from "./strings";
import type { ApiErrorBody } from "./types";

export interface ShownError {
  code: string;
  message: string;
  hint: string;
}

/** User-facing text for an API error: our own strings for known codes, the server's otherwise. */
export function describeError(err: ApiErrorBody, locale: Locale = "en"): ShownError {
  const m = `error.${err.code}.message`;
  const h = `error.${err.code}.hint`;
  if (hasKey(m) && hasKey(h)) {
    return { code: err.code, message: translate(locale, m), hint: translate(locale, h) };
  }
  if (err.message) return { code: err.code, message: err.message, hint: err.hint };
  return {
    code: "unexpected",
    message: translate(locale, "error.unexpected.message"),
    hint: translate(locale, "error.unexpected.hint"),
  };
}
