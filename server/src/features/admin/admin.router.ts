import { Router, Request, Response } from 'express';
import { requireAdmin } from '../../_shared/middleware/requireAuth.js';

const router = Router();
router.use(requireAdmin);

router.get('/users', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.post('/users', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.put('/users/:id', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.delete('/users/:id', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
