// Self-host the OCR engine (HANDOFF.md 3/4): copy the Tesseract.js worker, the two LSTM-only
// cores (SIMD and plain) and the English model from node_modules into a versioned folder,
// public/ocr/<dir>/, so the files can be cached for a year and the site never loads a CDN.
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { OCR_DIR } from "./ocr-dir.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nm = join(root, "node_modules");
const base = join(root, "public", "ocr");
const out = join(base, OCR_DIR);
const files = [
  ["tesseract.js/dist/worker.min.js", "worker.min.js"],
  ["tesseract.js-core/tesseract-core-lstm.wasm.js", "core/tesseract-core-lstm.wasm.js"],
  ["tesseract.js-core/tesseract-core-simd-lstm.wasm.js", "core/tesseract-core-simd-lstm.wasm.js"],
  ["@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", "lang/eng.traineddata.gz"],
];
rmSync(base, { recursive: true, force: true }); // drop folders of older versions
for (const [from, to] of files) {
  mkdirSync(dirname(join(out, to)), { recursive: true });
  copyFileSync(join(nm, from), join(out, to));
}
console.log(`ocr assets: ${files.length} files -> public/ocr/${OCR_DIR}`);
