import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'e2e', 'screenshots');

const FIXTURE_PATH = path.join(process.cwd(), 'e2e', 'fixture.jpg');

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const jpeg = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
    'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIA' +
    'AhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEA//EAB4QAAIBBAMAAAAAAAAAAAAAAAABAgMREiEx/8QAFAEB' +
    'AAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKwAJmf/2Q==',
    'base64',
  );
  fs.writeFileSync(FIXTURE_PATH, jpeg);
});

test.afterAll(() => {
  if (fs.existsSync(FIXTURE_PATH)) fs.unlinkSync(FIXTURE_PATH);
});

test.describe('Manual location picker (story 0016)', () => {
  test('location tag and Adjust button appear in report form', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.fab', { timeout: 8_000 });
    await page.click('.fab');

    await expect(page.locator('.report-panel')).toBeVisible();
    await expect(page.locator('[data-testid="location-tag"]')).toBeVisible();
    await expect(page.locator('[data-testid="adjust-location-btn"]')).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'location-picker-form.png') });
  });

  test('clicking Adjust hides the form and shows picking hint', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.fab', { timeout: 8_000 });
    await page.click('.fab');
    await expect(page.locator('.report-panel')).toBeVisible();

    await page.click('[data-testid="adjust-location-btn"]');

    // Form overlay is hidden
    await expect(page.locator('.report-overlay')).toHaveCSS('display', 'none');

    // Picking hint banner is visible
    await expect(page.locator('[data-testid="location-picking-hint"]')).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'location-picking-hint.png') });
  });

  test('Cancel in picking hint restores the form', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.fab', { timeout: 8_000 });
    await page.click('.fab');
    await expect(page.locator('.report-panel')).toBeVisible();

    await page.click('[data-testid="adjust-location-btn"]');
    await expect(page.locator('[data-testid="location-picking-hint"]')).toBeVisible();

    await page.click('.location-picking-cancel');

    // Form is visible again
    await expect(page.locator('.report-panel')).toBeVisible();
    await expect(page.locator('[data-testid="location-picking-hint"]')).not.toBeVisible();
  });

  test('tapping the map during picking mode updates the location', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.fab', { timeout: 8_000 });
    await page.click('.fab');
    await expect(page.locator('.report-panel')).toBeVisible();

    // Record the original location text
    const originalLocation = await page.locator('[data-testid="location-tag"]').textContent();

    await page.click('[data-testid="adjust-location-btn"]');
    await expect(page.locator('[data-testid="location-picking-hint"]')).toBeVisible();

    // Click somewhere on the map (offset from center)
    const mapBox = await page.locator('.map-container').boundingBox();
    if (!mapBox) throw new Error('Map container not found');
    await page.mouse.click(mapBox.x + mapBox.width * 0.3, mapBox.y + mapBox.height * 0.3);

    // Form should reappear
    await expect(page.locator('.report-panel')).toBeVisible({ timeout: 5_000 });

    // Location should be updated (should now show specific coords, not "approximate")
    const updatedLocation = await page.locator('[data-testid="location-tag"]').textContent();
    expect(updatedLocation).not.toBe(originalLocation);
    expect(updatedLocation).toContain('📍');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'location-updated.png') });
  });

  test('report submitted after picking uses the picked location', async ({ page }) => {
    const uniqueTitle = `Location pick test ${Date.now()}`;

    await page.goto('/');
    await page.waitForSelector('.fab', { timeout: 8_000 });
    await page.click('.fab');
    await expect(page.locator('.report-panel')).toBeVisible();

    await page.click('[data-testid="adjust-location-btn"]');
    await expect(page.locator('[data-testid="location-picking-hint"]')).toBeVisible();

    // Click towards the top-left of the map to get a lat/lng noticeably different from Bar centre
    const mapBox = await page.locator('.map-container').boundingBox();
    if (!mapBox) throw new Error('Map container not found');
    await page.mouse.click(mapBox.x + 50, mapBox.y + 50);

    await expect(page.locator('.report-panel')).toBeVisible({ timeout: 5_000 });

    // Capture coords from the location tag
    const locationText = await page.locator('[data-testid="location-tag"]').textContent() ?? '';
    const coordMatch = locationText.match(/([\d.]+),\s*([\d.]+)/);
    expect(coordMatch).not.toBeNull();
    const pickedLat = parseFloat(coordMatch![1]);
    const pickedLng = parseFloat(coordMatch![2]);

    // Attach photo and fill title, then submit
    await page.locator('[data-testid="photo-input"]').setInputFiles(FIXTURE_PATH);
    await page.fill('#issue-title', uniqueTitle);
    await page.click('.submit-btn');
    await expect(page.locator('.report-panel')).not.toBeVisible({ timeout: 8_000 });

    // Verify the API stored the picked coordinates
    const issues = await page.evaluate(() => fetch('/api/issues').then(r => r.json())) as Array<{ title: string; lat: number; lng: number }>;
    const created = issues.find(i => i.title === uniqueTitle);
    expect(created).toBeDefined();
    // The lat/lng should be within ~0.1 degrees of what we picked
    expect(Math.abs(created!.lat - pickedLat)).toBeLessThan(0.1);
    expect(Math.abs(created!.lng - pickedLng)).toBeLessThan(0.1);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'location-pick-submitted.png') });
  });
});
