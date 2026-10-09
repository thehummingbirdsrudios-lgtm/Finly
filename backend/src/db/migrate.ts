/**
 * Forward-only, checksummed migration runner (D-027). Plain SQL files run in name order, each in its own
 * transaction; an applied file whose content changed stops the run. Works on any PostgreSQL 17 and on PGlite.
 */

import type { Sql } from './sql.ts';

export type { Sql };

export interface Migration {
  version: string;
  name: string;
  sql: string;
  checksum: string;
}

const FILE_NAME = /^(\d{4})_([a-z0-9_]+)\.sql$/;

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Reads `NNNN_name.sql` files from a directory, sorted by version. */
export async function loadMigrations(dir: URL | string): Promise<Migration[]> {
  const found: Migration[] = [];
  // A plain path (Windows or Unix) becomes a directory URL so file names resolve inside it.
  const base = dir instanceof URL ? dir : new URL(`file:///${dir.replaceAll('\\', '/').replace(/^\/+/, '')}/`);
  for await (const entry of Deno.readDir(base)) {
    if (!entry.isFile) continue;
    const match = FILE_NAME.exec(entry.name);
    if (!match) throw new Error(`Unexpected file in migrations: ${entry.name}`);
    // Line endings are normalised so a Windows checkout and a Unix checkout of the same file share one checksum.
    const sql = (await Deno.readTextFile(new URL(entry.name, base))).replaceAll('\r\n', '\n');
    found.push({ version: match[1], name: entry.name, sql, checksum: await sha256Hex(sql) });
  }
  found.sort((a, b) => a.version.localeCompare(b.version));
  for (let i = 1; i < found.length; i++) {
    if (found[i].version === found[i - 1].version) throw new Error(`Duplicate migration version ${found[i].version}`);
  }
  return found;
}

const BOOTSTRAP = `
create schema if not exists finly;
create table if not exists finly.schema_migration (
  version text primary key,
  name text not null,
  checksum text not null,
  applied_at timestamptz not null default now()
);`;

/** Applies every pending migration; returns the versions applied. */
export async function migrate(db: Sql, migrations: Migration[]): Promise<string[]> {
  await db.exec(BOOTSTRAP);
  const applied = await db.query<{ version: string; checksum: string }>(
    'select version, checksum from finly.schema_migration order by version',
  );
  const byVersion = new Map(applied.map((r) => [r.version, r.checksum]));
  for (const m of migrations) {
    const sum = byVersion.get(m.version);
    if (sum !== undefined && sum !== m.checksum) {
      throw new Error(`Migration ${m.name} was changed after it was applied. Write a new migration instead.`);
    }
  }
  const known = new Set(migrations.map((m) => m.version));
  for (const v of byVersion.keys()) {
    if (!known.has(v)) throw new Error(`The database has migration ${v}, which this code does not know.`);
  }
  const done: string[] = [];
  for (const m of migrations) {
    if (byVersion.has(m.version)) continue;
    await db.transaction(async (tx) => {
      await tx.exec(m.sql);
      await tx.query('insert into finly.schema_migration (version, name, checksum) values ($1, $2, $3)', [
        m.version,
        m.name,
        m.checksum,
      ]);
    });
    done.push(m.version);
  }
  return done;
}
