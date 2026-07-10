alter table public.profiles
  alter column primary_role set default 'client',
  alter column role set default 'client';

update public.profiles
set primary_role = case
  when primary_role::text in ('sender', 'both') then 'client'::public.user_role
  else primary_role
end;

update public.profiles
set role = case
  when role::text in ('sender', 'both') then 'client'::public.user_role
  else role
end;

update public.profiles
set identity_status = 'approved'
where is_verified = true
  and identity_status = 'pending';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  selected_role public.user_role := 'client';
  raw_role text := lower(coalesce(new.raw_user_meta_data->>'primary_role', ''));
begin
  if raw_role in ('client', 'local_transporter', 'traveler') then
    selected_role := raw_role::public.user_role;
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    phone,
    country,
    city,
    address_line1,
    primary_role,
    role,
    account_status
  )
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'country', ''),
    nullif(new.raw_user_meta_data->>'city', ''),
    nullif(new.raw_user_meta_data->>'address_line1', ''),
    selected_role,
    selected_role,
    case
      when new.email_confirmed_at is null then 'pending_email_confirmation'::public.account_status
      else 'active'::public.account_status
    end
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    phone = coalesce(public.profiles.phone, excluded.phone),
    country = coalesce(public.profiles.country, excluded.country),
    city = coalesce(public.profiles.city, excluded.city),
    address_line1 = coalesce(public.profiles.address_line1, excluded.address_line1),
    primary_role = excluded.primary_role,
    role = excluded.role,
    updated_at = now();

  return new;
end;
$$;
