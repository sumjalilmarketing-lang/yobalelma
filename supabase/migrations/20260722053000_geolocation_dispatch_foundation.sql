alter table public.shipment_addresses
  add column if not exists formatted_address text,
  add column if not exists landmark text,
  add column if not exists neighborhood text,
  add column if not exists commune text,
  add column if not exists region text,
  add column if not exists country_code text check (country_code is null or char_length(country_code)=2),
  add column if not exists latitude numeric(10,7) check (latitude between -90 and 90),
  add column if not exists longitude numeric(10,7) check (longitude between -180 and 180),
  add column if not exists provider_place_id text,
  add column if not exists location_type text check (location_type is null or location_type in ('address','street','neighborhood','commune','city','landmark','airport','station','relay','hub','other')),
  add column if not exists geocoding_provider text,
  add column if not exists accuracy_level text check (accuracy_level is null or accuracy_level in ('rooftop','entrance','street','neighborhood','city','approximate')),
  add column if not exists validation_status text not null default 'manual' check (validation_status in ('manual','suggested','selected','user_confirmed','provider_verified')),
  add column if not exists plus_code text,
  add column if not exists access_instructions text,
  add column if not exists floor text,
  add column if not exists apartment text,
  add column if not exists building text,
  add column if not exists place_photo_upload_id uuid references public.secure_uploads(id) on delete restrict,
  add column if not exists updated_at timestamptz not null default now();
create index if not exists shipment_addresses_geo_idx on public.shipment_addresses(latitude,longitude) where latitude is not null and longitude is not null;

alter table public.relay_points add column if not exists formatted_address text, add column if not exists neighborhood text, add column if not exists commune text, add column if not exists region text, add column if not exists provider_place_id text, add column if not exists geocoding_provider text, add column if not exists accuracy_level text, add column if not exists location_validation_status text not null default 'manual';
alter table public.airport_hubs add column if not exists formatted_address text, add column if not exists latitude numeric(10,7) check (latitude between -90 and 90), add column if not exists longitude numeric(10,7) check (longitude between -180 and 180), add column if not exists provider_place_id text, add column if not exists geocoding_provider text, add column if not exists accuracy_level text, add column if not exists location_validation_status text not null default 'manual';

create table if not exists public.operational_location_consents (
  id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
  purpose text not null check (purpose in ('active_mission','working_hours')), granted boolean not null, granted_at timestamptz,
  revoked_at timestamptz, expires_at timestamptz, policy_version text not null, created_at timestamptz not null default now(),
  check ((granted and granted_at is not null and revoked_at is null) or not granted)
);
create table if not exists public.operational_position_events (
  id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
  mission_id uuid references public.local_delivery_missions(id) on delete cascade, collection_route_id uuid references public.collection_routes(id) on delete cascade,
  latitude numeric(10,7) not null check (latitude between -90 and 90), longitude numeric(10,7) not null check (longitude between -180 and 180),
  accuracy_meters numeric(10,2) not null check (accuracy_meters between 0 and 5000), speed_kph numeric(8,2) check (speed_kph between 0 and 250), heading_degrees numeric(6,2) check (heading_degrees between 0 and 360),
  battery_percent integer check (battery_percent between 0 and 100), source text not null check (source in ('browser','mobile','vehicle_device')),
  recorded_at timestamptz not null, received_at timestamptz not null default now(), retention_until timestamptz not null default (now()+interval '30 days'),
  check ((mission_id is not null)::integer+(collection_route_id is not null)::integer=1)
);
create index if not exists operational_position_latest_idx on public.operational_position_events(profile_id,recorded_at desc);
create index if not exists operational_position_mission_idx on public.operational_position_events(mission_id,recorded_at desc) where mission_id is not null;

