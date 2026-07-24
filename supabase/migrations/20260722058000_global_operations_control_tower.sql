create or replace function public.current_user_has_control_tower_country(p_country_code text) returns boolean
language sql stable security definer set search_path=public as $$
  select public.current_user_has_role(array['admin','super_admin','auditor']) or exists(
    select 1 from public.governance_staff_assignments a where a.profile_id=auth.uid() and a.active
      and a.country_code=upper(p_country_code)
      and a.role_id in ('country_manager','operations_manager','dispatch_manager','hub_manager','relay_manager','collection_manager','local_delivery_manager','traveler_manager','customs_manager','compliance_manager','finance_manager','customer_support_manager','security_manager','partner_manager','orange_partner_manager')
  );
$$;
revoke all on function public.current_user_has_control_tower_country(text) from public;
grant execute on function public.current_user_has_control_tower_country(text) to authenticated,service_role;

create table public.control_tower_events (
  id uuid primary key default gen_random_uuid(), source_module text not null, source_event_id text not null,
  event_type text not null, entity_type text not null, entity_id text not null, country_code text not null check(char_length(country_code)=2),
  region_code text, occurred_at timestamptz not null, received_at timestamptz not null default now(),
  severity text not null default 'info' check(severity in ('info','warning','critical')),
  sanitized_payload jsonb not null default '{}', correlation_id uuid, causation_id uuid references public.control_tower_events(id),
  processing_status text not null default 'pending' check(processing_status in ('pending','processed','failed','dead_letter')),
  processing_attempts integer not null default 0, processed_at timestamptz, last_error_code text,
  retention_until timestamptz not null default (now()+interval '365 days'), unique(source_module,source_event_id)
);
create index control_tower_events_replay_idx on public.control_tower_events(country_code,occurred_at,id);
create index control_tower_events_processing_idx on public.control_tower_events(processing_status,received_at) where processing_status in ('pending','failed');

create table public.control_tower_outbox (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.control_tower_events(id) on delete cascade,
  destination text not null check(destination in ('digital_twin','snapshot','recommendations','notifications','analytics','partner_webhook')),
  status text not null default 'pending' check(status in ('pending','processing','completed','failed','dead_letter')),
  available_at timestamptz not null default now(), attempts integer not null default 0, locked_at timestamptz, locked_by text,
  last_error_code text, completed_at timestamptz, created_at timestamptz not null default now(), unique(event_id,destination)
);
create index control_tower_outbox_queue_idx on public.control_tower_outbox(status,available_at) where status in ('pending','failed');

create table public.digital_twin_entities (
  id uuid primary key default gen_random_uuid(), entity_type text not null check(entity_type in ('hub','relay','vehicle','driver','traveler','mission','shipment','incident','airport','port','service_zone')),
  entity_id text not null, country_code text not null check(char_length(country_code)=2), region_code text, city text,
  operational_status text not null, latitude numeric(10,7), longitude numeric(10,7), capacity_used numeric, capacity_total numeric,
  state jsonb not null default '{}', state_version bigint not null default 1, last_event_id uuid references public.control_tower_events(id),
  observed_at timestamptz not null, updated_at timestamptz not null default now(), unique(entity_type,entity_id),
  check(latitude is null or latitude between -90 and 90), check(longitude is null or longitude between -180 and 180),
  check(capacity_used is null or capacity_used>=0),check(capacity_total is null or capacity_total>=0)
);
create index digital_twin_geo_idx on public.digital_twin_entities(country_code,entity_type,operational_status);
create table public.digital_twin_state_events (
  id uuid primary key default gen_random_uuid(), twin_entity_id uuid not null references public.digital_twin_entities(id) on delete cascade,
  control_event_id uuid not null references public.control_tower_events(id) on delete restrict,
  previous_status text, new_status text not null, state_version bigint not null, state_delta jsonb not null default '{}', occurred_at timestamptz not null,
  unique(twin_entity_id,state_version)
);

create table public.control_tower_snapshots (
  id uuid primary key default gen_random_uuid(), country_code text not null check(char_length(country_code)=2), scope_type text not null check(scope_type in ('global','country','region','hub','relay')),
  scope_id text not null, captured_at timestamptz not null, freshness_seconds integer not null check(freshness_seconds>=0),
  health_status text not null check(health_status in ('nominal','degraded','critical','unavailable')),
  kpis jsonb not null, alerts jsonb not null default '[]', data_quality jsonb not null default '{}', source_watermark timestamptz,
  created_at timestamptz not null default now(), unique(scope_type,scope_id,captured_at)
);
create index control_tower_snapshots_latest_idx on public.control_tower_snapshots(scope_type,scope_id,captured_at desc);

