import { assert, assertEquals, assertNotEquals, assertRejects } from '@std/assert';
import { FinlyError } from '../../src/domain/errors.ts';
import { Cipher, ctx, keyVersionOf } from '../../src/crypto/cipher.ts';
import { EnvKekSource, KeyRing, StaticKekSource } from '../../src/crypto/keys.ts';
import { bandOf, bandsFor, BlindIndex } from '../../src/crypto/blind.ts';
import { canonical, HashChain } from '../../src/crypto/chain.ts';

const kek = () => crypto.getRandomValues(new Uint8Array(32));
const ring = (keks = new Map([[1, kek()]]), active = 1) => new KeyRing(new StaticKekSource(keks, active));

Deno.test('amounts round-trip, including negative balances and the largest allowed amount', async () => {
  const c = new Cipher(ring());
  for (const v of [1n, 45000n, 999_999_999_999n, -1_20_000n, 0n]) {
    const at = ctx('journal_line', 'amount_enc', 'row-1');
    assertEquals(await c.decryptAmount(await c.encryptAmount(v, at), at), v);
  }
});

Deno.test('every amount ciphertext has the same length, whatever the amount', async () => {
  const c = new Cipher(ring());
  const lengths = new Set<number>();
  for (const v of [1n, 9n, 45000n, 999_999_999_999n]) lengths.add((await c.encryptAmount(v, 'x')).length);
  assertEquals([...lengths], [39]);
});

Deno.test('the same amount encrypts differently each time (random nonce)', async () => {
  const c = new Cipher(ring());
  assertNotEquals(await c.encryptAmount(5000n, 'x'), await c.encryptAmount(5000n, 'x'));
});

Deno.test('tampering, moving a value to another row, or another column is refused (INTEGRITY)', async () => {
  const c = new Cipher(ring());
  const sealed = await c.encryptAmount(50000n, ctx('journal_line', 'amount_enc', 'a'));
  const flipped = sealed.slice();
  flipped[20] ^= 1;
  for (
    const attempt of [
      () => c.decryptAmount(flipped, ctx('journal_line', 'amount_enc', 'a')),
      () => c.decryptAmount(sealed, ctx('journal_line', 'amount_enc', 'b')),
      () => c.decryptAmount(sealed, ctx('txn_leg', 'amount_enc', 'a')),
    ]
  ) {
    const err = await assertRejects(attempt, FinlyError);
    assertEquals(err.code, 'INTEGRITY');
  }
});

Deno.test('the key-version header is authenticated: relabelling it is refused', async () => {
  const keys = new Map([[1, kek()], [2, kek()]]);
  const c = new Cipher(ring(keys, 2));
  const sealed = await c.encryptAmount(7n, 'x');
  assertEquals(keyVersionOf(sealed), 2);
  const relabelled = sealed.slice();
  relabelled[2] = 1;
  const err = await assertRejects(() => c.decryptAmount(relabelled, 'x'), FinlyError);
  assertEquals(err.code, 'INTEGRITY');
});

Deno.test('a value written under a key version that is no longer configured fails loudly, never silently', async () => {
  const k1 = kek();
  const old = await new Cipher(ring(new Map([[1, k1]]), 1)).encryptAmount(100n, 'x');
  const withoutV1 = new Cipher(ring(new Map([[2, kek()]]), 2));
  const err = await assertRejects(() => withoutV1.decryptAmount(old, 'x'), FinlyError);
  assertEquals(err.code, 'INTEGRITY');
});

Deno.test('rotation: v1 data still reads after v2 becomes active, and re-encryption moves it to v2', async () => {
  const keys = new Map([[1, kek()]]);
  const v1 = await new Cipher(ring(keys, 1)).encryptAmount(45000n, 'x');
  keys.set(2, kek());
  const c = new Cipher(ring(keys, 2));
  assertEquals(await c.decryptAmount(v1, 'x'), 45000n);
  const v2 = await c.reencrypt(v1, 'x');
  assertEquals(keyVersionOf(v2), 2);
  assertEquals(await c.decryptAmount(v2, 'x'), 45000n);
});

Deno.test('text values round-trip with their context', async () => {
  const c = new Cipher(ring());
  const at = ctx('txn_note', 'note_enc', 'n1');
  assertEquals(
    await c.decryptText(await c.encryptText('Angadiya visit — ₹45,000', at), at),
    'Angadiya visit — ₹45,000',
  );
});

Deno.test('blind indexes: equal within an environment, different across environments and keys', async () => {
  const r = ring();
  const b = new BlindIndex(r);
  assertEquals(await b.amount('mint', 45000n), await b.amount('mint', 45000n));
  assertNotEquals(await b.amount('mint', 45000n), await b.amount('jsk', 45000n));
  assertNotEquals(await b.amount('mint', 45000n), await new BlindIndex(ring()).amount('mint', 45000n));
  assertEquals((await b.amount('mint', 1n)).length, 16);
  assertEquals(await b.phone('+91 98765 43210'), await b.phone('9876543210'));
});

Deno.test('amount bands cover a range filter', () => {
  assertEquals(bandOf(45000n), 4);
  assertEquals(bandOf(-45000n), 4);
  assertEquals(bandsFor(10000n, 50000n), [3, 4, 5]);
});

Deno.test('hash chain: verifies its own links; any change to content, order or previous hash breaks it', async () => {
  const chain = new HashChain(ring());
  const genesis = new Uint8Array(0);
  const content = { journal: 'j1', lines: [{ side: 'Dr', amount: 50000n }, { side: 'Cr', amount: 50000n }] };
  const h1 = await chain.link(genesis, content);
  assert(await chain.verify(genesis, content, h1, 1));
  assert(!await chain.verify(genesis, { ...content, journal: 'j2' }, h1, 1));
  assert(!await chain.verify(h1, content, h1, 1));
  assertEquals(canonical({ b: 1n, a: [true, null] }), '{"a":[true,null],"b":"1"}');
});

Deno.test('the environment key source requires an active, well-formed key', () => {
  const env = (vars: Record<string, string | undefined>) => ({ get: (n: string) => vars[n] });
  const good = btoa(String.fromCharCode(...kek()));
  assertEquals(new EnvKekSource(env({ FINLY_KEK_ACTIVE: '1', FINLY_KEK_V1: good })).activeVersion(), 1);
  for (
    const bad of [{}, { FINLY_KEK_ACTIVE: '2', FINLY_KEK_V1: good }, {
      FINLY_KEK_ACTIVE: '1',
      FINLY_KEK_V1: btoa('short'),
    }]
  ) {
    let threw = false;
    try {
      new EnvKekSource(env(bad));
    } catch (e) {
      threw = e instanceof FinlyError;
    }
    assert(threw, JSON.stringify(Object.keys(bad)));
  }
});
