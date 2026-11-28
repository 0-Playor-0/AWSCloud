import { expect, test, type Page } from '@playwright/test';

/** Samples scrollWidth - innerWidth on every animation frame for `ms`; returns the worst overflow. */
async function maxOverflowDuring(page: Page, ms: number): Promise<number> {
  return page.evaluate(
    (duration) =>
      new Promise<number>((resolve) => {
        let worst = -Infinity;
        const end = performance.now() + duration;
        const tick = () => {
          worst = Math.max(worst, document.documentElement.scrollWidth - window.innerWidth);
          if (performance.now() < end) requestAnimationFrame(tick);
          else resolve(worst);
        };
        requestAnimationFrame(tick);
      }),
    ms,
  );
}

test.describe('phone 390x844', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });

  test('report stamp never widens the page during its animation', async ({ page }) => {
    await page.goto('/');
    const sampling = maxOverflowDuring(page, 2500);
    await page.locator('#report').scrollIntoViewIfNeeded();
    expect(await sampling).toBeLessThanOrEqual(0);

    // And again when a real comparison re-renders the report and re-runs the stamp.
    await page.locator('#workspace').getByRole('button', { name: 'Check my documents' }).click();
    const after = maxOverflowDuring(page, 2500);
    await expect(page.locator('#report')).toBeInViewport();
    expect(await after).toBeLessThanOrEqual(0);
  });

  test('no horizontal scroll anywhere on the page', async ({ page }) => {
    await page.goto('/');
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 600) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      expect(await maxOverflowDuring(page, 150)).toBeLessThanOrEqual(0);
    }
  });
});

test('report shows the Identity Health Score after a check', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('health-score')).toContainText('Appears after you run the check');
  const res = page.waitForResponse('**/v1/compare');
  await page.locator('#workspace').getByRole('button', { name: 'Check my documents' }).click();
  const counts = (await (await res).json()).summary.counts;
  const expected = Math.max(0, 100 - 25 * counts.blocking - 10 * counts.risky - 2 * counts.cosmetic);
  await expect(page.getByTestId('health-score-value')).toHaveText(String(expected));
  await expect(page.getByTestId('health-score')).toContainText('Our estimate, not an official score.');
  await page.getByTestId('health-score').getByText("How it's calculated").click();
  await expect(page.getByTestId('health-score')).toContainText('100 − 25 per blocking');
});

for (const [checks, visible] of [[0, false], [5, true]] as const) {
  test(`counter ${visible ? 'shown' : 'hidden'} when the count is ${checks}`, async ({ page }) => {
    await page.route('**/v1/stats', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ checks, checks_with_mismatch: 0 }) }),
    );
    await page.goto('/');
    await page.waitForResponse('**/v1/stats');
    await expect(page.getByTestId('counter')).toHaveCount(visible ? 1 : 0);
  });
}

test('print view (download report): report only, score, URL, no controls', async ({ page }, testInfo) => {
  await page.goto('/');
  const res = page.waitForResponse('**/v1/compare');
  await page.locator('#workspace').getByRole('button', { name: 'Check my documents' }).click();
  await res;
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#report')).toBeVisible();
  await expect(page.getByTestId('health-score-value')).toBeVisible();
  await expect(page.locator('#report')).toContainText(new URL(page.url()).origin);
  for (const id of ['#hero', '#workspace', 'header']) {
    await expect(page.locator(id).first()).toBeHidden();
  }
  await expect(page.getByRole('button', { name: /Download report/ })).toBeHidden();
  const shot = await page.screenshot({ fullPage: true });
  await testInfo.attach('print-view', { body: shot, contentType: 'image/png' });
});
