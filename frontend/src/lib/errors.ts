import { hasKey, t } from "./strings";
import type { ApiErrorBody } from "./types";

export interface ShownError {
  code: string;
  message: string;
  hint: string;
}

/** User-facing text for an API error: our own strings for known codes, the server's otherwise. */
export function describeError(err: ApiErrorBody): ShownError {
  const m = `error.${err.code}.message`;
  const h = `error.${err.code}.hint`;
  if (hasKey(m) && hasKey(h)) return { code: err.code, message: t(m), hint: t(h) };
  if (err.message) return { code: err.code, message: err.message, hint: err.hint };
  return { code: "unexpected", message: t("error.unexpected.message"), hint: t("error.unexpected.hint") };
}
