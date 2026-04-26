import request from 'supertest';
import app from '../../app.js';

async function adminCookie(): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  const raw = res.headers['set-cookie'] as unknown as string[];
  return Array.isArray(raw) ? raw[0] : (raw as string);
}

describe('GET /api/admin/staff', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/admin/staff');
    expect(res.status).toBe(401);
  });

  it('returns staff list for admin', async () => {
    const cookie = await adminCookie();
    const res = await request(app)
      .get('/api/admin/staff')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    // password_hash must never be exposed
    expect(res.body[0]).not.toHaveProperty('password_hash');
  });
});

describe('POST /api/admin/staff', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/admin/staff')
      .send({ username: 'newuser', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('creates a new editor account', async () => {
    const cookie = await adminCookie();
    const username = `employee_${Date.now()}`;
    const res = await request(app)
      .post('/api/admin/staff')
      .set('Cookie', cookie)
      .send({ username, password: 'securepass1' });
    expect(res.status).toBe(201);
    expect(res.body.username).toBe(username);
    expect(res.body.role).toBe('editor');
    expect(res.body.active).toBe(1);
    expect(res.body).not.toHaveProperty('password_hash');
  });

  it('returns 400 for too-short username', async () => {
    const cookie = await adminCookie();
    const res = await request(app)
      .post('/api/admin/staff')
      .set('Cookie', cookie)
      .send({ username: 'ab', password: 'securepass1' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for too-short password', async () => {
    const cookie = await adminCookie();
    const res = await request(app)
      .post('/api/admin/staff')
      .set('Cookie', cookie)
      .send({ username: 'validuser', password: 'short' });
    expect(res.status).toBe(400);
  });

  it('returns 409 for duplicate username', async () => {
    const cookie = await adminCookie();
    const username = `dup_${Date.now()}`;
    await request(app)
      .post('/api/admin/staff')
      .set('Cookie', cookie)
      .send({ username, password: 'securepass1' });
    const res = await request(app)
      .post('/api/admin/staff')
      .set('Cookie', cookie)
      .send({ username, password: 'securepass1' });
    expect(res.status).toBe(409);
  });

  it('new employee can log in after creation', async () => {
    const cookie = await adminCookie();
    const username = `logintest_${Date.now()}`;
    await request(app)
      .post('/api/admin/staff')
      .set('Cookie', cookie)
      .send({ username, password: 'mypassword99' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username, password: 'mypassword99' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.ok).toBe(true);
  });

  it('returns 403 for non-admin staff', async () => {
    // create an editor account first
    const adminCook = await adminCookie();
    const username = `editor_${Date.now()}`;
    await request(app)
      .post('/api/admin/staff')
      .set('Cookie', adminCook)
      .send({ username, password: 'editorpass1' });

    // log in as the editor
    const editorLogin = await request(app)
      .post('/api/auth/login')
      .send({ username, password: 'editorpass1' });
    const editorCookie = (editorLogin.headers['set-cookie'] as unknown as string[])[0];

    const res = await request(app)
      .post('/api/admin/staff')
      .set('Cookie', editorCookie)
      .send({ username: 'anotheruser', password: 'securepass1' });
    expect(res.status).toBe(403);
  });
});
