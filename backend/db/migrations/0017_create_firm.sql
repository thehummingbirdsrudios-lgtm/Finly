-- 0017 Self-service creation of a firm or pool (ADDON-17 creation mode A, ADDON-18 §12, D-038).
-- Creating a firm does not make the creator its owner: the creator says whether they are an owner. An owner is recorded
-- as one (verification `unverified`, for later evidence) and receives the scoped `entity_owner` role; anyone else
-- receives the scoped `entity_admin` role. Either way the creator gets a manage grant in their name, the books are
-- provisioned, and nothing else — no other entity, no platform right — changes.
-- Data impact: none (a new function). Recovery: forward fix.

set local role finly_owner;

create function finly.create_firm(
  p_name text,
  p_type_key text,
  p_opening date,
  p_creator_is_owner boolean,
  p_share_bp int default null
) returns uuid
language plpgsql security definer set search_path = finly, pg_temp
as $$
declare
  actor uuid := finly.actor_user_id();
  person uuid := finly.actor_person_id();
  t record;
  firm uuid;
begin
  if actor is null or person is null then
    raise exception using errcode = 'F1008', message = 'Sign in with an active account to create books.';
  end if;
  select id, kind into t from finly.entity_type where key = p_type_key and status = 'active';
  if t.id is null or t.kind not in ('firm', 'pool') then
    raise exception using errcode = 'F1012', message = 'Choose a business or pool type.';
  end if;
  if p_creator_is_owner is null then
    raise exception using errcode = 'F1007', message = 'Say whether you are an owner of these books.';
  end if;
  if p_share_bp is not null and (not p_creator_is_owner or p_share_bp not between 1 and 10000) then
    raise exception using errcode = 'F1007', message = 'An ownership share is between 0.01 % and 100 %, for an owner.';
  end if;

  insert into finly.entity (kind, entity_type_id, display_name, created_by)
  values (t.kind, t.id, p_name, actor)
  returning id into firm;

  if p_creator_is_owner then
    insert into finly.entity_ownership (entity_id, owner_entity_id, share_basis, share_bp, ownership_type_id,
      verification, recorded_by, reason)
    values (firm, person, case when p_share_bp is null then 'unspecified' else 'percent' end, p_share_bp,
            (select id from finly.lookup_value where list_key = 'ownership_type' and key = 'individual'),
            'unverified', actor, 'Declared by the creator when the books were created');
    insert into finly.env_access (user_id, env_entity_id, level, source, granted_by, reason)
    values (actor, firm, 'manage', 'ownership', actor, 'Creator and declared owner');
  else
    insert into finly.env_access (user_id, env_entity_id, level, source, granted_by, reason)
    values (actor, firm, 'manage', 'admin', actor, 'Creator of these books');
  end if;
  insert into finly.user_role (user_id, role_id, scope_entity_id, granted_by, reason)
  values (actor, (select id from finly.role where key = case when p_creator_is_owner then 'entity_owner'
                                                           else 'entity_admin' end),
          firm, actor, 'Creator of these books');

  perform finly.provision_books(firm, p_opening);
  return firm;
end
$$;
comment on function finly.create_firm(text, text, date, boolean, int) is
  'Self-service creation of a firm or pool by the signed-in user: the creator says whether they are an owner (recorded, unverified) and is granted entity_owner or entity_admin there, scoped; the books are provisioned. Nothing else changes.';

revoke all on function finly.create_firm(text, text, date, boolean, int) from public;
grant execute on function finly.create_firm(text, text, date, boolean, int) to finly_api;
