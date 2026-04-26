import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'e2e', 'screenshots');

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

test.describe('Staff login', () => {
  test('login page renders when navigating to /login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toHaveText('Bar Municipality');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'login-page.png') });
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('.form-error')).toBeVisible({ timeout: 5_000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'login-error.png') });
  });

  test('redirects to /dashboard after successful login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5_000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'login-success.png') });
  });

  test('nav shows staff login link when logged out', async ({ page }) => {
    await page.goto('/');
    const loginLink = page.locator('.app-nav a', { hasText: 'Staff login' });
    await expect(loginLink).toBeVisible({ timeout: 5_000 });
  });

  test('nav shows username and sign out button when logged in', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5_000 });

    await page.goto('/');
    await expect(page.locator('.app-nav').getByText('admin')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('.app-nav button', { hasText: 'Sign out' })).toBeVisible();
  });
});
