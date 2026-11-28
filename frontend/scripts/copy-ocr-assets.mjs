// Copy the Tesseract worker, LSTM-only cores, and English model into a versioned
// self-hosted folder. No CDN or third-party font/model request is needed.
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { OCR_DIR } from './ocr-dir.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const modules = join(root, 'node_modules');
const base = join(root, 'public', 'ocr');
const output = join(base, OCR_DIR);
const files = [
  ['tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['tesseract.js-core/tesseract-core-lstm.wasm.js', 'core/tesseract-core-lstm.wasm.js'],
  ['tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'core/tesseract-core-simd-lstm.wasm.js'],
  ['@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'lang/eng.traineddata.gz'],
];

rmSync(base, { recursive: true, force: true });
for (const [from, to] of files) {
  mkdirSync(dirname(join(output, to)), { recursive: true });
  copyFileSync(join(modules, from), join(output, to));
}
console.log(`ocr assets: ${files.length} files -> public/ocr/${OCR_DIR}`);
