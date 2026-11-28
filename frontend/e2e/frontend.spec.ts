import { expect, test } from '@playwright/test';

test('sample comparison uses the backend and renders its guidance', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));

  const statsPromise = page.waitForResponse(
    (response) => response.url().includes('/v1/stats') && response.request().method() === 'GET',
  );
  await page.goto('/');
  const statsResponse = await statsPromise;
  expect(statsResponse.ok()).toBe(true);
  const stats = await statsResponse.json();
  expect(stats).toMatchObject({
    checks: expect.any(Number),
    checks_with_mismatch: expect.any(Number),
  });

  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/v1/compare') && response.request().method() === 'POST',
  );
  await page
    .locator('#workspace')
    .getByRole('button', { name: 'Check my documents' })
    .click();

  const response = await responsePromise;
  expect(response.ok()).toBe(true);
  const request = response.request().postDataJSON();
  expect(request.purpose).toBe('pan_aadhaar_link');
  expect(request.documents).toHaveLength(3);
  await expect(page.getByText('Guidance for each difference')).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('photo OCR stays on-device until the user consents to send selected text', async ({ page }) => {
  const requests: Array<{ url: string; contentType?: string; body?: string }> = [];
  page.on('request', (request) => {
    requests.push({
      url: request.url(),
      contentType: request.headers()['content-type'],
      body: request.postData() ?? undefined,
    });
  });

  await page.goto('/');
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 420;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#000000';
    context.font = '700 58px Arial';
    context.fillText('Name: RAVI KUMAR', 80, 150);
    context.fillText('Gender: M', 80, 260);
    return canvas.toDataURL('image/png').split(',')[1];
  });

  await page.getByLabel('Choose photo for Aadhaar Card').setInputFiles({
    name: 'synthetic-document.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png, 'base64'),
  });

  await expect
    .poll(async () => page.getByTestId('ocr-lines').locator('label').count(), {
      timeout: 60_000,
    })
    .toBeGreaterThan(0);
  expect(requests.filter((request) => request.url.includes('/v1/extract'))).toHaveLength(0);

  await page.getByLabel('I understand and consent to sending the selected text.').check();
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/v1/extract') && response.request().method() === 'POST',
  );
  await page.getByTestId('send-ocr-text').click();
  const response = await responsePromise;

  expect(response.ok()).toBe(true);
  const body = response.request().postDataJSON();
  expect(body.ocr_lines.length).toBeGreaterThan(0);
  expect(body).not.toHaveProperty('image');
  expect(JSON.stringify(body)).not.toContain('data:image');
  expect(requests.some((request) => request.contentType?.startsWith('image/'))).toBe(false);
  await expect(page.getByTestId('send-ocr-text')).toContainText('Text sent');
});

test('the main newspaper sheet fits a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const mainBox = await page.locator('main').boundingBox();
  expect(mainBox).not.toBeNull();
  expect(mainBox!.width).toBeLessThanOrEqual(390);
  expect(mainBox!.x).toBeGreaterThanOrEqual(0);
});
