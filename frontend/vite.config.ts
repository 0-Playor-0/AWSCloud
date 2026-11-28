import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

import { OCR_DIR } from './scripts/ocr-dir.mjs';

// Dev and preview proxy /v1 to the local API (scripts/local_api.py). Production builds call
// VITE_API_URL directly (CORS allows only the site's CloudFront origin).
const localApi = { '/v1': process.env.LOCAL_API ?? 'http://127.0.0.1:8787' };

export default defineConfig({
  define: { __OCR_DIR__: JSON.stringify(OCR_DIR) },
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, '.') } },
  build: {
    // Border illustrations stay separate, lazily loaded files; never base64 in the JS bundle.
    assetsInlineLimit: (file) => (file.endsWith('.webp') ? false : undefined),
  },
  test: { include: ['src/**/*.test.ts'] },
  server: { proxy: localApi },
  preview: { proxy: localApi },
});
