import { expect, test } from "@playwright/test";

import { addTyped, assertNoImageData, CARD_LINES, check, pickAndRead, startGeneral, watchRequests } from "./helpers";

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

test("photo flow: on-device OCR, numbers stripped, consent, text only sent", async ({ page, baseURL }) => {
  const requests = watchRequests(page);
  await startGeneral(page);
  await pickAndRead(page, [...CARD_LINES, "9999 9999 9999"]);
  await expect(page.getByTestId("crop-preview")).toBeVisible();
  const lines = page.getByTestId("ocr-lines");
  await expect(lines).toContainText("Ravi Kumar", { timeout: 45_000 });
  await expect(lines).not.toContainText("9999");
  await expect(page.getByText(/We removed 1 long number/)).toBeVisible();
  expect(requests.filter((r) => r.url().includes("/v1/extract"))).toHaveLength(0); // nothing sent yet

  await page.getByRole("button", { name: "Send this text" }).click();
  const dialog = page.getByRole("dialog", { name: "Before you send" });
  await expect(dialog).toContainText("Your photo never leaves your phone. Only the text read from it is sent. It is processed on AWS in Sydney, Australia, and not stored.");
  expect(requests.filter((r) => r.url().includes("/v1/extract"))).toHaveLength(0);
  const extractReq = page.waitForRequest("**/v1/extract");
  await dialog.getByRole("button", { name: "I understand" }).click();
  const body = JSON.parse((await extractReq).postData()!);
  expect(Object.keys(body).sort()).toEqual(["doc_type", "ocr_confidence", "ocr_lines"]);
  expect(body.ocr_lines.join(" ")).not.toMatch(/\d{9,}|\d{4}\s\d{4}\s\d{4}/);

  await expect(page.getByText("Check what we read.")).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveValue(/RAVI KUMAR/);
  await page.getByRole("button", { name: "Add document" }).click();
  await expect(page.getByText("from photo")).toBeVisible();

  // Consent is remembered for the session: the second send goes straight through.
  await pickAndRead(page, ["SAMPLE CARD", "Name: RAVI KUMAR", "DOB: 14/03/2007"], "Bank passbook");
  await expect(page.getByTestId("ocr-lines")).toContainText("RAVI", { timeout: 45_000 });
  await page.getByRole("button", { name: "Send this text" }).click();
  await expect(page.getByText("Check what we read.")).toBeVisible();
  await page.getByRole("button", { name: "Add document" }).click();
  await check(page);
  await expect(page.getByTestId("report-status")).not.toBeEmpty();

  assertNoImageData(requests, new URL(baseURL!).origin);
});

test("first OCR use: size notice, download progress, typed alternative", async ({ page }) => {
  await startGeneral(page);
  await page.getByRole("button", { name: "+ Add a document" }).click();
  const notice = page.getByTestId("ocr-download-notice");
  await expect(notice).toContainText("one-time download of about 7 MB");
  await notice.getByRole("button", { name: "Type it instead" }).click();
  await expect(page.getByRole("tab", { name: "Type it" })).toHaveAttribute("data-state", "active");

  await page.getByRole("tab", { name: "Photo" }).click();
  const { syntheticJpeg } = await import("./helpers");
  await page.getByLabel("Choose or take a photo").setInputFiles({
    name: "card.jpg", mimeType: "image/jpeg", buffer: await syntheticJpeg(page, CARD_LINES),
  });
  await page.getByRole("button", { name: "4 : 3" }).click();
  const ocrFiles: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/ocr/")) ocrFiles.push(new URL(r.url()).pathname); });
  await page.getByRole("button", { name: "Download (about 7 MB, one time) and read" }).click();
  await expect(page.getByTestId("ocr-progress")).toContainText(/Downloading|Reading/);
  await expect(page.getByTestId("ocr-lines")).toContainText("Ravi", { timeout: 45_000 });
  expect(ocrFiles.some((f) => /\/ocr\/t[\d.]+-c[\d.]+-e[\d.]+\/lang\/eng\.traineddata\.gz$/.test(f))).toBe(true);

  const req = page.waitForRequest("**/v1/extract");
  await page.getByRole("button", { name: "Send this text" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "I understand" }).click();
  const body = JSON.parse((await req).postData()!);
  expect(body.ocr_confidence).toHaveLength(body.ocr_lines.length);
  expect(body.ocr_confidence.every((c: number) => c >= 0 && c <= 1)).toBe(true);
});

