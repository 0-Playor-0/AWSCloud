import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

import { OCR_DIR } from "./scripts/ocr-dir.mjs";

// Dev: /v1 is proxied to the local API (scripts/local_api.py). Production builds call
// VITE_API_URL directly (CORS is restricted to the site's origin in template.yaml).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { __OCR_DIR__: JSON.stringify(OCR_DIR) },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"] },
  server: { proxy: { "/v1": process.env.LOCAL_API ?? "http://127.0.0.1:8787" } },
  preview: { proxy: { "/v1": process.env.LOCAL_API ?? "http://127.0.0.1:8787" } },
});
