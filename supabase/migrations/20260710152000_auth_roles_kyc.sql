alter type public.user_role add value if not exists 'client';
alter type public.user_role add value if not exists 'local_transporter';
alter type public.user_role add value if not exists 'relay_agent';
alter type public.user_role add value if not exists 'hub_agent';
alter type public.user_role add value if not exists 'collection_driver';
alter type public.user_role add value if not exists 'operations_manager';
alter type public.user_role add value if not exists 'support_agent';
alter type public.user_role add value if not exists 'super_admin';

create type public.account_status as enum (
  'pending_email_confirmation',
  'active',
  'suspended',
  'closed'
);

create type public.identity_verification_status as enum (
  'pending',
  'submitted',
  'approved',
  'rejected',
  'needs_more_information',
  'expired'
);

create type public.identity_document_type as enum (
  'national_id',
  'passport',
  'residence_permit',
  'driver_license'
);

create type public.identity_document_kind as enum (
  'front',
  'back',
  'selfie',
  'passport'
);

create type public.identity_decision as enum (
  'submitted',
  'approved',
  'rejected',
  'needs_more_information'
);

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists postal_code text,
  add column if not exists primary_role public.user_role,
  add column if not exists account_status public.account_status not null default 'pending_email_confirmation',
  add column if not exists identity_status public.identity_verification_status not null default 'pending',
  add column if not exists last_sign_in_at timestamptz;

update public.profiles
set primary_role = role
where primary_role is null;

alter table public.profiles
  alter column primary_role set default 'sender',
  alter column primary_role set not null;

create table public.role_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  assigned_by uuid references public.profiles(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  reason text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint role_assignments_dates_check check (ends_at is null or ends_at > starts_at)
);

create table public.identity_verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  document_type public.identity_document_type not null,
  document_number text,
  issuing_country text not null,
  expires_on date not null,
  status public.identity_verification_status not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.identity_verification_documents (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.identity_verifications(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  document_kind public.identity_document_kind not null,
  storage_bucket text not null default 'kyc-documents',
  storage_path text not null,
  mime_type text,
  file_size_bytes integer check (file_size_bytes is null or file_size_bytes > 0),
  created_at timestamptz not null default now(),
  unique (verification_id, document_kind, storage_path)
);

create table public.identity_verification_decisions (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.identity_verifications(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  decision public.identity_decision not null,
  comment text,
  created_at timestamptz not null default now()
);

create unique index role_assignments_one_active_role_idx
  on public.role_assignments (profile_id, role)
  where status = 'active';

create index role_assignments_profile_idx
  on public.role_assignments (profile_id, status);

create index identity_verifications_profile_idx
  on public.identity_verifications (profile_id, status, created_at desc);

create index identity_verification_documents_profile_idx
  on public.identity_verification_documents (profile_id, verification_id);

create index identity_verification_decisions_verification_idx
  on public.identity_verification_decisions (verification_id, created_at desc);

create trigger role_assignments_set_updated_at
before update on public.role_assignments
for each row execute function public.set_updated_at();

create trigger identity_verifications_set_updated_at
before update on public.identity_verifications
for each row execute function public.set_updated_at();

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
  );
$$;

alter table public.role_assignments enable row level security;
alter table public.identity_verifications enable row level security;
alter table public.identity_verification_documents enable row level security;
alter table public.identity_verification_decisions enable row level security;

create policy "profiles_select_internal_staff" on public.profiles
for select using (
  public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager',
    'support_agent'
  ])
);

create policy "profiles_update_internal_staff" on public.profiles
for update using (
  public.current_user_has_role(array['admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['admin', 'super_admin'])
);

create policy "role_assignments_select_own_or_staff" on public.role_assignments
for select using (
  profile_id = auth.uid()
  or public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager',
    'support_agent'
  ])
);

create policy "role_assignments_insert_admins" on public.role_assignments
for insert with check (
  public.current_user_has_role(array['admin', 'super_admin'])
);

create policy "role_assignments_update_admins" on public.role_assignments
for update using (
  public.current_user_has_role(array['admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['admin', 'super_admin'])
);

create policy "identity_verifications_select_own_or_staff" on public.identity_verifications
for select using (
  profile_id = auth.uid()
  or public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager',
    'support_agent'
  ])
);

create policy "identity_verifications_insert_own" on public.identity_verifications
for insert with check (profile_id = auth.uid());

create policy "identity_verifications_update_own_pending" on public.identity_verifications
for update using (
  profile_id = auth.uid()
  and status in ('pending', 'submitted', 'needs_more_information')
) with check (
  profile_id = auth.uid()
  and status in ('pending', 'submitted', 'needs_more_information')
);

create policy "identity_verifications_update_staff" on public.identity_verifications
for update using (
  public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager',
    'support_agent'
  ])
) with check (
  public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager',
    'support_agent'
  ])
);

create policy "identity_documents_select_own_or_staff" on public.identity_verification_documents
for select using (
  profile_id = auth.uid()
  or public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager',
    'support_agent'
  ])
);

create policy "identity_documents_insert_own" on public.identity_verification_documents
for insert with check (profile_id = auth.uid());

create policy "identity_documents_update_own_pending" on public.identity_verification_documents
for update using (
  profile_id = auth.uid()
  and exists (
    select 1
    from public.identity_verifications v
    where v.id = identity_verification_documents.verification_id
      and v.profile_id = auth.uid()
      and v.status in ('pending', 'submitted', 'needs_more_information')
  )
) with check (
  profile_id = auth.uid()
);

create policy "identity_decisions_select_own_or_staff" on public.identity_verification_decisions
for select using (
  exists (
    select 1
    from public.identity_verifications v
    where v.id = identity_verification_decisions.verification_id
      and v.profile_id = auth.uid()
  )
  or public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager',
    'support_agent'
  ])
);

create policy "identity_decisions_insert_user_submission_or_staff" on public.identity_verification_decisions
for insert with check (
  (
    actor_id = auth.uid()
    and decision = 'submitted'
    and exists (
      select 1
      from public.identity_verifications v
      where v.id = identity_verification_decisions.verification_id
        and v.profile_id = auth.uid()
    )
  )
  or public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager',
    'support_agent'
  ])
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'kyc-documents',
  'kyc-documents',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'application/pdf']
) on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "kyc_documents_select_owner_or_staff" on storage.objects
for select using (
  bucket_id = 'kyc-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.current_user_has_role(array[
      'admin',
      'super_admin',
      'operations_manager',
      'support_agent'
    ])
  )
);

create policy "kyc_documents_insert_owner" on storage.objects
for insert with check (
  bucket_id = 'kyc-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "kyc_documents_update_owner_or_staff" on storage.objects
for update using (
  bucket_id = 'kyc-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.current_user_has_role(array['admin', 'super_admin'])
  )
) with check (
  bucket_id = 'kyc-documents'
);
