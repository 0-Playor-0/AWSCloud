import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

// Default: the local API (scripts/local_api.py, the real handler) behind the Vite dev server.
// E2E_BASE_URL points the suite at a deployed site instead.
const py = process.env.PYTHON ?? fileURLToPath(new URL("../.venv/bin/python", import.meta.url));
const remote = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: 0,
  timeout: 60_000, // the first on-device OCR loads ~7 MB of engine + model
  reporter: "list",
  use: { ...devices["Pixel 7"], baseURL: remote ?? "http://127.0.0.1:5173", trace: "off" },
  webServer: remote
    ? undefined
    : [
        { command: `${py} ../scripts/local_api.py --port 8787`, port: 8787, reuseExistingServer: false },
        { command: "npm run dev -- --port 5173 --strictPort", port: 5173, reuseExistingServer: false },
      ],
});
