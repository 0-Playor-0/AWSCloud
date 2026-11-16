// Self-host the OCR engine (HANDOFF.md 3/4): copy Tesseract.js worker, LSTM-only cores and the
// English model from node_modules into public/ocr/ so the site never loads a third-party CDN.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nm = join(root, "node_modules");
const out = join(root, "public", "ocr");
const files = [
  ["tesseract.js/dist/worker.min.js", "worker.min.js"],
  ...["", "-simd", "-relaxedsimd"].map((v) => [
    `tesseract.js-core/tesseract-core${v}-lstm.wasm.js`, `core/tesseract-core${v}-lstm.wasm.js`,
  ]),
  ["@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", "lang/eng.traineddata.gz"],
];
for (const [from, to] of files) {
  mkdirSync(dirname(join(out, to)), { recursive: true });
  copyFileSync(join(nm, from), join(out, to));
}
console.log(`ocr assets: ${files.length} files -> public/ocr`);
