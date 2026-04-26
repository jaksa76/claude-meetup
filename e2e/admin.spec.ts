import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'e2e', 'screenshots');

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

async function adminLogin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 5_000 });
}

test.describe('Admin – create employee account', () => {
  test('admin sees Admin link in nav and can navigate to /admin', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/');
    await expect(page.locator('.app-nav a', { hasText: 'Admin' })).toBeVisible({ timeout: 5_000 });
    await page.click('.app-nav a >> text=Admin');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('h1')).toHaveText('Admin Panel');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin-panel.png') });
  });

  test('admin panel shows create form and staff list', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin');
    await expect(page.locator('[data-testid="create-account-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="staff-list"]')).toBeVisible();
    // admin account should already be in the list
    await expect(page.locator('.admin-table')).toContainText('admin');
  });

  test('admin can create a new employee account', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin');

    const username = `employee_${Date.now()}`;
    await page.fill('#new-username', username);
    await page.fill('#new-password', 'securepass1');
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="form-success"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('[data-testid="staff-list"]')).toContainText(username);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin-create-account.png') });
  });

  test('new employee can log in after creation', async ({ page, request }) => {
    // create account via API
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123' },
    });
    const cookies = loginRes.headers()['set-cookie'];
    const username = `newstaff_${Date.now()}`;
    await request.post('/api/admin/staff', {
      data: { username, password: 'mypassword99' },
      headers: { Cookie: cookies },
    });

    // log in as the new employee
    await page.goto('/login');
    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', 'mypassword99');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5_000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'employee-login.png') });
  });

  test('shows error for duplicate username', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin');

    await page.fill('#new-username', 'admin');
    await page.fill('#new-password', 'securepass1');
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="form-error"]')).toBeVisible({ timeout: 5_000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin-duplicate-error.png') });
  });

  test('non-admin (editor) redirected away from /admin', async ({ page, request }) => {
    // create an editor via API
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123' },
    });
    const cookies = loginRes.headers()['set-cookie'];
    const username = `editor_${Date.now()}`;
    await request.post('/api/admin/staff', {
      data: { username, password: 'editorpass1' },
      headers: { Cookie: cookies },
    });

    // log in as the editor
    await page.goto('/login');
    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', 'editorpass1');
    await page.click('button[type="submit"]');

    // try to access admin page - should be redirected
    await page.goto('/admin');
    await expect(page).not.toHaveURL('/admin', { timeout: 3_000 });
  });

  test('unauthenticated user redirected away from /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});
