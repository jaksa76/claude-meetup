import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  role: 'staff' | 'admin';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token =
    req.cookies?.token ??
    req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET ?? 'dev-secret';
    req.user = jwt.verify(token, secret) as JwtPayload;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorised' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  });
}
