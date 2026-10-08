/** A migrated PGlite database for database tests, plus helpers to act as one of Finly's roles. */
import type { PGlite } from '@electric-sql/pglite';
import { loadMigrations, migrate } from '../../src/db/migrate.ts';
import { openPglite } from '../../src/db/pglite.ts';

export const MIGRATIONS_DIR = new URL('../../db/migrations/', import.meta.url);

export async function migratedDb(): Promise<PGlite> {
  const { db, sql } = await openPglite();
  await migrate(sql, await loadMigrations(MIGRATIONS_DIR));
  return db;
}

/** The SQLSTATE of a PGlite error, or undefined. */
export function sqlState(e: unknown): string | undefined {
  return (e as { code?: string }).code;
}

/** Runs `fn`, expecting it to fail with SQLSTATE `code`; returns the error message. */
export async function expectSqlError(code: string, fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn();
  } catch (e) {
    const got = sqlState(e);
    if (got !== code) throw new Error(`Expected SQLSTATE ${code}, got ${got}: ${(e as Error).message}`);
    return (e as Error).message;
  }
  throw new Error(`Expected SQLSTATE ${code}, but the statement succeeded`);
}
