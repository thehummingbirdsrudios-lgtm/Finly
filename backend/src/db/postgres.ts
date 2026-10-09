/**
 * The `Sql` interface over a real PostgreSQL server (postgres.js), used in production and in server-backed tests.
 *
 * Convention for JSON parameters: pass the JSON as text and cast in SQL (`$1::text::jsonb`). postgres.js
 * JSON-encodes any value bound to a json/jsonb parameter, so a JSON string bound to `$1::jsonb` arrives double-encoded
 * (a jsonb string, not an object). PGlite does not do this, so only the real-server tests catch it.
 */
import postgres from 'postgres';
import { Buffer } from 'node:buffer';
import type { Sql } from './sql.ts';

export type PgClient = ReturnType<typeof postgres>;
type Runner = { unsafe: PgClient['unsafe'] };

/** postgres.js sends `Buffer` as bytea; plain `Uint8Array` values are converted. */
function params(values: unknown[]): never[] {
  return values.map((v) => (v instanceof Uint8Array && !Buffer.isBuffer(v) ? Buffer.from(v) : v)) as never[];
}

function wrap(runner: Runner, client: PgClient | null): Sql {
  return {
    async exec(text) {
      // No parameters → simple protocol, so several statements may be sent at once (migrations).
      await runner.unsafe(text);
    },
    async query<T>(text: string, values: unknown[] = []) {
      return [...(await runner.unsafe(text, params(values)))] as unknown as T[];
    },
    transaction<T>(fn: (tx: Sql) => Promise<T>): Promise<T> {
      if (!client) throw new Error('Nested transactions are not supported; use savepoints.');
      return client.begin((tx) => fn(wrap(tx as unknown as Runner, null))) as Promise<T>;
    },
  };
}

export interface PgOptions {
  /** Maximum pooled connections. */
  max?: number;
  /** Application name shown in pg_stat_activity. */
  applicationName?: string;
}

/** Connects to `url`; the caller closes the client with `client.end()`. Notices are not printed (they may echo data). */
export function openPostgres(url: string, opts: PgOptions = {}): { client: PgClient; sql: Sql } {
  const client = postgres(url, {
    max: opts.max ?? 4,
    onnotice: () => {},
    connection: { application_name: opts.applicationName ?? 'finly' },
  });
  return { client, sql: wrap(client, client) };
}
