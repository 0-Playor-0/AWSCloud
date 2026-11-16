import { expect, test } from "@playwright/test";

import { addTyped, check, startGeneral, syntheticJpeg } from "./helpers";

// Runs against a local API started with --cap 0 (HANDOFF.md Phase 3 "done when").

test("cap reached: switches to typed mode and typed checks still work", async ({ page }) => {
  await startGeneral(page);
  await page.getByRole("button", { name: "+ Add a document" }).click();
  await page.getByLabel("Choose or take a photo").setInputFiles({
    name: "card.jpg", mimeType: "image/jpeg", buffer: await syntheticJpeg(page, 900, 600),
  });
  await page.getByRole("button", { name: "Use this crop" }).click();
  await page.getByRole("button", { name: "Read the text" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "I understand" }).click();

  await expect(page.getByText("Photo reading is paused for today.")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Type it" })).toHaveAttribute("data-state", "active");
  await expect(page.getByRole("tab", { name: "Photo" })).toBeDisabled();
  await page.getByRole("button", { name: "Cancel" }).last().click();

  await addTyped(page, "Aadhaar", "ANITA SINGH", "1990-04-07");
  await addTyped(page, "Bank passbook", "ANITA KUMARI SINGH", "1990-04-07");
  await check(page);
  await expect(page.getByTestId("report-status")).toHaveText("Mismatches found");

  // The photo tab stays off for the rest of the session.
  await page.getByRole("button", { name: "Edit documents" }).click();
  await page.getByRole("button", { name: "+ Add a document" }).click();
  await expect(page.getByRole("tab", { name: "Photo" })).toBeDisabled();
});

test("cap reached: sample flow works", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Load Anita's sample set" }).click();
  await check(page);
  await expect(page.getByTestId("report-status")).toHaveText("Mismatches found");
});
