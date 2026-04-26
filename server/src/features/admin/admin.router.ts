import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../../shared/middleware/requireAdmin.js';
import { createStaffAccount, listStaffAccounts } from './admin.service.js';

const router = Router();

const createAccountSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
});

router.get('/staff', requireAdmin, (_req, res) => {
  const accounts = listStaffAccounts();
  res.json(accounts);
});

router.post('/staff', requireAdmin, async (req, res) => {
  const parsed = createAccountSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'username (min 3 chars) and password (min 8 chars) are required' });
    return;
  }
  try {
    const account = await createStaffAccount(parsed.data.username, parsed.data.password);
    res.status(201).json(account);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    if (e.statusCode === 409) {
      res.status(409).json({ error: e.message });
      return;
    }
    throw err;
  }
});

export default router;
