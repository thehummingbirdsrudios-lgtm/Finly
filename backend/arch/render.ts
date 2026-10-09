/** Writes docs/architecture/module-map.md from the import graph (`deno task arch:map`). */
import { readGraph, renderMap } from './graph.ts';

export const MAP_FILE = new URL('../../docs/architecture/module-map.md', import.meta.url);

if (import.meta.main) {
  await Deno.mkdir(new URL('./', MAP_FILE), { recursive: true });
  await Deno.writeTextFile(MAP_FILE, renderMap(await readGraph()));
  console.log(`Wrote ${MAP_FILE.pathname}`);
}
