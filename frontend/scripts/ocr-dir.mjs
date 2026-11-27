// Versioned folder name for the self-hosted OCR assets.
import { readFileSync } from 'node:fs';

const version = (pkg) =>
  JSON.parse(readFileSync(new URL(`../node_modules/${pkg}/package.json`, import.meta.url))).version;

export const OCR_DIR = `t${version('tesseract.js')}-c${version('tesseract.js-core')}-e${version('@tesseract.js-data/eng')}`;
