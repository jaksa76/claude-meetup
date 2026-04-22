import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'e2e', 'screenshots');

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

test.describe('Hello world', () => {
  test('displays the greeting from the API', async ({ page }) => {
    await page.goto('/');

    const heading = page.locator('h2');
    await expect(heading).not.toBeEmpty({ timeout: 5_000 });

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'hello.png'), fullPage: true });
  });
});
