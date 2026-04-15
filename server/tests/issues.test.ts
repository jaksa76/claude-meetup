import request from 'supertest';
import app from '../src/app';
import { _clearStore } from '../src/features/issues/issues.service';

beforeEach(() => _clearStore());

describe('POST /api/issues', () => {
  it('creates an issue and returns a tracking code', async () => {
    const res = await request(app)
      .post('/api/issues')
      .send({ description: 'Broken streetlight', latitude: 42.1, longitude: 19.1 });

    expect(res.status).toBe(201);
    expect(res.body.trackingCode).toMatch(/^[A-Z0-9]{8}$/);
  });

  it('rejects missing description', async () => {
    const res = await request(app)
      .post('/api/issues')
      .send({ latitude: 42.1, longitude: 19.1 });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/issues', () => {
  it('returns only open issues', async () => {
    await request(app)
      .post('/api/issues')
      .send({ description: 'Pothole', latitude: 42.1, longitude: 19.1 });

    const res = await request(app).get('/api/issues');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).not.toHaveProperty('contactPhone');
  });
});

describe('GET /api/issues/:trackingCode', () => {
  it('returns issue by tracking code', async () => {
    const create = await request(app)
      .post('/api/issues')
      .send({ description: 'Graffiti', latitude: 42.1, longitude: 19.1 });

    const { trackingCode } = create.body;
    const res = await request(app).get(`/api/issues/${trackingCode}`);
    expect(res.status).toBe(200);
    expect(res.body.trackingCode).toBe(trackingCode);
  });

  it('returns 404 for unknown code', async () => {
    const res = await request(app).get('/api/issues/NOTFOUND');
    expect(res.status).toBe(404);
  });
});
