/**
 * The composition root: one place that turns configuration into a working API. Used by the server entry point, the
 * Supabase Edge Function and the end-to-end tests, so all three run the same wiring.
 */
import { ActivityService } from '../app/books/activity.ts';
import { BooksService } from '../app/books/service.ts';
import { IdentityService } from '../app/identity/service.ts';
import { PostingService } from '../app/posting/service.ts';
import { BlindIndex } from '../crypto/blind.ts';
import { HashChain } from '../crypto/chain.ts';
import { Cipher } from '../crypto/cipher.ts';
import { type KekSource, KeyRing } from '../crypto/keys.ts';
import { TokenSigner } from '../crypto/token.ts';
import type { Sql } from '../db/sql.ts';
import { type ApiDeps, createApi } from '../http/app.ts';

export const VERSION = '1.0.0';

export interface Services extends ApiDeps {
  keys: KeyRing;
}

export function compose(db: Sql, kek: KekSource, log?: ApiDeps['log']): Services {
  const keys = new KeyRing(kek);
  const cipher = new Cipher(keys);
  const blind = new BlindIndex(keys);
  const chain = new HashChain(keys);
  const books = new BooksService(db, { cipher, blind, chain });
  return {
    keys,
    identity: new IdentityService(db, new TokenSigner(keys), blind),
    books,
    activity: new ActivityService(books, cipher),
    posting: new PostingService(db, { cipher, blind, chain }),
    ping: async () => {
      await db.query('select 1');
    },
    log,
    version: VERSION,
  };
}

export function api(db: Sql, kek: KekSource, log?: ApiDeps['log']) {
  return createApi(compose(db, kek, log));
}
