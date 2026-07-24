create unique index if not exists operational_tracking_alerts_one_open_idx
  on public.operational_tracking_alerts(profile_id,alert_type)
  where status in ('open','qualified','assigned');

create or replace function public.detect_tracking_device_change() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if old.device_session_id is not null and new.device_session_id is distinct from old.device_session_id
     and old.status not in ('offline','unavailable','mission_completed','paused') and old.updated_at>now()-interval '30 minutes' then
    insert into public.operational_tracking_alerts(profile_id,mission_id,collection_route_id,alert_type,severity,sanitized_context)
      values(new.profile_id,new.active_mission_id,new.collection_route_id,'multi_device','critical',jsonb_build_object('detected_by','device_session_change'))
      on conflict(profile_id,alert_type) where status in ('open','qualified','assigned') do nothing;
  end if;
  return new;
end; $$;
drop trigger if exists driver_state_device_change_alert on public.driver_operational_states;
create trigger driver_state_device_change_alert after update on public.driver_operational_states for each row execute function public.detect_tracking_device_change();

create or replace function public.manage_tracking_alert(p_alert_id uuid,p_status text,p_assigned_to uuid,p_comment text) returns void
language plpgsql security definer set search_path=public as $$
declare alert public.operational_tracking_alerts%rowtype;
begin
  if not public.current_user_has_role(array['operations_manager','dispatch_manager','collection_manager','local_delivery_manager','security_manager','admin','super_admin']) then raise exception 'Tracking alert management role required'; end if;
  if p_status not in ('qualified','assigned','resolved','dismissed') then raise exception 'Invalid alert status'; end if;
  select * into alert from public.operational_tracking_alerts where id=p_alert_id for update;
  if alert.id is null or not public.current_user_can_view_tracking_subject(alert.profile_id) then raise exception 'Tracking alert unavailable'; end if;
  if (alert.status,p_status) not in (('open','qualified'),('open','assigned'),('qualified','assigned'),('qualified','resolved'),('assigned','resolved'),('open','dismissed'),('qualified','dismissed')) then raise exception 'Tracking alert transition forbidden'; end if;
  if p_status in ('resolved','dismissed') and length(trim(coalesce(p_comment,'')))<5 then raise exception 'Resolution comment required'; end if;
  update public.operational_tracking_alerts set status=p_status,assigned_to=case when p_status='assigned' then coalesce(p_assigned_to,auth.uid()) else assigned_to end,resolution_comment=case when p_status in ('resolved','dismissed') then trim(p_comment) else resolution_comment end,qualified_at=case when p_status='qualified' then now() else qualified_at end,resolved_at=case when p_status in ('resolved','dismissed') then now() else null end,updated_at=now() where id=alert.id;
end; $$;
revoke all on function public.manage_tracking_alert(uuid,text,uuid,text) from public,anon;
grant execute on function public.manage_tracking_alert(uuid,text,uuid,text) to authenticated;

create or replace function public.run_tracking_alert_sweep() returns integer
language plpgsql security definer set search_path=public as $$
declare affected integer:=0;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  insert into public.operational_tracking_alerts(profile_id,mission_id,collection_route_id,alert_type,severity,sanitized_context)
    select s.profile_id,s.active_mission_id,s.collection_route_id,'stale_position','critical',jsonb_build_object('last_position_at',p.recorded_at)
    from public.driver_operational_states s left join public.operational_live_positions p on p.profile_id=s.profile_id
    where s.status not in ('offline','available','unavailable','mission_completed','paused') and (p.recorded_at is null or p.recorded_at<now()-interval '10 minutes')
    on conflict(profile_id,alert_type) where status in ('open','qualified','assigned') do nothing;
  get diagnostics affected=row_count;
  delete from public.operational_live_positions where expires_at<now();
  return affected;
end; $$;
revoke all on function public.run_tracking_alert_sweep() from public,anon,authenticated;
grant execute on function public.run_tracking_alert_sweep() to service_role;

create or replace function public.record_verified_geofence_event(p_geofence_id uuid,p_position_event_id uuid,p_event_type text,p_distance_meters integer) returns uuid
language plpgsql security definer set search_path=public as $$
declare event_id uuid; position public.operational_position_events%rowtype;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  if p_event_type not in ('entered','exited','probable_arrival','prolonged_stop','route_deviation') or p_distance_meters<0 then raise exception 'Invalid geofence event'; end if;
  select * into position from public.operational_position_events where id=p_position_event_id;
  if position.id is null or not exists(select 1 from public.operational_geofences g where g.id=p_geofence_id and g.active and (g.mission_id=position.mission_id or g.collection_route_id=position.collection_route_id)) then raise exception 'Geofence does not match position assignment'; end if;
  insert into public.operational_geofence_events(geofence_id,position_event_id,profile_id,event_type,distance_meters,requires_proof,occurred_at)
    values(p_geofence_id,p_position_event_id,position.profile_id,p_event_type,p_distance_meters,true,position.recorded_at)
    on conflict(geofence_id,position_event_id,event_type) do update set distance_meters=excluded.distance_meters
    returning id into event_id;
  return event_id;
end; $$;
revoke all on function public.record_verified_geofence_event(uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.record_verified_geofence_event(uuid,uuid,text,integer) to service_role;
