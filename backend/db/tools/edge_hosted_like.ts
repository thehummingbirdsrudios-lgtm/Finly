/**
 * Runs the bundled API (build/edge/index.js) the way the hosted Supabase runtime does: without the Node globals that
 * local Deno adds to plain code. Used by `deno task dev:api`, so the local smoke test (deploy-api.md §3) catches a
 * dependency on any of them before a deploy does.
 */
const NODE_ONLY_GLOBALS = ['Buffer', 'process', 'setImmediate', 'clearImmediate', 'global'];

for (const name of NODE_ONLY_GLOBALS) delete (globalThis as Record<string, unknown>)[name];
// A computed specifier: the bundle is build output, so type checking (and CI) must not need it to exist.
await import(new URL('../../build/edge/index.js', import.meta.url).href);
