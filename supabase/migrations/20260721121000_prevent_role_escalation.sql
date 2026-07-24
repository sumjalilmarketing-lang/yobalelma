drop policy if exists "user_roles_write_staff" on public.user_roles;
create policy "user_roles_write_super_admin" on public.user_roles
for all to authenticated
using (public.current_user_has_role(array['super_admin']))
with check (public.current_user_has_role(array['super_admin']));

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.current_user_has_role(array['super_admin']) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role::text not in ('client', 'local_transporter', 'traveler')
       or new.primary_role::text not in ('client', 'local_transporter', 'traveler') then
      raise exception 'ROLE_ESCALATION_DENIED' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.role is distinct from old.role or new.primary_role is distinct from old.primary_role then
    raise exception 'ROLE_ESCALATION_DENIED' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_escalation on public.profiles;
create trigger profiles_prevent_role_escalation
before insert or update on public.profiles
for each row execute function public.prevent_profile_role_escalation();
