import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../src/app';
import { _clearStore } from '../src/features/issues/issues.service';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';

// Minimal 1x1 JPEG (valid file content)
const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
  'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN' +
  'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
  'MjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAA' +
  'AAAAAAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAA' +
  'AAAA/9oADAMBAAIRAxEAPwCwABmX/9k=',
  'base64',
);

// Minimal valid 1x1 PNG
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

beforeEach(() => _clearStore());

describe('POST /api/issues — photo upload', () => {
  it('accepts a JPEG photo and returns a tracking code', async () => {
    const res = await request(app)
      .post('/api/issues')
      .field('description', 'Broken streetlight')
      .field('latitude', '42.1')
      .field('longitude', '19.1')
      .attach('photo', TINY_JPEG, { filename: 'photo.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    expect(res.body.trackingCode).toMatch(/^[A-Z0-9]{8}$/);
  });

  it('accepts a PNG photo', async () => {
    const res = await request(app)
      .post('/api/issues')
      .field('description', 'Pothole')
      .field('latitude', '42.1')
      .field('longitude', '19.1')
      .attach('photo', TINY_PNG, { filename: 'photo.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.trackingCode).toMatch(/^[A-Z0-9]{8}$/);
  });

  it('rejects a non-image file (GIF)', async () => {
    const gif = Buffer.from('R0lGODlhAQABAAAAACH5BAEAAAAALAAAAAABAAEAAAI=', 'base64');
    const res = await request(app)
      .post('/api/issues')
      .field('description', 'Test')
      .field('latitude', '42.1')
      .field('longitude', '19.1')
      .attach('photo', gif, { filename: 'anim.gif', contentType: 'image/gif' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/JPEG|PNG/i);
  });

  it('rejects a file exceeding 5 MB', async () => {
    const big = Buffer.alloc(6 * 1024 * 1024, 0xff);
    const res = await request(app)
      .post('/api/issues')
      .field('description', 'Test')
      .field('latitude', '42.1')
      .field('longitude', '19.1')
      .attach('photo', big, { filename: 'big.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
  });

  it('stores the uploaded file on disk', async () => {
    const res = await request(app)
      .post('/api/issues')
      .field('description', 'Graffiti')
      .field('latitude', '42.2')
      .field('longitude', '19.2')
      .attach('photo', TINY_JPEG, { filename: 'photo.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(201);

    // At least one file should exist in the uploads dir
    const files = fs.readdirSync(path.resolve(UPLOAD_DIR));
    expect(files.length).toBeGreaterThan(0);
  });

  it('submits successfully with no photo (photo optional)', async () => {
    const res = await request(app)
      .post('/api/issues')
      .send({ description: 'No photo', latitude: 42.1, longitude: 19.1 });

    expect(res.status).toBe(201);
    expect(res.body.trackingCode).toMatch(/^[A-Z0-9]{8}$/);
  });
});
