import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  createIssue,
  listOpenIssues,
  getIssueByTrackingCode,
} from './issues.service.js';

const router = Router();

const createIssueSchema = z.object({
  description: z.string().min(1).max(4096),
  latitude: z.number(),
  longitude: z.number(),
  contactPhone: z.string().optional(),
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = createIssueSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const issue = createIssue({
    ...parsed.data,
    photoPath: (req as Request & { file?: Express.Multer.File }).file?.path,
  });

  res.status(201).json({ trackingCode: issue.trackingCode });
});

router.get('/', (_req: Request, res: Response) => {
  const issues = listOpenIssues().map(({ id, latitude, longitude, category, status, createdAt }) => ({
    id,
    latitude,
    longitude,
    category,
    status,
    createdAt,
  }));
  res.json(issues);
});

router.get('/:trackingCode', (req: Request, res: Response) => {
  const issue = getIssueByTrackingCode(req.params['trackingCode'] as string);
  if (!issue) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const { contactPhone: _cp, ...safe } = issue;
  res.json(safe);
});

export default router;
