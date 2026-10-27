begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from public, anon, authenticated;
grant select on public.admin_users to authenticated;
create policy "Administrators can read their own membership"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

create function private.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null check (
    char_length(guest_name) between 1 and 160 and btrim(guest_name) <> ''
    and guest_name !~ U&'[\0001-\001F\007F-\009F\2028\2029\202A-\202E\2066-\2069]'
  ),
  title text not null default '' check (title in ('', 'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Mr. & Mrs.', 'Family')),
  display_name text not null check (
    char_length(display_name) between 1 and 160 and btrim(display_name) <> ''
    and display_name !~ U&'[\0001-\001F\007F-\009F\2028\2029\202A-\202E\2066-\2069]'
  ),
  token text not null unique check (char_length(token) between 8 and 128 and token ~ '^[A-Za-z0-9_-]+$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index invitations_created_at_idx on public.invitations (created_at desc, id);

create function private.set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function private.set_updated_at() from public, anon, authenticated;
create trigger invitations_updated_at before update on public.invitations
  for each row execute function private.set_updated_at();

alter table public.invitations enable row level security;
revoke all on public.invitations from public, anon, authenticated;
grant select, insert, update on public.invitations to authenticated;
grant select on public.invitations to service_role;
create policy "Administrators can read invitations" on public.invitations
  for select to authenticated using ((select private.is_admin()));
create policy "Administrators can create invitations" on public.invitations
  for insert to authenticated with check ((select private.is_admin()));
create policy "Administrators can update invitations" on public.invitations
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

commit;
