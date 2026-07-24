create or replace function public.sanitize_control_tower_event_payload(p_payload jsonb) returns jsonb
language sql immutable set search_path=public as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'operational_status',p_payload->'operational_status','city',p_payload->'city',
    'latitude',p_payload->'latitude','longitude',p_payload->'longitude',
    'capacity_used',p_payload->'capacity_used','capacity_total',p_payload->'capacity_total',
    'priority',p_payload->'priority','risk_level',p_payload->'risk_level',
    'shipment_id',p_payload->'shipment_id','assigned_to',p_payload->'assigned_to',
    'vehicle_id',p_payload->'vehicle_id','active_mission_id',p_payload->'active_mission_id',
    'eta_seconds',p_payload->'eta_seconds','progress_percent',p_payload->'progress_percent',
    'source_record_id',p_payload->'source_record_id','reason_code',p_payload->'reason_code',
    'metric',p_payload->'metric','value',p_payload->'value'
  ));
$$;
revoke all on function public.sanitize_control_tower_event_payload(jsonb) from public,anon;
grant execute on function public.sanitize_control_tower_event_payload(jsonb) to authenticated,service_role;

create or replace function public.ingest_control_tower_events(p_events jsonb) returns integer language plpgsql security definer set search_path=public as $$
declare item jsonb; event_id uuid; inserted integer:=0;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  if jsonb_typeof(p_events)<>'array' or jsonb_array_length(p_events) not between 1 and 500 then raise exception 'Event batch invalid'; end if;
  for item in select value from jsonb_array_elements(p_events) loop
    event_id:=null;
    insert into public.control_tower_events(source_module,source_event_id,event_type,entity_type,entity_id,country_code,region_code,occurred_at,severity,sanitized_payload,correlation_id)
      values(item->>'source_module',item->>'source_event_id',item->>'event_type',item->>'entity_type',item->>'entity_id',upper(item->>'country_code'),item->>'region_code',(item->>'occurred_at')::timestamptz,coalesce(item->>'severity','info'),public.sanitize_control_tower_event_payload(coalesce(item->'sanitized_payload','{}')),nullif(item->>'correlation_id','')::uuid)
      on conflict(source_module,source_event_id) do nothing returning id into event_id;
    if event_id is null then continue; end if;
    insert into public.control_tower_outbox(event_id,destination) select event_id,value from jsonb_array_elements_text('["digital_twin","snapshot","recommendations","notifications","analytics"]');
    inserted:=inserted+1;
  end loop; return inserted;
end; $$;
revoke all on function public.ingest_control_tower_events(jsonb) from public,anon,authenticated;
grant execute on function public.ingest_control_tower_events(jsonb) to service_role;
