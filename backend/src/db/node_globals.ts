/**
 * The PostgreSQL driver (npm:postgres) uses Node's `Buffer`, `process`, `setImmediate` and `clearImmediate` globals.
 * Deno provides them to npm packages, but `deno task edge:bundle` inlines the driver as plain code, and the hosted
 * Supabase runtime does not define them globally ("ReferenceError: Buffer is not defined" at boot, "setImmediate is
 * not defined" on connect). Imported by postgres.ts before the driver, so ES module order guarantees it runs first.
 * Existing globals are left alone. `deno task dev:api` runs the bundle with all of them removed
 * (db/tools/edge_hosted_like.ts), so a new dependency on another Node global fails locally first.
 */
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { clearImmediate, setImmediate } from 'node:timers';

const globals = globalThis as Record<string, unknown>;
globals.Buffer ??= Buffer;
globals.process ??= process;
globals.setImmediate ??= setImmediate;
globals.clearImmediate ??= clearImmediate;
