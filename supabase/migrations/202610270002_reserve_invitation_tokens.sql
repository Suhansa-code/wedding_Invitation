begin;

-- Prevent writes between the backfill and installing the reservation trigger.
lock table public.invitations in share row exclusive mode;

create table private.invitation_tokens (
  token text primary key
);
alter table private.invitation_tokens enable row level security;
revoke all on private.invitation_tokens from public, anon, authenticated, service_role;

insert into private.invitation_tokens (token)
  select token from public.invitations;

create function private.reserve_invitation_token()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.token is not distinct from old.token then
    return new;
  end if;

  insert into private.invitation_tokens (token) values (new.token)
    on conflict (token) do nothing;
  if not found then
    raise unique_violation using message = 'Invitation token has already been issued';
  end if;
  return new;
end;
$$;
revoke all on function private.reserve_invitation_token() from public, anon, authenticated, service_role;

-- AFTER runs only for rows accepted by constraints and RLS; reservations roll back with the write.
create trigger invitations_reserve_token after insert or update of token on public.invitations
  for each row execute function private.reserve_invitation_token();

commit;
