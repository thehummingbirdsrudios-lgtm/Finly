/**
 * Encryption cost on realistic Finly workloads (docs/security/encryption-architecture.md). Run: deno task bench:crypto
 * Each bench is one user-visible operation, not one primitive, so the numbers read as screen and posting costs.
 */
import { Cipher, ctx } from '../src/crypto/cipher.ts';
import { KeyRing, StaticKekSource } from '../src/crypto/keys.ts';
import { BlindIndex } from '../src/crypto/blind.ts';
import { HashChain } from '../src/crypto/chain.ts';

const keys = new KeyRing(new StaticKekSource(new Map([[1, crypto.getRandomValues(new Uint8Array(32))]]), 1));
const cipher = new Cipher(keys);
const blind = new BlindIndex(keys);
const chain = new HashChain(keys);

async function sealed(n: number): Promise<Uint8Array[]> {
  return await Promise.all(
    Array.from(
      { length: n },
      (_, i) => cipher.encryptAmount(BigInt(1000 + i), ctx('balance_current', 'balance_enc', `${i}`)),
    ),
  );
}
const balances500 = await sealed(500);
const lines50 = await sealed(50);
const periods3600 = await sealed(3600);

Deno.bench('one amount: encrypt', { group: 'primitive', baseline: true }, async () => {
  await cipher.encryptAmount(45000n, 'x');
});
Deno.bench('one amount: decrypt', { group: 'primitive' }, async () => {
  await cipher.decryptAmount(balances500[0], ctx('balance_current', 'balance_enc', '0'));
});

Deno.bench('posting: 3 journals, 8 lines, 8 snapshot updates, 2 open items, 4 leg indexes, chain link', async () => {
  // Encrypt lines and legs, decrypt + re-encrypt the snapshots it touches, index legs, link the chain.
  const work: Promise<unknown>[] = [];
  for (let i = 0; i < 8; i++) work.push(cipher.encryptAmount(30000n, `journal_line.amount_enc:${i}`));
  for (let i = 0; i < 8; i++) {
    work.push(
      cipher.decryptAmount(balances500[i], ctx('balance_current', 'balance_enc', `${i}`))
        .then((b) => cipher.encryptAmount(b + 30000n, ctx('balance_current', 'balance_enc', `${i}`))),
    );
  }
  for (let i = 0; i < 4; i++) {
    work.push(cipher.encryptAmount(30000n, `txn_leg.amount_enc:${i}`), blind.amount('mint', 30000n));
  }
  for (let i = 0; i < 2; i++) work.push(cipher.encryptAmount(30000n, `open_item.original_enc:${i}`));
  await Promise.all(work);
  await chain.link(new Uint8Array(32), { lines: 8 });
});

Deno.bench('dashboard: decrypt 500 balance slices', async () => {
  await Promise.all(balances500.map((b, i) => cipher.decryptAmount(b, ctx('balance_current', 'balance_enc', `${i}`))));
});

Deno.bench('statement page: decrypt 50 lines', async () => {
  await Promise.all(lines50.map((b, i) => cipher.decryptAmount(b, ctx('balance_current', 'balance_enc', `${i}`))));
});

Deno.bench('yearly report: decrypt 300 slices × 12 months', async () => {
  await Promise.all(periods3600.map((b, i) => cipher.decryptAmount(b, ctx('balance_current', 'balance_enc', `${i}`))));
});
