import { expect, type Page } from "@playwright/test";

/** A synthetic JPEG drawn in the browser (fictional text only). */
export async function syntheticJpeg(page: Page, width: number, height: number): Promise<Buffer> {
  const b64 = await page.evaluate(([w, h]) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#000";
    ctx.font = `${Math.round(h / 6)}px sans-serif`;
    ctx.fillText("SAMPLE RAVI KUMAR", 10, h / 3);
    ctx.fillText("DOB 14/03/2007", 10, (2 * h) / 3);
    return c.toDataURL("image/jpeg", 0.9).split(",")[1];
  }, [width, height]);
  return Buffer.from(b64, "base64");
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

export async function check(page: Page) {
  await page.getByRole("button", { name: "Check my documents" }).click();
  await expect(page.getByRole("heading", { name: "3. Your report" })).toBeVisible();
}
