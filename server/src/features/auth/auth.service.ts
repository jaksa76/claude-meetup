import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../../_shared/middleware/requireAuth.js';

const SALT_ROUNDS = 10;

export function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET ?? 'dev-secret';
  return jwt.sign(payload, secret, { expiresIn: '1d' });
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function loginAsAdmin(
  username: string,
  password: string,
): Promise<string | null> {
  const adminUsername = process.env.ADMIN_USERNAME ?? 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin';

  if (username !== adminUsername || password !== adminPassword) return null;

  return signToken({ sub: 'admin', role: 'admin' });
}
