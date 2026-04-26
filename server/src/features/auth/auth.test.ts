import request from 'supertest';
import app from '../../app.js';

describe('POST /api/auth/login', () => {
  it('returns 200 and sets cookie with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const cookies = res.headers['set-cookie'] as string[] | string;
    const cookieHeader = Array.isArray(cookies) ? cookies.join(' ') : cookies;
    expect(cookieHeader).toMatch(/token=/);
  });

  it('returns 401 with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 401 for non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'anything' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when body is missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns user info with a valid token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    const cookieStr = Array.isArray(cookies) ? cookies[0] : (cookies as string);

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookieStr);

    expect(meRes.status).toBe(200);
    expect(meRes.body.username).toBe('admin');
    expect(meRes.body.role).toBe('admin');
    expect(meRes.body).not.toHaveProperty('password_hash');
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the token cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const cookies = res.headers['set-cookie'] as string[] | string;
    const cookieHeader = Array.isArray(cookies) ? cookies.join(' ') : cookies ?? '';
    expect(cookieHeader).toMatch(/token=;|token=$/);
  });
});
