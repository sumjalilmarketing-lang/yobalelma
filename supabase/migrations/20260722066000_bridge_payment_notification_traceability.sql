create or replace function public.bridge_payment_event_traceability() returns trigger language plpgsql security definer set search_path=public as $$
declare shipment uuid; st public.parcel_custody_state%rowtype; kind text; proof_id uuid; proof_ids uuid[]:=array[]::uuid[]; hash_value text;
begin
  select p.shipment_id into shipment from public.payments p where p.id=new.payment_id;
  select * into st from public.parcel_custody_state where shipment_id=shipment;
  if st.parcel_id is null then return new; end if;
  kind:=case when lower(new.event_type) like '%success%' or lower(new.event_type) like '%confirm%' or lower(new.event_type) like '%paid%' then 'payment_confirmed' when lower(new.event_type) like '%fail%' or lower(new.event_type) like '%cancel%' or lower(new.event_type) like '%expire%' then 'payment_failed' else 'payment_pending' end;
  if new.verified and kind='payment_confirmed' then
    hash_value:=encode(digest('payment_event:'||new.id::text||':'||coalesce(new.provider_event_id,''),'sha256'),'hex');
    insert into public.parcel_traceability_proofs(parcel_id,shipment_id,proof_type,proof_hash,captured_at,metadata,verified_at,verification_status)
    values(st.parcel_id,shipment,'payment',hash_value,new.received_at,jsonb_build_object('payment_event_id',new.id),new.processed_at,'verified')
    on conflict(parcel_id,proof_hash) do nothing returning id into proof_id;
    if proof_id is not null then proof_ids:=array[proof_id]; end if;
  end if;
  perform public.append_verified_operational_trace(shipment,kind,st.current_stage,st.current_custodian_type,st.current_custodian_id,st.current_location_id,'payment_events',new.id::text,'user-app',new.received_at,'unknown',new.sanitized_payload||jsonb_build_object('verified',new.verified,'processing_status',new.processing_status),proof_ids);
  return new;
end; $$;
create trigger payment_event_traceability after insert on public.payment_events for each row execute function public.bridge_payment_event_traceability();

create or replace function public.bridge_notification_event_traceability() returns trigger language plpgsql security definer set search_path=public as $$
declare st public.parcel_custody_state%rowtype;
begin
  if new.shipment_id is null then return new; end if;
  select * into st from public.parcel_custody_state where shipment_id=new.shipment_id;
  if st.parcel_id is null then return new; end if;
  perform public.append_verified_operational_trace(new.shipment_id,'recipient_notified',st.current_stage,st.current_custodian_type,st.current_custodian_id,st.current_location_id,'notification_events',new.id::text,'user-app',new.created_at,'unknown',jsonb_build_object('event_key',new.event_key),array[]::uuid[]);
  return new;
end; $$;
create trigger notification_event_traceability after insert on public.notification_events for each row execute function public.bridge_notification_event_traceability();
