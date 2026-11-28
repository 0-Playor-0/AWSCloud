// Privacy checks ported from the pre-merge suite (172ec71 e2e/flows.spec.ts + helpers.ts).
import { expect, test, type Page, type Request } from '@playwright/test';

const ID_PATTERNS = [/\d{12}/, /\d{4}[\s-]+\d{4}[\s-]+\d{4}/];
const IMAGE_MARKERS = [/data:image\//, /\/9j\//, /iVBORw0KGgo/, /[A-Za-z0-9+/=]{400,}/];

/** Our own origins: the site, plus the API when it is deployed separately (E2E_API_URL). */
function ownOrigins(siteOrigin: string): string[] {
  const api = process.env.E2E_API_URL;
  return api ? [siteOrigin, new URL(api).origin] : [siteOrigin];
}

function watchRequests(page: Page): Request[] {
  const seen: Request[] = [];
  page.on('request', (r) => seen.push(r));
  return seen;
}

function assertCleanRequests(requests: Request[], siteOrigin: string) {
  const allowed = ownOrigins(siteOrigin);
  for (const r of requests) {
    const url = new URL(r.url());
    if (url.protocol === 'data:' || url.protocol === 'blob:') continue;
    expect(allowed, `third-party request: ${r.url()}`).toContain(url.origin);
    const body = r.postData();
    if (!body) continue;
    expect(body.length, `large request body to ${r.url()}`).toBeLessThan(8_000);
    for (const m of [...ID_PATTERNS, ...IMAGE_MARKERS]) {
      expect(body, `ID-like or image data sent to ${r.url()}`).not.toMatch(m);
    }
  }
}

/** Records every write to web storage and every IndexedDB open, before any page script runs. */
async function recordStorageWrites(page: Page) {
  await page.addInitScript(() => {
    const log: string[] = [];
    (window as unknown as { __storageWrites: string[] }).__storageWrites = log;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      log.push(`setItem:${key}`);
      return setItem.call(this, key, value);
    };
    const open = indexedDB.open.bind(indexedDB);
    indexedDB.open = (name: string, version?: number) => {
      log.push(`indexedDB.open:${name}`);
      return open(name, version);
    };
  });
}

async function syntheticCard(page: Page, lines: string[]): Promise<Buffer> {
  const b64 = await page.evaluate((ls) => {
    const c = document.createElement('canvas');
    c.width = 1200;
    c.height = 120 + ls.length * 110;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#000';
    ctx.font = '700 64px Arial';
    ls.forEach((l, i) => ctx.fillText(l, 60, 110 + i * 110));
    return c.toDataURL('image/png').split(',')[1];
  }, lines);
  return Buffer.from(b64, 'base64');
}

test('photo with an Aadhaar-like number: consent first, number stripped, nothing stored, own hosts only', async ({
  page,
  baseURL,
}) => {
  const requests = watchRequests(page);
  await recordStorageWrites(page);
  await page.goto('/');

  await page.getByLabel('Choose photo for Aadhaar Card').setInputFiles({
    name: 'synthetic.png',
    mimeType: 'image/png',
    buffer: await syntheticCard(page, ['Name: RAVI KUMAR', '9999 9999 9999', 'Gender: M']),
  });
  await expect
    .poll(async () => page.getByTestId('ocr-lines').locator('label').count(), { timeout: 60_000 })
    .toBeGreaterThan(0);
  await expect(page.getByTestId('ocr-lines')).not.toContainText(/\d{4}\s\d{4}\s\d{4}/);

  // Consent is required before the first send; nothing has been sent yet.
  const send = page.getByTestId('send-ocr-text');
  await expect(send).toBeDisabled();
  expect(requests.filter((r) => r.url().includes('/v1/extract'))).toHaveLength(0);

  await page.getByLabel('I understand and consent to sending the selected text.').check();
  await expect(send).toBeEnabled();
  const extract = page.waitForRequest('**/v1/extract');
  await send.click();
  const body = (await extract).postDataJSON();
  expect(Object.keys(body).sort()).toEqual(expect.arrayContaining(['doc_type', 'ocr_lines']));
  expect(JSON.stringify(body)).not.toMatch(/\d{9,}|\d{4}\s\d{4}\s\d{4}/);

  assertCleanRequests(requests, new URL(baseURL!).origin);
  expect(await page.evaluate(() => (window as unknown as { __storageWrites: string[] }).__storageWrites)).toEqual([]);
});

