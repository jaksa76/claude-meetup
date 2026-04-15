import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../_shared/middleware/requireAuth.js';
import {
  listAllIssues,
  getIssueById,
  updateIssue,
} from '../issues/issues.service.js';

const router = Router();
router.use(requireAuth);

router.get('/issues', (_req: Request, res: Response) => {
  res.json(listAllIssues());
});

router.get('/issues/:id', (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  const issue = getIssueById(id);
  if (!issue) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(issue);
});

const statusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'rejected']),
});

router.patch('/issues/:id/status', (req: Request, res: Response) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const issue = updateIssue(req.params['id'] as string, { status: parsed.data.status });
  if (!issue) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(issue);
});

const categorySchema = z.object({ category: z.string().min(1) });

router.patch('/issues/:id/category', (req: Request, res: Response) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const issue = updateIssue(req.params['id'] as string, { category: parsed.data.category });
  if (!issue) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(issue);
});

router.post('/issues/:id/notes', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.patch('/issues/:id/assignment', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.post('/issues/:id/close', (req: Request, res: Response) => {
  const closeSchema = z.object({
    resolution: z.enum(['resolved', 'rejected']),
    comment: z.string().min(1),
  });
  const parsed = closeSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const issue = updateIssue(req.params['id'] as string, { status: parsed.data.resolution });
  if (!issue) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(issue);
});

export default router;
