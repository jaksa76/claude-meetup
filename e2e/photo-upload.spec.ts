import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Minimal valid 1×1 JPEG (binary)
const JPEG_1X1 = Buffer.from(
  'ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707' +
  '07090909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c' +
  '231c1c2837292c30313434341f27393d38323c2e333432ffffc0000b080001000101' +
  '011100ffc4001f0000010501010101010100000000000000000102030405060708090a' +
  '0bffda00080101000005021bffd9',
  'hex',
);

// Minimal valid 1×1 PNG
const PNG_1X1 = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
  '2e00000000c4944415478016360f8cfc00000000200016834d840000000049454e44ae426082',
  'hex',
);

function writeTmpFile(name: string, buf: Buffer): string {
  const p = path.join(os.tmpdir(), name);
  fs.writeFileSync(p, buf);
  return p;
}

test.describe('Photo upload on the report form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/report');
  });

  test('gallery input accepts a valid JPEG and shows a preview', async ({ page }) => {
    const jpegPath = writeTmpFile('test.jpg', JPEG_1X1);

    const galleryInput = page.getByTestId('gallery-input');
    await galleryInput.setInputFiles(jpegPath);

    await expect(page.getByAltText('Preview of selected photo')).toBeVisible();
    await expect(page.getByRole('button', { name: /remove photo/i })).toBeVisible();
  });

  test('gallery input accepts a valid PNG and shows a preview', async ({ page }) => {
    const pngPath = writeTmpFile('test.png', PNG_1X1);

    const galleryInput = page.getByTestId('gallery-input');
    await galleryInput.setInputFiles(pngPath);

    await expect(page.getByAltText('Preview of selected photo')).toBeVisible();
  });

  test('rejects a file that is not JPEG or PNG', async ({ page }) => {
    const gifPath = writeTmpFile('anim.gif', Buffer.from('GIF89a'));

    const galleryInput = page.getByTestId('gallery-input');
    await galleryInput.setInputFiles(gifPath);

    await expect(page.getByRole('alert')).toContainText(/only jpeg and png/i);
    await expect(page.getByAltText('Preview of selected photo')).not.toBeVisible();
  });

  test('rejects a file larger than 5 MB', async ({ page }) => {
    const bigPath = writeTmpFile('big.jpg', Buffer.alloc(6 * 1024 * 1024, 0xff));

    const galleryInput = page.getByTestId('gallery-input');
    await galleryInput.setInputFiles(bigPath);

    await expect(page.getByRole('alert')).toContainText(/5 mb/i);
    await expect(page.getByAltText('Preview of selected photo')).not.toBeVisible();
  });

  test('Remove button clears the preview and restores the choice buttons', async ({ page }) => {
    const jpegPath = writeTmpFile('test.jpg', JPEG_1X1);

    await page.getByTestId('gallery-input').setInputFiles(jpegPath);
    await expect(page.getByAltText('Preview of selected photo')).toBeVisible();

    await page.getByRole('button', { name: /remove photo/i }).click();

    await expect(page.getByAltText('Preview of selected photo')).not.toBeVisible();
    await expect(page.getByRole('button', { name: /take a photo with your camera/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /choose a photo from your gallery/i })).toBeVisible();
  });

  test('submitting with a photo returns a tracking code', async ({ page }) => {
    const jpegPath = writeTmpFile('test.jpg', JPEG_1X1);

    await page.getByTestId('gallery-input').setInputFiles(jpegPath);
    await page.getByRole('button', { name: /submit report/i }).click();

    await expect(page.getByText(/your tracking code/i)).toBeVisible({ timeout: 10_000 });
    const code = page.locator('.tracking-code');
    await expect(code).toBeVisible();
    await expect(code).toHaveText(/^[A-Z0-9]{8}$/);
  });

  test('submitting without a photo also succeeds', async ({ page }) => {
    await page.getByRole('button', { name: /submit report/i }).click();

    await expect(page.getByText(/your tracking code/i)).toBeVisible({ timeout: 10_000 });
  });
});
