import { expect, test } from "@playwright/test";

import { addTyped, check, startGeneral, syntheticJpeg } from "./helpers";

test("sample flow: load a sample set and get a report", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Load Kavya's sample set" }).click();
  await expect(page.getByText("3 of 6 documents added")).toBeVisible();
  await check(page);
  await expect(page.getByTestId("report-status")).toHaveText("Mismatches found");
  await expect(page.getByRole("heading", { name: "Fix plan" })).toBeVisible();
  await expect(page.getByText(/Self-check only. Not legal advice./)).toBeVisible();
});

test("typed flow with an anchor updates the fix plan", async ({ page }) => {
  await startGeneral(page);
  await addTyped(page, "Aadhaar", "K RAVI", "2007-03-14");
  await addTyped(page, "PAN card", "RAVI KUMAR", "2007-03-14");
  await check(page);
  await expect(page.getByTestId("report-status")).toHaveText("Mismatches found");
  await expect(page.locator("[data-severity=risky]")).toHaveCount(1);
  await expect(page.getByText(/Decide which document shows your correct name/)).toBeVisible();
  await page.getByLabel("Correct name is on").selectOption({ label: "Aadhaar" });
  await page.getByRole("button", { name: "Update fix plan" }).click();
  await expect(page.getByText(/Decide which document/)).toHaveCount(0);
});

test("all match", async ({ page }) => {
  await startGeneral(page);
  await addTyped(page, "PAN card", "ASHA RAO", "2001-01-09");
  await addTyped(page, "Passport", "ASHA RAO", "2001-01-09");
  await check(page);
  await expect(page.getByTestId("report-status")).toHaveText("Everything matches");
});

test("photo flow: consent, exact preview, extract, confirm", async ({ page }) => {
  await startGeneral(page);
  await page.getByRole("button", { name: "+ Add a document" }).click();
  await expect(page.getByText(/leave out the Aadhaar number, your photo and the QR code/)).toBeVisible();
  await page.getByLabel("Choose or take a photo").setInputFiles({
    name: "card.jpg", mimeType: "image/jpeg", buffer: await syntheticJpeg(page, 1800, 1200),
  });
  await page.getByRole("button", { name: "Use this crop" }).click();
  const preview = page.getByTestId("upload-preview");
  await expect(preview).toBeVisible();
  const size = await preview.evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]);
  expect(Math.max(...size)).toBeLessThanOrEqual(1600);

  let extractCalls = 0;
  page.on("request", (r) => { if (r.url().includes("/v1/extract")) extractCalls += 1; });
  await page.getByRole("button", { name: "Read the text" }).click();
  const dialog = page.getByRole("dialog", { name: "Before you upload" });
  await expect(dialog).toBeVisible();
  expect(extractCalls).toBe(0); // nothing sent before consent
  await dialog.getByRole("button", { name: "I understand" }).click();

  await expect(page.getByText("Check what we read.")).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveValue("RAVI KUMAR K");
  await page.getByRole("button", { name: "Add document" }).click();
  await expect(page.getByText("from photo")).toBeVisible();

  // Consent is remembered for the session: the second upload goes straight through.
  await page.getByRole("button", { name: "+ Add a document" }).click();
  await page.getByLabel("Document type").selectOption({ label: "PAN card" });
  await page.getByLabel("Choose or take a photo").setInputFiles({
    name: "pan.jpg", mimeType: "image/jpeg", buffer: await syntheticJpeg(page, 900, 600),
  });
  await page.getByRole("button", { name: "Use this crop" }).click();
  await page.getByRole("button", { name: "Read the text" }).click();
  await expect(page.getByLabel("Full name")).toHaveValue("RAVI KUMAR");
  await page.getByRole("button", { name: "Add document" }).click();
  await check(page);
  await expect(page.getByTestId("report-status")).not.toBeEmpty();
});

test("id_number_detected asks for a new crop", async ({ page }) => {
  await startGeneral(page);
  await page.getByRole("button", { name: "+ Add a document" }).click();
  // The local API reads crops 200–299 px wide as containing a synthetic 12-digit number.
  await page.getByLabel("Choose or take a photo").setInputFiles({
    name: "narrow.jpg", mimeType: "image/jpeg", buffer: await syntheticJpeg(page, 250, 400),
  });
  await page.getByRole("button", { name: "Use this crop" }).click();
  await page.getByRole("button", { name: "Read the text" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "I understand" }).click();
  const alert = page.locator("[data-error-code=id_number_detected]");
  await expect(alert).toContainText("seems to include an ID number");
  await expect(page.getByTestId("upload-preview")).toHaveCount(0); // back to cropping
});

test("unreadable crop", async ({ page }) => {
  await startGeneral(page);
  await page.getByRole("button", { name: "+ Add a document" }).click();
  await page.getByLabel("Choose or take a photo").setInputFiles({
    name: "tiny.jpg", mimeType: "image/jpeg", buffer: await syntheticJpeg(page, 150, 300),
  });
  await page.getByRole("button", { name: "Use this crop" }).click();
  await page.getByRole("button", { name: "Read the text" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "I understand" }).click();
  await expect(page.locator("[data-error-code=unreadable]")).toBeVisible();
});

test("consent declined sends nothing", async ({ page }) => {
  await startGeneral(page);
  await page.getByRole("button", { name: "+ Add a document" }).click();
  await page.getByLabel("Choose or take a photo").setInputFiles({
    name: "card.jpg", mimeType: "image/jpeg", buffer: await syntheticJpeg(page, 900, 600),
  });
  await page.getByRole("button", { name: "Use this crop" }).click();
  let sent = false;
  page.on("request", (r) => { if (r.url().includes("/v1/extract")) sent = true; });
  await page.getByRole("button", { name: "Read the text" }).click();
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(sent).toBe(false);
});

for (const [name, status, body, code, text] of [
  ["bare API Gateway 429", 429, '{"message":"Too Many Requests"}', "throttled", "Too many requests right now."],
  ["non-contract 503", 503, "<html>Service Unavailable</html>", "unexpected", "The service sent an unexpected reply."],
  ["contract 400", 400, '{"error":{"code":"invalid_request","message":"x","hint":"y"}}', "invalid_request", "Some details could not be accepted."],
] as const) {
  test(`compare error: ${name}`, async ({ page }) => {
    await page.route("**/v1/compare", (r) => r.fulfill({ status, body, contentType: "application/json" }));
    await page.goto("/");
    await page.getByRole("button", { name: "Load Arjun's sample set" }).click();
    await page.getByRole("button", { name: "Check my documents" }).click();
    const alert = page.locator(`[data-error-code=${code}]`);
    await expect(alert).toContainText(text);
    await page.unroute("**/v1/compare");
    await alert.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByTestId("report-status")).toHaveText("Small differences only");
  });
}

test("validation: needs at least one field and two documents", async ({ page }) => {
  await startGeneral(page);
  await expect(page.getByRole("button", { name: "Check my documents" })).toBeDisabled();
  await page.getByRole("button", { name: "+ Add a document" }).click();
  await page.getByRole("tab", { name: "Type it" }).click();
  await page.getByRole("tabpanel").getByRole("button", { name: "Add document" }).click();
  await expect(page.getByRole("alert")).toHaveText("Fill in at least one field.");
});

test("no horizontal scroll on a phone", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
