-- Run against a migrated LOCAL test database as its owner:
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/invitations_rls.sql
-- Fixtures and mutations are rolled back. No pgTAP extension is required.
begin;

insert into auth.users (id) values
  ('a0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000002');
insert into public.admin_users (user_id) values ('a0000000-0000-4000-8000-000000000001');
insert into public.invitations (id, guest_name, display_name, token) values
  ('a0000000-0000-4000-8000-000000000003', 'RLS Guest', 'RLS Guest', 'rls-test-private-token');

do $$
begin
  if exists (
    select 1 from pg_roles
    where rolname in ('anon', 'authenticated', 'service_role')
      and (
        has_table_privilege(oid, 'private.invitation_tokens', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
        or has_function_privilege(oid, 'private.reserve_invitation_token()', 'EXECUTE')
      )
  ) then
    raise exception 'An application role has direct token registry access';
  end if;
end;
$$;

set local role anon;
do $$
begin
  begin
    perform display_name from public.invitations;
    raise exception 'Anonymous invitation SELECT unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform user_id from public.admin_users;
    raise exception 'Anonymous membership SELECT unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000002';
do $$
begin
  if exists (select 1 from public.invitations) or exists (select 1 from public.admin_users) then
    raise exception 'Non-administrator read private rows';
  end if;
  update public.invitations set is_active = false where id = 'a0000000-0000-4000-8000-000000000003';
  if found then raise exception 'Non-administrator updated an invitation'; end if;
  begin
    insert into public.invitations (guest_name, display_name, token) values ('Unauthorized', 'Unauthorized', 'rls-test-denied-token');
    raise exception 'Non-administrator inserted an invitation';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.admin_users (user_id) values ('a0000000-0000-4000-8000-000000000002');
    raise exception 'Non-administrator granted themselves membership';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set local request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000001';
do $$
begin
  if not exists (select 1 from public.admin_users where user_id = auth.uid()) then
    raise exception 'Administrator cannot read their own membership';
  end if;
  if not exists (select 1 from public.invitations where id = 'a0000000-0000-4000-8000-000000000003') then
    raise exception 'Administrator cannot read invitations';
  end if;
  insert into public.invitations (guest_name, title, display_name, token)
    values ('Created Guest', 'Mr. & Mrs.', 'Our Dear Friends', 'rls-test-created-token');
  update public.invitations set display_name = 'Updated Guest', is_active = false
    where id = 'a0000000-0000-4000-8000-000000000003';
  if not found then raise exception 'Administrator update failed'; end if;
  if not exists (select 1 from public.invitations where id = 'a0000000-0000-4000-8000-000000000003' and token = 'rls-test-private-token' and not is_active) then
    raise exception 'Editing details changed the token or failed to deactivate';
  end if;
  begin
    insert into public.admin_users (user_id) values ('a0000000-0000-4000-8000-000000000002');
    raise exception 'Administrator wrote membership';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.admin_users where user_id = auth.uid();
    raise exception 'Administrator deleted membership';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.invitations where id = 'a0000000-0000-4000-8000-000000000003';
    raise exception 'Administrator deleted an invitation instead of deactivating it';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.invitations (guest_name, display_name, token) values ('Duplicate', 'Duplicate', 'rls-test-private-token');
    raise exception 'Duplicate token accepted';
  exception when unique_violation then null;
  end;
  update public.invitations set token = 'rls-test-regenerated-token'
    where id = 'a0000000-0000-4000-8000-000000000003';
  if not found then raise exception 'Administrator token regeneration failed'; end if;
  if not exists (select 1 from public.invitations where id = 'a0000000-0000-4000-8000-000000000003' and token = 'rls-test-regenerated-token' and not is_active) then
    raise exception 'Regeneration did not replace the token or reactivated the invitation';
  end if;
  begin
    insert into public.invitations (guest_name, display_name, token) values ('Reused', 'Reused', 'rls-test-private-token');
    raise exception 'Retired token accepted on insert';
  exception when unique_violation then
    if sqlerrm <> 'Invitation token has already been issued' then
      raise exception 'Retired token rejection did not use the generic registry error';
    end if;
  end;
  begin
    update public.invitations set token = 'rls-test-private-token'
      where id = 'a0000000-0000-4000-8000-000000000003';
    raise exception 'Retired token accepted on original invitation update';
  exception when unique_violation then null;
  end;
  begin
    update public.invitations set token = 'rls-test-private-token' where token = 'rls-test-created-token';
    raise exception 'Retired token accepted on another invitation update';
  exception when unique_violation then null;
  end;
  update public.invitations set token = token, guest_name = 'Renamed Guest', display_name = 'Renamed Display'
    where id = 'a0000000-0000-4000-8000-000000000003';
  if not found then raise exception 'Unchanged-token name edit failed'; end if;
  if not exists (select 1 from public.invitations where id = 'a0000000-0000-4000-8000-000000000003' and token = 'rls-test-regenerated-token' and guest_name = 'Renamed Guest' and display_name = 'Renamed Display') then
    raise exception 'Unchanged-token name edit altered the token or failed to update names';
  end if;
  if exists (select 1 from public.invitations where token = 'rls-test-private-token') then
    raise exception 'Retired token remains visible in application invitation rows';
  end if;
  begin
    insert into public.invitations (guest_name, display_name, token) values ('Short Token', 'Short Token', 'short');
    raise exception 'Short token accepted';
  exception when check_violation then null;
  end;
  begin
    update public.invitations set guest_name = E'Guest\nName' where id = 'a0000000-0000-4000-8000-000000000003';
    raise exception 'Multiline guest name accepted';
  exception when check_violation then null;
  end;
  begin
    update public.invitations set display_name = U&'Guest\2028Name' where id = 'a0000000-0000-4000-8000-000000000003';
    raise exception 'Multiline display name accepted';
  exception when check_violation then null;
  end;
end;
$$;

set local role service_role;
do $$
begin
  if exists (select display_name from public.invitations where token = 'rls-test-private-token' and is_active = true) then
    raise exception 'Retired invitation token resolved';
  end if;
  if exists (select display_name from public.invitations where token = 'rls-test-regenerated-token' and is_active = true) then
    raise exception 'Inactive invitation resolved';
  end if;
  if not exists (select display_name from public.invitations where token = 'rls-test-created-token' and is_active = true) then
    raise exception 'Active invitation could not be resolved by the server role';
  end if;
end;
$$;

reset role;
delete from public.admin_users where user_id = 'a0000000-0000-4000-8000-000000000001';
set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000001';
do $$
begin
  if exists (select 1 from public.invitations) then
    raise exception 'Revoked administrator retained invitation access';
  end if;
end;
$$;

rollback;
