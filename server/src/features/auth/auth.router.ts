import { Router } from 'express';
import { z } from 'zod';
import { loginStaff } from './auth.service.js';
import { requireAuth } from '../../shared/middleware/requireAuth.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'username and password are required' });
    return;
  }
  const { username, password } = parsed.data;
  const token = await loginStaff(username, password);
  if (!token) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  });
  res.json({ ok: true });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

export default router;
