-- Catalog fingerprint of schema finly: identical on two databases ⇔ same tables, columns, defaults, constraints,
-- function bodies, policies, triggers, indexes and table privileges. Reads only the system catalogs, so the platform
-- owner can run it too — used to verify a deployment through a second, independent channel
-- (docs/operations/deployment.md §3). Applied migrations and their checksums are compared separately.
select md5(string_agg(x, E'\n' order by x)) as fingerprint, count(*)::int as items,
       count(*) filter (where x like 'tab:%')::int as tables,
       count(*) filter (where x like 'fn:%')::int as functions,
       count(*) filter (where x like 'pol:%')::int as policies
from (
  select 'tab:' || c.relname || ':' || c.relkind::text || ':' || c.relrowsecurity::text as x
  from pg_class c where c.relnamespace = 'finly'::regnamespace and c.relkind in ('r', 'v', 'p')
  union all
  select 'col:' || c.relname || '.' || a.attname || ':' || format_type(a.atttypid, a.atttypmod) || ':' || a.attnotnull::text
         || ':' || a.attgenerated::text || ':' || coalesce(pg_get_expr(d.adbin, d.adrelid), '')
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where c.relnamespace = 'finly'::regnamespace and a.attnum > 0 and not a.attisdropped and c.relkind in ('r', 'v', 'p')
  union all
  select 'con:' || conrelid::regclass::text || ':' || conname || ':' || pg_get_constraintdef(oid)
  from pg_constraint where connamespace = 'finly'::regnamespace
  union all
  select 'fn:' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || '):' || p.prosecdef::text || ':'
         || md5(pg_get_functiondef(p.oid))
  from pg_proc p where p.pronamespace = 'finly'::regnamespace
  union all
  select 'pol:' || tablename || ':' || policyname || ':' || cmd || ':' || array_to_string(roles, ',') || ':'
         || coalesce(qual, '') || ':' || coalesce(with_check, '')
  from pg_policies where schemaname = 'finly'
  union all
  select 'trg:' || tgrelid::regclass::text || ':' || tgname || ':' || pg_get_triggerdef(oid)
  from pg_trigger where not tgisinternal and tgrelid in (select oid from pg_class where relnamespace = 'finly'::regnamespace)
  union all
  select 'idx:' || pg_get_indexdef(indexrelid)
  from pg_index where indrelid in (select oid from pg_class where relnamespace = 'finly'::regnamespace)
  union all
  -- Effective privileges: a missing ACL means the default (owner only), the same as its explicit form.
  select 'acl:' || c.relname || ':' || array_to_string(array(
           select unnest(coalesce(c.relacl, acldefault(case when c.relkind = 'S' then 's' else 'r' end::"char", c.relowner)))::text
           order by 1), ',')
  from pg_class c where c.relnamespace = 'finly'::regnamespace

) t;
