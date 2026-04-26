import bcrypt from 'bcrypt';
import { db } from '../../shared/db.js';

const SALT_ROUNDS = 10;

export interface StaffAccount {
  id: string;
  username: string;
  role: string;
  active: number;
  created_at: string;
}

export async function createStaffAccount(
  username: string,
  password: string,
): Promise<StaffAccount> {
  const existing = db.get<{ id: string }>('SELECT id FROM staff WHERE username = $1', [username]);
  if (existing) {
    throw Object.assign(new Error('Username already exists'), { statusCode: 409 });
  }
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = crypto.randomUUID();
  db.run(
    'INSERT INTO staff (id, username, password_hash, role) VALUES ($1, $2, $3, $4)',
    [id, username, hash, 'editor'],
  );
  return db.get<StaffAccount>(
    'SELECT id, username, role, active, created_at FROM staff WHERE id = $1',
    [id],
  )!;
}

export function listStaffAccounts(): StaffAccount[] {
  return db.all<StaffAccount>(
    'SELECT id, username, role, active, created_at FROM staff ORDER BY created_at DESC',
    [],
  );
}
