import { expect, type Page, type Request } from "@playwright/test";

/** A synthetic card image drawn in the browser (fictional text only). */
export async function syntheticJpeg(page: Page, lines: string[], width = 1200, height = 900): Promise<Buffer> {
  const b64 = await page.evaluate(([ls, w, h]) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#000";
    const size = Math.round(h / (ls.length * 2 + 1));
    ctx.font = `bold ${size}px Arial, sans-serif`;
    ls.forEach((l, i) => ctx.fillText(l, 60, size * (2 * i + 1.6)));
    return c.toDataURL("image/jpeg", 0.95).split(",")[1];
  }, [lines, width, height] as const);
  return Buffer.from(b64, "base64");
}

export const CARD_LINES = ["SAMPLE CARD", "Ravi Kumar K", "DOB: 14/03/2007", "MALE"];

/** Records every request so tests can assert nothing image-like or third-party is sent. */
export function watchRequests(page: Page): Request[] {
  const seen: Request[] = [];
  page.on("request", (r) => seen.push(r));
  return seen;
}

const IMAGE_MARKERS = [/data:image\//, /\/9j\//, /iVBORw0KGgo/, /[A-Za-z0-9+/=]{400,}/];

/** Our own origins: the site, plus the API when it is deployed separately (E2E_API_URL). */
export function ownOrigins(siteOrigin: string): string[] {
  const api = process.env.E2E_API_URL;
  return api ? [siteOrigin, new URL(api).origin] : [siteOrigin];
}

export function assertNoImageData(requests: Request[], origin: string) {
  const allowed = ownOrigins(origin);
  for (const r of requests) {
    expect(allowed, `third-party request: ${r.url()}`).toContain(new URL(r.url()).origin);
    const body = r.postData();
    if (!body) continue;
    expect(body.length, `large request body to ${r.url()}`).toBeLessThan(8_000);
    for (const m of IMAGE_MARKERS) expect(body, `image-like data sent to ${r.url()}`).not.toMatch(m);
  }
}

export async function startGeneral(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "2. Add your documents" })).toBeVisible();
}

export async function addTyped(page: Page, docType: string, name: string, dob: string) {
  await page.getByRole("button", { name: "+ Add a document" }).click();
  await page.getByLabel("Document type").selectOption({ label: docType });
  await page.getByRole("tab", { name: "Type it" }).click();
  const panel = page.getByRole("tabpanel");
  await panel.getByLabel("Full name").fill(name);
  await panel.getByLabel("Date of birth", { exact: true }).fill(dob);
  await panel.getByRole("button", { name: "Add document" }).click();
}

export async function pickAndRead(page: Page, lines: string[], docType = "Aadhaar") {
  await page.getByRole("button", { name: "+ Add a document" }).click();
  await page.getByLabel("Document type").selectOption({ label: docType });
  await page.getByLabel("Choose or take a photo").setInputFiles({
    name: "card.jpg", mimeType: "image/jpeg", buffer: await syntheticJpeg(page, lines),
  });
  // Zoom out fully is the default; a 4:3 crop keeps the whole synthetic card.
  await page.getByRole("button", { name: "4 : 3" }).click();
  await page.getByRole("button", { name: /Read this crop|and read$/ }).click();
}

export async function check(page: Page) {
  await page.getByRole("button", { name: "Check my documents" }).click();
  await expect(page.getByRole("heading", { name: "3. Your report" })).toBeVisible();
}
