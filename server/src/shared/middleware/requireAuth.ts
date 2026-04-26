import { Request, Response, NextFunction } from 'express';
import { verifyToken, StaffUser } from '../../features/auth/auth.service.js';

declare global {
  namespace Express {
    interface Request {
      user?: StaffUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token ?? extractBearer(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }
  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }
  req.user = user;
  next();
}

function extractBearer(header?: string): string | null {
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}
