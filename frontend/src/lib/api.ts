import type { Anchor, ApiErrorBody, CompareResponse, DocumentEntry, DocType, ExtractResponse, Purpose } from "./types";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiErrorBody; status: number };

const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const TIMEOUT_MS = 30_000;

function isErrorBody(x: unknown): x is { error: ApiErrorBody } {
  const e = (x as { error?: Record<string, unknown> } | null)?.error;
  return !!e && typeof e.code === "string" && typeof e.message === "string" && typeof e.hint === "string";
}

function clientError(code: "network" | "unexpected" | "throttled", status = 0): ApiResult<never> {
  return { ok: false, status, error: { code, message: "", hint: "" } };
}

/**
 * Classify a raw response. Exported for tests.
 * - contract error body → that error
 * - bare 429 (API Gateway throttling has no contract body) → throttled
 * - 2xx passing `valid` → data
 * - anything else → unexpected (generic retry message)
 */
export function classify<T>(status: number, body: unknown, valid: (b: unknown) => boolean): ApiResult<T> {
  if (status >= 200 && status < 300) {
    return valid(body) ? { ok: true, data: body as T } : clientError("unexpected", status);
  }
  if (isErrorBody(body)) return { ok: false, status, error: body.error };
  if (status === 429) return clientError("throttled", status);
  return clientError("unexpected", status);
}

async function request<T>(path: string, init: RequestInit, valid: (b: unknown) => boolean): Promise<ApiResult<T>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(BASE + path, { ...init, signal: ctrl.signal });
  } catch {
    clearTimeout(timer);
    return clientError("network");
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null; // non-JSON reply: classified below
  } finally {
    clearTimeout(timer);
  }
  return classify<T>(res.status, body, valid);
}

function postJson(body: unknown): RequestInit {
  return { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}

const isObj = (b: unknown): b is Record<string, unknown> => typeof b === "object" && b !== null;
const validExtract = (b: unknown) => isObj(b) && isObj(b.fields) && Array.isArray(b.warnings);
const validCompare = (b: unknown) =>
  isObj(b) && isObj(b.summary) && Array.isArray(b.findings) && Array.isArray(b.fix_plan);

/** POST /v1/extract with on-device OCR text only; retries once on 502 (HANDOFF.md section 5). */
export async function extract(docType: DocType, ocrLines: string[]): Promise<ApiResult<ExtractResponse>> {
  const init = postJson({ doc_type: docType, ocr_lines: ocrLines });
  const first = await request<ExtractResponse>("/v1/extract", init, validExtract);
  if (first.ok || first.status !== 502) return first;
  return request<ExtractResponse>("/v1/extract", init, validExtract);
}

export function compare(purpose: Purpose, docs: DocumentEntry[], anchor: Anchor | null): Promise<ApiResult<CompareResponse>> {
  const body = {
    purpose,
    documents: docs.map((d) => ({ doc_type: d.doc_type, fields: d.fields })),
    ...(anchor && Object.values(anchor).some(Boolean) ? { anchor } : {}),
  };
  return request<CompareResponse>("/v1/compare", postJson(body), validCompare);
}
