import Database from 'better-sqlite3';
import path from 'path';

// In production swap this module for a pg pool using the same interface
// so feature code never changes — only this file and the import.

const sqliteDb = new Database(path.join(process.cwd(), 'dev.db'));
sqliteDb.pragma('journal_mode = WAL');
sqliteDb.pragma('foreign_keys = ON');

// Convert pg-style $1, $2 placeholders to SQLite ? so feature code
// can be written once and work against both drivers.
function toPositional(sql: string): string {
  return sql.replace(/\$\d+/g, '?');
}

export const db = {
  run(sql: string, params: unknown[] = []) {
    return sqliteDb.prepare(toPositional(sql)).run(params);
  },
  get<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | undefined {
    return sqliteDb.prepare(toPositional(sql)).get(params) as T | undefined;
  },
  all<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
    return sqliteDb.prepare(toPositional(sql)).all(params) as T[];
  },
  exec(sql: string) {
    sqliteDb.exec(sql);
  },
};
