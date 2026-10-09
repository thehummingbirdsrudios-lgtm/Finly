/**
 * The API server (local development, self-hosting, or any Deno host). Configuration comes from the environment only:
 *   FINLY_DATABASE_URL  postgres URL of the API login (a member of finly_api, finly_auth, finly_ledger; see
 *                       docs/operations/deployment.md) — never a superuser in production
 *   FINLY_KEK_ACTIVE, FINLY_KEK_V<n>  key-encryption keys (docs/operations/key-recovery.md)
 *   PORT                listening port (default 8787)
 * Run: deno task api
 */
import { EnvKekSource } from '../crypto/keys.ts';
import { openPostgres } from '../db/postgres.ts';
import { api, VERSION } from './compose.ts';

const url = Deno.env.get('FINLY_DATABASE_URL');
if (!url) {
  console.error(JSON.stringify({ level: 'fatal', msg: 'FINLY_DATABASE_URL is not set' }));
  Deno.exit(1);
}
const { client, sql } = openPostgres(url, { max: 10, applicationName: 'finly-api' });
const handler = api(sql, new EnvKekSource());
const port = Number(Deno.env.get('PORT') ?? '8787');

const server = Deno.serve({
  port,
  hostname: '0.0.0.0',
  onListen: () => {
    console.log(JSON.stringify({ level: 'info', msg: 'finly api listening', port, version: VERSION }));
  },
}, (req, info) => handler(req, (info.remoteAddr as Deno.NetAddr).hostname));

const stop = async () => {
  await server.shutdown();
  await client.end({ timeout: 5 });
  Deno.exit(0);
};
Deno.addSignalListener('SIGINT', stop);
if (Deno.build.os !== 'windows') Deno.addSignalListener('SIGTERM', stop);
