import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { loginAsAdmin } from './auth.service.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid credentials' });
    return;
  }

  const { username, password } = parsed.data;
  const token = await loginAsAdmin(username, password);

  if (!token) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  res
    .cookie('token', token, { httpOnly: true, sameSite: 'strict' })
    .json({ ok: true });
});

export default router;