create table public.control_tower_recommendations (
  id uuid primary key default gen_random_uuid(), country_code text not null check(char_length(country_code)=2), module text not null,
  recommendation_type text not null, entity_type text not null, entity_id text not null, priority text not null check(priority in ('low','medium','high','critical')),
  title text not null, explanation text not null, evidence jsonb not null default '[]', alternatives jsonb not null default '[]', confidence numeric(5,2) not null check(confidence between 0 and 100),
  requires_human_approval boolean not null default true, status text not null default 'proposed' check(status in ('proposed','acknowledged','approved','rejected','expired','executed')),
  generated_at timestamptz not null default now(), expires_at timestamptz not null, acknowledged_by uuid references public.profiles(id), decided_by uuid references public.profiles(id), decided_at timestamptz, decision_reason text,
  check(requires_human_approval or recommendation_type not in ('reassign_mission','reroute_shipment','change_hub','block_payment','close_incident'))
);
create index control_tower_recommendations_queue_idx on public.control_tower_recommendations(country_code,status,priority,generated_at desc);
create table public.control_tower_decision_events (
  id uuid primary key default gen_random_uuid(), recommendation_id uuid not null references public.control_tower_recommendations(id) on delete cascade,
  action text not null, actor_id uuid not null references public.profiles(id), reason text, created_at timestamptz not null default now()
);

create table public.control_tower_module_health (
  module text not null, country_code text not null check(char_length(country_code)=2), status text not null check(status in ('nominal','degraded','critical','unavailable','disabled')),
  last_success_at timestamptz, last_failure_at timestamptz, latency_p95_ms integer, backlog_count integer not null default 0,
  dependencies jsonb not null default '[]', details jsonb not null default '{}', updated_at timestamptz not null default now(), primary key(module,country_code)
);

alter table public.operational_incidents add column if not exists country_code text check(country_code is null or char_length(country_code)=2), add column if not exists source_module text, add column if not exists region_code text, add column if not exists city text, add column if not exists vehicle_id uuid references public.collection_vehicles(id) on delete set null, add column if not exists collection_route_id uuid references public.collection_routes(id) on delete set null;

alter table public.control_tower_events enable row level security; alter table public.control_tower_outbox enable row level security;
alter table public.digital_twin_entities enable row level security; alter table public.digital_twin_state_events enable row level security;
alter table public.control_tower_snapshots enable row level security; alter table public.control_tower_recommendations enable row level security;
alter table public.control_tower_decision_events enable row level security; alter table public.control_tower_module_health enable row level security;
create policy control_events_scoped on public.control_tower_events for select using(public.current_user_has_control_tower_country(country_code));
create policy twin_entities_scoped on public.digital_twin_entities for select using(public.current_user_has_control_tower_country(country_code));
create policy twin_state_events_scoped on public.digital_twin_state_events for select using(exists(select 1 from public.digital_twin_entities e where e.id=twin_entity_id and public.current_user_has_control_tower_country(e.country_code)));
create policy tower_snapshots_scoped on public.control_tower_snapshots for select using(public.current_user_has_control_tower_country(country_code));
create policy tower_recommendations_scoped on public.control_tower_recommendations for select using(public.current_user_has_control_tower_country(country_code));
create policy tower_decisions_scoped on public.control_tower_decision_events for select using(exists(select 1 from public.control_tower_recommendations r where r.id=recommendation_id and public.current_user_has_control_tower_country(r.country_code)));
create policy tower_health_scoped on public.control_tower_module_health for select using(public.current_user_has_control_tower_country(country_code));

drop policy if exists "operational_incidents_select_staff" on public.operational_incidents;
drop policy if exists "operational_incidents_write_staff" on public.operational_incidents;
create policy operational_incidents_scoped_read on public.operational_incidents for select using(
  created_by=auth.uid() or assigned_to=auth.uid() or public.current_user_has_role(array['admin','super_admin','auditor'])
  or (country_code is not null and public.current_user_has_control_tower_country(country_code))
  or (hub_id is not null and public.current_user_can_access_hub(hub_id))
);
create policy operational_incidents_scoped_write on public.operational_incidents for all using(
  created_by=auth.uid() or assigned_to=auth.uid() or public.current_user_has_role(array['admin','super_admin'])
  or (country_code is not null and public.current_user_has_control_tower_country(country_code)) or (hub_id is not null and public.current_user_can_manage_hub(hub_id))
) with check(
  created_by=auth.uid() or assigned_to=auth.uid() or public.current_user_has_role(array['admin','super_admin'])
  or (country_code is not null and public.current_user_has_control_tower_country(country_code)) or (hub_id is not null and public.current_user_can_manage_hub(hub_id))
);