test("unticked lines are not sent", async ({ page }) => {
  await startGeneral(page);
  await pickAndRead(page, CARD_LINES);
  const lines = page.getByTestId("ocr-lines");
  await expect(lines).toContainText("SAMPLE", { timeout: 45_000 });
  await lines.getByRole("listitem").filter({ hasText: "SAMPLE" }).getByRole("checkbox").uncheck();
  const req = page.waitForRequest("**/v1/extract");
  await page.getByRole("button", { name: "Send this text" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "I understand" }).click();
  expect(JSON.parse((await req).postData()!).ocr_lines.join(" ")).not.toContain("SAMPLE");
});

test("blank crop is unreadable without sending anything", async ({ page }) => {
  const requests = watchRequests(page);
  await startGeneral(page);
  await pickAndRead(page, []);
  await expect(page.locator("[data-error-code=unreadable]")).toBeVisible({ timeout: 45_000 });
  expect(requests.filter((r) => r.url().includes("/v1/extract"))).toHaveLength(0);
});

test("server id_number_detected asks for a new crop", async ({ page }) => {
  await page.route("**/v1/extract", (r) => r.fulfill({
    status: 422, contentType: "application/json",
    body: '{"error":{"code":"id_number_detected","message":"x","hint":"y"}}',
  }));
  await startGeneral(page);
  await pickAndRead(page, CARD_LINES);
  await expect(page.getByTestId("ocr-lines")).toContainText("Ravi", { timeout: 45_000 });
  await page.getByRole("button", { name: "Send this text" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "I understand" }).click();
  await expect(page.locator("[data-error-code=id_number_detected]")).toContainText("seems to include an ID number");
  await expect(page.getByTestId("ocr-lines")).toHaveCount(0); // back to cropping
});

test("daily_cap_reached (bedrock mode) switches to typed mode; typed checks still work", async ({ page }) => {
  await page.route("**/v1/extract", (r) => r.fulfill({
    status: 429, contentType: "application/json",
    body: '{"error":{"code":"daily_cap_reached","message":"x","hint":"y"}}',
  }));
  await startGeneral(page);
  await pickAndRead(page, CARD_LINES);
  await expect(page.getByTestId("ocr-lines")).toContainText("Ravi", { timeout: 45_000 });
  await page.getByRole("button", { name: "Send this text" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "I understand" }).click();
  await expect(page.getByText(/paused for today/)).toBeVisible();
  await expect(page.getByRole("tab", { name: "Type it" })).toHaveAttribute("data-state", "active");
  await expect(page.getByRole("tab", { name: "Photo" })).toBeDisabled();
  await page.getByRole("button", { name: "Cancel" }).last().click();
  await addTyped(page, "Aadhaar", "ANITA SINGH", "1990-04-07");
  await addTyped(page, "Bank passbook", "ANITA KUMARI SINGH", "1990-04-07");
  await check(page);
  await expect(page.getByTestId("report-status")).toHaveText("Mismatches found");
});

test("consent declined sends nothing", async ({ page }) => {
  const requests = watchRequests(page);
  await startGeneral(page);
  await pickAndRead(page, CARD_LINES);
  await expect(page.getByTestId("ocr-lines")).toContainText("Ravi", { timeout: 45_000 });
  await page.getByRole("button", { name: "Send this text" }).click();
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(requests.filter((r) => r.url().includes("/v1/extract"))).toHaveLength(0);
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

test("landing: numbered sections, live counter, reduced motion shows everything", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const n of ["01", "02", "03", "04", "05"]) {
    await expect(page.locator(`#s${n}-section`)).toBeAttached();
  }
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Same person.");
  await expect(page.getByTestId("count-checks")).toHaveText(/^\d/);
  await page.getByRole("link", { name: "What it costs" }).click();
  await expect(page.getByText("A rejected PF claim")).toBeVisible();
});

test("report is a receipt with character-level differences", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Load Anita's sample set" }).click();
  await check(page);
  const receipt = page.getByRole("article", { name: "Check receipt" });
  await expect(receipt).toContainText("General check");
  await expect(receipt.locator("mark.diff-mark").first()).toBeVisible();
});
