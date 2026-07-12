create type public.dispatch_job_status as enum (
  'queued',
  'broadcasting',
  'assigned',
  'expired',
  'cancelled',
  'manual_review'
);

create type public.dispatch_candidate_status as enum (
  'pending',
  'notified',
  'accepted',
  'declined',
  'expired',
  'superseded'
);

create table public.dispatch_jobs (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  pickup_request_id uuid references public.pickup_requests(id) on delete set null,
  status public.dispatch_job_status not null default 'queued',
  search_radius_km numeric(8,2) not null default 5,
  candidate_limit integer not null default 5 check (candidate_limit > 0 and candidate_limit <= 25),
  timeout_seconds integer not null default 90 check (timeout_seconds >= 15),
  assigned_transporter_id uuid references public.profiles(id) on delete set null,
  assigned_mission_id uuid references public.local_delivery_missions(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  started_at timestamptz,
  assigned_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dispatch_candidates (
  id uuid primary key default gen_random_uuid(),
  dispatch_job_id uuid not null references public.dispatch_jobs(id) on delete cascade,
  transporter_id uuid not null references public.profiles(id) on delete cascade,
  mission_id uuid references public.local_delivery_missions(id) on delete set null,
  status public.dispatch_candidate_status not null default 'pending',
  score numeric(8,2) not null default 0,
  rank integer not null,
  distance_km numeric(8,2),
  eta_minutes integer,
  score_breakdown jsonb not null default '{}'::jsonb,
  notified_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dispatch_job_id, transporter_id)
);

create table public.dispatch_events (
  id uuid primary key default gen_random_uuid(),
  dispatch_job_id uuid not null references public.dispatch_jobs(id) on delete cascade,
  candidate_id uuid references public.dispatch_candidates(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.transporter_locations (
  transporter_id uuid primary key references public.profiles(id) on delete cascade,
  city text not null,
  country text not null,
  latitude numeric(10,7),
  longitude numeric(10,7),
  accuracy_meters integer,
  status public.transporter_availability_status not null default 'offline',
  updated_at timestamptz not null default now()
);

create table public.transporter_matching_scores (
  id uuid primary key default gen_random_uuid(),
  transporter_id uuid not null references public.profiles(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  score numeric(8,2) not null default 0,
  distance_km numeric(8,2),
  eta_minutes integer,
  fairness_score numeric(8,2) not null default 0,
  availability_score numeric(8,2) not null default 0,
  capacity_score numeric(8,2) not null default 0,
  rating_score numeric(8,2) not null default 0,
  reasons text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  unique (transporter_id, shipment_id)
);

create index dispatch_jobs_status_idx
  on public.dispatch_jobs (status, created_at desc);

create index dispatch_jobs_shipment_idx
  on public.dispatch_jobs (shipment_id, status);

create index dispatch_candidates_job_status_idx
  on public.dispatch_candidates (dispatch_job_id, status, rank);

create index dispatch_candidates_transporter_idx
  on public.dispatch_candidates (transporter_id, status);

create index dispatch_events_job_idx
  on public.dispatch_events (dispatch_job_id, created_at desc);

create index transporter_locations_status_idx
  on public.transporter_locations (country, city, status, updated_at desc);

create index transporter_matching_scores_lookup_idx
  on public.transporter_matching_scores (shipment_id, score desc);

create trigger dispatch_jobs_set_updated_at
before update on public.dispatch_jobs
for each row execute function public.set_updated_at();

create trigger dispatch_candidates_set_updated_at
before update on public.dispatch_candidates
for each row execute function public.set_updated_at();

alter table public.dispatch_jobs enable row level security;
alter table public.dispatch_candidates enable row level security;
alter table public.dispatch_events enable row level security;
alter table public.transporter_locations enable row level security;
alter table public.transporter_matching_scores enable row level security;

create policy "dispatch_jobs_select_staff_or_participants" on public.dispatch_jobs
for select using (
  public.current_user_has_role(array['operations_manager', 'support_agent', 'admin', 'super_admin'])
  or assigned_transporter_id = auth.uid()
  or exists (
    select 1
    from public.shipments s
    where s.id = dispatch_jobs.shipment_id
      and s.sender_id = auth.uid()
  )
);

create policy "dispatch_jobs_write_staff" on public.dispatch_jobs
for all using (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
);

create policy "dispatch_candidates_select_staff_or_transporter" on public.dispatch_candidates
for select using (
  transporter_id = auth.uid()
  or public.current_user_has_role(array['operations_manager', 'support_agent', 'admin', 'super_admin'])
);

create policy "dispatch_candidates_write_staff" on public.dispatch_candidates
for all using (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
);

create policy "dispatch_events_select_staff_or_participants" on public.dispatch_events
for select using (
  actor_id = auth.uid()
  or public.current_user_has_role(array['operations_manager', 'support_agent', 'admin', 'super_admin'])
  or exists (
    select 1
    from public.dispatch_jobs j
    where j.id = dispatch_events.dispatch_job_id
      and j.assigned_transporter_id = auth.uid()
  )
);

create policy "dispatch_events_insert_authenticated" on public.dispatch_events
for insert with check (auth.uid() is not null);

create policy "transporter_locations_select_operations" on public.transporter_locations
for select using (
  transporter_id = auth.uid()
  or public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
);

create policy "transporter_locations_upsert_own" on public.transporter_locations
for insert with check (transporter_id = auth.uid());

create policy "transporter_locations_update_own" on public.transporter_locations
for update using (transporter_id = auth.uid())
with check (transporter_id = auth.uid());

create policy "transporter_matching_scores_select_staff_or_transporter" on public.transporter_matching_scores
for select using (
  transporter_id = auth.uid()
  or public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
);

create policy "transporter_matching_scores_write_staff" on public.transporter_matching_scores
for all using (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
);

