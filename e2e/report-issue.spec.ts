import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'e2e', 'screenshots');

// Minimal 1×1 white JPEG to use as a fixture
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

test.describe('Report issue form', () => {
  test('FAB opens the report form', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.fab', { timeout: 8_000 });

    await page.click('.fab');
    await expect(page.locator('.report-panel')).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'report-form-open.png') });
  });

  test('submitting a report with photo and title adds a new pin', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 8_000 });
    const initialPins = await page.locator('.leaflet-marker-icon').count();

    await page.click('.fab');
    await expect(page.locator('.report-panel')).toBeVisible();

    // Attach photo
    await page.locator('[data-testid="photo-input"]').setInputFiles(FIXTURE_PATH);
    await expect(page.locator('.photo-preview')).toBeVisible();

    // Fill title
    await page.fill('#issue-title', 'E2E test issue');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'report-form-filled.png') });

    // Submit
    await page.click('.submit-btn');

    // Form should close
    await expect(page.locator('.report-panel')).not.toBeVisible({ timeout: 8_000 });

    // A new pin should appear on the map (at least one more than before)
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(initialPins + 1, { timeout: 8_000 });
  });

  test('shows error when submitting without a photo', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.fab', { timeout: 8_000 });
    await page.click('.fab');

    await page.fill('#issue-title', 'No photo');
    await page.click('.submit-btn');

    await expect(page.locator('.form-error')).toBeVisible();
  });

  test('submitting with a phone number completes successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.fab', { timeout: 8_000 });
    await page.click('.fab');

    await page.locator('[data-testid="photo-input"]').setInputFiles(FIXTURE_PATH);
    await page.fill('#issue-title', 'Issue with phone');
    await page.fill('#issue-phone', '+382 67 123 456');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'report-form-with-phone.png') });
    await page.click('.submit-btn');

    // Form closes — phone is not exposed anywhere in the UI
    await expect(page.locator('.report-panel')).not.toBeVisible({ timeout: 8_000 });
    const pageText = await page.textContent('body');
    expect(pageText).not.toContain('+382 67 123 456');
  });

  test('submitted issue persists after page reload', async ({ page }) => {
    const uniqueTitle = `Persistence test ${Date.now()}`;

    await page.goto('/');
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 8_000 });
    const initialPins = await page.locator('.leaflet-marker-icon').count();

    await page.click('.fab');
    await expect(page.locator('.report-panel')).toBeVisible();

    await page.locator('[data-testid="photo-input"]').setInputFiles(FIXTURE_PATH);
    await page.fill('#issue-title', uniqueTitle);
    await page.click('.submit-btn');
    await expect(page.locator('.report-panel')).not.toBeVisible({ timeout: 8_000 });
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(initialPins + 1, { timeout: 8_000 });

    // Reload the page — the new issue must survive a fresh fetch from the server
    await page.reload();
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 8_000 });
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(initialPins + 1, { timeout: 8_000 });

    // Verify the specific title is returned by the API after reload
    const issues = await page.evaluate(() =>
      fetch('/api/issues').then(r => r.json()),
    );
    const found = (issues as Array<{ title: string }>).some(i => i.title === uniqueTitle);
    expect(found, `Issue titled "${uniqueTitle}" not found in API response after reload`).toBe(true);
  });

  test('description is submitted and shown in the popup', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.fab', { timeout: 8_000 });
    await page.click('.fab');

    await page.locator('[data-testid="photo-input"]').setInputFiles(FIXTURE_PATH);
    await page.fill('#issue-title', 'Issue with description');
    await page.fill('#issue-description', 'Large pothole near the bus stop.');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'report-form-with-description.png') });
    const initialPins = await page.locator('.leaflet-marker-icon').count();
    await page.click('.submit-btn');
    await expect(page.locator('.report-panel')).not.toBeVisible({ timeout: 8_000 });

    // Wait for the map to update with the newly submitted issue, then click it
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(initialPins + 1, { timeout: 8_000 });
    await page.locator('.leaflet-marker-icon').first().dispatchEvent('click');
    await expect(page.locator('.leaflet-popup .issue-desc')).toContainText('Large pothole near the bus stop.');
  });

  test('shows GPS coordinates when geolocation is granted', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 42.1234, longitude: 19.2345 });

    await page.goto('/');
    await page.waitForSelector('.fab', { timeout: 8_000 });
    await page.click('.fab');

    const tag = page.locator('[data-testid="location-tag"]');
    await expect(tag).toBeVisible({ timeout: 5_000 });
    await expect(tag).toContainText('42.12340');
    await expect(tag).toContainText('19.23450');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'report-form-gps.png') });
  });

  test('shows approximate location warning when geolocation is denied', async ({ page, context }) => {
    await context.clearPermissions();

    await page.goto('/');
    await page.waitForSelector('.fab', { timeout: 8_000 });

    // Stub geolocation to call the error callback immediately
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (_s: unknown, err: (e: { code: number }) => void) =>
            err({ code: 1 }),
        },
        configurable: true,
      });
    });

    await page.reload();
    await page.waitForSelector('.fab', { timeout: 8_000 });
    await page.click('.fab');

    const tag = page.locator('[data-testid="location-tag"]');
    await expect(tag).toBeVisible({ timeout: 5_000 });
    await expect(tag).toContainText('approximate');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'report-form-approx-location.png') });
  });
});
