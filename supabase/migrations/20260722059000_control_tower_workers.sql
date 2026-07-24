create table public.control_tower_notification_commands (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.control_tower_events(id) on delete cascade,
  country_code text not null check(char_length(country_code)=2), notification_type text not null,
  audience jsonb not null default '{}', channels text[] not null default array['in_app'], sanitized_content jsonb not null default '{}',
  status text not null default 'pending' check(status in ('pending','processing','sent','failed','cancelled')),
  created_at timestamptz not null default now(), processed_at timestamptz, unique(event_id,notification_type)
);
alter table public.control_tower_notification_commands enable row level security;
create policy tower_notification_commands_scoped on public.control_tower_notification_commands for select using(public.current_user_has_control_tower_country(country_code));
create unique index control_tower_recommendations_one_active_idx on public.control_tower_recommendations(country_code,recommendation_type,entity_type,entity_id) where status in ('proposed','acknowledged');

create or replace function public.apply_control_tower_digital_twin(p_event_id uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare e public.control_tower_events%rowtype; twin_id uuid; previous_status text; next_version bigint;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  select * into e from public.control_tower_events where id=p_event_id;
  if e.id is null then raise exception 'Control event unavailable'; end if;
  select id,operational_status,state_version+1 into twin_id,previous_status,next_version from public.digital_twin_entities where entity_type=e.entity_type and entity_id=e.entity_id for update;
  next_version:=coalesce(next_version,1);
  insert into public.digital_twin_entities(entity_type,entity_id,country_code,region_code,city,operational_status,latitude,longitude,capacity_used,capacity_total,state,state_version,last_event_id,observed_at)
    values(e.entity_type,e.entity_id,e.country_code,e.region_code,e.sanitized_payload->>'city',coalesce(e.sanitized_payload->>'operational_status',e.event_type),nullif(e.sanitized_payload->>'latitude','')::numeric,nullif(e.sanitized_payload->>'longitude','')::numeric,nullif(e.sanitized_payload->>'capacity_used','')::numeric,nullif(e.sanitized_payload->>'capacity_total','')::numeric,e.sanitized_payload,next_version,e.id,e.occurred_at)
    on conflict(entity_type,entity_id) do update set country_code=excluded.country_code,region_code=excluded.region_code,city=coalesce(excluded.city,public.digital_twin_entities.city),operational_status=excluded.operational_status,latitude=coalesce(excluded.latitude,public.digital_twin_entities.latitude),longitude=coalesce(excluded.longitude,public.digital_twin_entities.longitude),capacity_used=coalesce(excluded.capacity_used,public.digital_twin_entities.capacity_used),capacity_total=coalesce(excluded.capacity_total,public.digital_twin_entities.capacity_total),state=public.digital_twin_entities.state||excluded.state,state_version=excluded.state_version,last_event_id=e.id,observed_at=e.occurred_at,updated_at=now()
    returning id into twin_id;
  insert into public.digital_twin_state_events(twin_entity_id,control_event_id,previous_status,new_status,state_version,state_delta,occurred_at)
    values(twin_id,e.id,previous_status,coalesce(e.sanitized_payload->>'operational_status',e.event_type),next_version,e.sanitized_payload,e.occurred_at)
    on conflict(twin_entity_id,state_version) do nothing;
  return twin_id;
end; $$;

create or replace function public.refresh_control_tower_snapshot(p_country_code text) returns uuid language plpgsql security definer set search_path=public as $$
declare country text:=upper(p_country_code); snapshot_id uuid; kpis jsonb; health text; capacity_total numeric; capacity_used numeric; critical_alerts integer; incidents integer; stale integer;
begin
  if auth.role()<>'service_role' or char_length(country)<>2 then raise exception 'Service role and country required'; end if;
  select coalesce(sum(c.storage_weight_capacity_kg),0),coalesce(sum(c.reserved_weight_kg),0) into capacity_total,capacity_used from public.hub_capacities c join public.airport_hubs h on h.id=c.hub_id where h.country=country and c.capacity_date=current_date;
  select count(*) into incidents from public.operational_incidents where country_code=country and status not in ('resolved','closed');
  select count(*) into critical_alerts from public.operational_tracking_alerts a where a.severity='critical' and a.status in ('open','qualified','assigned') and exists(select 1 from public.governance_staff_assignments s where s.profile_id=a.profile_id and s.active and s.country_code=country);
  select count(*) into stale from public.driver_operational_states s where s.status not in ('offline','available','unavailable','mission_completed','paused') and exists(select 1 from public.governance_staff_assignments a where a.profile_id=s.profile_id and a.active and a.country_code=country) and not exists(select 1 from public.operational_live_positions p where p.profile_id=s.profile_id and p.expires_at>now());
  kpis:=jsonb_build_object(
    'active_shipments',(select count(*) from public.shipments where origin_country=country and status not in ('delivered','cancelled')),
    'active_missions',(select count(*) from public.local_delivery_missions m join public.shipments s on s.id=m.shipment_id where s.origin_country=country and m.status in ('offered','accepted','picked_up')),
    'open_incidents',incidents,'critical_alerts',critical_alerts,
    'online_drivers',(select count(*) from public.operational_live_positions p where p.expires_at>now() and exists(select 1 from public.governance_staff_assignments a where a.profile_id=p.profile_id and a.active and a.country_code=country)),
    'stale_drivers',stale,'hub_capacity_percent',case when capacity_total>0 then round(capacity_used/capacity_total*100) else 0 end,
    'payment_exceptions',(select count(*) from public.payments where country_code=country and status in ('failed','expired','refund_pending')),
    'customs_blocked',(select count(*) from public.customs_cases where country_scope=country and status in ('rejected','suspended','seized','additional_information_required','inspection_required'))
  );
  health:=case when critical_alerts>2 or incidents>10 or (capacity_total>0 and capacity_used/capacity_total>=.95) then 'critical' when critical_alerts>0 or incidents>3 or stale>2 or (capacity_total>0 and capacity_used/capacity_total>=.75) then 'degraded' else 'nominal' end;
  insert into public.control_tower_snapshots(country_code,scope_type,scope_id,captured_at,freshness_seconds,health_status,kpis,alerts,data_quality,source_watermark)
    values(country,'country',country,date_trunc('minute',now()),0,health,kpis,'[]',jsonb_build_object('notifications_country_breakdown','unavailable'),(select max(received_at) from public.control_tower_events where country_code=country))
    on conflict(scope_type,scope_id,captured_at) do update set health_status=excluded.health_status,kpis=excluded.kpis,data_quality=excluded.data_quality,source_watermark=excluded.source_watermark
    returning id into snapshot_id; return snapshot_id;
end; $$;

create or replace function public.generate_control_tower_recommendations(p_country_code text) returns integer language plpgsql security definer set search_path=public as $$
declare snapshot public.control_tower_snapshots%rowtype; generated integer:=0; value integer;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  select * into snapshot from public.control_tower_snapshots where scope_type='country' and scope_id=upper(p_country_code) order by captured_at desc limit 1;
  if snapshot.id is null then raise exception 'Control snapshot required'; end if;
  value:=coalesce((snapshot.kpis->>'stale_drivers')::integer,0);
  if value>0 then insert into public.control_tower_recommendations(country_code,module,recommendation_type,entity_type,entity_id,priority,title,explanation,evidence,alternatives,confidence,requires_human_approval,expires_at)
    values(snapshot.country_code,'driver_tracking','verify_driver_signal','country',snapshot.country_code,'high','Contrôler les signaux terrain',value||' chauffeur(s) sans position récente. Vérifier la connectivité avant toute réaffectation.',jsonb_build_array(jsonb_build_object('metric','stale_drivers','value',value)),jsonb_build_array('Attendre la reprise réseau','Contacter le conducteur','Préparer une réaffectation'),80,true,now()+interval '30 minutes') on conflict(country_code,recommendation_type,entity_type,entity_id) where status in ('proposed','acknowledged') do nothing; get diagnostics generated=row_count; end if;
  value:=coalesce((snapshot.kpis->>'customs_blocked')::integer,0);
  if value>0 then insert into public.control_tower_recommendations(country_code,module,recommendation_type,entity_type,entity_id,priority,title,explanation,evidence,alternatives,confidence,requires_human_approval,expires_at)
    values(snapshot.country_code,'customs','customs_escalation','country',snapshot.country_code,'high','Traiter les blocages douaniers',value||' dossier(s) nécessitent une décision ou une pièce officielle.',jsonb_build_array(jsonb_build_object('metric','customs_blocked','value',value)),jsonb_build_array('Demander les pièces','Escalader au responsable douane','Suspendre le départ'),90,true,now()+interval '2 hours') on conflict(country_code,recommendation_type,entity_type,entity_id) where status in ('proposed','acknowledged') do nothing; get diagnostics value=row_count; generated:=generated+value; end if;
  return generated;
end; $$;

create or replace function public.complete_control_tower_outbox(p_item_id uuid,p_worker_id text,p_success boolean,p_error_code text) returns void language plpgsql security definer set search_path=public as $$
declare item public.control_tower_outbox%rowtype;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  select * into item from public.control_tower_outbox where id=p_item_id for update;
  if item.id is null or item.status<>'processing' or item.locked_by<>p_worker_id then raise exception 'Outbox lease unavailable'; end if;
  update public.control_tower_outbox set status=case when p_success then 'completed' when attempts>=8 then 'dead_letter' else 'failed' end,available_at=case when p_success then available_at else now()+least(interval '30 minutes',interval '15 seconds'*power(2,least(attempts,7))) end,last_error_code=case when p_success then null else left(coalesce(p_error_code,'PROCESSING_FAILED'),120) end,completed_at=case when p_success then now() end,locked_at=null,locked_by=null where id=item.id;
  if p_success and not exists(select 1 from public.control_tower_outbox where event_id=item.event_id and status not in ('completed','dead_letter')) then update public.control_tower_events set processing_status='processed',processed_at=now() where id=item.event_id; end if;
end; $$;

create or replace function public.process_control_tower_outbox_item(p_item_id uuid,p_worker_id text) returns void language plpgsql security definer set search_path=public as $$
declare item public.control_tower_outbox%rowtype; event public.control_tower_events%rowtype;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  select * into item from public.control_tower_outbox where id=p_item_id and status='processing' and locked_by=p_worker_id;
  if item.id is null then raise exception 'Outbox lease unavailable'; end if;
  select * into event from public.control_tower_events where id=item.event_id;
  if item.destination='digital_twin' then perform public.apply_control_tower_digital_twin(event.id);
  elsif item.destination='snapshot' then perform public.refresh_control_tower_snapshot(event.country_code);
  elsif item.destination='recommendations' then perform public.generate_control_tower_recommendations(event.country_code);
  elsif item.destination='notifications' then insert into public.control_tower_notification_commands(event_id,country_code,notification_type,audience,channels,sanitized_content) values(event.id,event.country_code,event.event_type,jsonb_build_object('country_code',event.country_code),array['in_app'],jsonb_build_object('entity_type',event.entity_type,'entity_id',event.entity_id,'severity',event.severity)) on conflict(event_id,notification_type) do nothing;
  elsif item.destination='analytics' then null;
  else raise exception 'Unsupported Control Tower destination'; end if;
  perform public.complete_control_tower_outbox(item.id,p_worker_id,true,null);
exception when others then perform public.complete_control_tower_outbox(p_item_id,p_worker_id,false,sqlstate); end; $$;

revoke all on function public.apply_control_tower_digital_twin(uuid) from public,anon,authenticated;
revoke all on function public.refresh_control_tower_snapshot(text) from public,anon,authenticated;
revoke all on function public.generate_control_tower_recommendations(text) from public,anon,authenticated;
revoke all on function public.complete_control_tower_outbox(uuid,text,boolean,text) from public,anon,authenticated;
revoke all on function public.process_control_tower_outbox_item(uuid,text) from public,anon,authenticated;
grant execute on function public.apply_control_tower_digital_twin(uuid) to service_role;
grant execute on function public.refresh_control_tower_snapshot(text) to service_role;
grant execute on function public.generate_control_tower_recommendations(text) to service_role;
grant execute on function public.complete_control_tower_outbox(uuid,text,boolean,text) to service_role;
grant execute on function public.process_control_tower_outbox_item(uuid,text) to service_role;
