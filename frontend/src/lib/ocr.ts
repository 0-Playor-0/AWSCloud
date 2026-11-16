// On-device OCR (HANDOFF.md 3): Tesseract.js, English, LSTM-only, loaded only when photo mode is
// used. Assets are self-hosted under /ocr/<version>/ (scripts/copy-ocr-assets.mjs) and served with
// long cache headers. downloadOcr() fetches exactly the files the worker will use, with byte
// progress, so the worker then reads them from the HTTP cache. Nothing is kept in browser storage.
import type { Worker } from "tesseract.js";

export interface OcrLine {
  text: string;
  confidence: number | null; // 0..1; null when the engine gave no per-line data
}

/** Approximate total of the files below, for the notice shown before the first download. */
export const OCR_DOWNLOAD_MB = 7;

// Smallest module using a SIMD instruction (same test as wasm-feature-detect).
const SIMD_PROBE = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11,
]);

const asset = (path: string) =>
  new URL(`${import.meta.env.BASE_URL}ocr/${__OCR_DIR__}/${path}`, window.location.href).href;

function assets() {
  const core = WebAssembly.validate(SIMD_PROBE) ? "tesseract-core-simd-lstm.wasm.js" : "tesseract-core-lstm.wasm.js";
  return { worker: asset("worker.min.js"), core: asset(`core/${core}`), lang: asset("lang/eng.traineddata.gz") };
}

/** True when every OCR file is already in the HTTP cache (so no download notice is needed). */
export async function ocrAssetsCached(): Promise<boolean> {
  try {
    const res = await Promise.all(
      Object.values(assets()).map((u) => fetch(u, { cache: "only-if-cached", mode: "same-origin" })),
    );
    return res.every((r) => r.ok);
  } catch {
    return false;
  }
}

/** Download the OCR files into the HTTP cache, reporting bytes received. */
export async function downloadOcr(onProgress: (loaded: number, total: number) => void): Promise<void> {
  const urls = Object.values(assets());
  const responses = await Promise.all(urls.map((u) => fetch(u)));
  if (responses.some((r) => !r.ok || !r.body)) throw new Error("ocr_download_failed");
  const sizes = responses.map((r) => Number(r.headers.get("content-length")) || 0);
  const total = sizes.every(Boolean) ? sizes.reduce((a, b) => a + b, 0) : OCR_DOWNLOAD_MB * 1024 * 1024;
  let loaded = 0;
  onProgress(0, total);
  await Promise.all(
    responses.map(async (r) => {
      const reader = r.body!.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        loaded += value.byteLength;
        onProgress(Math.min(loaded, total), total);
      }
    }),
  );
}

let worker: Promise<Worker> | null = null;
let listener: ((progress: number) => void) | null = null;

function getWorker(): Promise<Worker> {
  const { worker: workerPath, core, lang } = assets();
  worker ??= import("tesseract.js").then(({ createWorker, OEM }) =>
    createWorker("eng", OEM.LSTM_ONLY, {
      workerPath,
      corePath: core, // a .js path: used as-is, no SIMD guessing inside the worker
      langPath: lang.slice(0, lang.lastIndexOf("/")),
      cacheMethod: "none", // no IndexedDB copy; the HTTP cache holds the model
      workerBlobURL: false,
      logger: (m: { status: string; progress: number }) => {
        if (m.status === "recognizing text") listener?.(m.progress);
      },
    }),
  );
  worker.catch(() => {
    worker = null; // allow a retry after a failed load
  });
  return worker;
}

/** Read text lines (with confidence) from an image on this device. Nothing leaves the browser. */
export async function readLines(image: Blob, onProgress?: (progress: number) => void): Promise<OcrLine[]> {
  listener = onProgress ?? null;
  try {
    const w = await getWorker();
    const { data } = await w.recognize(image, {}, { blocks: true, text: true });
    const lines = (data.blocks ?? []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines));
    if (lines.length === 0) return data.text.split("\n").map((text) => ({ text, confidence: null }));
    return lines.map((l) => ({ text: l.text.replace(/\n$/, ""), confidence: l.confidence / 100 }));
  } finally {
    listener = null;
  }
}
