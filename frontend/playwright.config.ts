import { defineConfig, devices } from "@playwright/test";

// Phase 3: runs against the local API (scripts/local_api.py, the real handler with fake AWS).
// E2E_BASE_URL points the "default" project at a deployed site instead (Phase 5).
const py = process.env.PYTHON ?? "../.venv/bin/python";
const remote = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: { ...devices["Pixel 7"], trace: "off" },
  projects: [
    { name: "default", testIgnore: /cap-zero/, use: { baseURL: remote ?? "http://127.0.0.1:5173" } },
    { name: "cap-zero", testMatch: /cap-zero/, use: { baseURL: "http://127.0.0.1:5174" } },
  ],
  webServer: remote
    ? undefined
    : [
        { command: `${py} ../scripts/local_api.py --port 8787 --cap 300`, port: 8787, reuseExistingServer: false },
        { command: `${py} ../scripts/local_api.py --port 8788 --cap 0`, port: 8788, reuseExistingServer: false },
        { command: "npx vite --port 5173 --strictPort", port: 5173, reuseExistingServer: false },
        {
          command: "npx vite --port 5174 --strictPort",
          port: 5174,
          env: { LOCAL_API: "http://127.0.0.1:8788" },
          reuseExistingServer: false,
        },
      ],
});
