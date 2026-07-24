alter table public.secure_uploads
  add column if not exists scan_attempts integer not null default 0 check (scan_attempts between 0 and 10),
  add column if not exists scan_lease_until timestamptz,
  add column if not exists scanner_provider text,
  add column if not exists content_sha256 text check (content_sha256 is null or content_sha256 ~ '^[a-f0-9]{64}$'),
  add column if not exists definitions_version text;

create table if not exists public.secure_upload_scan_events (
  id uuid primary key default gen_random_uuid(), upload_id uuid not null references public.secure_uploads(id) on delete cascade,
  scanner_provider text not null, verdict public.upload_security_status not null check (verdict in ('clean','infected','failed')),
  provider_reference text, failure_code text, content_sha256 text check (content_sha256 is null or content_sha256 ~ '^[a-f0-9]{64}$'),
  definitions_version text, scanned_at timestamptz not null, created_at timestamptz not null default now()
);
create index if not exists secure_uploads_scan_queue_idx on public.secure_uploads (security_status, scan_lease_until, created_at) where security_status = 'pending';
create index if not exists secure_upload_scan_events_upload_idx on public.secure_upload_scan_events (upload_id, created_at desc);
alter table public.secure_upload_scan_events enable row level security;
create policy "secure_upload_scan_events_security_read" on public.secure_upload_scan_events for select using (public.current_user_has_role(array['security_manager','auditor','admin','super_admin']));

create or replace function public.claim_secure_upload_scan(p_provider text)
returns table (upload_id uuid, bucket text, storage_path text, declared_mime_type text, declared_size_bytes integer)
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  return query with candidate as (
    select id from public.secure_uploads where security_status = 'pending' and (scan_lease_until is null or scan_lease_until < now()) and scan_attempts < 10
    order by created_at for update skip locked limit 1
  ), claimed as (
    update public.secure_uploads u set scan_attempts = u.scan_attempts + 1, scan_lease_until = now() + interval '5 minutes', scanner_provider = p_provider
    from candidate where u.id = candidate.id returning u.id, u.bucket, u.storage_path, u.declared_mime_type, u.declared_size_bytes
  ) select * from claimed;
end; $$;

create or replace function public.complete_secure_upload_scan(
  p_upload_id uuid, p_provider text, p_verdict public.upload_security_status, p_provider_reference text,
  p_failure_code text, p_content_sha256 text, p_definitions_version text, p_scanned_at timestamptz
) returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  if p_verdict not in ('clean','infected','failed') then raise exception 'Invalid scan verdict'; end if;
  update public.secure_uploads set security_status = p_verdict, scanner_reference = nullif(p_provider_reference,''),
    failure_reason = case when p_verdict = 'failed' then coalesce(nullif(p_failure_code,''),'SCANNER_FAILURE') else null end,
    content_sha256 = p_content_sha256, definitions_version = p_definitions_version, scanned_at = p_scanned_at, scan_lease_until = null
  where id = p_upload_id and security_status = 'pending' and scanner_provider = p_provider and scan_lease_until >= now();
  if not found then raise exception 'Scan lease is no longer valid'; end if;
  insert into public.secure_upload_scan_events (upload_id, scanner_provider, verdict, provider_reference, failure_code, content_sha256, definitions_version, scanned_at)
  values (p_upload_id, p_provider, p_verdict, nullif(p_provider_reference,''), nullif(p_failure_code,''), p_content_sha256, p_definitions_version, p_scanned_at);
end; $$;

alter table public.notification_deliveries
  add column if not exists attempt_count integer not null default 0 check (attempt_count between 0 and 12),
  add column if not exists max_attempts integer not null default 5 check (max_attempts between 1 and 12),
  add column if not exists next_attempt_at timestamptz not null default now(), add column if not exists locked_until timestamptz,
  add column if not exists lock_token uuid, add column if not exists last_error_code text, add column if not exists dead_lettered_at timestamptz;
create index if not exists notification_delivery_queue_idx on public.notification_deliveries (status, next_attempt_at, created_at) where status = 'queued';

create or replace function public.claim_notification_delivery(p_provider text, p_channels public.notification_channel[])
returns table (delivery_id uuid, lock_token uuid, notification_event_id uuid, channel public.notification_channel, attempt_count integer)
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  return query with candidate as (
    select id from public.notification_deliveries where status = 'queued' and channel = any(p_channels) and next_attempt_at <= now()
      and (locked_until is null or locked_until < now()) and attempt_count < max_attempts order by created_at for update skip locked limit 1
  ), claimed as (
    update public.notification_deliveries d set provider = p_provider, attempt_count = d.attempt_count + 1,
      locked_until = now() + interval '2 minutes', lock_token = gen_random_uuid()
    from candidate where d.id = candidate.id returning d.id, d.lock_token, d.notification_event_id, d.channel, d.attempt_count
  ) select * from claimed;
end; $$;

create or replace function public.complete_notification_delivery(
  p_delivery_id uuid, p_lock_token uuid, p_sent boolean, p_provider_reference text, p_error_code text, p_retry_at timestamptz
) returns void language plpgsql security definer set search_path = public as $$
declare v_attempt integer; v_max integer;
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  select attempt_count, max_attempts into v_attempt, v_max from public.notification_deliveries
  where id = p_delivery_id and lock_token = p_lock_token and locked_until >= now() for update;
  if not found then raise exception 'Notification lease is no longer valid'; end if;
  update public.notification_deliveries set
    status = case when p_sent then 'sent'::public.notification_delivery_status when v_attempt >= v_max then 'failed'::public.notification_delivery_status else 'queued'::public.notification_delivery_status end,
    provider_reference = case when p_sent then nullif(p_provider_reference,'') else null end, sent_at = case when p_sent then now() else null end,
    error_message = null, last_error_code = case when p_sent then null else coalesce(nullif(p_error_code,''),'PROVIDER_FAILURE') end,
    next_attempt_at = case when not p_sent and v_attempt < v_max then greatest(coalesce(p_retry_at, now() + interval '30 seconds'), now()) else next_attempt_at end,
    dead_lettered_at = case when not p_sent and v_attempt >= v_max then now() else null end, locked_until = null, lock_token = null
  where id = p_delivery_id;
end; $$;

revoke all on function public.claim_secure_upload_scan(text) from public;
revoke all on function public.complete_secure_upload_scan(uuid,text,public.upload_security_status,text,text,text,text,timestamptz) from public;
revoke all on function public.claim_notification_delivery(text,public.notification_channel[]) from public;
revoke all on function public.complete_notification_delivery(uuid,uuid,boolean,text,text,timestamptz) from public;
grant execute on function public.claim_secure_upload_scan(text) to service_role;
grant execute on function public.complete_secure_upload_scan(uuid,text,public.upload_security_status,text,text,text,text,timestamptz) to service_role;
grant execute on function public.claim_notification_delivery(text,public.notification_channel[]) to service_role;
grant execute on function public.complete_notification_delivery(uuid,uuid,boolean,text,text,timestamptz) to service_role;
