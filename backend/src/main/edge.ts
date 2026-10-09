/**
 * The API as a Supabase Edge Function (docs/operations/deploy-api.md). Built into one file by `deno task edge:bundle`
 * and deployed as the function `api` with JWT verification off (Finly authenticates every request itself).
 *
 * Configuration comes only from the function's secrets, never from code:
 *   FINLY_DATABASE_URL  the least-privilege `finly_app` login through the Supavisor transaction pooler (port 6543)
 *   FINLY_KEK_ACTIVE, FINLY_KEK_V<n>  key-encryption keys (docs/operations/key-recovery.md)
 * Until they are set, every request is answered with 503 "not configured" — no data, no stack traces.
 */
import { EnvKekSource } from '../crypto/keys.ts';
import { openPostgres } from '../db/postgres.ts';
import { api, VERSION } from './compose.ts';

type Handler = (req: Request, remote?: string) => Promise<Response>;

function notConfigured(missing: string[]): Handler {
  return (req) => {
    const health = new URL(req.url).pathname.endsWith('/v1/health');
    return Promise.resolve(
      new Response(
        JSON.stringify(
          health ? { status: 'not_configured', version: VERSION, missing } : {
            code: 'NOT_CONFIGURED',
            title: 'Finly is being set up. Please try again later.',
            status: 503,
          },
        ),
        { status: 503, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } },
      ),
    );
  };
}

function build(): Handler {
  const missing = ['FINLY_DATABASE_URL', 'FINLY_KEK_ACTIVE'].filter((n) => !Deno.env.get(n));
  if (missing.length > 0) return notConfigured(missing);
  let kek: EnvKekSource;
  try {
    kek = new EnvKekSource();
  } catch {
    return notConfigured(['FINLY_KEK_V<active>']);
  }
  // Transaction pooling: no prepared statements; few connections per isolate; idle ones closed quickly.
  const { sql } = openPostgres(Deno.env.get('FINLY_DATABASE_URL')!, {
    max: 3,
    prepare: false,
    idleTimeoutSeconds: 20,
    applicationName: 'finly-api-edge',
  });
  return api(sql, kek);
}

const handler = build();

Deno.serve((req, info) => handler(req, (info.remoteAddr as Deno.NetAddr | undefined)?.hostname));