create or replace function public.ingest_control_tower_events(p_events jsonb) returns integer language plpgsql security definer set search_path=public as $$
declare item jsonb; event_id uuid; inserted integer:=0;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  if jsonb_typeof(p_events)<>'array' or jsonb_array_length(p_events) not between 1 and 500 then raise exception 'Event batch invalid'; end if;
  for item in select value from jsonb_array_elements(p_events) loop
    event_id:=null;
    insert into public.control_tower_events(source_module,source_event_id,event_type,entity_type,entity_id,country_code,region_code,occurred_at,severity,sanitized_payload,correlation_id)
      values(item->>'source_module',item->>'source_event_id',item->>'event_type',item->>'entity_type',item->>'entity_id',upper(item->>'country_code'),item->>'region_code',(item->>'occurred_at')::timestamptz,coalesce(item->>'severity','info'),coalesce(item->'sanitized_payload','{}'),nullif(item->>'correlation_id','')::uuid)
      on conflict(source_module,source_event_id) do nothing returning id into event_id;
    if event_id is null then continue; end if;
    insert into public.control_tower_outbox(event_id,destination) select event_id,value from jsonb_array_elements_text('["digital_twin","snapshot","recommendations","notifications","analytics"]');
    inserted:=inserted+1;
  end loop; return inserted;
end; $$;
revoke all on function public.ingest_control_tower_events(jsonb) from public,anon,authenticated; grant execute on function public.ingest_control_tower_events(jsonb) to service_role;

create or replace function public.claim_control_tower_outbox(p_worker_id text,p_limit integer default 100) returns setof public.control_tower_outbox
language plpgsql security definer set search_path=public as $$ begin
  if auth.role()<>'service_role' or length(trim(p_worker_id))<3 then raise exception 'Service worker required'; end if;
  return query update public.control_tower_outbox o set status='processing',locked_at=now(),locked_by=trim(p_worker_id),attempts=o.attempts+1
    where o.id in(select id from public.control_tower_outbox where status in ('pending','failed') and available_at<=now() order by available_at for update skip locked limit least(greatest(p_limit,1),500)) returning o.*;
end; $$;
revoke all on function public.claim_control_tower_outbox(text,integer) from public,anon,authenticated; grant execute on function public.claim_control_tower_outbox(text,integer) to service_role;

create or replace function public.decide_control_tower_recommendation(p_id uuid,p_decision text,p_reason text) returns void language plpgsql security definer set search_path=public as $$
declare r public.control_tower_recommendations%rowtype;
begin
  if p_decision not in ('acknowledged','approved','rejected') then raise exception 'Invalid decision'; end if;
  select * into r from public.control_tower_recommendations where id=p_id for update;
  if r.id is null or r.status not in ('proposed','acknowledged') or r.expires_at<=now() or not public.current_user_has_control_tower_country(r.country_code) then raise exception 'Recommendation unavailable'; end if;
  if p_decision in ('approved','rejected') and length(trim(coalesce(p_reason,'')))<5 then raise exception 'Decision reason required'; end if;
  update public.control_tower_recommendations set status=p_decision,acknowledged_by=case when p_decision='acknowledged' then auth.uid() else acknowledged_by end,decided_by=case when p_decision in ('approved','rejected') then auth.uid() end,decided_at=case when p_decision in ('approved','rejected') then now() end,decision_reason=case when p_decision in ('approved','rejected') then trim(p_reason) end where id=r.id;
  insert into public.control_tower_decision_events(recommendation_id,action,actor_id,reason) values(r.id,p_decision,auth.uid(),nullif(trim(coalesce(p_reason,'')),''));
end; $$;
revoke all on function public.decide_control_tower_recommendation(uuid,text,text) from public,anon; grant execute on function public.decide_control_tower_recommendation(uuid,text,text) to authenticated;

create or replace function public.purge_control_tower_history() returns jsonb language plpgsql security definer set search_path=public as $$
declare events_count integer; snapshots_count integer;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  delete from public.control_tower_events where retention_until<now() and not exists(select 1 from public.control_tower_outbox o where o.event_id=control_tower_events.id and o.status not in ('completed','dead_letter')); get diagnostics events_count=row_count;
  delete from public.control_tower_snapshots where captured_at<now()-interval '400 days'; get diagnostics snapshots_count=row_count;
  return jsonb_build_object('events',events_count,'snapshots',snapshots_count);
end; $$;
revoke all on function public.purge_control_tower_history() from public,anon,authenticated; grant execute on function public.purge_control_tower_history() to service_role;
