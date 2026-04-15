import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  createIssue,
  listOpenIssues,
  getIssueByTrackingCode,
} from './issues.service.js';
import { upload } from '../../_shared/upload.js';

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many submissions — please try again later.' },
});

const router = Router();

const createIssueSchema = z.object({
  description: z.string().min(1).max(4096),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  contactPhone: z.string().optional(),
});

router.post(
  '/',
  submitLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('photo')(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    const parsed = createIssueSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const photoPath = req.file ? req.file.filename : undefined;
    const issue = createIssue({ ...parsed.data, photoPath });

    res.status(201).json({ trackingCode: issue.trackingCode });
  },
);

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
