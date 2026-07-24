create or replace function public.record_relay_package_control(
  p_tracking_code text,
  p_relay_point_id uuid,
  p_idempotency_key text,
  p_weight_kg numeric,
  p_length_cm numeric,
  p_width_cm numeric,
  p_height_cm numeric,
  p_quality_score integer
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_shipment_id uuid;
  v_decision text;
begin
  if not public.current_user_can_access_relay_point(p_relay_point_id) then
    raise exception 'Relay access denied';
  end if;
  if p_weight_kg <= 0 or p_weight_kg > 300
    or least(p_length_cm, p_width_cm, p_height_cm) <= 0
    or greatest(p_length_cm, p_width_cm, p_height_cm) > 300
    or p_quality_score not between 1 and 100 then
    raise exception 'Invalid package control';
  end if;

  select s.id into v_shipment_id
  from public.shipments s
  join public.relay_inventory i on i.shipment_id = s.id
  where s.tracking_code = p_tracking_code
    and i.current_relay_point_id = p_relay_point_id
    and i.status <> 'released'
  for update of i;
  if v_shipment_id is null then raise exception 'Package is not active at this relay point'; end if;

  v_decision := case when p_quality_score < 50 then 'refused' when p_quality_score < 75 then 'anomaly' else 'accepted' end;
  insert into public.relay_package_controls (
    shipment_id, relay_point_id, actor_id, weight_kg, dimensions,
    quality_score, photo_count, decision, idempotency_key
  ) values (
    v_shipment_id, p_relay_point_id, auth.uid(), p_weight_kg,
    jsonb_build_object('lengthCm', p_length_cm, 'widthCm', p_width_cm, 'heightCm', p_height_cm),
    p_quality_score, 0, v_decision, p_idempotency_key
  )
  on conflict (actor_id, idempotency_key) do update set
    idempotency_key = excluded.idempotency_key
  returning decision into v_decision;

  update public.relay_inventory set
    quality_score = p_quality_score,
    status = case when v_decision = 'accepted' then 'stored' else 'exception' end,
    updated_by = auth.uid(), updated_at = now()
  where shipment_id = v_shipment_id and current_relay_point_id = p_relay_point_id;

  insert into public.audit_log_events (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'relay.package_controlled', 'shipment', v_shipment_id,
    jsonb_build_object('relay_point_id', p_relay_point_id, 'decision', v_decision));
  return v_decision;
end;
$$;

revoke all on function public.record_relay_package_control(text, uuid, text, numeric, numeric, numeric, numeric, integer) from public;
grant execute on function public.record_relay_package_control(text, uuid, text, numeric, numeric, numeric, numeric, integer) to authenticated;
