/**
 * Prints the chart-of-accounts and category seed SQL from the engine's templates (src/domain/ledger/coa.ts), so the
 * seed migration and the engine start from one definition. tests/db/catalog_test.ts asserts they stay equal.
 * Usage: deno run backend/db/tools/coa_seed_sql.ts
 */
import { ACCOUNT_TEMPLATE, CATEGORY_TEMPLATE } from '../../src/domain/ledger/coa.ts';
import { ROLE_REQUIRES } from '../../src/domain/ledger/types.ts';

const q = (s: string) => `'${s.replaceAll("'", "''")}'`;
const rows: string[] = [];
let order = 0;
for (const t of ACCOUNT_TEMPLATE) {
  const needs = ROLE_REQUIRES[t.role];
  for (const kind of t.kinds) {
    if (kind === 'party') continue;
    rows.push(
      `  (${q(kind)}, ${q(t.code)}, ${q(t.name)}, ${q(t.cls)}, ${q(t.role)}, ${needs.includes('location')}, ` +
        `${needs.includes('counterparty')}, ${needs.includes('category')}, ${(order += 10)})`,
    );
  }
}
console.log(
  'insert into finly.coa_template_account\n  (entity_kind, code, name, class, role, requires_location, ' +
    'requires_counterparty, requires_category, sort_order) values\n' + rows.join(',\n') + ';\n',
);
order = 0;
console.log(
  'insert into finly.category (kind, key, name, account_code, sort_order) values\n' +
    CATEGORY_TEMPLATE.map((c) => `  (${q(c.kind)}, ${q(c.key)}, ${q(c.name)}, ${q(c.accountCode)}, ${(order += 10)})`)
      .join(',\n') +
    ';',
);
