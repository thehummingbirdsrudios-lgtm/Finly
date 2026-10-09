/**
 * The database port: the only thing application services know about PostgreSQL. Implemented over postgres.js
 * (`postgres.ts`) and PGlite (`pglite.ts`).
 */
export interface Sql {
  /** Runs one or more statements without parameters. */
  exec(text: string): Promise<void>;
  /** Runs one parameterised statement and returns its rows. */
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
  /** Runs `fn` inside one transaction: commit on success, rollback on any error. */
  transaction<T>(fn: (tx: Sql) => Promise<T>): Promise<T>;
}
