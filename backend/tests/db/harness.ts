/**
 * A migrated database for database tests. By default an in-process PGlite; with `FINLY_TEST_TARGET=pg17` (or `pg18`)
 * a fresh `finly_t_*` database on the real server named by `FINLY_PG17_ADMIN_URL` (`FINLY_PG18_ADMIN_URL`) — see
 * `deno task test:pg17`. The same tests run on both, through the small interface below.
 */
import { loadMigrations, migrate, type Sql } from '../../src/db/migrate.ts';
import { type ByteaDomains, openPglite } from '../../src/db/pglite.ts';
import type { PGlite, Transaction } from '@electric-sql/pglite';
import { openPostgres, type PgClient } from '../../src/db/postgres.ts';
import { Buffer } from 'node:buffer';

export const MIGRATIONS_DIR = new URL('../../db/migrations/', import.meta.url);

/** One connection's query surface (a whole database, or one transaction). */
export interface TestTx {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
  exec(text: string): Promise<unknown>;
}

export interface TestDb extends TestTx {
  transaction<T>(fn: (tx: TestTx) => Promise<T>): Promise<T>;
  close(): Promise<void>;
  /** Which engine this is, for tests that only make sense on a real server (several connections). */
  readonly target: 'pglite' | 'pg17' | 'pg18';
  /** Opens another connection to the same database (real servers only). */
  connect?: () => TestDb;
  /** The same database through the production `Sql` port (what application services use). */
  port?: Sql;
}

export function testTarget(): TestDb['target'] {
  const t = Deno.env.get('FINLY_TEST_TARGET');
  return t === 'pg17' || t === 'pg18' ? t : 'pglite';
}

function adminUrl(target: 'pg17' | 'pg18'): string {
  const name = target === 'pg17' ? 'FINLY_PG17_ADMIN_URL' : 'FINLY_PG18_ADMIN_URL';
  const url = Deno.env.get(name);
  if (!url) throw new Error(`${name} is not set (see backend/.env.example)`);
  return url;
}

function wrapPg(client: PgClient, target: 'pg17' | 'pg18', url: string): TestDb {
  const tx = (runner: { unsafe: PgClient['unsafe'] }): TestTx => ({
    async query<T>(text: string, params: unknown[] = []) {
      // Same conversion as the production adapter (Uint8Array → Buffer for bytea).
      const values = params.map((v) => (v instanceof Uint8Array && !Buffer.isBuffer(v) ? Buffer.from(v) : v));
      // A plain array: postgres.js results carry extra properties (count, columns…).
      return { rows: [...(await runner.unsafe(text, values as never[]))] as unknown as T[] };
    },
    async exec(text: string) {
      return await runner.unsafe(text);
    },
  });
  return {
    ...tx(client),
    target,
    transaction: <T>(fn: (t: TestTx) => Promise<T>) =>
      client.begin((t) => fn(tx(t as unknown as { unsafe: PgClient['unsafe'] }))) as Promise<T>,
    close: () => client.end(),
    connect: () => wrapPg(openPostgres(url, { max: 1, applicationName: 'finly-test' }).client, target, url),
  };
}

/** PGlite as a TestDb, with the same bytea-domain serializers as the production adapter (src/db/pglite.ts). */
function wrapPglite(db: PGlite, domains: ByteaDomains): TestDb {
  const tx = (runner: PGlite | Transaction): TestTx => ({
    async query<T>(text: string, params: unknown[] = []) {
      const serializers = params.some((p) => p instanceof Uint8Array) ? await domains.serializers(runner) : undefined;
      return { rows: (await runner.query<T>(text, params, serializers ? { serializers } : undefined)).rows };
    },
    async exec(text: string) {
      const result = await runner.exec(text);
      domains.invalidate();
      return result;
    },
  });
  return {
    ...tx(db),
    target: 'pglite',
    transaction: <T>(fn: (t: TestTx) => Promise<T>) => db.transaction((t) => fn(tx(t))),
    close: () => db.close(),
  };
}

/** A fresh, empty database (no migrations) as the runner's `Sql` interface, on the configured target. */
export async function emptyDb(): Promise<{ sql: Sql; close: () => Promise<void>; db: TestDb }> {
  const target = testTarget();
  if (target === 'pglite') {
    const { db, sql, domains } = await openPglite();
    return { sql, close: () => db.close(), db: wrapPglite(db, domains) };
  }
  const admin = openPostgres(adminUrl(target), { max: 1, applicationName: 'finly-test-admin' });
  const name = `finly_t_${crypto.randomUUID().replaceAll('-', '').slice(0, 16)}`;
  await admin.sql.exec(`create database ${name}`);
  await admin.client.end();
  const url = adminUrl(target).replace(/\/[^/?]*(\?|$)/, `/${name}$1`);
  const { client, sql } = openPostgres(url, { max: 4, applicationName: 'finly-test' });
  return { sql, close: () => client.end(), db: wrapPg(client, target, url) };
}

/** A fresh database with every migration applied. */
export async function migratedDb(): Promise<TestDb> {
  const { sql, db } = await emptyDb();
  await migrate(sql, await loadMigrations(MIGRATIONS_DIR));
  return Object.assign(db, { port: sql });
}

/** The SQLSTATE of a database error, or undefined. */
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