create table if not exists public.dispatch_rule_sets (
  id uuid primary key default gen_random_uuid(), country_code text not null check (char_length(country_code)=2), city text, version integer not null check (version>0),
  name text not null, status text not null default 'draft' check (status in ('draft','active','retired')), mode text not null default 'semi_automatic' check (mode in ('automatic','semi_automatic','manual')),
  rules jsonb not null default '{}'::jsonb, created_by uuid not null references public.profiles(id), approved_by uuid references public.profiles(id), approved_at timestamptz,
  effective_from timestamptz not null, effective_to timestamptz, created_at timestamptz not null default now(), unique(country_code,city,version), check (effective_to is null or effective_to>effective_from)
);
create table if not exists public.dispatch_recommendations (
  id uuid primary key default gen_random_uuid(), mission_id uuid not null references public.local_delivery_missions(id) on delete cascade,
  candidate_profile_id uuid not null references public.profiles(id) on delete restrict, rule_set_id uuid not null references public.dispatch_rule_sets(id) on delete restrict,
  rank integer not null check (rank between 1 and 20), score numeric(5,2) not null check (score between 0 and 100), distance_meters integer not null check (distance_meters>=0), duration_seconds integer check (duration_seconds>=0),
  route_source text not null check (route_source in ('provider','geographic_fallback')), reasons text[] not null, confidence text not null check (confidence in ('low','medium','high')),
  requires_human_approval boolean not null default true, status text not null default 'proposed' check (status in ('proposed','approved','rejected','expired','assigned')),
  generated_at timestamptz not null default now(), expires_at timestamptz not null, approved_by uuid references public.profiles(id), approved_at timestamptz,
  unique(mission_id,candidate_profile_id,status)
);
create table if not exists public.dispatch_recommendation_events (
  id uuid primary key default gen_random_uuid(), mission_id uuid not null references public.local_delivery_missions(id) on delete cascade,
  recommendation_id uuid references public.dispatch_recommendations(id) on delete set null, event_type text not null,
  actor_id uuid references public.profiles(id), reason text, sanitized_metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists dispatch_recommendations_queue_idx on public.dispatch_recommendations(status,expires_at,score desc);
create index if not exists dispatch_recommendation_events_mission_idx on public.dispatch_recommendation_events(mission_id,created_at desc);

alter table public.operational_location_consents enable row level security; alter table public.operational_position_events enable row level security;
alter table public.dispatch_rule_sets enable row level security; alter table public.dispatch_recommendations enable row level security; alter table public.dispatch_recommendation_events enable row level security;
drop policy if exists location_consents_own on public.operational_location_consents; drop policy if exists location_consents_create_own on public.operational_location_consents;
drop policy if exists positions_own_or_dispatch on public.operational_position_events; drop policy if exists dispatch_rules_read on public.dispatch_rule_sets;
drop policy if exists dispatch_rules_create on public.dispatch_rule_sets; drop policy if exists dispatch_rules_update_draft on public.dispatch_rule_sets;
drop policy if exists dispatch_recommendations_read on public.dispatch_recommendations; drop policy if exists dispatch_recommendation_events_read on public.dispatch_recommendation_events;
create policy location_consents_own on public.operational_location_consents for select using (profile_id=auth.uid() or public.current_user_has_role(array['operations_manager','dispatch_manager','security_manager','auditor','admin','super_admin']));
create policy location_consents_create_own on public.operational_location_consents for insert with check (profile_id=auth.uid());
create policy positions_own_or_dispatch on public.operational_position_events for select using (profile_id=auth.uid() or public.current_user_has_role(array['operations_manager','dispatch_manager','security_manager','auditor','admin','super_admin']));
create policy dispatch_rules_read on public.dispatch_rule_sets for select using (public.current_user_has_role(array['operations_manager','dispatch_manager','security_manager','auditor','admin','super_admin']));
create policy dispatch_rules_create on public.dispatch_rule_sets for insert with check (status='draft' and created_by=auth.uid() and public.current_user_has_role(array['operations_manager','dispatch_manager','admin','super_admin']));
create policy dispatch_rules_update_draft on public.dispatch_rule_sets for update using (status='draft' and created_by=auth.uid() and public.current_user_has_role(array['operations_manager','dispatch_manager','admin','super_admin'])) with check (status='draft' and approved_by is null and public.current_user_has_role(array['operations_manager','dispatch_manager','admin','super_admin']));
create policy dispatch_recommendations_read on public.dispatch_recommendations for select using (candidate_profile_id=auth.uid() or public.current_user_has_role(array['operations_manager','dispatch_manager','security_manager','auditor','admin','super_admin']));
create policy dispatch_recommendation_events_read on public.dispatch_recommendation_events for select using (public.current_user_has_role(array['operations_manager','dispatch_manager','security_manager','auditor','admin','super_admin']) or exists(select 1 from public.local_delivery_missions m where m.id=mission_id and m.transporter_id=auth.uid()));

create or replace function public.set_operational_location_consent(p_granted boolean,p_purpose text,p_policy_version text,p_expires_at timestamptz) returns uuid
language plpgsql security definer set search_path=public as $$ declare consent_id uuid; begin
  if auth.uid() is null or p_purpose not in ('active_mission','working_hours') or length(trim(p_policy_version))<1 then raise exception 'Valid consent data required'; end if;
  update public.operational_location_consents set granted=false,revoked_at=now() where profile_id=auth.uid() and granted and revoked_at is null;
  insert into public.operational_location_consents(profile_id,purpose,granted,granted_at,revoked_at,expires_at,policy_version)
  values(auth.uid(),p_purpose,p_granted,case when p_granted then now() end,case when p_granted then null else now() end,p_expires_at,trim(p_policy_version)) returning id into consent_id; return consent_id;
end; $$;
revoke all on function public.set_operational_location_consent(boolean,text,text,timestamptz) from public,anon; grant execute on function public.set_operational_location_consent(boolean,text,text,timestamptz) to authenticated;

create or replace function public.record_operational_position(p_mission_id uuid,p_collection_route_id uuid,p_latitude numeric,p_longitude numeric,p_accuracy_meters numeric,p_speed_kph numeric,p_heading_degrees numeric,p_battery_percent integer,p_source text,p_recorded_at timestamptz) returns uuid
language plpgsql security definer set search_path=public as $$ declare event_id uuid; begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_accuracy_meters>1000 or p_recorded_at<now()-interval '24 hours' or p_recorded_at>now()+interval '5 minutes' then raise exception 'Position quality or timestamp invalid'; end if;
  if not exists(select 1 from public.operational_location_consents c where c.profile_id=auth.uid() and c.granted and c.revoked_at is null and (c.expires_at is null or c.expires_at>now())) then raise exception 'Active location consent required'; end if;
  if p_mission_id is not null and not exists(select 1 from public.local_delivery_missions m where m.id=p_mission_id and m.transporter_id=auth.uid() and m.status in ('offered','accepted','picked_up')) then raise exception 'Active mission required'; end if;
  if p_collection_route_id is not null and not exists(select 1 from public.collection_routes r where r.id=p_collection_route_id and r.driver_id=auth.uid() and r.status in ('planned','in_progress')) then raise exception 'Active collection route required'; end if;
  insert into public.operational_position_events(profile_id,mission_id,collection_route_id,latitude,longitude,accuracy_meters,speed_kph,heading_degrees,battery_percent,source,recorded_at)
  values(auth.uid(),p_mission_id,p_collection_route_id,p_latitude,p_longitude,p_accuracy_meters,p_speed_kph,p_heading_degrees,p_battery_percent,p_source,p_recorded_at) returning id into event_id;
  return event_id;
end; $$;
revoke all on function public.record_operational_position(uuid,uuid,numeric,numeric,numeric,numeric,numeric,integer,text,timestamptz) from public,anon; grant execute on function public.record_operational_position(uuid,uuid,numeric,numeric,numeric,numeric,numeric,integer,text,timestamptz) to authenticated;

create or replace function public.approve_dispatch_rule_set(p_rule_set_id uuid) returns void language plpgsql security definer set search_path=public as $$ declare r public.dispatch_rule_sets%rowtype; begin
  select * into r from public.dispatch_rule_sets where id=p_rule_set_id for update; if r.id is null or r.status<>'draft' then raise exception 'Dispatch rule set unavailable'; end if;
  if r.created_by=auth.uid() then raise exception 'Self approval is forbidden'; end if; if not public.current_user_has_role(array['operations_manager','dispatch_manager','admin','super_admin']) then raise exception 'Dispatch rule approval required'; end if;
  update public.dispatch_rule_sets set status='retired' where country_code=r.country_code and city is not distinct from r.city and status='active';
  update public.dispatch_rule_sets set status='active',approved_by=auth.uid(),approved_at=now() where id=r.id;
end; $$;
revoke all on function public.approve_dispatch_rule_set(uuid) from public; grant execute on function public.approve_dispatch_rule_set(uuid) to authenticated;

create or replace function public.replace_dispatch_recommendations(p_mission_id uuid,p_rule_set_id uuid,p_recommendations jsonb) returns integer
language plpgsql security definer set search_path=public as $$ declare item jsonb; inserted integer:=0; begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  if not exists(select 1 from public.local_delivery_missions where id=p_mission_id) or not exists(select 1 from public.dispatch_rule_sets where id=p_rule_set_id and status='active' and effective_from<=now() and (effective_to is null or effective_to>now())) then raise exception 'Active mission and dispatch rules required'; end if;
  update public.dispatch_recommendations set status='expired' where mission_id=p_mission_id and status='proposed';
  for item in select value from jsonb_array_elements(p_recommendations) loop
    if (item->>'route_source')='geographic_fallback' and coalesce((item->>'requires_human_approval')::boolean,false)=false then raise exception 'Geographic fallback requires human approval'; end if;
    insert into public.dispatch_recommendations(mission_id,candidate_profile_id,rule_set_id,rank,score,distance_meters,duration_seconds,route_source,reasons,confidence,requires_human_approval,expires_at)
    values(p_mission_id,(item->>'candidate_id')::uuid,p_rule_set_id,(item->>'rank')::integer,(item->>'score')::numeric,(item->>'distance_meters')::integer,nullif(item->>'duration_seconds','')::integer,item->>'route_source',array(select jsonb_array_elements_text(item->'reasons')),item->>'confidence',coalesce((item->>'requires_human_approval')::boolean,true),now()+interval '10 minutes'); inserted:=inserted+1;
  end loop;
  insert into public.dispatch_recommendation_events(mission_id,event_type,sanitized_metadata) values(p_mission_id,'recommendations_generated',jsonb_build_object('count',inserted,'rule_set_id',p_rule_set_id)); return inserted;
end; $$;
revoke all on function public.replace_dispatch_recommendations(uuid,uuid,jsonb) from public,anon,authenticated; grant execute on function public.replace_dispatch_recommendations(uuid,uuid,jsonb) to service_role;

create or replace function public.approve_dispatch_recommendation(p_recommendation_id uuid,p_reason text) returns void language plpgsql security definer set search_path=public as $$ declare r public.dispatch_recommendations%rowtype; current_mission public.local_delivery_missions%rowtype; assigned_mission_id uuid; begin
  if not public.current_user_has_role(array['operations_manager','dispatch_manager','admin','super_admin']) then raise exception 'Dispatch approval required'; end if;
  select * into r from public.dispatch_recommendations where id=p_recommendation_id for update; if r.id is null or r.status<>'proposed' or r.expires_at<=now() then raise exception 'Dispatch recommendation unavailable'; end if;
  if length(trim(coalesce(p_reason,'')))<5 then raise exception 'Dispatch approval reason required'; end if;
  select * into current_mission from public.local_delivery_missions where id=r.mission_id for update;
  update public.dispatch_recommendations set status='assigned',approved_by=auth.uid(),approved_at=now() where id=r.id;
  if current_mission.transporter_id=r.candidate_profile_id then update public.local_delivery_missions set status='offered',score=r.score::integer,reason=r.reasons,offered_at=now() where id=r.mission_id returning id into assigned_mission_id;
  else
    update public.local_delivery_missions set status='cancelled' where id=current_mission.id;
    insert into public.local_delivery_missions(shipment_id,transporter_id,status,score,reason,offered_at) values(current_mission.shipment_id,r.candidate_profile_id,'offered',r.score::integer,r.reasons,now())
    on conflict(shipment_id,transporter_id) do update set status='offered',score=excluded.score,reason=excluded.reason,offered_at=now() returning id into assigned_mission_id;
  end if;
  update public.dispatch_recommendations set status='rejected' where mission_id=r.mission_id and id<>r.id and status='proposed';
  insert into public.dispatch_recommendation_events(mission_id,recommendation_id,event_type,actor_id,reason,sanitized_metadata) values(r.mission_id,r.id,'recommendation_approved',auth.uid(),trim(p_reason),jsonb_build_object('assigned_mission_id',assigned_mission_id));
end; $$;
revoke all on function public.approve_dispatch_recommendation(uuid,text) from public; grant execute on function public.approve_dispatch_recommendation(uuid,text) to authenticated;

create or replace function public.purge_expired_operational_positions() returns integer language plpgsql security definer set search_path=public as $$ declare affected integer; begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if; delete from public.operational_position_events where retention_until<now(); get diagnostics affected=row_count; return affected;
end; $$;
revoke all on function public.purge_expired_operational_positions() from public,anon,authenticated; grant execute on function public.purge_expired_operational_positions() to service_role;
