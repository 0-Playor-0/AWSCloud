// On-device OCR. The worker, WASM core, and language model are self-hosted;
// the source image never leaves the browser.
import type { Worker } from 'tesseract.js';

export interface RecognizedLine {
  text: string;
  confidence: number | null;
}

const SIMD_PROBE = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15,
  253, 98, 11,
]);

const asset = (path: string) =>
  new URL(`${import.meta.env.BASE_URL}ocr/${__OCR_DIR__}/${path}`, window.location.href).href;

function assets() {
  const core = WebAssembly.validate(SIMD_PROBE)
    ? 'tesseract-core-simd-lstm.wasm.js'
    : 'tesseract-core-lstm.wasm.js';
  return {
    worker: asset('worker.min.js'),
    core: asset(`core/${core}`),
    lang: asset('lang/eng.traineddata.gz'),
  };
}

let worker: Promise<Worker> | null = null;
let progressListener: ((progress: number) => void) | null = null;

function getWorker(): Promise<Worker> {
  const { worker: workerPath, core, lang } = assets();
  worker ??= import('tesseract.js').then(({ createWorker, OEM }) =>
    createWorker('eng', OEM.LSTM_ONLY, {
      workerPath,
      corePath: core,
      langPath: lang.slice(0, lang.lastIndexOf('/')),
      cacheMethod: 'none',
      workerBlobURL: false,
      logger: (message: { status: string; progress: number }) => {
        if (message.status === 'recognizing text') progressListener?.(message.progress);
      },
    }),
  );
  worker.catch(() => {
    worker = null;
  });
  return worker;
}

export async function readLines(
  image: Blob,
  onProgress?: (progress: number) => void,
): Promise<RecognizedLine[]> {
  progressListener = onProgress ?? null;
  try {
    const activeWorker = await getWorker();
    const { data } = await activeWorker.recognize(image, {}, { blocks: true, text: true });
    const lines = (data.blocks ?? []).flatMap((block) =>
      block.paragraphs.flatMap((paragraph) => paragraph.lines),
    );
    if (lines.length === 0) {
      return data.text.split('\n').map((text) => ({ text, confidence: null }));
    }
    return lines.map((line) => ({
      text: line.text.replace(/\n$/, ''),
      confidence: line.confidence / 100,
    }));
  } finally {
    progressListener = null;
  }
}
