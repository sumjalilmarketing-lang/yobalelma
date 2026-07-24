create table public.operational_incident_comments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.operational_incidents(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(trim(body)) between 2 and 4000),
  created_at timestamptz not null default now()
);
create index operational_incident_comments_timeline_idx
  on public.operational_incident_comments(incident_id,created_at,id);
alter table public.operational_incident_comments enable row level security;
create policy operational_incident_comments_scoped on public.operational_incident_comments for select using (
  exists (
    select 1 from public.operational_incidents i where i.id=incident_id and (
      i.created_by=auth.uid() or i.assigned_to=auth.uid()
      or public.current_user_has_role(array['admin','super_admin','auditor'])
      or (i.country_code is not null and public.current_user_has_control_tower_country(i.country_code))
      or (i.hub_id is not null and public.current_user_can_access_hub(i.hub_id))
    )
  )
);

create or replace function public.manage_control_tower_incident(
  p_incident_id uuid,
  p_status text default null,
  p_assigned_to uuid default null,
  p_comment text default null
) returns void language plpgsql security definer set search_path=public as $$
declare
  incident public.operational_incidents%rowtype;
  next_status public.operational_incident_status;
begin
  select * into incident from public.operational_incidents where id=p_incident_id for update;
  if incident.id is null then raise exception 'Incident unavailable'; end if;
  if not public.current_user_has_role(array['admin','super_admin','operations_manager','dispatch_manager','hub_manager','relay_manager','collection_manager','local_delivery_manager','customer_support_manager','security_manager']) then
    raise exception 'Incident management unavailable';
  end if;
  if not (
    public.current_user_has_role(array['admin','super_admin'])
    or (incident.country_code is not null and public.current_user_has_control_tower_country(incident.country_code))
    or (incident.hub_id is not null and public.current_user_can_manage_hub(incident.hub_id))
  ) then raise exception 'Incident scope unavailable'; end if;
  if p_assigned_to is not null and incident.country_code is not null and not exists (
    select 1 from public.governance_staff_assignments a
    where a.profile_id=p_assigned_to and a.active and a.country_code=incident.country_code
  ) then raise exception 'Assignee is outside incident country scope'; end if;
  if p_status is not null then
    next_status:=p_status::public.operational_incident_status;
    if not (
      (incident.status='open' and next_status in ('assigned','escalated','blocked','resolved'))
      or (incident.status='assigned' and next_status in ('escalated','blocked','resolved'))
      or (incident.status in ('escalated','blocked') and next_status in ('assigned','resolved'))
      or (incident.status='resolved' and next_status in ('closed','open'))
      or incident.status=next_status
    ) then raise exception 'Incident workflow transition unavailable'; end if;
  end if;
  update public.operational_incidents set
    status=coalesce(next_status,status),
    assigned_to=coalesce(p_assigned_to,assigned_to),
    resolved_by=case when next_status='resolved' then auth.uid() when next_status='open' then null else resolved_by end,
    resolved_at=case when next_status='resolved' then now() when next_status='open' then null else resolved_at end,
    closed_at=case when next_status='closed' then now() when next_status='open' then null else closed_at end,
    updated_at=now()
  where id=incident.id;
  if nullif(trim(coalesce(p_comment,'')),'') is not null then
    insert into public.operational_incident_comments(incident_id,author_id,body)
      values(incident.id,auth.uid(),trim(p_comment));
  end if;
end; $$;
revoke all on function public.manage_control_tower_incident(uuid,text,uuid,text) from public,anon;
grant execute on function public.manage_control_tower_incident(uuid,text,uuid,text) to authenticated;

create or replace function public.emit_control_tower_domain_event() returns trigger
language plpgsql security definer set search_path=public as $$
declare
  row_data jsonb:=to_jsonb(new);
  country text;
  entity_type text;
  entity_id text;
  source_record_id text;
  operational_status text;
  event_id uuid;
  severity text:='info';
  payload jsonb;
