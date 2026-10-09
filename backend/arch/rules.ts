/**
 * The backend's module boundaries (add-on 15 §1, §2.2): which layer may import which. One table drives the
 * architecture test (tests/architecture/boundaries_test.ts) and the generated map (docs/architecture/module-map.md),
 * so the documented dependency graph cannot drift from the code.
 *
 * Direction: http → app → domain; app → crypto, db (through ports); nothing imports http or app from below.
 */

export interface Layer {
  /** Short name used in the map. */
  name: string;
  /** Directory prefix, relative to backend/. */
  path: string;
  purpose: string;
  /** Prefixes (relative to backend/) this layer may import, besides itself. */
  may: string[];
  /** Bare specifiers from the import map this layer may use. */
  external: string[];
}

export const LAYERS: Layer[] = [
  {
    name: 'domain',
    path: 'src/domain/',
    purpose:
      'Accounting model and posting engine — pure and deterministic: no I/O, no keys; clock and randomness only in ids.ts (new ids)',
    may: [],
    external: [],
  },
  {
    name: 'crypto',
    path: 'src/crypto/',
    purpose: 'Encryption, blind indexes, hash chains, key ring (D-026, D-033)',
    may: ['src/domain/errors.ts'],
    external: [],
  },
  {
    name: 'db',
    path: 'src/db/',
    purpose: 'PostgreSQL adapters, migration runner, SCRAM verifiers',
    may: [],
    external: ['postgres', 'node:buffer', '@electric-sql/pglite'],
  },
  {
    name: 'app',
    path: 'src/app/',
    purpose: 'Application services (posting, identity, policy): one use case per transaction, through ports',
    may: ['src/domain/', 'src/crypto/', 'src/db/sql.ts'],
    external: [],
  },
  {
    name: 'http',
    path: 'src/http/',
    purpose: 'Versioned HTTP API: authentication, validation, error mapping; calls app services only',
    may: ['src/app/', 'src/domain/errors.ts', 'src/domain/ids.ts', 'src/domain/money.ts'],
    external: ['zod', 'jose'],
  },
];

/** Files allowed to read the clock or the random generator inside an otherwise pure layer. */
export const IMPURE_ALLOWED = ['src/domain/ids.ts'];

/** Calls that make code depend on time, chance or the outside world. */
export const IMPURE =
  /\b(Date\.now|new Date\(\)|Math\.random|crypto\.|Deno\.|fetch\(|performance\.now|setTimeout|setInterval)/;

export function layerOf(file: string): Layer | undefined {
  return LAYERS.find((l) => file.startsWith(l.path));
}
