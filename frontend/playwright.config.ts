import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

// Three modes:
// - default: the local API (scripts/local_api.py, the real handler) behind the Vite dev server
// - E2E_API_URL: the local dev site calling a deployed API directly (tests CORS too)
// - E2E_BASE_URL: a deployed site (CloudFront) end to end
const py = process.env.PYTHON ?? fileURLToPath(new URL("../.venv/bin/python", import.meta.url));
const remote = process.env.E2E_BASE_URL;
const api = process.env.E2E_API_URL;
const devSite = { command: "npm run dev -- --port 5173 --strictPort", port: 5173, reuseExistingServer: false };

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: 0,
  timeout: 60_000, // the first on-device OCR loads ~7 MB of engine + model
  reporter: "list",
  // localhost (not 127.0.0.1) is the dev origin the API's CORS allows
  use: { ...devices["Pixel 7"], baseURL: remote ?? (api ? "http://localhost:5173" : "http://127.0.0.1:5173"), trace: "off" },
  webServer: remote
    ? undefined
    : api
      ? [{ ...devSite, env: { VITE_API_URL: api } }]
      : [{ command: `${py} ../scripts/local_api.py --port 8787`, port: 8787, reuseExistingServer: false }, devSite],
});
