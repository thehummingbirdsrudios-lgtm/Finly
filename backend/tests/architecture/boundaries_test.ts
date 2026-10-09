/**
 * Architecture checks (add-on 15 §1.4, §2.2): the import graph of backend/src has no cycles, every file belongs to a
 * layer, every import is allowed by arch/rules.ts, and the committed module map matches the code.
 */
import { assert, assertEquals } from '@std/assert';
import { cycles, type Graph, readGraph, renderMap, violations } from '../../arch/graph.ts';
import { MAP_FILE } from '../../arch/render.ts';
import { IMPURE, IMPURE_ALLOWED } from '../../arch/rules.ts';

const graph = await readGraph();

Deno.test('the source has no import cycles', () => {
  assertEquals(cycles(graph), []);
});

Deno.test('every import respects the layer rules', () => {
  assertEquals(violations(graph), []);
});

Deno.test('the domain layer is pure: no clock, randomness or I/O outside ids.ts', async () => {
  const impure: string[] = [];
  for (const file of graph.edges.keys()) {
    if (!file.startsWith('src/domain/') || IMPURE_ALLOWED.includes(file)) continue;
    const text = await Deno.readTextFile(new URL(`../../${file}`, import.meta.url));
    text.split('\n').forEach((line, i) => {
      if (IMPURE.test(line) && !line.trimStart().startsWith('*') && !line.trimStart().startsWith('//')) {
        impure.push(`${file}:${i + 1}: ${line.trim()}`);
      }
    });
  }
  assertEquals(impure, []);
});

Deno.test('the committed module map matches the code (run `deno task arch:map`)', async () => {
  assertEquals((await Deno.readTextFile(MAP_FILE)).replaceAll('\r\n', '\n'), renderMap(graph));
});

Deno.test('the checks themselves catch a cycle and a forbidden import', () => {
  const bad: Graph = {
    edges: new Map([
      ['src/domain/a.ts', ['src/domain/b.ts', 'src/db/postgres.ts']],
      ['src/domain/b.ts', ['src/domain/a.ts', 'postgres']],
    ]),
  };
  assertEquals(cycles(bad).length, 1);
  const found = violations(bad);
  assert(found.some((v) => v.includes('domain may not import db')), found.join('\n'));
  assert(found.some((v) => v.includes('may not use the package postgres')), found.join('\n'));
});
