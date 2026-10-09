/**
 * The `Sql` interface over PGlite (PostgreSQL in WebAssembly), used by tests and local tooling (D-024, D-028).
 *
 * PGlite serialises a parameter by the type the server describes for it. For a column of a domain over bytea (Finly's
 * `ciphertext` and `keyed_hash`) that is the domain's own type, which PGlite does not know, so it sends `String(value)`
 * — a Uint8Array [4, 5, 6] would be stored as the text "4,5,6". Every query therefore carries serializers for the
 * bytea domains that exist, read from the catalog and re-read after any DDL.
 */
import { PGlite, type Transaction } from '@electric-sql/pglite';
import type { Sql } from './sql.ts';

type SerializerOptions = Record<number, (value: unknown) => string>;

const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

/** PostgreSQL's hex input format for bytea: `\x0405…`. */
export function byteaHex(value: unknown): string {
  if (!(value instanceof Uint8Array)) throw new Error('A binary column needs bytes.');
  let out = '\\x';
  for (const b of value) out += HEX[b];
  return out;
}

/** Tracks the bytea domains of one PGlite database, for its serializers. */
export class ByteaDomains {
  private cached: SerializerOptions | null = null;

  constructor(private readonly db: PGlite) {}

  /** Call after DDL: domains may have been created. */
  invalidate(): void {
    this.cached = null;
  }

  async serializers(runner: PGlite | Transaction = this.db): Promise<SerializerOptions> {
    if (!this.cached) {
      const rows = (await runner.query<{ oid: number }>(
        `select oid::int as oid from pg_type where typtype = 'd' and typbasetype = 'bytea'::regtype`,
      )).rows;
      this.cached = Object.fromEntries(rows.map((r) => [r.oid, byteaHex]));
    }
    return this.cached;
  }
}

function hasBytes(params: unknown[]): boolean {
  return params.some((p) => p instanceof Uint8Array);
}

function wrap(db: PGlite | Transaction, domains: ByteaDomains): Sql {
  return {
    async exec(text) {
      await db.exec(text);
      domains.invalidate();
    },
    async query<T>(text: string, params: unknown[] = []) {
      const serializers = hasBytes(params) ? await domains.serializers(db) : undefined;
      return (await db.query<T>(text, params, serializers ? { serializers } : undefined)).rows;
    },
    transaction<T>(fn: (tx: Sql) => Promise<T>): Promise<T> {
      if (!('transaction' in db)) throw new Error('Nested transactions are not supported; use savepoints.');
      return (db as PGlite).transaction((tx) => fn(wrap(tx, domains)));
    },
  };
}

export async function openPglite(): Promise<{ db: PGlite; sql: Sql; domains: ByteaDomains }> {
  const db = new PGlite();
  await db.waitReady;
  const domains = new ByteaDomains(db);
  return { db, sql: wrap(db, domains), domains };
}
