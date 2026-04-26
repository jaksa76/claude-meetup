import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../shared/db.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const SALT_ROUNDS = 10;

export interface StaffUser {
  id: string;
  username: string;
  role: string;
}

export function initStaffTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id            TEXT PRIMARY KEY,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'editor',
      active        INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const adminUsername = process.env.ADMIN_USERNAME ?? 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';

  const existing = db.get<{ id: string }>('SELECT id FROM staff WHERE username = $1', [adminUsername]);
  if (!existing) {
    const hash = bcrypt.hashSync(adminPassword, SALT_ROUNDS);
    db.run(
      'INSERT INTO staff (id, username, password_hash, role) VALUES ($1, $2, $3, $4)',
      [crypto.randomUUID(), adminUsername, hash, 'admin'],
    );
  }
}

export async function loginStaff(username: string, password: string): Promise<string | null> {
  const row = db.get<{ id: string; username: string; password_hash: string; role: string; active: number }>(
    'SELECT id, username, password_hash, role, active FROM staff WHERE username = $1',
    [username],
  );
  if (!row || !row.active) return null;
  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) return null;
  return jwt.sign({ sub: row.id, username: row.username, role: row.role }, JWT_SECRET, { expiresIn: '8h' });
}

export function verifyToken(token: string): StaffUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; username: string; role: string };
    return { id: payload.sub, username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}
