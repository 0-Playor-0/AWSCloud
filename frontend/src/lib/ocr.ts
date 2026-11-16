// On-device OCR (HANDOFF.md 3): Tesseract.js, English, LSTM-only, loaded only when photo mode is
// used. All assets are self-hosted under /ocr/ (copied by scripts/copy-ocr-assets.mjs).
import type { Worker } from "tesseract.js";

export interface OcrProgress {
  status: string;
  progress: number; // 0..1
}

let worker: Promise<Worker> | null = null;
let listener: ((p: OcrProgress) => void) | null = null;

const asset = (path: string) => new URL(`${import.meta.env.BASE_URL}ocr/${path}`, window.location.href).href;

function getWorker(): Promise<Worker> {
  worker ??= import("tesseract.js").then(({ createWorker, OEM }) =>
    createWorker("eng", OEM.LSTM_ONLY, {
      workerPath: asset("worker.min.js"),
      corePath: asset("core"),
      langPath: asset("lang"),
      workerBlobURL: false,
      logger: (m: { status: string; progress: number }) => listener?.(m),
    }),
  );
  worker.catch(() => {
    worker = null; // allow a retry after a failed load
  });
  return worker;
}

/** Read text lines from an image on this device. Nothing leaves the browser. */
export async function readLines(image: Blob, onProgress?: (p: OcrProgress) => void): Promise<string[]> {
  listener = onProgress ?? null;
  try {
    const w = await getWorker();
    const { data } = await w.recognize(image);
    return data.text.split("\n");
  } finally {
    listener = null;
  }
}
