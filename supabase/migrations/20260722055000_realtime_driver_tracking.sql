alter table public.operational_position_events
  add column if not exists vehicle_id uuid references public.collection_vehicles(id) on delete set null,
  add column if not exists network_status text check (network_status is null or network_status in ('online','degraded','offline_replay')),
  add column if not exists location_status text not null default 'live' check (location_status in ('live','delayed','imprecise','suspicious')),
  add column if not exists client_event_id uuid,
  add column if not exists device_session_id uuid,
  add column if not exists is_suspicious boolean not null default false,
  add column if not exists anomaly_codes text[] not null default '{}';
create unique index if not exists operational_position_client_event_idx
  on public.operational_position_events(profile_id,client_event_id) where client_event_id is not null;

create table if not exists public.driver_operational_states (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'offline' check (status in ('offline','available','unavailable','mission_proposed','mission_accepted','en_route_pickup','arrived_pickup','parcel_collected','in_transit','arrived_relay','arrived_hub','arrived_recipient','delivery_in_progress','mission_completed','incident','paused','gps_unavailable')),
  active_mission_id uuid references public.local_delivery_missions(id) on delete set null,
  collection_route_id uuid references public.collection_routes(id) on delete set null,
  vehicle_id uuid references public.collection_vehicles(id) on delete set null,
  device_session_id uuid,
  last_transition_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((active_mission_id is not null)::integer + (collection_route_id is not null)::integer <= 1)
);
create table if not exists public.driver_status_events (
  id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
  previous_status text, new_status text not null, mission_id uuid references public.local_delivery_missions(id) on delete set null,
  collection_route_id uuid references public.collection_routes(id) on delete set null, reason text,
  actor_id uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create index if not exists driver_status_events_profile_idx on public.driver_status_events(profile_id,created_at desc);

create table if not exists public.operational_live_positions (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  position_event_id uuid not null references public.operational_position_events(id) on delete cascade,
  mission_id uuid references public.local_delivery_missions(id) on delete cascade,
  collection_route_id uuid references public.collection_routes(id) on delete cascade,
  vehicle_id uuid references public.collection_vehicles(id) on delete set null,
  latitude numeric(10,7) not null check (latitude between -90 and 90), longitude numeric(10,7) not null check (longitude between -180 and 180),
  accuracy_meters numeric(10,2) not null, speed_kph numeric(8,2), heading_degrees numeric(6,2), battery_percent integer,
  network_status text not null, location_status text not null, recorded_at timestamptz not null, received_at timestamptz not null,
  expires_at timestamptz not null, updated_at timestamptz not null default now()
);
create index if not exists operational_live_positions_mission_idx on public.operational_live_positions(mission_id) where mission_id is not null;

create table if not exists public.operational_geofences (
  id uuid primary key default gen_random_uuid(), name text not null, country_code text not null check (char_length(country_code)=2),
  fence_type text not null check (fence_type in ('pickup','relay','hub','delivery','restricted','sensitive')),
  mission_id uuid references public.local_delivery_missions(id) on delete cascade,
  collection_route_id uuid references public.collection_routes(id) on delete cascade,
  latitude numeric(10,7) not null check (latitude between -90 and 90), longitude numeric(10,7) not null check (longitude between -180 and 180),
  radius_meters integer not null check (radius_meters between 25 and 10000), active boolean not null default true,
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.operational_geofence_events (
  id uuid primary key default gen_random_uuid(), geofence_id uuid not null references public.operational_geofences(id) on delete cascade,
  position_event_id uuid not null references public.operational_position_events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('entered','exited','probable_arrival','prolonged_stop','route_deviation')),
  distance_meters integer not null check (distance_meters>=0), requires_proof boolean not null default true,
  occurred_at timestamptz not null, created_at timestamptz not null default now(), unique(geofence_id,position_event_id,event_type)
);

create table if not exists public.operational_tracking_alerts (
  id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
  mission_id uuid references public.local_delivery_missions(id) on delete cascade, collection_route_id uuid references public.collection_routes(id) on delete cascade,
  alert_type text not null check (alert_type in ('gps_unavailable','stale_position','impossible_speed','location_spoofing_suspected','route_deviation','prolonged_stop','outside_zone','mission_not_started','mission_not_accepted','multi_device','low_battery')),
  severity text not null check (severity in ('info','warning','critical')), status text not null default 'open' check (status in ('open','qualified','assigned','resolved','dismissed')),
  sanitized_context jsonb not null default '{}', assigned_to uuid references public.profiles(id), resolution_comment text,
  detected_at timestamptz not null default now(), qualified_at timestamptz, resolved_at timestamptz, updated_at timestamptz not null default now()
);
create index if not exists operational_tracking_alerts_queue_idx on public.operational_tracking_alerts(status,severity,detected_at desc);

create table if not exists public.operational_location_access_logs (
  id uuid primary key default gen_random_uuid(), viewer_id uuid not null references public.profiles(id), subject_profile_id uuid not null references public.profiles(id),
  mission_id uuid references public.local_delivery_missions(id) on delete set null, purpose text not null,
  precision_level text not null check (precision_level in ('approximate','precise')), created_at timestamptz not null default now()
);

alter table public.driver_operational_states enable row level security;
alter table public.driver_status_events enable row level security;
alter table public.operational_live_positions enable row level security;
alter table public.operational_geofences enable row level security;
alter table public.operational_geofence_events enable row level security;
alter table public.operational_tracking_alerts enable row level security;
alter table public.operational_location_access_logs enable row level security;

create policy driver_states_own on public.driver_operational_states for select using (profile_id=auth.uid());
create policy driver_status_events_own on public.driver_status_events for select using (profile_id=auth.uid());
create policy live_positions_own on public.operational_live_positions for select using (profile_id=auth.uid());
create policy geofences_dispatch_read on public.operational_geofences for select using (public.current_user_has_role(array['admin','super_admin','auditor']) or public.current_user_has_dispatch_country(country_code));
create policy geofences_dispatch_manage on public.operational_geofences for all using (public.current_user_has_dispatch_country(country_code)) with check (public.current_user_has_dispatch_country(country_code));
create policy geofence_events_own on public.operational_geofence_events for select using (profile_id=auth.uid());
create policy tracking_alerts_own on public.operational_tracking_alerts for select using (profile_id=auth.uid());
create policy location_access_logs_viewer on public.operational_location_access_logs for select using (viewer_id=auth.uid());

create or replace function public.current_user_can_view_tracking_subject(p_profile_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select p_profile_id=auth.uid() or public.current_user_has_role(array['admin','super_admin','auditor']) or exists(
    select 1 from public.governance_staff_assignments viewer
    join public.governance_staff_assignments subject on subject.profile_id=p_profile_id and subject.active and subject.country_code=viewer.country_code
    where viewer.profile_id=auth.uid() and viewer.active and viewer.role_id in ('operations_manager','dispatch_manager','collection_manager','local_delivery_manager','security_manager')
  );
$$;
revoke all on function public.current_user_can_view_tracking_subject(uuid) from public;
grant execute on function public.current_user_can_view_tracking_subject(uuid) to authenticated,service_role;

drop policy driver_states_own on public.driver_operational_states;
drop policy driver_status_events_own on public.driver_status_events;
drop policy live_positions_own on public.operational_live_positions;
drop policy geofence_events_own on public.operational_geofence_events;
drop policy tracking_alerts_own on public.operational_tracking_alerts;
create policy driver_states_scoped on public.driver_operational_states for select using (public.current_user_can_view_tracking_subject(profile_id));
create policy driver_status_events_scoped on public.driver_status_events for select using (public.current_user_can_view_tracking_subject(profile_id));
create policy live_positions_scoped on public.operational_live_positions for select using (public.current_user_can_view_tracking_subject(profile_id));
create policy geofence_events_scoped on public.operational_geofence_events for select using (public.current_user_can_view_tracking_subject(profile_id));
create policy tracking_alerts_scoped on public.operational_tracking_alerts for select using (public.current_user_can_view_tracking_subject(profile_id));

create or replace function public.set_driver_operational_status(p_status text,p_mission_id uuid,p_collection_route_id uuid,p_vehicle_id uuid,p_device_session_id uuid,p_reason text) returns void
language plpgsql security definer set search_path=public as $$
declare previous text; allowed boolean; owned boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_status not in ('offline','available','unavailable','mission_proposed','mission_accepted','en_route_pickup','arrived_pickup','parcel_collected','in_transit','arrived_relay','arrived_hub','arrived_recipient','delivery_in_progress','mission_completed','incident','paused','gps_unavailable') then raise exception 'Invalid driver status'; end if;
  if (p_mission_id is not null)::integer+(p_collection_route_id is not null)::integer>1 then raise exception 'Only one active assignment allowed'; end if;
  owned := (p_mission_id is not null and exists(select 1 from public.local_delivery_missions m where m.id=p_mission_id and m.transporter_id=auth.uid() and m.status in ('offered','accepted','picked_up')))
    or (p_collection_route_id is not null and exists(select 1 from public.collection_routes r where r.id=p_collection_route_id and r.driver_id=auth.uid() and r.status in ('planned','in_progress')));
  if p_status not in ('offline','available','unavailable','paused','gps_unavailable') and not owned then raise exception 'Active assignment required'; end if;
  select status into previous from public.driver_operational_states where profile_id=auth.uid() for update;
  previous:=coalesce(previous,'offline');
  allowed := p_status=previous or (previous,p_status) in (('offline','available'),('offline','mission_accepted'),('available','mission_proposed'),('available','mission_accepted'),('mission_proposed','mission_accepted'),('mission_accepted','en_route_pickup'),('mission_accepted','in_transit'),('en_route_pickup','arrived_pickup'),('arrived_pickup','parcel_collected'),('parcel_collected','in_transit'),('in_transit','arrived_relay'),('in_transit','arrived_hub'),('in_transit','arrived_recipient'),('arrived_recipient','delivery_in_progress'),('delivery_in_progress','mission_completed'))
    or (previous in ('paused','gps_unavailable','incident') and p_status in ('mission_accepted','in_transit'))
    or p_status in ('incident','paused','gps_unavailable','offline','unavailable');
  if not allowed then raise exception 'Driver status transition forbidden'; end if;
  insert into public.driver_operational_states(profile_id,status,active_mission_id,collection_route_id,vehicle_id,device_session_id,last_transition_at,updated_at)
    values(auth.uid(),p_status,case when p_status in ('offline','available','unavailable','mission_completed','paused') then null else p_mission_id end,case when p_status in ('offline','available','unavailable','mission_completed','paused') then null else p_collection_route_id end,p_vehicle_id,p_device_session_id,now(),now())
    on conflict(profile_id) do update set status=excluded.status,active_mission_id=excluded.active_mission_id,collection_route_id=excluded.collection_route_id,vehicle_id=excluded.vehicle_id,device_session_id=excluded.device_session_id,last_transition_at=now(),updated_at=now();
  insert into public.driver_status_events(profile_id,previous_status,new_status,mission_id,collection_route_id,reason,actor_id)
    values(auth.uid(),previous,p_status,p_mission_id,p_collection_route_id,nullif(trim(coalesce(p_reason,'')),''),auth.uid());
  if p_status in ('offline','unavailable','mission_completed','paused') then
    update public.operational_location_consents set granted=false,revoked_at=now() where profile_id=auth.uid() and granted and revoked_at is null;
    delete from public.operational_live_positions where profile_id=auth.uid();
  end if;
end; $$;
revoke all on function public.set_driver_operational_status(text,uuid,uuid,uuid,uuid,text) from public,anon;
grant execute on function public.set_driver_operational_status(text,uuid,uuid,uuid,uuid,text) to authenticated;

create or replace function public.record_operational_positions_batch(p_positions jsonb) returns integer
language plpgsql security definer set search_path=public as $$
declare item jsonb; inserted integer:=0; event_id uuid; state public.driver_operational_states%rowtype; last_position public.operational_position_events%rowtype; derived_speed numeric; suspicious boolean; codes text[];
begin
  if auth.uid() is null or jsonb_typeof(p_positions)<>'array' or jsonb_array_length(p_positions) not between 1 and 50 then raise exception 'Position batch invalid'; end if;
  select * into state from public.driver_operational_states where profile_id=auth.uid();
  if state.status not in ('mission_accepted','en_route_pickup','arrived_pickup','parcel_collected','in_transit','arrived_relay','arrived_hub','arrived_recipient','delivery_in_progress','incident','gps_unavailable') then raise exception 'Active tracking status required'; end if;
  if not exists(select 1 from public.operational_location_consents c where c.profile_id=auth.uid() and c.granted and c.revoked_at is null and c.expires_at>now()) then raise exception 'Active location consent required'; end if;
  for item in select value from jsonb_array_elements(p_positions) loop
    event_id:=null; derived_speed:=null;
    if (item->>'recorded_at')::timestamptz<now()-interval '24 hours' or (item->>'recorded_at')::timestamptz>now()+interval '5 minutes' then raise exception 'Position timestamp invalid'; end if;
    select * into last_position from public.operational_position_events where profile_id=auth.uid() order by recorded_at desc limit 1;
    suspicious:=false; codes:='{}';
    if last_position.id is not null and (item->>'recorded_at')::timestamptz>last_position.recorded_at then
      derived_speed := 6371000*2*asin(sqrt(power(sin(radians((item->>'latitude')::numeric-last_position.latitude)/2),2)+cos(radians(last_position.latitude))*cos(radians((item->>'latitude')::numeric))*power(sin(radians((item->>'longitude')::numeric-last_position.longitude)/2),2))) / extract(epoch from ((item->>'recorded_at')::timestamptz-last_position.recorded_at))*3.6;
      if derived_speed>250 then suspicious:=true; codes:=array_append(codes,'impossible_speed'); end if;
    end if;
    if (item->>'accuracy_meters')::numeric>1000 then codes:=array_append(codes,'imprecise'); end if;
    insert into public.operational_position_events(profile_id,mission_id,collection_route_id,vehicle_id,latitude,longitude,accuracy_meters,speed_kph,heading_degrees,battery_percent,source,recorded_at,network_status,location_status,client_event_id,device_session_id,is_suspicious,anomaly_codes)
      values(auth.uid(),state.active_mission_id,state.collection_route_id,state.vehicle_id,(item->>'latitude')::numeric,(item->>'longitude')::numeric,(item->>'accuracy_meters')::numeric,nullif(item->>'speed_kph','')::numeric,nullif(item->>'heading_degrees','')::numeric,nullif(item->>'battery_percent','')::integer,coalesce(item->>'source','browser'),(item->>'recorded_at')::timestamptz,coalesce(item->>'network_status','online'),case when suspicious then 'suspicious' when (item->>'network_status')='offline_replay' then 'delayed' when (item->>'accuracy_meters')::numeric>250 then 'imprecise' else 'live' end,(item->>'client_event_id')::uuid,state.device_session_id,suspicious,codes)
      on conflict(profile_id,client_event_id) where client_event_id is not null do nothing returning id into event_id;
    if event_id is null then continue; end if;
    insert into public.operational_live_positions(profile_id,position_event_id,mission_id,collection_route_id,vehicle_id,latitude,longitude,accuracy_meters,speed_kph,heading_degrees,battery_percent,network_status,location_status,recorded_at,received_at,expires_at)
      select profile_id,id,mission_id,collection_route_id,vehicle_id,latitude,longitude,accuracy_meters,speed_kph,heading_degrees,battery_percent,network_status,location_status,recorded_at,received_at,now()+interval '10 minutes' from public.operational_position_events where id=event_id
      on conflict(profile_id) do update set position_event_id=excluded.position_event_id,mission_id=excluded.mission_id,collection_route_id=excluded.collection_route_id,vehicle_id=excluded.vehicle_id,latitude=excluded.latitude,longitude=excluded.longitude,accuracy_meters=excluded.accuracy_meters,speed_kph=excluded.speed_kph,heading_degrees=excluded.heading_degrees,battery_percent=excluded.battery_percent,network_status=excluded.network_status,location_status=excluded.location_status,recorded_at=excluded.recorded_at,received_at=excluded.received_at,expires_at=excluded.expires_at,updated_at=now() where excluded.recorded_at>public.operational_live_positions.recorded_at;
    if suspicious then insert into public.operational_tracking_alerts(profile_id,mission_id,collection_route_id,alert_type,severity,sanitized_context) values(auth.uid(),state.active_mission_id,state.collection_route_id,'impossible_speed','critical',jsonb_build_object('position_event_id',event_id,'derived_speed_kph',round(derived_speed,1))); end if;
    inserted:=inserted+1;
  end loop;
  return inserted;
end; $$;
revoke all on function public.record_operational_positions_batch(jsonb) from public,anon;
grant execute on function public.record_operational_positions_batch(jsonb) to authenticated;

create or replace function public.purge_expired_operational_tracking() returns jsonb
language plpgsql security definer set search_path=public as $$ declare positions_count integer; live_count integer; begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  delete from public.operational_live_positions where expires_at<now(); get diagnostics live_count=row_count;
  delete from public.operational_position_events where retention_until<now(); get diagnostics positions_count=row_count;
  return jsonb_build_object('live_positions',live_count,'history_positions',positions_count);
end; $$;
revoke all on function public.purge_expired_operational_tracking() from public,anon,authenticated;
grant execute on function public.purge_expired_operational_tracking() to service_role;

create or replace function public.get_client_mission_tracking(p_mission_id uuid)
returns table(driver_status text,latitude numeric,longitude numeric,accuracy_meters numeric,recorded_at timestamptz,location_status text)
language plpgsql security definer set search_path=public as $$
declare subject_id uuid;
begin
  if auth.uid() is null or not exists(
    select 1 from public.local_delivery_missions m join public.shipments s on s.id=m.shipment_id
    where m.id=p_mission_id and s.sender_id=auth.uid()
  ) then raise exception 'Mission tracking access denied'; end if;
  select transporter_id into subject_id from public.local_delivery_missions where id=p_mission_id;
  insert into public.operational_location_access_logs(viewer_id,subject_profile_id,mission_id,purpose,precision_level)
    values(auth.uid(),subject_id,p_mission_id,'client_active_mission_tracking','approximate');
  return query select s.status,round(p.latitude,3),round(p.longitude,3),p.accuracy_meters,p.recorded_at,p.location_status
    from public.driver_operational_states s left join public.operational_live_positions p on p.profile_id=s.profile_id and p.mission_id=p_mission_id and p.expires_at>now()
    where s.profile_id=subject_id;
end; $$;
revoke all on function public.get_client_mission_tracking(uuid) from public,anon;
grant execute on function public.get_client_mission_tracking(uuid) to authenticated;
