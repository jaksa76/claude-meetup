import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { errorHandler } from './_shared/middleware/errorHandler.js';
import issuesRouter from './features/issues/issues.router.js';
import authRouter from './features/auth/auth.router.js';
import staffRouter from './features/staff/staff.router.js';
import adminRouter from './features/admin/admin.router.js';
import { UPLOAD_DIR } from './_shared/upload.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/static/uploads', express.static(path.resolve(UPLOAD_DIR)));

app.use('/api/issues', issuesRouter);
app.use('/api/staff/auth', authRouter);
app.use('/api/staff', staffRouter);
app.use('/api/admin', adminRouter);

app.use(errorHandler);

export default app;
