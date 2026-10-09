/**
 * Sets the API function's secrets (deploy-api.md §2) without any value appearing on screen, in Git, in logs, in a
 * process list or in chat:
 *
 * - `FINLY_DATABASE_URL` ← `FINLY_SUPABASE_APP_URL` in backend/.env.local (made by `deno task db:login finly_app …`);
 * - `FINLY_KEK_V1`, `FINLY_KEK_ACTIVE=1` ← the production key-encryption key. It is created here once, written to
 *   %USERPROFILE%/.finly/finly-kek-v1.txt (outside the repository) for the owner to escrow (key-recovery.md §1), and
 *   reused from that file afterwards. If the function already has a key but the file is gone, the tool stops: a new
 *   key would make every amount written with the old one unreadable.
 *
 * The values reach the pinned Supabase CLI through a temporary file under build/ (git-ignored) that is deleted at
 * once. Needs the owner's one-time `npx --yes supabase@2.118.0 login`.
 *
 *   deno task edge:secrets
 */
const PROJECT_REF = 'joidjmwfajbeivyffymb';
const CLI = ['--yes', 'supabase@2.118.0'];
const NPX = Deno.build.os === 'windows' ? 'npx.cmd' : 'npx';

function stop(message: string): never {
  console.error(message);
  Deno.exit(1);
}

async function cli(args: string[]): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  const out = await new Deno.Command(NPX, {
    args: [...CLI, ...args, '--project-ref', PROJECT_REF],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const text = new TextDecoder();
  return { ok: out.success, stdout: text.decode(out.stdout), stderr: text.decode(out.stderr) };
}

/** Names of the secrets the function already has (the CLI shows names and digests, never values). */
async function existingSecretNames(): Promise<Set<string>> {
  const listed = await cli(['secrets', 'list', '--output', 'json']);
  if (!listed.ok) {
    stop(
      /AccessToken|login/i.test(listed.stderr + listed.stdout)
        ? 'The Supabase CLI is not signed in. Run `npx --yes supabase@2.118.0 login` in a terminal first.'
        : `Could not list the function secrets: ${listed.stderr.trim().slice(0, 300)}`,
    );
  }
  try {
    const rows = JSON.parse(listed.stdout) as { name?: string }[];
    return new Set(rows.map((r) => r.name ?? '').filter(Boolean));
  } catch {
    return new Set(listed.stdout.match(/\b[A-Z][A-Z0-9_]+\b/g) ?? []);
  }
}

function isKek(value: string): boolean {
  try {
    return atob(value).length === 32;
  } catch {
    return false;
  }
}

/** Reads the escrow file's key, or creates the file with a new key when the function has none yet. */
async function productionKek(alreadySet: boolean): Promise<{ kek: string; file: string; created: boolean }> {
  const home = Deno.env.get('USERPROFILE') ?? Deno.env.get('HOME') ?? stop('No home directory to keep the key in.');
  const dir = `${home}/.finly`;
  const file = `${dir}/finly-kek-v1.txt`;
  try {
    const kek = (await Deno.readTextFile(file)).match(/^FINLY_KEK_V1=(.+)$/m)?.[1]?.trim() ?? '';
    if (!isKek(kek)) stop(`${file} does not hold a valid FINLY_KEK_V1 line; fix or restore it from escrow.`);
    return { kek, file, created: false };
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e;
  }
  if (alreadySet) {
    stop(
      'The function already has FINLY_KEK_V1 but the local copy is missing. Restore ' + file +
        ' from escrow (one line: FINLY_KEK_V1=<value>) and run again; a new key would make existing amounts unreadable.',
    );
  }
  const kek = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(
    file,
    `# Finly production key-encryption key, version 1, created ${new Date().toISOString().slice(0, 10)}.\n` +
      '# Escrow it now in two offline places kept apart from each other (docs/operations/key-recovery.md §1).\n' +
      '# Losing every copy makes all encrypted amounts unreadable for good. Never paste it into chat or a commit.\n' +
      `FINLY_KEK_V1=${kek}\n`,
    { mode: 0o600, createNew: true },
  );
  return { kek, file, created: true };
}

const databaseUrl = Deno.env.get('FINLY_SUPABASE_APP_URL') ??
  stop('FINLY_SUPABASE_APP_URL is not set in backend/.env.local (deno task db:login finly_app …).');
if (!databaseUrl.startsWith('postgresql://') || /['\s]/.test(databaseUrl)) {
  stop('FINLY_SUPABASE_APP_URL is not a plain postgresql:// URL.');
}

const names = await existingSecretNames();
const { kek, file, created } = await productionKek(names.has('FINLY_KEK_V1'));

const temp = new URL('../../build/edge-deploy/secrets.env', import.meta.url);
await Deno.mkdir(new URL('./', temp), { recursive: true });
// Deno.exit skips `finally`, so the outcome is only acted on after the file holding the values is gone.
let set: Awaited<ReturnType<typeof cli>>;
try {
  await Deno.writeTextFile(
    temp,
    `FINLY_DATABASE_URL='${databaseUrl}'\nFINLY_KEK_ACTIVE='1'\nFINLY_KEK_V1='${kek}'\n`,
    { mode: 0o600 },
  );
  set = await cli([
    'secrets',
    'set',
    '--env-file',
    decodeURIComponent(temp.pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  ]);
} finally {
  await Deno.remove(temp).catch(() => {});
}
if (!set.ok) stop(`Setting the secrets failed: ${set.stderr.trim().slice(0, 300)}`);

console.log(JSON.stringify({
  secretsSet: ['FINLY_DATABASE_URL', 'FINLY_KEK_ACTIVE', 'FINLY_KEK_V1'],
  keyFile: file,
  keyCreatedNow: created,
  next: created
    ? 'Escrow the key file in two offline places now, then run deno task edge:deploy.'
    : 'Run deno task edge:deploy if the function code changed.',
}));
