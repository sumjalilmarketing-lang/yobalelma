create or replace function public.record_relay_scan(
  p_tracking_code text,
  p_relay_point_id uuid,
  p_scan_type public.relay_scan_type,
  p_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_shipment_id uuid;
  v_scan_id uuid;
  v_next_status public.shipment_status;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select id
  into v_shipment_id
  from public.shipments
  where tracking_code = p_tracking_code
  limit 1;

  if v_shipment_id is null then
    raise exception 'Shipment not found';
  end if;

  insert into public.relay_scan_events (
    shipment_id,
    relay_point_id,
    actor_id,
    scan_type,
    note
  )
  values (
    v_shipment_id,
    p_relay_point_id,
    auth.uid(),
    p_scan_type,
    p_note
  )
  returning id into v_scan_id;

  if p_scan_type = 'check_in' then
    insert into public.relay_inventory (
      shipment_id,
      current_relay_point_id,
      status,
      checked_in_at,
      checked_out_at,
      updated_by
    )
    values (
      v_shipment_id,
      p_relay_point_id,
      'stored',
      now(),
      null,
      auth.uid()
    )
    on conflict (shipment_id) do update set
      current_relay_point_id = excluded.current_relay_point_id,
      status = 'stored',
      checked_in_at = excluded.checked_in_at,
      checked_out_at = null,
      updated_by = excluded.updated_by,
      updated_at = now();

    v_next_status := 'at_relay';
  elsif p_scan_type in ('check_out', 'handover') then
    update public.relay_inventory
    set status = 'released',
        checked_out_at = now(),
        updated_by = auth.uid(),
        updated_at = now()
    where shipment_id = v_shipment_id;

    v_next_status := case
      when p_scan_type = 'handover' then 'delivered'::public.shipment_status
      else 'collected_for_hub'::public.shipment_status
    end;
  else
    update public.relay_inventory
    set status = 'exception',
        updated_by = auth.uid(),
        updated_at = now()
    where shipment_id = v_shipment_id;

    v_next_status := 'at_relay';
  end if;

  update public.shipments
  set status = v_next_status
  where id = v_shipment_id;

  insert into public.shipment_status_events (
    shipment_id,
    actor_id,
    status,
    note,
    metadata
  )
  values (
    v_shipment_id,
    auth.uid(),
    v_next_status,
    coalesce(p_note, 'Scan relais ' || p_scan_type::text),
    jsonb_build_object(
      'relay_point_id',
      p_relay_point_id,
      'scan_id',
      v_scan_id,
      'scan_type',
      p_scan_type
    )
  );

  return v_scan_id;
end;
$$;
