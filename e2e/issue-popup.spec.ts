import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'e2e', 'screenshots');

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

test.describe('Issue popup', () => {
  test('clicking a map pin opens a popup with issue details', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 8_000 });

    // dispatchEvent fires the DOM click directly, bypassing Playwright hit-testing
    const marker = page.locator('.leaflet-marker-icon').first();
    await marker.dispatchEvent('click');

    const popup = page.locator('.leaflet-popup');
    await expect(popup).toBeVisible({ timeout: 5_000 });

    await expect(popup.locator('h3')).not.toBeEmpty();
    await expect(popup.locator('.status')).toBeVisible();
    await expect(popup.locator('.vote-btn')).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'issue-popup.png'), fullPage: false });
  });

  test('popup shows a photo when the issue has one', async ({ page }) => {
    await page.goto('/');
    // Only select individual pin markers, not cluster group icons
    await page.waitForSelector('.leaflet-marker-icon:not(.marker-cluster)', { timeout: 8_000 });

    const markers = page.locator('.leaflet-marker-icon:not(.marker-cluster)');
    const total = await markers.count();
    const limit = Math.min(total, 8);

    for (let i = 0; i < limit; i++) {
      await markers.nth(i).dispatchEvent('click');
      // Wait for popup to open
      const popup = page.locator('.leaflet-popup');
      const opened = await popup.isVisible({ timeout: 1_000 }).catch(() => false);
      if (!opened) { continue; }

      const photo = page.locator('.leaflet-popup .issue-photo').first();
      if (await photo.count() > 0) {
        await expect(photo).toHaveAttribute('src', /.+/);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'issue-popup-photo.png'), fullPage: false });
        return;
      }
      await page.keyboard.press('Escape');
    }

    throw new Error('No marker with a photo found in the first markers');
  });
});