test('sample comparison: clean request bodies, nothing stored, own hosts only', async ({ page, baseURL }) => {
  const requests = watchRequests(page);
  await recordStorageWrites(page);
  await page.goto('/');
  const compare = page.waitForResponse('**/v1/compare');
  await page.locator('#workspace').getByRole('button', { name: 'Check my documents' }).click();
  expect((await compare).ok()).toBe(true);
  assertCleanRequests(requests, new URL(baseURL!).origin);
  expect(await page.evaluate(() => (window as unknown as { __storageWrites: string[] }).__storageWrites)).toEqual([]);
});

test('declining consent sends nothing', async ({ page }) => {
  const requests = watchRequests(page);
  await page.goto('/');
  await page.getByLabel('Choose photo for Aadhaar Card').setInputFiles({
    name: 'synthetic.png',
    mimeType: 'image/png',
    buffer: await syntheticCard(page, ['Name: RAVI KUMAR', 'Gender: M']),
  });
  await expect
    .poll(async () => page.getByTestId('ocr-lines').locator('label').count(), { timeout: 60_000 })
    .toBeGreaterThan(0);
  await expect(page.getByTestId('send-ocr-text')).toBeDisabled();
  await page.waitForTimeout(500);
  expect(requests.filter((r) => r.url().includes('/v1/extract'))).toHaveLength(0);
});

test('no 12-digit or grouped ID number is rendered anywhere on the page', async ({ page }) => {
  await page.goto('/');
  const text = await page.locator('body').innerText();
  for (const p of ID_PATTERNS) expect(text).not.toMatch(p);
  await expect(page.getByText('XXXX XXXX 7721', { exact: false }).first()).toBeAttached();
});

for (const [name, width, expectImages] of [
  ['phone', 390, false],
  ['tablet', 1023, false],
  ['desktop', 1440, true],
] as const) {
  test(`illustrated border on ${name} (${width}px): ${expectImages ? 'rendered, lazy' : 'not rendered, no image requests'}`, async ({ page }) => {
    const imageRequests: string[] = [];
    page.on('request', (r) => { if (r.url().endsWith('.webp')) imageRequests.push(r.url()); });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const border = page.getByTestId('illustrated-border');
    if (expectImages) {
      await expect(border).toBeAttached();
      const imgs = border.locator('img');
      expect(await imgs.count()).toBeGreaterThan(0);
      for (const img of await imgs.all()) {
        await expect(img).toHaveAttribute('loading', 'lazy');
        await expect(img).toHaveAttribute('alt', '');
        await expect(img).toHaveAttribute('aria-hidden', 'true');
      }
    } else {
      await expect(border).toHaveCount(0);
      expect(await page.locator('img[src$=".webp"]').count()).toBe(0);
      expect(imageRequests).toEqual([]);
    }
  });
}

for (const [name, status, body] of [
  ['503', 503, '<html>Service Unavailable</html>'],
  ['bare 429', 429, '{"message":"Too Many Requests"}'],
] as const) {
  test(`busy ${name} once is retried quietly`, async ({ page }) => {
    let calls = 0;
    await page.route('**/v1/compare', (r) => {
      calls += 1;
      return calls === 1 ? r.fulfill({ status, body, contentType: 'application/json' }) : r.continue();
    });
    await page.goto('/');
    await page.locator('#workspace').getByRole('button', { name: 'Check my documents' }).click();
    await expect(page.getByText('Guidance for each difference')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(calls).toBe(2);
  });
}
