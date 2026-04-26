import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'e2e', 'screenshots');

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

test.describe('Upvote issue', () => {
  test('vote button increments the count in the popup', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 8_000 });

    // Open the first popup
    await page.locator('.leaflet-marker-icon').first().dispatchEvent('click');
    await expect(page.locator('.leaflet-popup')).toBeVisible({ timeout: 5_000 });

    const voteBtn = page.locator('.vote-btn').first();
    await expect(voteBtn).toBeVisible();

    // Read current count
    const countText = await voteBtn.locator('.vote-count').textContent();
    const before = parseInt(countText ?? '0', 10);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'vote-before.png') });

    // dispatchEvent bypasses nav z-index interception
    await voteBtn.dispatchEvent('click');

    // Wait for the count to increment
    await expect(voteBtn.locator('.vote-count')).toHaveText(String(before + 1), { timeout: 5_000 });

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'vote-after.png') });
  });
});
