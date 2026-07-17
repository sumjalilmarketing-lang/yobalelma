create extension if not exists pg_trgm;

alter table public.airport_hubs
  add column if not exists country_code text,
  add column if not exists currency_code text not null default 'XOF',
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6),
  add column if not exists status text not null default 'operational',
  add column if not exists supported_destination_codes text[] not null default '{}',
  add column if not exists local_rules jsonb not null default '{}'::jsonb;

create table if not exists public.hub_countries (
  country_code text primary key check (country_code ~ '^[A-Z]{2}$'),
  name text not null,
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  default_timezone text not null,
  regulations jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_timezones (
  timezone text primary key,
  utc_offset_minutes integer not null check (utc_offset_minutes between -720 and 840),
  observes_dst boolean not null default false,
  display_name text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_operating_hours (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.airport_hubs(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  break_periods jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hub_id, weekday),
  check (is_closed or (opens_at is not null and closes_at is not null and closes_at > opens_at))
);

create table if not exists public.hub_capacities (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.airport_hubs(id) on delete cascade,
  capacity_date date not null,
  inbound_package_capacity integer not null default 0 check (inbound_package_capacity >= 0),
  outbound_package_capacity integer not null default 0 check (outbound_package_capacity >= 0),
  storage_weight_capacity_kg numeric(12,2) not null default 0 check (storage_weight_capacity_kg >= 0),
  staffing_capacity_hours numeric(10,2) not null default 0 check (staffing_capacity_hours >= 0),
  reserved_weight_kg numeric(12,2) not null default 0 check (reserved_weight_kg >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hub_id, capacity_date)
);

create table if not exists public.hub_settings (
  hub_id uuid primary key references public.airport_hubs(id) on delete cascade,
  sla_receipt_minutes integer not null default 30 check (sla_receipt_minutes > 0),
  sla_inspection_minutes integer not null default 45 check (sla_inspection_minutes > 0),
  sla_batch_minutes integer not null default 90 check (sla_batch_minutes > 0),
  dormant_stock_hours integer not null default 48 check (dormant_stock_hours > 0),
  saturation_warning_percent numeric(5,2) not null default 80 check (saturation_warning_percent between 1 and 100),
  second_approval_required boolean not null default true,
  email_alerts_enabled boolean not null default false,
  sms_alerts_enabled boolean not null default false,
  whatsapp_alerts_enabled boolean not null default false,
  push_alerts_enabled boolean not null default true,
  scan_retry_limit integer not null default 3 check (scan_retry_limit between 0 and 10),
  local_rules jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_statuses (
  hub_id uuid primary key references public.airport_hubs(id) on delete cascade,
  operational_status text not null default 'operational' check (operational_status in ('operational','degraded','paused','maintenance','closed')),
  scanner_status text not null default 'online' check (scanner_status in ('online','degraded','offline')),
  network_status text not null default 'online' check (network_status in ('online','degraded','offline')),
  storage_status text not null default 'available' check (storage_status in ('available','warning','saturated','offline')),
  active_incident_count integer not null default 0 check (active_incident_count >= 0),
  status_note text,
  last_heartbeat_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  hub_id uuid not null references public.airport_hubs(id) on delete cascade,
  assignment_role text not null check (assignment_role in ('agent','supervisor','manager','operations_manager')),
  team_name text,
  job_title text,
  can_export boolean not null default false,
  can_manage_incidents boolean not null default false,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, hub_id, assignment_role)
);

create table if not exists public.hub_agent_shifts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  hub_id uuid not null references public.airport_hubs(id) on delete cascade,
  team_name text,
  station text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  actual_started_at timestamptz,
  actual_ended_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled','active','completed','cancelled','missed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.hub_agent_tasks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  hub_id uuid not null references public.airport_hubs(id) on delete cascade,
  task_type text not null,
  resource_type text,
  resource_id uuid,
  priority public.operational_priority not null default 'medium',
  status text not null default 'open' check (status in ('open','assigned','in_progress','blocked','completed','cancelled')),
  sla_due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_agent_activity_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  hub_id uuid not null references public.airport_hubs(id) on delete cascade,
  activity_type text not null,
  resource_type text,
  resource_id uuid,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  result text not null default 'success' check (result in ('success','failure','retry','cancelled')),
  error_code text,
  metadata jsonb not null default '{}'::jsonb,
  correlation_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.hub_agent_performance (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  hub_id uuid not null references public.airport_hubs(id) on delete cascade,
  metric_date date not null,
  received_packages integer not null default 0,
  completed_inspections integer not null default 0,
  stock_movements integer not null default 0,
  prepared_batches integer not null default 0,
  opened_incidents integer not null default 0,
  resolved_incidents integer not null default 0,
  operation_errors integer not null default 0,
  rework_count integer not null default 0,
  processed_weight_kg numeric(12,2) not null default 0,
  average_operation_seconds numeric(12,2) not null default 0,
  sla_compliance_percent numeric(5,2) not null default 100 check (sla_compliance_percent between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, hub_id, metric_date)
);

create table if not exists public.hub_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text,
  hub_id uuid references public.airport_hubs(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  old_value jsonb,
  new_value jsonb,
  reason text,
  context jsonb not null default '{}'::jsonb,
  correlation_id text,
  result text not null default 'success' check (result in ('success','failure','denied','partial')),
  risk_level text not null default 'low' check (risk_level in ('low','medium','high','critical')),
  occurred_at timestamptz not null default now()
);

create table if not exists public.hub_security_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  hub_id uuid references public.airport_hubs(id) on delete set null,
  event_type text not null,
  severity text not null check (severity in ('info','warning','high','critical')),
  source_ip_hash text,
  user_agent_hash text,
  correlation_id text,
  details jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.hub_user_activity_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  hub_id uuid references public.airport_hubs(id) on delete set null,
  event_type text not null,
  session_id text,
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.hub_saved_views (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  hub_id uuid references public.airport_hubs(id) on delete cascade,
  name text not null,
  view_type text not null,
  filters jsonb not null default '{}'::jsonb,
  columns jsonb not null default '[]'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, view_type, name)
);

create table if not exists public.hub_search_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  hub_id uuid references public.airport_hubs(id) on delete set null,
  query text not null,
  filters jsonb not null default '{}'::jsonb,
  result_count integer not null default 0,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists public.hub_alerts (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.airport_hubs(id) on delete cascade,
  alert_type text not null,
  severity text not null check (severity in ('info','warning','high','critical')),
  status text not null default 'open' check (status in ('open','acknowledged','resolved','suppressed')),
  title text not null,
  message text not null,
  resource_type text,
  resource_id uuid,
  assigned_to uuid references public.profiles(id) on delete set null,
  triggered_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  sla_due_at timestamptz,
  channels text[] not null default array['in_app']::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_incident_comments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.operational_incidents(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  is_internal boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.hub_incident_attachments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.operational_incidents(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  created_at timestamptz not null default now()
);

create table if not exists public.hub_incident_postmortems (
  incident_id uuid primary key references public.operational_incidents(id) on delete cascade,
  root_cause text not null,
  impact_summary text not null,
  timeline jsonb not null default '[]'::jsonb,
  corrective_actions jsonb not null default '[]'::jsonb,
  preventive_actions jsonb not null default '[]'::jsonb,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_forecast_snapshots (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.airport_hubs(id) on delete cascade,
  forecast_date date not null,
  expected_packages integer not null default 0,
  expected_weight_kg numeric(12,2) not null default 0,
  expected_traveler_capacity_kg numeric(12,2) not null default 0,
  recommended_agent_count integer not null default 0,
  recommended_storage_locations integer not null default 0,
  saturation_risk_percent numeric(5,2) not null default 0 check (saturation_risk_percent between 0 and 100),
  delay_risk_percent numeric(5,2) not null default 0 check (delay_risk_percent between 0 and 100),
  destination_load jsonb not null default '{}'::jsonb,
  assumptions jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  unique (hub_id, forecast_date)
);

create table if not exists public.hub_export_jobs (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid references public.airport_hubs(id) on delete set null,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  export_type text not null,
  export_format text not null check (export_format in ('csv','xlsx','pdf','print')),
  filters jsonb not null default '{}'::jsonb,
  status text not null default 'completed' check (status in ('queued','processing','completed','failed','expired')),
  row_count integer not null default 0,
  storage_path text,
  checksum text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.hub_system_metrics (
  id bigint generated always as identity primary key,
  hub_id uuid references public.airport_hubs(id) on delete cascade,
  metric_name text not null,
  metric_value numeric not null,
  unit text not null,
  labels jsonb not null default '{}'::jsonb,
  measured_at timestamptz not null default now()
);

create index if not exists airport_hubs_country_status_idx on public.airport_hubs (country_code, status);
create index if not exists airport_hubs_name_trgm_idx on public.airport_hubs using gin (name gin_trgm_ops);
create index if not exists hub_staff_assignments_profile_idx on public.hub_staff_assignments (profile_id, is_active, hub_id);
create index if not exists hub_agent_activity_logs_hub_date_idx on public.hub_agent_activity_logs (hub_id, created_at desc);
create index if not exists hub_agent_performance_hub_date_idx on public.hub_agent_performance (hub_id, metric_date desc);
create index if not exists hub_audit_events_hub_date_idx on public.hub_audit_events (hub_id, occurred_at desc);
create index if not exists hub_audit_events_resource_idx on public.hub_audit_events (resource_type, resource_id, occurred_at desc);
create index if not exists hub_alerts_hub_status_idx on public.hub_alerts (hub_id, status, severity, triggered_at desc);
create index if not exists hub_search_history_profile_idx on public.hub_search_history (profile_id, created_at desc);
create index if not exists hub_inventory_destination_status_idx on public.hub_inventory (hub_id, destination_country, status, entered_at desc);
create index if not exists hub_inventory_tracking_search_idx on public.shipments using gin (tracking_code gin_trgm_ops);
create index if not exists hub_receipts_code_search_idx on public.hub_inbound_receipts using gin (receipt_code gin_trgm_ops);
create index if not exists hub_batches_code_search_idx on public.hub_batches using gin (code gin_trgm_ops);
create index if not exists hub_incidents_title_search_idx on public.operational_incidents using gin (title gin_trgm_ops);
create index if not exists hub_system_metrics_name_date_idx on public.hub_system_metrics (metric_name, measured_at desc);

create or replace function public.current_user_can_access_hub(p_hub_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_user_has_role(array['admin', 'super_admin'])
    or exists (
      select 1 from public.hub_staff_assignments hsa
      where hsa.profile_id = auth.uid()
        and hsa.hub_id = p_hub_id
        and hsa.is_active
        and (hsa.ends_at is null or hsa.ends_at > now())
    )
    or exists (
      select 1 from public.hub_agent_profiles hap
      where hap.profile_id = auth.uid() and hap.hub_id = p_hub_id and hap.is_active
    )
    or exists (
      select 1 from public.operations_profiles op
      where op.profile_id = auth.uid() and op.is_active
        and (p_hub_id = any(op.managed_hub_ids) or cardinality(op.managed_hub_ids) = 0)
    );
$$;

create or replace function public.current_user_can_manage_hub(p_hub_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_role(array['operations_manager','admin','super_admin'])
    or exists (
      select 1 from public.hub_staff_assignments hsa
      where hsa.profile_id = auth.uid() and hsa.hub_id = p_hub_id
        and hsa.assignment_role in ('manager','operations_manager') and hsa.is_active
    );
$$;

drop policy if exists "airport_hubs_select_staff" on public.airport_hubs;
create policy "airport_hubs_select_staff" on public.airport_hubs
for select using (public.current_user_can_access_hub(id));

drop policy if exists "hub_agent_profiles_select_staff" on public.hub_agent_profiles;
create policy "hub_agent_profiles_select_staff" on public.hub_agent_profiles
for select using (
  profile_id = auth.uid()
  or public.current_user_can_access_hub(hub_id)
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'hub_countries','hub_timezones','hub_operating_hours','hub_capacities','hub_settings','hub_statuses',
    'hub_staff_assignments','hub_agent_shifts','hub_agent_tasks','hub_agent_activity_logs','hub_agent_performance',
    'hub_audit_events','hub_security_events','hub_user_activity_events','hub_saved_views','hub_search_history',
    'hub_alerts','hub_incident_comments','hub_incident_attachments','hub_incident_postmortems',
    'hub_forecast_snapshots','hub_export_jobs','hub_system_metrics'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

create policy "hub_countries_read_staff" on public.hub_countries for select using (public.current_user_has_role(array['hub_agent','hub_supervisor','hub_manager','operations_manager','admin','super_admin']));
create policy "hub_timezones_read_staff" on public.hub_timezones for select using (public.current_user_has_role(array['hub_agent','hub_supervisor','hub_manager','operations_manager','admin','super_admin']));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'hub_operating_hours','hub_capacities','hub_statuses','hub_agent_shifts','hub_agent_tasks',
    'hub_agent_activity_logs','hub_agent_performance','hub_audit_events','hub_security_events',
    'hub_user_activity_events','hub_alerts','hub_forecast_snapshots','hub_system_metrics'
  ] loop
    execute format('create policy %I on public.%I for select using (public.current_user_can_access_hub(hub_id))', table_name || '_read_hub', table_name);
  end loop;
end $$;

create policy "hub_settings_read_hub" on public.hub_settings for select using (public.current_user_can_access_hub(hub_id));
create policy "hub_settings_manage_hub" on public.hub_settings for all using (public.current_user_can_manage_hub(hub_id)) with check (public.current_user_can_manage_hub(hub_id));
create policy "hub_staff_assignments_read_hub" on public.hub_staff_assignments for select using (profile_id = auth.uid() or public.current_user_can_access_hub(hub_id));
create policy "hub_staff_assignments_manage_hub" on public.hub_staff_assignments for all using (public.current_user_can_manage_hub(hub_id)) with check (public.current_user_can_manage_hub(hub_id));
create policy "hub_saved_views_own" on public.hub_saved_views for all using (profile_id = auth.uid()) with check (profile_id = auth.uid() and (hub_id is null or public.current_user_can_access_hub(hub_id)));
create policy "hub_search_history_own" on public.hub_search_history for all using (profile_id = auth.uid()) with check (profile_id = auth.uid() and (hub_id is null or public.current_user_can_access_hub(hub_id)));
create policy "hub_export_jobs_own_or_manager" on public.hub_export_jobs for select using (requested_by = auth.uid() or (hub_id is not null and public.current_user_can_manage_hub(hub_id)));
create policy "hub_export_jobs_create" on public.hub_export_jobs for insert with check (requested_by = auth.uid() and (hub_id is null or public.current_user_can_access_hub(hub_id)));
create policy "hub_audit_events_create" on public.hub_audit_events for insert with check (
  actor_id = auth.uid() and hub_id is not null and public.current_user_can_access_hub(hub_id)
);
create policy "hub_activity_events_create" on public.hub_user_activity_events for insert with check (
  profile_id = auth.uid() and hub_id is not null and public.current_user_can_access_hub(hub_id)
);
create policy "hub_agent_activity_create" on public.hub_agent_activity_logs for insert with check (
  profile_id = auth.uid() and public.current_user_can_access_hub(hub_id)
);
create policy "hub_alerts_manage_hub" on public.hub_alerts for update using (
  public.current_user_can_manage_hub(hub_id) or assigned_to = auth.uid()
) with check (public.current_user_can_access_hub(hub_id));
create policy "hub_incident_comments_hub" on public.hub_incident_comments for select using (exists (select 1 from public.operational_incidents oi where oi.id = incident_id and oi.hub_id is not null and public.current_user_can_access_hub(oi.hub_id)));
create policy "hub_incident_comments_create" on public.hub_incident_comments for insert with check (author_id = auth.uid() and exists (select 1 from public.operational_incidents oi where oi.id = incident_id and oi.hub_id is not null and public.current_user_can_access_hub(oi.hub_id)));
create policy "hub_incident_attachments_hub" on public.hub_incident_attachments for select using (exists (select 1 from public.operational_incidents oi where oi.id = incident_id and oi.hub_id is not null and public.current_user_can_access_hub(oi.hub_id)));
create policy "hub_incident_attachments_create" on public.hub_incident_attachments for insert with check (uploaded_by = auth.uid() and exists (select 1 from public.operational_incidents oi where oi.id = incident_id and oi.hub_id is not null and public.current_user_can_access_hub(oi.hub_id)));
create policy "hub_incident_postmortems_hub" on public.hub_incident_postmortems for select using (exists (select 1 from public.operational_incidents oi where oi.id = incident_id and oi.hub_id is not null and public.current_user_can_access_hub(oi.hub_id)));
create policy "hub_incident_postmortems_manage" on public.hub_incident_postmortems for all using (exists (select 1 from public.operational_incidents oi where oi.id = incident_id and oi.hub_id is not null and public.current_user_can_manage_hub(oi.hub_id))) with check (created_by = auth.uid() and exists (select 1 from public.operational_incidents oi where oi.id = incident_id and oi.hub_id is not null and public.current_user_can_manage_hub(oi.hub_id)));

create or replace function public.prevent_hub_audit_mutation()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'Hub audit events are append-only';
end;
$$;
drop trigger if exists hub_audit_events_append_only on public.hub_audit_events;
create trigger hub_audit_events_append_only before update or delete on public.hub_audit_events for each row execute function public.prevent_hub_audit_mutation();

create or replace function public.search_hub_enterprise(
  p_query text,
  p_hub_id uuid default null,
  p_limit integer default 30,
  p_offset integer default 0
)
returns table(entity_type text, entity_id text, label text, subtitle text, href text, relevance real)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_query text := trim(coalesce(p_query, ''));
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if length(v_query) < 2 then return; end if;
  if p_hub_id is not null and not public.current_user_can_access_hub(p_hub_id) then raise exception 'Hub access denied'; end if;

  return query
  with results as (
    select 'shipment'::text, s.id::text, s.tracking_code, concat(s.destination_city, ', ', s.destination_country), '/hub/inventory/' || s.id, similarity(s.tracking_code, v_query)::real
    from public.shipments s join public.hub_inventory hi on hi.shipment_id = s.id and hi.active
    where (p_hub_id is null or hi.hub_id = p_hub_id) and public.current_user_can_access_hub(hi.hub_id)
      and (s.tracking_code ilike '%' || v_query || '%' or s.destination_city ilike '%' || v_query || '%')
    union all
    select 'manifest', hir.id::text, hir.receipt_code, hir.status::text, '/hub/inbound/' || hir.id, similarity(hir.receipt_code, v_query)::real
    from public.hub_inbound_receipts hir where (p_hub_id is null or hir.hub_id = p_hub_id) and public.current_user_can_access_hub(hir.hub_id) and hir.receipt_code ilike '%' || v_query || '%'
    union all
    select 'batch', hb.id::text, hb.code, concat(hb.destination_city, ' · ', hb.status::text), '/hub/batches/' || hb.id, similarity(hb.code, v_query)::real
    from public.hub_batches hb where hb.hub_id is not null and (p_hub_id is null or hb.hub_id = p_hub_id) and public.current_user_can_access_hub(hb.hub_id) and (hb.code ilike '%' || v_query || '%' or hb.destination_city ilike '%' || v_query || '%')
    union all
    select 'incident', oi.id::text, oi.title, concat(oi.incident_code, ' · ', oi.status::text), '/hub/incidents/' || oi.id, greatest(similarity(oi.title, v_query), similarity(oi.incident_code, v_query))::real
    from public.operational_incidents oi where oi.hub_id is not null and (p_hub_id is null or oi.hub_id = p_hub_id) and public.current_user_can_access_hub(oi.hub_id) and (oi.title ilike '%' || v_query || '%' or oi.incident_code ilike '%' || v_query || '%')
    union all
    select 'location', hsl.id::text, hsl.code, concat(hz.name, ' · ', hsl.location_type), '/hub/storage/locations', similarity(hsl.code, v_query)::real
    from public.hub_storage_locations hsl join public.hub_zones hz on hz.id = hsl.zone_id where (p_hub_id is null or hsl.hub_id = p_hub_id) and public.current_user_can_access_hub(hsl.hub_id) and (hsl.code ilike '%' || v_query || '%' or hz.name ilike '%' || v_query || '%')
  )
  select * from results order by relevance desc, label limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
end;
$$;

create or replace function public.get_hub_control_tower(p_hub_id uuid default null)
returns table(
  hub_id uuid, hub_code text, hub_name text, city text, country text, status text,
  inbound_count bigint, inventory_count bigint, active_batches bigint, open_incidents bigint,
  critical_alerts bigint, stored_weight_kg numeric, storage_capacity_kg numeric,
  traveler_capacity_kg numeric, reserved_capacity_kg numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select h.id, h.code, h.name, h.city, h.country, coalesce(hs.operational_status, h.status),
    (select count(*) from public.hub_inbound_receipts r where r.hub_id = h.id and r.created_at::date = current_date),
    (select count(*) from public.hub_inventory i where i.hub_id = h.id and i.active),
    (select count(*) from public.hub_batches b where b.hub_id = h.id and b.status not in ('completed','cancelled')),
    (select count(*) from public.operational_incidents oi where oi.hub_id = h.id and oi.status not in ('resolved','closed')),
    (select count(*) from public.hub_alerts ha where ha.hub_id = h.id and ha.status = 'open' and ha.severity in ('high','critical')),
    coalesce((select sum(i.measured_weight_kg) from public.hub_inventory i where i.hub_id = h.id and i.active), 0),
    h.max_storage_weight_kg,
    coalesce((select sum(t.available_weight_kg) from public.trips t where t.status in ('planned','boarding') and lower(t.origin_city) = lower(h.city)), 0),
    coalesce((select sum(b.reserved_weight_kg) from public.hub_batches b where b.hub_id = h.id and b.status not in ('completed','cancelled')), 0)
  from public.airport_hubs h
  left join public.hub_statuses hs on hs.hub_id = h.id
  where h.is_active and (p_hub_id is null or h.id = p_hub_id) and public.current_user_can_access_hub(h.id)
  order by h.code;
$$;

revoke all on function public.search_hub_enterprise(text, uuid, integer, integer) from public;
revoke all on function public.get_hub_control_tower(uuid) from public;
grant execute on function public.search_hub_enterprise(text, uuid, integer, integer) to authenticated;
grant execute on function public.get_hub_control_tower(uuid) to authenticated;

insert into public.hub_countries (country_code, name, currency_code, default_timezone, regulations)
values
  ('SN','Sénégal','XOF','Africa/Dakar','{"customs":"WAEMU"}'::jsonb),
  ('FR','France','EUR','Europe/Paris','{"customs":"EU"}'::jsonb),
  ('BE','Belgique','EUR','Europe/Brussels','{"customs":"EU"}'::jsonb),
  ('CI','Côte d''Ivoire','XOF','Africa/Abidjan','{"customs":"WAEMU"}'::jsonb),
  ('MA','Maroc','MAD','Africa/Casablanca','{"customs":"MA"}'::jsonb),
  ('CA','Canada','CAD','America/Toronto','{"customs":"CA"}'::jsonb)
on conflict (country_code) do update set name = excluded.name, currency_code = excluded.currency_code, default_timezone = excluded.default_timezone, regulations = excluded.regulations, updated_at = now();

insert into public.hub_timezones (timezone, utc_offset_minutes, observes_dst, display_name)
values
  ('Africa/Dakar',0,false,'Dakar'), ('Europe/Paris',60,true,'Paris'), ('Europe/Brussels',60,true,'Bruxelles'),
  ('Africa/Abidjan',0,false,'Abidjan'), ('Africa/Casablanca',60,true,'Casablanca'), ('America/Toronto',-300,true,'Montréal')
on conflict (timezone) do update set utc_offset_minutes = excluded.utc_offset_minutes, observes_dst = excluded.observes_dst, display_name = excluded.display_name, updated_at = now();

insert into public.airport_hubs (code,name,country,country_code,city,airport_code,timezone,currency_code,address,max_daily_packages,max_storage_weight_kg,latitude,longitude,status,supported_destination_codes,is_active)
values
  ('DSS-DAKAR','Yobalelma Hub Dakar','Sénégal','SN','Dakar','DSS','Africa/Dakar','XOF','Aéroport international Blaise-Diagne',5000,50000,14.6708,-17.0733,'operational',array['CDG-PARIS','BRU-BRUSSELS','ABJ-ABIDJAN','CMN-CASABLANCA','YUL-MONTREAL'],true),
  ('CDG-PARIS','Yobalelma Hub Paris','France','FR','Paris','CDG','Europe/Paris','EUR','Zone cargo Paris-CDG',8000,80000,49.0097,2.5479,'operational',array['DSS-DAKAR','BRU-BRUSSELS','YUL-MONTREAL'],true),
  ('BRU-BRUSSELS','Yobalelma Hub Bruxelles','Belgique','BE','Bruxelles','BRU','Europe/Brussels','EUR','Brussels Airport Cargo',3500,40000,50.9014,4.4844,'operational',array['DSS-DAKAR','CDG-PARIS'],true),
  ('ABJ-ABIDJAN','Yobalelma Hub Abidjan','Côte d''Ivoire','CI','Abidjan','ABJ','Africa/Abidjan','XOF','Aéroport Félix-Houphouët-Boigny',4000,45000,5.2614,-3.9263,'operational',array['DSS-DAKAR','CDG-PARIS'],true),
  ('CMN-CASABLANCA','Yobalelma Hub Casablanca','Maroc','MA','Casablanca','CMN','Africa/Casablanca','MAD','Aéroport Mohammed V Cargo',4500,50000,33.3675,-7.58997,'operational',array['DSS-DAKAR','CDG-PARIS','BRU-BRUSSELS'],true),
  ('YUL-MONTREAL','Yobalelma Hub Montréal','Canada','CA','Montréal','YUL','America/Toronto','CAD','Montréal-Trudeau Cargo',4500,55000,45.4706,-73.7408,'operational',array['DSS-DAKAR','CDG-PARIS'],true)
on conflict (code) do update set name=excluded.name,country=excluded.country,country_code=excluded.country_code,city=excluded.city,airport_code=excluded.airport_code,timezone=excluded.timezone,currency_code=excluded.currency_code,address=excluded.address,max_daily_packages=excluded.max_daily_packages,max_storage_weight_kg=excluded.max_storage_weight_kg,latitude=excluded.latitude,longitude=excluded.longitude,status=excluded.status,supported_destination_codes=excluded.supported_destination_codes,is_active=true,updated_at=now();

insert into public.hub_settings (hub_id)
select id from public.airport_hubs where code in ('DSS-DAKAR','CDG-PARIS','BRU-BRUSSELS','ABJ-ABIDJAN','CMN-CASABLANCA','YUL-MONTREAL')
on conflict (hub_id) do nothing;

insert into public.hub_statuses (hub_id, operational_status, scanner_status, network_status, storage_status)
select id, 'operational', 'online', 'online', 'available' from public.airport_hubs where code in ('DSS-DAKAR','CDG-PARIS','BRU-BRUSSELS','ABJ-ABIDJAN','CMN-CASABLANCA','YUL-MONTREAL')
on conflict (hub_id) do nothing;

insert into public.hub_operating_hours (hub_id, weekday, opens_at, closes_at, is_closed)
select h.id, d, case when d = 7 then null else '06:00'::time end, case when d = 7 then null else '22:00'::time end, d = 7
from public.airport_hubs h cross join generate_series(1,7) d
where h.code in ('DSS-DAKAR','CDG-PARIS','BRU-BRUSSELS','ABJ-ABIDJAN','CMN-CASABLANCA','YUL-MONTREAL')
on conflict (hub_id, weekday) do nothing;

insert into public.hub_capacities (hub_id, capacity_date, inbound_package_capacity, outbound_package_capacity, storage_weight_capacity_kg, staffing_capacity_hours)
select id, current_date, max_daily_packages, max_daily_packages, max_storage_weight_kg, 160
from public.airport_hubs where code in ('DSS-DAKAR','CDG-PARIS','BRU-BRUSSELS','ABJ-ABIDJAN','CMN-CASABLANCA','YUL-MONTREAL')
on conflict (hub_id, capacity_date) do update set inbound_package_capacity=excluded.inbound_package_capacity,outbound_package_capacity=excluded.outbound_package_capacity,storage_weight_capacity_kg=excluded.storage_weight_capacity_kg,staffing_capacity_hours=excluded.staffing_capacity_hours,updated_at=now();

insert into public.hub_staff_assignments (profile_id, hub_id, assignment_role, team_name, job_title, can_export, can_manage_incidents, is_primary)
select hap.profile_id, hap.hub_id,
  case p.primary_role::text when 'hub_manager' then 'manager' when 'hub_supervisor' then 'supervisor' else 'agent' end,
  'Operations', hap.role_title, p.primary_role::text in ('hub_manager','hub_supervisor'), true, true
from public.hub_agent_profiles hap join public.profiles p on p.id = hap.profile_id
on conflict (profile_id, hub_id, assignment_role) do update set is_active=true,job_title=excluded.job_title,can_export=excluded.can_export,can_manage_incidents=true,updated_at=now();

insert into public.hub_staff_assignments (profile_id, hub_id, assignment_role, team_name, job_title, can_export, can_manage_incidents, is_primary)
select op.profile_id, h.id, 'operations_manager', 'Control Tower', 'Operations manager', true, true, h.code = 'DSS-DAKAR'
from public.operations_profiles op cross join public.airport_hubs h
where op.is_active and h.code in ('DSS-DAKAR','CDG-PARIS','BRU-BRUSSELS','ABJ-ABIDJAN','CMN-CASABLANCA','YUL-MONTREAL')
on conflict (profile_id, hub_id, assignment_role) do update set is_active=true,can_export=true,can_manage_incidents=true,updated_at=now();
