/** The `Sql` interface over PGlite (PostgreSQL 17 in WebAssembly), used by tests and local tooling (D-024). */
import { PGlite, type Transaction } from '@electric-sql/pglite';
import type { Sql } from './migrate.ts';

function wrap(db: PGlite | Transaction): Sql {
  return {
    async exec(text) {
      await db.exec(text);
    },
    async query<T>(text: string, params: unknown[] = []) {
      return (await db.query<T>(text, params)).rows;
    },
    transaction<T>(fn: (tx: Sql) => Promise<T>): Promise<T> {
      if (!('transaction' in db)) throw new Error('Nested transactions are not supported; use savepoints.');
      return (db as PGlite).transaction((tx) => fn(wrap(tx)));
    },
  };
}

export async function openPglite(): Promise<{ db: PGlite; sql: Sql }> {
  const db = new PGlite();
  await db.waitReady;
  return { db, sql: wrap(db) };
}
