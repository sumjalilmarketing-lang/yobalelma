create or replace function public.scan_handover_qr_token(
  p_token text,
  p_expected_token_type public.handover_qr_token_type,
  p_note text default null,
  p_incident_type text default null
)
returns table (
  batch_id uuid,
  next_token text,
  next_token_expires_at timestamptz
)
language plpgsql
security invoker
set search_path = public, extensions, pg_catalog
as $$
declare
  v_token public.handover_qr_tokens%rowtype;
  v_next record;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_token
  from public.handover_qr_tokens
  where token_hash = public.hash_handover_token(p_token)
  for update;

  if v_token.id is null then
    raise exception 'QR token not found';
  end if;

  if v_token.token_type <> p_expected_token_type then
    raise exception 'Unexpected QR token type';
  end if;

  if v_token.status <> 'active' or v_token.expires_at <= now() then
    update public.handover_qr_tokens
    set status = case when expires_at <= now() then 'expired' else status end,
        updated_at = now()
    where id = v_token.id;
    raise exception 'QR token is not active';
  end if;

  update public.handover_qr_tokens
  set status = 'used',
      used_by = auth.uid(),
      used_at = now(),
      updated_at = now()
  where id = v_token.id;

  insert into public.audit_log_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'qr_token_scanned',
    'hub_batch',
    v_token.batch_id,
    jsonb_build_object(
      'token_id',
      v_token.id,
      'token_type',
      v_token.token_type,
      'incident_type',
      nullif(p_incident_type, '')
    )
  );

  if p_expected_token_type = 'origin_pickup' then
    update public.hub_batches
    set status = 'in_transit',
        sealed_by = coalesce(sealed_by, auth.uid()),
        sealed_at = coalesce(sealed_at, now())
    where id = v_token.batch_id;

    update public.capacity_reservations cr
    set status = 'loaded',
        updated_at = now()
    where cr.batch_id = v_token.batch_id
      and cr.status = 'reserved';

    update public.shipments s
    set status = 'in_transit'
    where s.id in (
      select cr.shipment_id
      from public.capacity_reservations cr
      where cr.batch_id = v_token.batch_id
    );

    insert into public.shipment_status_events (shipment_id, actor_id, status, note, metadata)
    select
      cr.shipment_id,
      auth.uid(),
      'in_transit',
      coalesce(p_note, 'Lot remis au voyageur.'),
      jsonb_build_object('batch_id', v_token.batch_id, 'qr_token_id', v_token.id)
    from public.capacity_reservations cr
    where cr.batch_id = v_token.batch_id;

    select *
    into v_next
    from public.create_handover_qr_token(v_token.batch_id, 'destination_dropoff', 240)
    limit 1;

    batch_id := v_token.batch_id;
    next_token := v_next.token;
    next_token_expires_at := v_next.expires_at;
    return next;
  else
    if nullif(p_incident_type, '') is null then
      update public.hub_batches
      set status = 'closed'
      where id = v_token.batch_id;

      update public.capacity_reservations cr
      set status = 'released',
          updated_at = now()
      where cr.batch_id = v_token.batch_id
        and cr.status in ('reserved', 'loaded');

      update public.shipments s
      set status = 'delivered',
          payout_eligible_for_release = true,
          payout_blocked_reason = null
      where s.id in (
        select cr.shipment_id
        from public.capacity_reservations cr
        where cr.batch_id = v_token.batch_id
      );

      insert into public.shipment_status_events (shipment_id, actor_id, status, note, metadata)
      select
        cr.shipment_id,
        auth.uid(),
        'delivered',
        coalesce(p_note, 'Lot receptionne a destination.'),
        jsonb_build_object('batch_id', v_token.batch_id, 'qr_token_id', v_token.id)
      from public.capacity_reservations cr
      where cr.batch_id = v_token.batch_id;
    else
      update public.hub_batches
      set status = 'arrived'
      where id = v_token.batch_id;

      update public.shipments s
      set payout_eligible_for_release = false,
          payout_blocked_reason = p_incident_type
      where s.id in (
        select cr.shipment_id
        from public.capacity_reservations cr
        where cr.batch_id = v_token.batch_id
      );

      insert into public.shipment_status_events (shipment_id, actor_id, status, note, metadata)
      select
        cr.shipment_id,
        auth.uid(),
        s.status,
        coalesce(p_note, 'Incident constate a destination.'),
        jsonb_build_object(
          'batch_id',
          v_token.batch_id,
          'qr_token_id',
          v_token.id,
          'incident_type',
          p_incident_type
        )
      from public.capacity_reservations cr
      join public.shipments s on s.id = cr.shipment_id
      where cr.batch_id = v_token.batch_id;
    end if;

    batch_id := v_token.batch_id;
    next_token := null;
    next_token_expires_at := null;
    return next;
  end if;
end;
$$;
