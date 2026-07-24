create unique index if not exists hub_inbound_receipt_items_tracking_unique
  on public.hub_inbound_receipt_items (receipt_id, tracking_code)
  where tracking_code is not null;

create or replace function public.scan_hub_inbound_item(
  p_receipt_id uuid,
  p_tracking_code text,
  p_status public.hub_inbound_item_status default 'received_at_hub',
  p_note text default null,
  p_photo_paths text[] default '{}'
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_receipt public.hub_inbound_receipts%rowtype;
  v_existing public.hub_inbound_receipt_items%rowtype;
  v_item_id uuid;
  v_shipment_id uuid;
  v_expected integer;
  v_received integer;
  v_missing integer;
  v_damaged integer;
  v_extra integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_receipt
  from public.hub_inbound_receipts
  where id = p_receipt_id
  for update;

  if v_receipt.id is null then
    raise exception 'Hub receipt not found';
  end if;

  if not public.current_user_can_access_hub(v_receipt.hub_id) then
    raise exception 'Hub access denied';
  end if;

  if v_receipt.status in ('confirmed', 'cancelled') then
    raise exception 'Hub receipt is already finalized';
  end if;

  if p_status in ('missing_at_hub', 'damaged_at_hub', 'extra_at_hub', 'quarantined', 'rejected_at_hub')
    and nullif(trim(p_note), '') is null then
    raise exception 'Manifest discrepancy requires a note';
  end if;

  select * into v_existing
  from public.hub_inbound_receipt_items
  where receipt_id = p_receipt_id
    and tracking_code = p_tracking_code
  for update;

  if v_existing.id is not null and v_existing.status = p_status
    and coalesce(v_existing.condition_note, '') = coalesce(nullif(trim(p_note), ''), '') then
    return v_existing.id;
  end if;

  v_shipment_id := coalesce(
    v_existing.shipment_id,
    (select id from public.shipments where tracking_code = p_tracking_code limit 1)
  );

  if v_existing.id is null then
    insert into public.hub_inbound_receipt_items (
      receipt_id, shipment_id, tracking_code, status, condition_note, photo_paths, scanned_by
    ) values (
      p_receipt_id, v_shipment_id, p_tracking_code, p_status, nullif(trim(p_note), ''), coalesce(p_photo_paths, '{}'), auth.uid()
    ) returning id into v_item_id;
  else
    update public.hub_inbound_receipt_items
    set shipment_id = v_shipment_id,
        status = p_status,
        condition_note = nullif(trim(p_note), ''),
        photo_paths = coalesce(p_photo_paths, photo_paths),
        scanned_by = auth.uid(),
        scanned_at = now()
    where id = v_existing.id
    returning id into v_item_id;
  end if;

  if v_shipment_id is not null and p_status in ('received_at_hub', 'damaged_at_hub', 'quarantined') then
    perform public.move_hub_inventory(
      v_shipment_id,
      v_receipt.hub_id,
      null,
      case
        when p_status = 'damaged_at_hub' then 'damaged'::public.hub_inventory_status
        when p_status = 'quarantined' then 'quarantined'::public.hub_inventory_status
        else 'inspection_required'::public.hub_inventory_status
      end,
      null,
      coalesce(nullif(trim(p_note), ''), 'Reception hub')
    );

    update public.shipments set status = 'at_hub' where id = v_shipment_id;

    insert into public.shipment_status_events (shipment_id, actor_id, status, note, metadata)
    values (
      v_shipment_id,
      auth.uid(),
      'at_hub',
      coalesce(nullif(trim(p_note), ''), 'Colis recu au hub.'),
      jsonb_build_object('hub_id', v_receipt.hub_id, 'receipt_id', p_receipt_id, 'hub_status', p_status)
    );
  end if;

  if p_status in ('missing_at_hub', 'damaged_at_hub', 'extra_at_hub') and not exists (
    select 1 from public.operational_incidents
    where hub_id = v_receipt.hub_id
      and shipment_id is not distinct from v_shipment_id
      and metadata->>'receipt_id' = p_receipt_id::text
      and metadata->>'tracking_code' = p_tracking_code
      and status not in ('resolved', 'closed')
  ) then
    insert into public.operational_incidents (
      incident_type, priority, hub_id, shipment_id, title, description,
      blocks_shipment, created_by, metadata
    ) values (
      case
        when p_status = 'missing_at_hub' then 'missing_package'::public.operational_incident_type
        when p_status = 'damaged_at_hub' then 'damaged_package'::public.operational_incident_type
        else 'extra_package'::public.operational_incident_type
      end,
      case when p_status = 'missing_at_hub' then 'urgent'::public.operational_priority else 'high'::public.operational_priority end,
      v_receipt.hub_id,
      v_shipment_id,
      'Ecart de manifeste hub',
      p_note,
      p_status <> 'extra_at_hub',
      auth.uid(),
      jsonb_build_object('receipt_id', p_receipt_id, 'tracking_code', p_tracking_code, 'status', p_status)
    );
  end if;

  select
    count(*) filter (where status <> 'extra_at_hub'),
    count(*) filter (where status = 'received_at_hub'),
    count(*) filter (where status = 'missing_at_hub'),
    count(*) filter (where status = 'damaged_at_hub'),
    count(*) filter (where status = 'extra_at_hub')
  into v_expected, v_received, v_missing, v_damaged, v_extra
  from public.hub_inbound_receipt_items
  where receipt_id = p_receipt_id;

  update public.hub_inbound_receipts
  set expected_count = v_expected,
      received_count = v_received,
      missing_count = v_missing,
      damaged_count = v_damaged,
      extra_count = v_extra,
      received_at = coalesce(received_at, now()),
      received_by = coalesce(received_by, auth.uid()),
      status = case
        when v_missing > 0 or v_damaged > 0 or v_extra > 0 then 'needs_review'::public.hub_inbound_receipt_status
        else 'scanning'::public.hub_inbound_receipt_status
      end
  where id = p_receipt_id;

  insert into public.audit_log_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'hub_inbound_item_scanned',
    'hub_inbound_receipt',
    p_receipt_id,
    jsonb_build_object('item_id', v_item_id, 'tracking_code', p_tracking_code, 'status', p_status)
  );

  return v_item_id;
