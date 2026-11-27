import type { OcrLine } from "./ocr";
import type { Anchor, ApiErrorBody, CompareResponse, DocumentEntry, DocType, ExtractResponse, Purpose } from "./types";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiErrorBody; status: number };

const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const TIMEOUT_MS = 30_000;
/** One automatic retry after this pause (plus up to 50% jitter) on a busy reply (HANDOFF.md 5). */
export const RETRY_BACKOFF_MS = 800;

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

/**
 * Busy replies worth one quiet retry: 503 (Lambda at its concurrency limit) and a throttled 429
 * (bare from API Gateway or in contract shape). Never daily_cap_reached, which is also a 429.
 * /v1/extract also retries a 502 (extractor_failed) once.
 */
export function isRetryable(r: ApiResult<unknown>, alsoRetry502 = false): boolean {
  if (r.ok) return false;
  return r.status === 503 || r.error.code === "throttled" || (alsoRetry502 && r.status === 502);
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestWithRetry<T>(
  path: string, init: RequestInit, valid: (b: unknown) => boolean, alsoRetry502 = false,
): Promise<ApiResult<T>> {
  const first = await request<T>(path, init, valid);
  if (!isRetryable(first, alsoRetry502)) return first;
  await pause(RETRY_BACKOFF_MS * (1 + Math.random() * 0.5));
  return request<T>(path, init, valid);
}

function postJson(body: unknown): RequestInit {
  return { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}

const isObj = (b: unknown): b is Record<string, unknown> => typeof b === "object" && b !== null;
const validExtract = (b: unknown) => isObj(b) && isObj(b.fields) && Array.isArray(b.warnings);
const validCompare = (b: unknown) =>
  isObj(b) && isObj(b.summary) && Array.isArray(b.findings) && Array.isArray(b.fix_plan)
  && Array.isArray(b.guidance);

/** POST /v1/extract with on-device OCR text only; one retry on 502, 503 or throttled. */
export async function extract(docType: DocType, lines: OcrLine[]): Promise<ApiResult<ExtractResponse>> {
  const confidence = lines.map((l) => l.confidence);
  const init = postJson({
    doc_type: docType,
    ocr_lines: lines.map((l) => l.text),
    // only when every line has one (contract: same length as ocr_lines)
    ...(confidence.every((c) => c !== null) ? { ocr_confidence: confidence.map((c) => Math.round(c * 100) / 100) } : {}),
  });
  return requestWithRetry<ExtractResponse>("/v1/extract", init, validExtract, true);
}

export function compare(purpose: Purpose, docs: DocumentEntry[], anchor: Anchor | null): Promise<ApiResult<CompareResponse>> {
  const body = {
    purpose,
    documents: docs.map((d) => ({ doc_type: d.doc_type, fields: d.fields })),
    ...(anchor && Object.values(anchor).some(Boolean) ? { anchor } : {}),
  };
  return requestWithRetry<CompareResponse>("/v1/compare", postJson(body), validCompare);
}

export interface Stats {
  checks: number;
  checks_with_mismatch: number;
}

export function stats(): Promise<ApiResult<Stats>> {
  return requestWithRetry<Stats>("/v1/stats", { method: "GET" }, (b) => isObj(b) && typeof b.checks === "number");
}
