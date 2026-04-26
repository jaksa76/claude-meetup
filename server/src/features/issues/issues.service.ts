import { db } from '../../shared/db.js';
import { encryptPhone } from '../../shared/crypto.js';

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  photo_url: string | null;
  lat: number;
  lng: number;
  status: string;
  votes: number;
  created_at: string;
}

export function initIssuesTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS issues (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      photo_url   TEXT,
      lat         REAL NOT NULL,
      lng         REAL NOT NULL,
      status      TEXT NOT NULL DEFAULT 'new',
      votes       INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const cols = db.all<{ name: string }>('PRAGMA table_info(issues)');
  if (!cols.some(c => c.name === 'photo_url')) {
    db.exec('ALTER TABLE issues ADD COLUMN photo_url TEXT');
  }
  if (!cols.some(c => c.name === 'phone_enc')) {
    db.exec('ALTER TABLE issues ADD COLUMN phone_enc TEXT');
    db.exec('ALTER TABLE issues ADD COLUMN phone_iv TEXT');
  }

  // Backfill sample photos for seed rows that have no photo yet
  const seedPhotos: Array<[string, string]> = [
    ['1', 'https://picsum.photos/seed/issue1/400/240'],
    ['2', 'https://picsum.photos/seed/issue2/400/240'],
    ['3', 'https://picsum.photos/seed/issue3/400/240'],
    ['5', 'https://picsum.photos/seed/issue5/400/240'],
  ];
  for (const [id, url] of seedPhotos) {
    db.run('UPDATE issues SET photo_url = $1 WHERE id = $2 AND photo_url IS NULL', [url, id]);
  }

  const count = db.get<{ n: number }>('SELECT COUNT(*) as n FROM issues');
  if (count && count.n === 0) {
    for (const s of SEED_ISSUES) {
      db.run(
        'INSERT INTO issues (id, title, lat, lng, status, photo_url) VALUES ($1, $2, $3, $4, $5, $6)',
        [s.id, s.title, s.lat, s.lng, s.status, s.photo_url],
      );
    }
  }
}

const SEED_ISSUES = [
  { id: '1', title: 'Potholes on Jovana Tomaševića', lat: 42.0939, lng: 19.1003, status: 'new', photo_url: 'https://picsum.photos/seed/issue1/400/240' },
  { id: '2', title: 'Broken street light near the port', lat: 42.0891, lng: 19.0961, status: 'in_progress', photo_url: 'https://picsum.photos/seed/issue2/400/240' },
  { id: '3', title: 'Illegal dumping in Topolica park', lat: 42.0975, lng: 19.1052, status: 'new', photo_url: 'https://picsum.photos/seed/issue3/400/240' },
  { id: '4', title: 'Damaged pavement on Maršala Tita', lat: 42.0921, lng: 19.0987, status: 'resolved', photo_url: null },
  { id: '5', title: 'Overflowing bin at bus station', lat: 42.0908, lng: 19.1021, status: 'new', photo_url: 'https://picsum.photos/seed/issue5/400/240' },
] as const;

export function resetIssuesForTest() {
  db.exec('DELETE FROM issues');
  for (const s of SEED_ISSUES) {
    db.run(
      'INSERT INTO issues (id, title, lat, lng, status, photo_url) VALUES ($1, $2, $3, $4, $5, $6)',
      [s.id, s.title, s.lat, s.lng, s.status, s.photo_url],
    );
  }
}

export function getAllIssues(): Issue[] {
  return db.all<Issue>('SELECT id, title, description, photo_url, lat, lng, status, votes, created_at FROM issues ORDER BY created_at DESC');
}

export function voteOnIssue(id: string): Issue | null {
  const existing = db.get<{ id: string }>('SELECT id FROM issues WHERE id = $1', [id]);
  if (!existing) return null;
  db.run('UPDATE issues SET votes = votes + 1 WHERE id = $1', [id]);
  return db.get<Issue>('SELECT id, title, description, photo_url, lat, lng, status, votes, created_at FROM issues WHERE id = $1', [id])!;
}

export function createIssue(data: { id: string; title: string; description: string | null; phone: string | null; lat: number; lng: number; photo_url: string | null }): Issue {
  let phone_enc: string | null = null;
  let phone_iv: string | null = null;
  if (data.phone) {
    const encrypted = encryptPhone(data.phone);
    phone_enc = encrypted.enc;
    phone_iv = encrypted.iv;
  }
  db.run(
    'INSERT INTO issues (id, title, description, phone_enc, phone_iv, lat, lng, photo_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [data.id, data.title, data.description, phone_enc, phone_iv, data.lat, data.lng, data.photo_url],
  );
  return db.get<Issue>('SELECT id, title, description, photo_url, lat, lng, status, votes, created_at FROM issues WHERE id = $1', [data.id])!;
}