begin
  source_record_id:=coalesce(row_data->>'id',row_data->>'profile_id');
  entity_id:=source_record_id;
  entity_type:=case tg_table_name
    when 'shipments' then 'shipment'
    when 'operational_incidents' then 'incident'
    when 'driver_operational_states' then 'driver'
    when 'payments' then 'shipment'
    when 'customs_cases' then 'shipment'
    when 'airport_hubs' then 'hub'
    when 'relay_points' then 'relay'
    when 'local_delivery_missions' then 'mission'
  end;
  if tg_table_name in ('payments','customs_cases') then entity_id:=row_data->>'shipment_id'; end if;
  if entity_type is null or entity_id is null then return new; end if;
  country:=upper(coalesce(row_data->>'country_code',row_data->>'country_scope',row_data->>'origin_country',row_data->>'country'));
  if country is null and tg_table_name='operational_incidents' then
    select coalesce(h.country,s.origin_country) into country
    from (select 1) x
    left join public.airport_hubs h on h.id=nullif(row_data->>'hub_id','')::uuid
    left join public.shipments s on s.id=nullif(row_data->>'shipment_id','')::uuid;
  elsif country is null and tg_table_name='driver_operational_states' then
    select a.country_code into country from public.governance_staff_assignments a
      where a.profile_id=(row_data->>'profile_id')::uuid and a.active order by a.is_primary desc,a.assigned_at desc limit 1;
  elsif country is null and tg_table_name='local_delivery_missions' then
    select s.origin_country into country from public.shipments s where s.id=(row_data->>'shipment_id')::uuid;
  end if;
  if country is null or char_length(country)<>2 then return new; end if;
  operational_status:=coalesce(row_data->>'operational_status',row_data->>'status','updated');
  if tg_table_name='operational_incidents' and row_data->>'priority'='urgent' then severity:='critical';
  elsif tg_table_name='operational_incidents' and row_data->>'priority'='high' then severity:='warning';
  elsif tg_table_name='payments' and operational_status in ('failed','expired','refund_pending') then severity:='warning';
  elsif tg_table_name='customs_cases' and (row_data->>'risk_level' in ('high','critical') or operational_status in ('rejected','suspended','seized')) then severity:='critical';
  elsif operational_status in ('blocked','degraded','gps_unavailable','incident','full','maintenance') then severity:='warning';
  end if;
  payload:=jsonb_strip_nulls(jsonb_build_object(
    'operational_status',operational_status,
    'source_record_id',source_record_id,
    'city',coalesce(row_data->>'city',row_data->>'origin_city'),
    'latitude',coalesce(row_data->>'latitude',row_data->>'geo_latitude'),
    'longitude',coalesce(row_data->>'longitude',row_data->>'geo_longitude'),
    'priority',row_data->>'priority',
    'risk_level',row_data->>'risk_level',
    'shipment_id',row_data->>'shipment_id',
    'assigned_to',row_data->>'assigned_to',
    'vehicle_id',row_data->>'vehicle_id',
    'active_mission_id',row_data->>'active_mission_id'
  ));
  insert into public.control_tower_events(source_module,source_event_id,event_type,entity_type,entity_id,country_code,occurred_at,severity,sanitized_payload)
    values(tg_table_name,tg_table_name||':'||source_record_id||':'||md5(payload::text),tg_table_name||'.'||lower(tg_op),entity_type,entity_id,country,now(),severity,payload)
    on conflict(source_module,source_event_id) do nothing returning id into event_id;
  if event_id is not null then
    insert into public.control_tower_outbox(event_id,destination)
      select event_id,value from jsonb_array_elements_text('["digital_twin","snapshot","recommendations","notifications","analytics"]');
  end if;
  return new;
end; $$;
revoke all on function public.emit_control_tower_domain_event() from public,anon,authenticated;

create trigger shipments_control_tower_event after insert or update on public.shipments for each row execute function public.emit_control_tower_domain_event();
create trigger incidents_control_tower_event after insert or update on public.operational_incidents for each row execute function public.emit_control_tower_domain_event();
create trigger driver_states_control_tower_event after insert or update on public.driver_operational_states for each row execute function public.emit_control_tower_domain_event();
create trigger payments_control_tower_event after insert or update on public.payments for each row execute function public.emit_control_tower_domain_event();
create trigger customs_cases_control_tower_event after insert or update on public.customs_cases for each row execute function public.emit_control_tower_domain_event();
create trigger hubs_control_tower_event after insert or update on public.airport_hubs for each row execute function public.emit_control_tower_domain_event();
create trigger relays_control_tower_event after insert or update on public.relay_points for each row execute function public.emit_control_tower_domain_event();
create trigger local_missions_control_tower_event after insert or update on public.local_delivery_missions for each row execute function public.emit_control_tower_domain_event();
