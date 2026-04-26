import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getAllIssues, createIssue, voteOnIssue } from './issues.service.js';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(process.cwd(), 'uploads'),
    filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname) || '.jpg'}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

const phoneRegex = /^\+?[\d\s\-().]{7,20}$/;

const CreateIssueBody = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  phone: z.string().regex(phoneRegex, 'Invalid phone number').optional(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
});

router.get('/', (_req, res) => {
  res.json(getAllIssues());
});

router.post('/', upload.single('photo'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Photo is required' });
    return;
  }

  const parsed = CreateIssueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { title, description, phone, lat, lng } = parsed.data;
  const photo_url = `/uploads/${req.file.filename}`;
  const issue = createIssue({ id: uuidv4(), title, description: description ?? null, phone: phone ?? null, lat, lng, photo_url });
  res.status(201).json(issue);
});

router.post('/:id/vote', (req, res) => {
  const updated = voteOnIssue(req.params.id);
  if (!updated) {
    res.status(404).json({ error: 'Issue not found' });
    return;
  }
  res.json(updated);
});

export default router;
