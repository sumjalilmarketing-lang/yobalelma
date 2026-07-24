create type public.upload_security_status as enum ('pending', 'clean', 'infected', 'failed');

create table public.secure_uploads (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  bucket text not null,
  storage_path text not null,
  declared_mime_type text not null,
  declared_size_bytes integer not null check (declared_size_bytes > 0),
  security_status public.upload_security_status not null default 'pending',
  scanner_reference text,
  scanned_at timestamptz,
  failure_reason text,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, storage_path),
  check (storage_path like profile_id::text || '/%')
);

create index secure_uploads_profile_status_idx
  on public.secure_uploads (profile_id, security_status, created_at desc);

create trigger secure_uploads_set_updated_at
before update on public.secure_uploads
for each row execute function public.set_updated_at();

alter table public.secure_uploads enable row level security;

create policy "secure_uploads_select_own_or_security_staff" on public.secure_uploads
for select using (
  profile_id = auth.uid()
  or public.current_user_has_role(array['admin', 'super_admin', 'security_manager'])
);

create or replace function public.register_secure_upload(
  p_bucket text,
  p_storage_path text,
  p_declared_mime_type text,
  p_declared_size_bytes integer
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_upload_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_storage_path not like auth.uid()::text || '/%' then raise exception 'Invalid upload owner'; end if;

  insert into public.secure_uploads (
    profile_id, bucket, storage_path, declared_mime_type, declared_size_bytes
  ) values (
    auth.uid(), p_bucket, p_storage_path, p_declared_mime_type, p_declared_size_bytes
  ) returning id into v_upload_id;

  return v_upload_id;
end;
$$;

create or replace function public.submit_identity_verification(
  p_document_type public.identity_document_type,
  p_document_number text,
  p_issuing_country text,
  p_expires_on date,
  p_documents jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public, storage
as $$
declare
  v_verification_id uuid;
  v_document jsonb;
  v_required_kind text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_expires_on <= current_date then raise exception 'Document expired'; end if;
  if jsonb_typeof(p_documents) <> 'array' or jsonb_array_length(p_documents) = 0 then
    raise exception 'At least one document is required';
  end if;
  if exists (
    select 1 from public.identity_verifications
    where profile_id = auth.uid() and status in ('pending', 'submitted')
  ) then raise exception 'An identity review is already active'; end if;

  foreach v_required_kind in array case when p_document_type = 'passport'
    then array['passport', 'selfie'] else array['front', 'selfie'] end
  loop
    if not exists (
      select 1 from jsonb_array_elements(p_documents) d
      where d->>'kind' = v_required_kind
    ) then raise exception 'Required identity document is missing'; end if;
  end loop;

  for v_document in select value from jsonb_array_elements(p_documents)
  loop
    if (v_document->>'kind') not in ('front', 'back', 'selfie', 'passport') then
      raise exception 'Invalid identity document kind';
    end if;
    if not exists (
      select 1
      from public.secure_uploads u
      join storage.objects o on o.bucket_id = u.bucket and o.name = u.storage_path
      where u.profile_id = auth.uid()
        and u.bucket = 'kyc-documents'
        and u.storage_path = v_document->>'path'
        and u.security_status = 'clean'
        and u.consumed_at is null
        and coalesce((o.metadata->>'size')::bigint, 0) = u.declared_size_bytes
        and coalesce(o.metadata->>'mimetype', '') = u.declared_mime_type
    ) then raise exception 'Identity document has not passed security controls'; end if;
  end loop;

  insert into public.identity_verifications (
    profile_id, document_type, document_number, issuing_country, expires_on, status
  ) values (
    auth.uid(), p_document_type, nullif(trim(p_document_number), ''), trim(p_issuing_country), p_expires_on, 'submitted'
  ) returning id into v_verification_id;

  insert into public.identity_verification_documents (
    verification_id, profile_id, document_kind, storage_bucket, storage_path, mime_type, file_size_bytes
  )
  select v_verification_id, auth.uid(), (d->>'kind')::public.identity_document_kind,
    u.bucket, u.storage_path, u.declared_mime_type, u.declared_size_bytes
  from jsonb_array_elements(p_documents) d
  join public.secure_uploads u on u.profile_id = auth.uid()
    and u.bucket = 'kyc-documents' and u.storage_path = d->>'path';

  update public.secure_uploads set consumed_at = now()
  where profile_id = auth.uid() and bucket = 'kyc-documents'
    and storage_path in (select d->>'path' from jsonb_array_elements(p_documents) d);

  insert into public.identity_verification_decisions (verification_id, actor_id, decision, comment)
  values (v_verification_id, auth.uid(), 'submitted', 'Soumission utilisateur.');

  update public.profiles set identity_status = 'submitted' where id = auth.uid();
  return v_verification_id;
end;
$$;

create or replace function public.review_identity_verification(
  p_verification_id uuid,
  p_decision public.identity_decision,
  p_comment text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  if not public.current_user_has_role(array[
    'admin', 'super_admin', 'traveler_manager', 'traveler_validation',
    'customs_manager', 'compliance_manager', 'compliance_agent'
  ]) then raise exception 'KYC review permission required'; end if;
  if p_decision not in ('approved', 'rejected', 'needs_more_information') then
    raise exception 'Invalid KYC decision';
  end if;
  if p_decision in ('rejected', 'needs_more_information') and length(trim(coalesce(p_comment, ''))) < 8 then
    raise exception 'A review reason is required';
  end if;

  update public.identity_verifications set
    status = p_decision::text::public.identity_verification_status,
    reviewed_at = now(), reviewed_by = auth.uid(),
    rejection_reason = case when p_decision = 'rejected' then trim(p_comment) else null end
  where id = p_verification_id and status = 'submitted'
  returning profile_id into v_profile_id;

  if v_profile_id is null then raise exception 'KYC review is not available'; end if;
  update public.profiles set identity_status = p_decision::text::public.identity_verification_status
  where id = v_profile_id;
  insert into public.identity_verification_decisions (verification_id, actor_id, decision, comment)
  values (p_verification_id, auth.uid(), p_decision, nullif(trim(p_comment), ''));
end;
$$;

revoke all on function public.register_secure_upload(text, text, text, integer) from public;
revoke all on function public.submit_identity_verification(public.identity_document_type, text, text, date, jsonb) from public;
revoke all on function public.review_identity_verification(uuid, public.identity_decision, text) from public;
grant execute on function public.register_secure_upload(text, text, text, integer) to authenticated;
grant execute on function public.submit_identity_verification(public.identity_document_type, text, text, date, jsonb) to authenticated;
grant execute on function public.review_identity_verification(uuid, public.identity_decision, text) to authenticated;
