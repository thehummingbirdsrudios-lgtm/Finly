/**
 * The database adapters store and return bytes exactly — through the production `Sql` port and the test handle — for
 * plain bytea and for Finly's bytea domains (`ciphertext`, `keyed_hash`). PGlite once stored a Uint8Array bound to a
 * domain column as the text "4,5,6"; this guards against that ever coming back, on every target.
 */
import { assertEquals } from '@std/assert';
import { migratedDb } from './harness.ts';

const db = await migratedDb();

Deno.test('bytes survive a round trip through a ciphertext domain column, by either handle', async () => {
  const bytes = crypto.getRandomValues(new Uint8Array(39));
  await db.exec(`create temporary table probe (c finly.ciphertext, k finly.keyed_hash, b bytea)`);
  await db.port!.query(`insert into probe values ($1, $2, $3)`, [bytes, bytes.slice(0, 16), bytes]);
  await db.query(`insert into probe values ($1, $2, $3)`, [bytes, bytes.slice(0, 16), bytes]);
  const rows = await db.port!.query<{ c: Uint8Array; k: Uint8Array; b: Uint8Array }>(`select c, k, b from probe`);
  assertEquals(rows.length, 2);
  for (const r of rows) {
    assertEquals(new Uint8Array(r.c), bytes);
    assertEquals(new Uint8Array(r.k), bytes.slice(0, 16));
    assertEquals(new Uint8Array(r.b), bytes);
  }
  // A binary parameter also matches in a WHERE clause on the domain column.
  assertEquals((await db.port!.query(`select 1 from probe where c = $1`, [bytes])).length, 2);
});