end;
$$;

create or replace function public.confirm_hub_inbound_receipt(p_receipt_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_receipt public.hub_inbound_receipts%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_receipt
  from public.hub_inbound_receipts
  where id = p_receipt_id
  for update;

  if v_receipt.id is null then
    raise exception 'Hub receipt not found';
  end if;

  if not public.current_user_can_access_hub(v_receipt.hub_id) then
    raise exception 'Hub access denied';
  end if;

  if v_receipt.status = 'confirmed' then
    return v_receipt.id;
  end if;

  if not exists (select 1 from public.hub_inbound_receipt_items where receipt_id = p_receipt_id) then
    raise exception 'Cannot confirm an empty Hub receipt';
  end if;

  update public.hub_inbound_receipts
  set status = 'confirmed', updated_at = now()
  where id = p_receipt_id;

  insert into public.audit_log_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'hub_inbound_receipt_confirmed',
    'hub_inbound_receipt',
    p_receipt_id,
    jsonb_build_object('received', v_receipt.received_count, 'missing', v_receipt.missing_count, 'damaged', v_receipt.damaged_count)
  );

  return p_receipt_id;
end;
$$;

revoke all on function public.scan_hub_inbound_item(uuid, text, public.hub_inbound_item_status, text, text[]) from public;
revoke all on function public.confirm_hub_inbound_receipt(uuid) from public;
grant execute on function public.scan_hub_inbound_item(uuid, text, public.hub_inbound_item_status, text, text[]) to authenticated;
grant execute on function public.confirm_hub_inbound_receipt(uuid) to authenticated;
