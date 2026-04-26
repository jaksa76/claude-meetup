import path from 'path';
import request from 'supertest';
import app from '../../app.js';

const FIXTURE_IMAGE = path.join(process.cwd(), 'src/features/issues/fixture.jpg');

// Create a minimal valid JPEG buffer for tests
import fs from 'fs';
beforeAll(() => {
  // 1×1 white JPEG
  const jpeg = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
    'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN' +
    'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
    'MjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB' +
    'AQBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB/9oADAMBAAIRAxEA' +
    'PwCwABmX/9k=',
    'base64',
  );
  fs.writeFileSync(FIXTURE_IMAGE, jpeg);
});

afterAll(() => {
  if (fs.existsSync(FIXTURE_IMAGE)) fs.unlinkSync(FIXTURE_IMAGE);
});

describe('GET /api/issues', () => {
  it('returns an array of issues', async () => {
    const res = await request(app).get('/api/issues');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('each issue includes required fields including photo_url', async () => {
    const res = await request(app).get('/api/issues');
    expect(res.body.length).toBeGreaterThan(0);
    const issue = res.body[0];
    expect(issue).toHaveProperty('id');
    expect(issue).toHaveProperty('title');
    expect(issue).toHaveProperty('lat');
    expect(issue).toHaveProperty('lng');
    expect(issue).toHaveProperty('status');
    expect(issue).toHaveProperty('votes');
    expect(issue).toHaveProperty('photo_url');
  });

  it('photo_url is a string or null', async () => {
    const res = await request(app).get('/api/issues');
    for (const issue of res.body) {
      expect(issue.photo_url === null || typeof issue.photo_url === 'string').toBe(true);
    }
  });
});

describe('POST /api/issues', () => {
  it('creates an issue and returns 201', async () => {
    const res = await request(app)
      .post('/api/issues')
      .field('title', 'Test pothole')
      .field('lat', '42.0939')
      .field('lng', '19.1003')
      .attach('photo', FIXTURE_IMAGE, { contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Test pothole',
      status: 'new',
      votes: 0,
    });
    expect(typeof res.body.id).toBe('string');
    expect(res.body.photo_url).toMatch(/^\/uploads\//);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/issues')
      .field('lat', '42.0939')
      .field('lng', '19.1003')
      .attach('photo', FIXTURE_IMAGE, { contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('stores and returns description when provided', async () => {
    const res = await request(app)
      .post('/api/issues')
      .field('title', 'Issue with description')
      .field('description', 'There is a big hole in the road near the market.')
      .field('lat', '42.0939')
      .field('lng', '19.1003')
      .attach('photo', FIXTURE_IMAGE, { contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    expect(res.body.description).toBe('There is a big hole in the road near the market.');
  });

  it('description is null when not provided', async () => {
    const res = await request(app)
      .post('/api/issues')
      .field('title', 'Issue without description')
      .field('lat', '42.0939')
      .field('lng', '19.1003')
      .attach('photo', FIXTURE_IMAGE, { contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    expect(res.body.description).toBeNull();
  });

  it('returns 400 when photo is missing', async () => {
    const res = await request(app)
      .post('/api/issues')
      .field('title', 'No photo issue')
      .field('lat', '42.0939')
      .field('lng', '19.1003');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('accepts a phone number and never returns it in the response', async () => {
    const res = await request(app)
      .post('/api/issues')
      .field('title', 'Issue with phone')
      .field('phone', '+382 67 123 456')
      .field('lat', '42.0939')
      .field('lng', '19.1003')
      .attach('photo', FIXTURE_IMAGE, { contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('+382');
    expect(body).not.toContain('67 123');
    expect(res.body).not.toHaveProperty('phone');
    expect(res.body).not.toHaveProperty('phone_enc');
    expect(res.body).not.toHaveProperty('phone_iv');
  });

  it('returns 400 for an invalid phone number', async () => {
    const res = await request(app)
      .post('/api/issues')
      .field('title', 'Bad phone')
      .field('phone', 'not-a-phone!!!')
      .field('lat', '42.0939')
      .field('lng', '19.1003')
      .attach('photo', FIXTURE_IMAGE, { contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/issues/:id/vote', () => {
  it('increments vote count and returns updated issue', async () => {
    const before = await request(app).get('/api/issues');
    const issue = before.body[0];
    const votesBefore = issue.votes;

    const res = await request(app).post(`/api/issues/${issue.id}/vote`);
    expect(res.status).toBe(200);
    expect(res.body.votes).toBe(votesBefore + 1);
    expect(res.body.id).toBe(issue.id);
  });

  it('returns 404 for a non-existent issue', async () => {
    const res = await request(app).post('/api/issues/nonexistent-id/vote');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/issues', () => {
  it('never exposes phone fields in list response', async () => {
    const res = await request(app).get('/api/issues');
    expect(res.status).toBe(200);
    for (const issue of res.body) {
      expect(issue).not.toHaveProperty('phone');
      expect(issue).not.toHaveProperty('phone_enc');
      expect(issue).not.toHaveProperty('phone_iv');
    }
  });
});
