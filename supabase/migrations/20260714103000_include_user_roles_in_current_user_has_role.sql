create or replace function public.current_user_has_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.primary_role::text = any(required_roles)
        or p.role::text = any(required_roles)
      )
  )
  or exists (
    select 1
    from public.role_assignments ra
    where ra.profile_id = auth.uid()
      and ra.status = 'active'
      and (ra.ends_at is null or ra.ends_at > now())
      and ra.role::text = any(required_roles)
  )
  or exists (
    select 1
    from public.user_roles ur
    where ur.profile_id = auth.uid()
      and ur.role_id = any(required_roles)
  );
$$;
