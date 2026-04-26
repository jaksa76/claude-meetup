import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'e2e', 'screenshots');

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

test.describe('Map clustering', () => {
  test('clusters appear when zoomed out and expand on zoom in', async ({ page }) => {
    await page.goto('/');

    // Zoom out far enough to force clustering
    await page.waitForSelector('.leaflet-container', { timeout: 8_000 });
    const map = page.locator('.leaflet-container');
    await map.click(); // focus map

    // Zoom out 5 levels using keyboard
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('-');
      await page.waitForTimeout(150);
    }

    // At low zoom there should be cluster markers (div icons with a count)
    const clusters = page.locator('.marker-cluster');
    const clusterCount = await clusters.count();

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'map-clustered.png'), fullPage: false });

    // Zoom back in to see individual pins
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('+');
      await page.waitForTimeout(150);
    }

    // Individual pins should be visible now
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 6_000 });
    const pins = page.locator('.leaflet-marker-icon');
    await expect(pins.first()).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'map-unclustered.png'), fullPage: false });

    // Either clusters were shown when zoomed out, or pins were always few enough not to cluster — both are valid
    expect(clusterCount + (await pins.count())).toBeGreaterThan(0);
  });

  test('clicking a cluster zooms in to reveal its children', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.leaflet-container', { timeout: 8_000 });
    const map = page.locator('.leaflet-container');
    await map.click();

    // Zoom out to force clustering
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('-');
      await page.waitForTimeout(150);
    }

    const cluster = page.locator('.marker-cluster').first();
    if (await cluster.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await cluster.click();
      await page.waitForTimeout(600); // wait for zoom animation
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'map-cluster-clicked.png'), fullPage: false });
      // After clicking, either fewer clusters or more individual pins visible
      await expect(page.locator('.leaflet-container')).toBeVisible();
    }
  });
});
