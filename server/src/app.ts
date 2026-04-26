import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import issuesRouter from './features/issues/issues.router.js';
import { initIssuesTable, resetIssuesForTest } from './features/issues/issues.service.js';
import authRouter from './features/auth/auth.router.js';
import { initStaffTable } from './features/auth/auth.service.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

initIssuesTable();
initStaffTable();

app.get('/health', (_req, res) => res.json({ ok: true }));

if (process.env.NODE_ENV !== 'production') {
  app.post('/api/test/reset', (_req, res) => {
    resetIssuesForTest();
    res.json({ ok: true });
  });
}
app.use('/api/issues', issuesRouter);
app.use('/api/auth', authRouter);

export default app;
