insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('traceability-exports','traceability-exports',false,20971520,array['application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

alter table public.parcel_traceability_events drop constraint if exists parcel_traceability_events_event_type_check;
alter table public.parcel_traceability_events add constraint parcel_traceability_events_event_type_check check(event_type in (
  'parcel_created','shipment_created','tracking_number_generated','payment_pending','payment_confirmed','payment_failed','parcel_deposited','parcel_received_at_relay','parcel_scanned','custody_transfer_requested','custody_transfer_started','custody_transfer_confirmed','custody_transfer_rejected','driver_assigned','mission_accepted','driver_en_route','driver_arrived','parcel_collected','parcel_loaded','vehicle_departed','parcel_in_transit','vehicle_arrived','parcel_received_at_hub','parcel_sorted','parcel_stored','parcel_released_from_hub','parcel_handed_to_traveler','customs_pending','customs_document_requested','customs_document_received','customs_cleared','customs_blocked','parcel_arrived_destination_country','parcel_received_at_destination_hub','last_mile_assigned','parcel_out_for_delivery','parcel_available_at_relay','recipient_notified','delivery_attempted','delivery_failed','parcel_delivered','parcel_collected_by_recipient','parcel_return_requested','parcel_returned','parcel_damaged','parcel_lost_suspected','parcel_found','incident_opened','incident_resolved','proof_added','correction_recorded','event_cancelled','tracking_closed'
));

create policy traceability_exports_owner_insert on storage.objects for insert to authenticated
with check(bucket_id='traceability-exports' and (storage.foldername(name))[1]=auth.uid()::text);
create policy traceability_exports_owner_read on storage.objects for select to authenticated
using(bucket_id='traceability-exports' and (storage.foldername(name))[1]=auth.uid()::text);
create policy traceability_exports_owner_delete on storage.objects for delete to authenticated
using(bucket_id='traceability-exports' and (storage.foldername(name))[1]=auth.uid()::text);

create or replace function public.log_parcel_passport_access(p_parcel_id uuid,p_access_type text,p_purpose text) returns uuid
language plpgsql security definer set search_path=public as $$
declare st public.parcel_custody_state%rowtype; log_id uuid;
begin
  if auth.uid() is null or p_access_type not in ('view','search','export','proof_download') then raise exception 'Access denied'; end if;
  select * into st from public.parcel_custody_state where parcel_id=p_parcel_id;
  if st.parcel_id is null or not exists(select 1 from public.shipments s where s.id=st.shipment_id and (s.sender_id=auth.uid() or public.current_user_has_control_tower_country(st.current_country_code))) then raise exception 'Parcel unavailable'; end if;
  insert into public.parcel_passport_access_log(parcel_id,actor_id,access_type,application_source,country_code,purpose)
  values(p_parcel_id,auth.uid(),p_access_type,'admin-app',st.current_country_code,left(nullif(trim(p_purpose),''),300)) returning id into log_id;
  return log_id;
end; $$;
revoke all on function public.log_parcel_passport_access(uuid,text,text) from public,anon;
grant execute on function public.log_parcel_passport_access(uuid,text,text) to authenticated;

create or replace function public.append_verified_operational_trace(
  p_shipment_id uuid,p_event_type text,p_stage_after text,p_new_custodian_type text,p_new_custodian_id text,
  p_location_id text,p_source_table text,p_source_id text,p_application_source text,p_occurred_at timestamptz,
  p_condition text default 'unknown',p_metadata jsonb default '{}'::jsonb,p_proof_ids uuid[] default array[]::uuid[]
) returns uuid language plpgsql security definer set search_path=public as $$
declare st public.parcel_custody_state%rowtype; v_event_id uuid:=gen_random_uuid(); seq bigint; hash_value text; required_count integer:=0; verified_count integer:=0;
begin
  select * into st from public.parcel_custody_state where shipment_id=p_shipment_id for update;
  if st.parcel_id is null then raise exception 'Traceability state unavailable'; end if;
  if not public.is_valid_parcel_stage_transition(st.current_stage,p_stage_after) then raise exception 'Invalid parcel stage transition'; end if;
  if p_stage_after<>st.current_stage and nullif(p_new_custodian_id,'') is null then raise exception 'New custodian required'; end if;
  if p_event_type in ('parcel_delivered','parcel_collected_by_recipient') and st.current_stage in ('delivered','closed') then return st.last_event_id; end if;
  select coalesce(max(minimum_proof_count),0) into required_count from public.parcel_proof_requirements where active and event_type=p_event_type and (country_code is null or country_code=st.current_country_code);
  select count(*) into verified_count from public.parcel_traceability_proofs where id=any(coalesce(p_proof_ids,array[]::uuid[])) and parcel_id=st.parcel_id and verification_status='verified';
  if verified_count<required_count then raise exception 'Required verified proofs missing'; end if;
  seq:=st.event_count+1;
  hash_value:=encode(digest(concat_ws('|',v_event_id::text,st.parcel_id::text,seq::text,p_event_type,st.current_custodian_id,coalesce(p_new_custodian_id,st.current_custodian_id),p_stage_after,p_occurred_at::text,st.last_event_hash,p_source_table,p_source_id),'sha256'),'hex');
  insert into public.parcel_traceability_events(id,parcel_id,shipment_id,sequence_no,event_type,stage_before,stage_after,previous_custodian_type,previous_custodian_id,new_custodian_type,new_custodian_id,previous_location_id,new_location_id,country_code,occurred_at,recorded_by,recorded_by_role,application_source,event_source,parcel_condition,idempotency_key,previous_event_hash,event_hash,metadata)
  values(v_event_id,st.parcel_id,st.shipment_id,seq,p_event_type,st.current_stage,p_stage_after,st.current_custodian_type,st.current_custodian_id,coalesce(nullif(p_new_custodian_type,''),st.current_custodian_type),coalesce(nullif(p_new_custodian_id,''),st.current_custodian_id),st.current_location_id,coalesce(nullif(p_location_id,''),st.current_location_id),st.current_country_code,coalesce(p_occurred_at,now()),auth.uid(),p_source_table,p_application_source,'legacy_bridge',coalesce(nullif(p_condition,''),'unknown'),'legacy:'||p_source_table||':'||p_source_id,st.last_event_hash,hash_value,coalesce(p_metadata,'{}'))
  on conflict(parcel_id,idempotency_key) do nothing returning id into v_event_id;
  if v_event_id is null then select id into v_event_id from public.parcel_traceability_events where parcel_id=st.parcel_id and idempotency_key='legacy:'||p_source_table||':'||p_source_id; return v_event_id; end if;
  update public.parcel_traceability_proofs set event_id=v_event_id where id=any(coalesce(p_proof_ids,array[]::uuid[])) and event_id is null;
  update public.parcel_custody_state set current_stage=p_stage_after,current_custodian_type=coalesce(nullif(p_new_custodian_type,''),current_custodian_type),current_custodian_id=coalesce(nullif(p_new_custodian_id,''),current_custodian_id),current_location_id=coalesce(nullif(p_location_id,''),current_location_id),last_event_id=v_event_id,last_event_hash=hash_value,event_count=seq,closed_at=case when p_stage_after='closed' then now() else closed_at end,updated_at=now() where parcel_id=st.parcel_id;
  insert into public.control_tower_events(source_module,source_event_id,event_type,entity_type,entity_id,country_code,occurred_at,severity,sanitized_payload)
  values('parcel_traceability',v_event_id::text,p_event_type,'shipment',p_shipment_id::text,st.current_country_code,coalesce(p_occurred_at,now()),case when p_event_type in ('parcel_damaged','parcel_lost_suspected','customs_blocked','incident_opened') then 'critical' else 'info' end,jsonb_build_object('parcel_id',st.parcel_id,'stage',p_stage_after,'custodian_type',coalesce(p_new_custodian_type,st.current_custodian_type),'location_id',p_location_id)) on conflict do nothing;
  insert into public.control_tower_outbox(event_id,destination) select c.id,d from public.control_tower_events c cross join unnest(array['digital_twin','snapshot','recommendations','notifications','analytics']) d where c.source_module='parcel_traceability' and c.source_event_id=v_event_id::text on conflict do nothing;
  return v_event_id;
end; $$;
revoke all on function public.append_verified_operational_trace(uuid,text,text,text,text,text,text,text,text,timestamptz,text,jsonb,uuid[]) from public,anon,authenticated;

create or replace function public.bridge_collection_traceability() returns trigger language plpgsql security definer set search_path=public as $$
declare st public.parcel_custody_state%rowtype; next_stage text; event_type text; cust_type text; cust_id text;
begin
  select * into st from public.parcel_custody_state where shipment_id=new.shipment_id;
  event_type:=case new.movement_type when 'loaded' then 'parcel_loaded' when 'unloaded' then 'parcel_in_transit' when 'anomaly_reported' then 'parcel_damaged' else 'proof_added' end;
  next_stage:=case when new.movement_type='loaded' then 'with_collection_driver' else st.current_stage end;
  cust_type:=case when new.movement_type='loaded' then 'collection_driver' else st.current_custodian_type end; cust_id:=case when new.movement_type='loaded' then new.performed_by::text else st.current_custodian_id end;
  perform public.append_verified_operational_trace(new.shipment_id,event_type,next_stage,cust_type,cust_id,new.stop_id::text,'collection_package_movements',new.id::text,'collection-app',new.created_at,case when new.movement_type='anomaly_reported' then 'other' else 'unknown' end,new.metadata,array[]::uuid[]); return new;
end; $$;
create trigger collection_movements_traceability after insert on public.collection_package_movements for each row execute function public.bridge_collection_traceability();

create or replace function public.bridge_hub_inbound_traceability() returns trigger language plpgsql security definer set search_path=public as $$
declare st public.parcel_custody_state%rowtype; hub uuid; target text; kind text;
begin
  if new.shipment_id is null then return new; end if; select * into st from public.parcel_custody_state where shipment_id=new.shipment_id; select r.hub_id into hub from public.hub_inbound_receipts r where r.id=new.receipt_id;
  if new.status::text in ('damaged','quarantined') then target:=st.current_stage;kind:='parcel_damaged'; else target:=case when st.current_stage='with_traveler' then 'at_destination_hub' else 'at_origin_hub' end;kind:='parcel_received_at_hub'; end if;
  perform public.append_verified_operational_trace(new.shipment_id,kind,target,'hub',hub::text,hub::text,'hub_inbound_receipt_items',new.id::text,'hub-app',new.scanned_at,case when new.status::text='damaged' then 'severe_damage' else 'unknown' end,new.metadata,array[]::uuid[]); return new;
end; $$;
create trigger hub_inbound_traceability after insert or update of status on public.hub_inbound_receipt_items for each row execute function public.bridge_hub_inbound_traceability();

create or replace function public.bridge_hub_inventory_traceability() returns trigger language plpgsql security definer set search_path=public as $$
declare st public.parcel_custody_state%rowtype;
begin select * into st from public.parcel_custody_state where shipment_id=new.shipment_id; perform public.append_verified_operational_trace(new.shipment_id,'parcel_stored',st.current_stage,st.current_custodian_type,st.current_custodian_id,new.to_location_id::text,'hub_inventory_movements',new.id::text,'hub-app',new.created_at,'unknown',new.metadata,array[]::uuid[]);return new;end; $$;
create trigger hub_inventory_traceability after insert on public.hub_inventory_movements for each row execute function public.bridge_hub_inventory_traceability();

create or replace function public.bridge_hub_handover_traceability() returns trigger language plpgsql security definer set search_path=public as $$
declare item record; st public.parcel_custody_state%rowtype; proof_ids uuid[]; proof_id uuid; hash_value text;
begin
  for item in select shipment_id from public.hub_batch_shipments where batch_id=new.batch_id and removed_at is null loop
    select * into st from public.parcel_custody_state where shipment_id=item.shipment_id;
    hash_value:=encode(digest('hub_handover:'||new.id::text||':'||item.shipment_id::text,'sha256'),'hex');
    insert into public.parcel_traceability_proofs(parcel_id,shipment_id,proof_type,storage_bucket,storage_path,proof_hash,captured_at,captured_by,metadata,verified_at,verified_by,verification_status)
    values(st.parcel_id,item.shipment_id,case when new.token_id is not null then 'qr' else 'server_confirmation' end,null,null,hash_value,new.handed_over_at,new.handed_over_by,jsonb_build_object('hub_handover_id',new.id,'verified_identity',new.verified_identity,'verified_document',new.verified_document,'verified_ticket',new.verified_ticket),new.handed_over_at,new.handed_over_by,'verified') on conflict(parcel_id,proof_hash) do update set proof_hash=excluded.proof_hash returning id into proof_id;
    proof_ids:=array[proof_id];
    hash_value:=encode(digest('hub_identity_verified:'||new.id::text||':'||item.shipment_id::text,'sha256'),'hex');
    insert into public.parcel_traceability_proofs(parcel_id,shipment_id,proof_type,proof_hash,captured_at,captured_by,metadata,verified_at,verified_by,verification_status)
    values(st.parcel_id,item.shipment_id,'identity',hash_value,new.handed_over_at,new.handed_over_by,jsonb_build_object('hub_handover_id',new.id,'verified_identity',new.verified_identity,'verified_document',new.verified_document,'verified_ticket',new.verified_ticket),new.handed_over_at,new.handed_over_by,'verified') on conflict(parcel_id,proof_hash) do update set proof_hash=excluded.proof_hash returning id into proof_id;
    proof_ids:=array_append(proof_ids,proof_id);
    perform public.append_verified_operational_trace(item.shipment_id,'parcel_handed_to_traveler','with_traveler','traveler',new.traveler_id::text,new.hub_id::text,'hub_handover_events',new.id::text,'hub-app',new.handed_over_at,'intact',jsonb_build_object('batch_id',new.batch_id,'trip_id',new.trip_id),proof_ids);
  end loop; return new;
end; $$;
create trigger hub_handover_traceability after insert on public.hub_handover_events for each row execute function public.bridge_hub_handover_traceability();

create or replace function public.bridge_relay_handover_traceability() returns trigger language plpgsql security definer set search_path=public as $$
declare st public.parcel_custody_state%rowtype; proof_ids uuid[]:=array[]::uuid[]; proof_id uuid; hash_value text; target text; event_kind text; recipient text;
begin
  select * into st from public.parcel_custody_state where shipment_id=new.shipment_id;
  hash_value:=encode(digest('relay_signature:'||new.signature_hash||':'||new.id::text,'sha256'),'hex');
  insert into public.parcel_traceability_proofs(parcel_id,shipment_id,proof_type,proof_hash,captured_at,captured_by,metadata,verified_at,verified_by,verification_status) values(st.parcel_id,new.shipment_id,'signature',hash_value,new.created_at,new.actor_id,jsonb_build_object('relay_handover_id',new.id),new.created_at,new.actor_id,'verified') on conflict(parcel_id,proof_hash) do update set proof_hash=excluded.proof_hash returning id into proof_id; proof_ids:=array_append(proof_ids,proof_id);
  if new.otp_verified then hash_value:=encode(digest('relay_otp_verified:'||new.id::text,'sha256'),'hex'); insert into public.parcel_traceability_proofs(parcel_id,shipment_id,proof_type,proof_hash,captured_at,captured_by,metadata,verified_at,verified_by,verification_status) values(st.parcel_id,new.shipment_id,'otp',hash_value,new.created_at,new.actor_id,jsonb_build_object('relay_handover_id',new.id),new.created_at,new.actor_id,'verified') on conflict(parcel_id,proof_hash) do update set proof_hash=excluded.proof_hash returning id into proof_id; proof_ids:=array_append(proof_ids,proof_id); end if;
  if new.recipient_type='recipient' then target:='delivered';event_kind:='parcel_collected_by_recipient';recipient:='recipient:'||new.shipment_id::text; else target:='with_last_mile_driver';event_kind:='custody_transfer_confirmed';recipient:=new.actor_id::text; end if;
  perform public.append_verified_operational_trace(new.shipment_id,event_kind,target,case when new.recipient_type='recipient' then 'recipient' else 'local_transporter' end,recipient,new.relay_point_id::text,'relay_handover_events',new.id::text,'relay-app',new.created_at,'intact',new.metadata,proof_ids); return new;
end; $$;
create trigger relay_handover_traceability after insert on public.relay_handover_events for each row execute function public.bridge_relay_handover_traceability();

create or replace function public.bridge_incident_traceability() returns trigger language plpgsql security definer set search_path=public as $$
declare st public.parcel_custody_state%rowtype;
begin if new.shipment_id is null then return new; end if;select * into st from public.parcel_custody_state where shipment_id=new.shipment_id;perform public.append_verified_operational_trace(new.shipment_id,'incident_opened',st.current_stage,st.current_custodian_type,st.current_custodian_id,coalesce(new.hub_id::text,st.current_location_id),'operational_incidents',new.id::text,'admin-app',new.created_at,case when new.incident_type::text like '%damage%' then 'other' else 'unknown' end,jsonb_build_object('incident_code',new.incident_code,'priority',new.priority,'status',new.status),array[]::uuid[]);return new;end; $$;
create trigger operational_incident_traceability after insert on public.operational_incidents for each row execute function public.bridge_incident_traceability();

create or replace function public.bridge_shipment_status_traceability() returns trigger language plpgsql security definer set search_path=public as $$
declare st public.parcel_custody_state%rowtype; kind text;
begin
  select * into st from public.parcel_custody_state where shipment_id=new.shipment_id; if st.parcel_id is null or new.status::text='confirmed' then return new; end if;
  kind:=case new.status::text when 'matching' then 'custody_transfer_requested' when 'assigned' then 'driver_assigned' when 'picked_up' then 'parcel_collected' when 'at_relay' then 'parcel_received_at_relay' when 'collected_for_hub' then 'parcel_loaded' when 'in_transit' then 'parcel_in_transit' when 'at_hub' then 'parcel_received_at_hub' when 'out_for_delivery' then 'parcel_out_for_delivery' when 'delivered' then 'proof_added' when 'cancelled' then 'event_cancelled' else 'proof_added' end;
  perform public.append_verified_operational_trace(new.shipment_id,kind,st.current_stage,st.current_custodian_type,st.current_custodian_id,st.current_location_id,'shipment_status_events',new.id::text,coalesce(new.metadata->>'application_source','user-app'),new.created_at,'unknown',new.metadata||jsonb_build_object('legacy_status',new.status),array[]::uuid[]);return new;
end; $$;
create trigger shipment_status_traceability after insert on public.shipment_status_events for each row execute function public.bridge_shipment_status_traceability();

-- Every legacy status mutation must have an audit event in the same transaction.
create or replace function public.ensure_shipment_status_event() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.status is not distinct from new.status then return new; end if;
  if not exists(
    select 1 from public.shipment_status_events e
    where e.shipment_id=new.id and e.status=new.status and e.xmin::text::bigint=txid_current()
  ) then
    insert into public.shipment_status_events(shipment_id,actor_id,status,note,metadata)
    values(new.id,auth.uid(),new.status,'Statut journalise automatiquement.',jsonb_build_object('application_source','status-guard','previous_status',old.status));
  end if;
  return new;
end; $$;
create constraint trigger shipment_status_event_guard after update of status on public.shipments
deferrable initially deferred for each row execute function public.ensure_shipment_status_event();

create or replace function public.bridge_proof_of_delivery_traceability() returns trigger language plpgsql security definer set search_path=public as $$
declare st public.parcel_custody_state%rowtype; proof_id uuid; hash_value text;
begin
  select * into st from public.parcel_custody_state where shipment_id=new.shipment_id;
  if st.parcel_id is null then return new; end if;
  hash_value:=encode(digest('proof_of_delivery:'||new.id::text||':'||new.method,'sha256'),'hex');
  insert into public.parcel_traceability_proofs(parcel_id,shipment_id,proof_type,proof_hash,captured_at,captured_by,metadata,verified_at,verified_by,verification_status)
  values(st.parcel_id,new.shipment_id,case when new.method in ('otp','qr','signature') then new.method else 'delivery' end,hash_value,new.captured_at,new.recorded_by,jsonb_build_object('proof_of_delivery_id',new.id,'location_label',new.location_label,'device_label',new.device_label),new.captured_at,new.recorded_by,'verified')
  on conflict(parcel_id,proof_hash) do nothing returning id into proof_id;
  return new;
end; $$;
create trigger proof_of_delivery_traceability after insert on public.proof_of_delivery for each row execute function public.bridge_proof_of_delivery_traceability();

create or replace function public.bridge_delivery_event_traceability() returns trigger language plpgsql security definer set search_path=public as $$
declare st public.parcel_custody_state%rowtype; target text; kind text; cust_type text; cust_id text; proof_ids uuid[];
begin
  select * into st from public.parcel_custody_state where shipment_id=new.shipment_id;
  if st.parcel_id is null then return new; end if;
  target:=st.current_stage; kind:='proof_added'; cust_type:=st.current_custodian_type; cust_id:=st.current_custodian_id;
  if new.status::text='out_for_delivery' then target:='with_last_mile_driver';kind:='parcel_out_for_delivery';cust_type:='local_transporter';cust_id:=coalesce(new.actor_id::text,st.current_custodian_id);
  elsif new.status::text='delivered' then target:='delivered';kind:='parcel_delivered';cust_type:='recipient';cust_id:='recipient:'||new.shipment_id::text;
  elsif new.status::text in ('delivery_attempted','recipient_absent','invalid_address','otp_failed','refused_by_recipient') then kind:='delivery_attempted';
  elsif new.status::text='delivery_blocked' then kind:='incident_opened'; end if;
  select coalesce(array_agg(p.id),'{}'::uuid[]) into proof_ids from public.parcel_traceability_proofs p where p.parcel_id=st.parcel_id and p.verification_status='verified' and p.metadata->>'proof_of_delivery_id' is not null;
  perform public.append_verified_operational_trace(new.shipment_id,kind,target,cust_type,cust_id,st.current_location_id,'delivery_events',new.id::text,'relay-app',new.created_at,case when new.status::text='delivered' then 'intact' else 'unknown' end,new.metadata||jsonb_build_object('delivery_status',new.status,'event_type',new.event_type),proof_ids);
  return new;
end; $$;
create trigger delivery_event_traceability after insert on public.delivery_events for each row execute function public.bridge_delivery_event_traceability();

create or replace function public.bridge_customs_event_traceability() returns trigger language plpgsql security definer set search_path=public as $$
declare shipment uuid; st public.parcel_custody_state%rowtype; kind text;
begin
  select c.shipment_id into shipment from public.customs_cases c where c.id=new.customs_case_id;
  select * into st from public.parcel_custody_state where shipment_id=shipment;
  if st.parcel_id is null then return new; end if;
  kind:=case when lower(new.event_type) like '%release%' or lower(new.event_type) like '%clear%' then 'customs_cleared' when lower(new.event_type) like '%document%request%' then 'customs_document_requested' when lower(new.event_type) like '%document%' then 'customs_document_received' when lower(new.event_type) like '%reject%' or lower(new.event_type) like '%seiz%' or lower(new.event_type) like '%block%' then 'customs_blocked' else 'customs_pending' end;
  perform public.append_verified_operational_trace(shipment,kind,st.current_stage,st.current_custodian_type,st.current_custodian_id,st.current_location_id,'customs_events',new.id::text,'admin-app',new.created_at,'unknown',new.sanitized_payload||jsonb_build_object('customs_case_id',new.customs_case_id,'verified',new.verified,'source',new.source),array[]::uuid[]);
  return new;
end; $$;
create trigger customs_event_traceability after insert on public.customs_events for each row execute function public.bridge_customs_event_traceability();

create or replace function public.bridge_manual_correction_traceability() returns trigger language plpgsql security definer set search_path=public as $$
declare shipment uuid; st public.parcel_custody_state%rowtype;
begin
  if new.status::text<>'applied' or old.status::text='applied' then return new; end if;
  if new.entity_type='shipment' then shipment:=new.entity_id;
  elsif new.entity_type='parcel' then select shipment_id into shipment from public.parcel_custody_state where parcel_id=new.entity_id;
  else return new; end if;
  select * into st from public.parcel_custody_state where shipment_id=shipment;
  if st.parcel_id is null then return new; end if;
  perform public.append_verified_operational_trace(shipment,'correction_recorded',st.current_stage,st.current_custodian_type,st.current_custodian_id,st.current_location_id,'manual_corrections',new.id::text,'admin-app',coalesce(new.applied_at,new.updated_at),'unknown',jsonb_build_object('action',new.action,'reason',new.reason,'permission_key',new.permission_key,'approved_by',new.approved_by),array[]::uuid[]);
  return new;
end; $$;
create trigger manual_correction_traceability after update of status on public.manual_corrections for each row execute function public.bridge_manual_correction_traceability();

create or replace function public.add_collection_manifest_item_traced(p_manifest_id uuid,p_shipment_id uuid,p_incident_note text default null) returns uuid language plpgsql security definer set search_path=public as $$
declare item_id uuid;
begin
  if auth.uid() is null or not public.current_user_has_role(array['collection_driver','collection_manager','operations_manager','admin','super_admin']) then raise exception 'Collection access denied'; end if;
  insert into public.collection_manifest_items(manifest_id,shipment_id,incident_note) values(p_manifest_id,p_shipment_id,nullif(trim(p_incident_note),'')) returning id into item_id;
  update public.shipments set status='collected_for_hub' where id=p_shipment_id and status in ('picked_up','at_relay','assigned');
  insert into public.shipment_status_events(actor_id,metadata,note,shipment_id,status) values(auth.uid(),jsonb_build_object('collection_manifest_id',p_manifest_id,'collection_manifest_item_id',item_id,'application_source','collection-app'),'Colis ajoute au manifeste de collecte hub.',p_shipment_id,'collected_for_hub');
  return item_id;
end; $$;
revoke all on function public.add_collection_manifest_item_traced(uuid,uuid,text) from public,anon;grant execute on function public.add_collection_manifest_item_traced(uuid,uuid,text) to authenticated;

create or replace function public.record_relay_storage_traced(p_tracking_code text,p_relay_point_id uuid,p_location_id uuid,p_idempotency_key text) returns uuid language plpgsql security definer set search_path=public as $$
declare v_shipment_id uuid; st public.parcel_custody_state%rowtype; event_id uuid;
begin
  if not public.current_user_can_access_relay_point(p_relay_point_id) then raise exception 'Relay access denied'; end if;
  select id into v_shipment_id from public.shipments where tracking_code=p_tracking_code; if v_shipment_id is null then raise exception 'Shipment not found'; end if;
  if not exists(select 1 from public.relay_storage_locations where id=p_location_id and relay_point_id=p_relay_point_id) then raise exception 'Invalid location'; end if;
  update public.relay_inventory set storage_location_id=p_location_id,status='stored',updated_by=auth.uid(),updated_at=now() where shipment_id=v_shipment_id and current_relay_point_id=p_relay_point_id;
  select * into st from public.parcel_custody_state where shipment_id=v_shipment_id;
  event_id:=public.append_verified_operational_trace(v_shipment_id,'parcel_stored',st.current_stage,st.current_custodian_type,st.current_custodian_id,p_location_id::text,'relay_storage',p_idempotency_key,'relay-app',now(),'unknown',jsonb_build_object('relay_point_id',p_relay_point_id),array[]::uuid[]); return event_id;
end; $$;
revoke all on function public.record_relay_storage_traced(text,uuid,uuid,text) from public,anon;grant execute on function public.record_relay_storage_traced(text,uuid,uuid,text) to authenticated;

create or replace function public.record_parcel_seal_action(
  p_parcel_id uuid,p_action text,p_seal_hash text,p_location_id text,p_photo_proof_id uuid,p_reason text,p_authorized boolean,p_idempotency_key text
) returns uuid language plpgsql security definer set search_path=public as $$
declare st public.parcel_custody_state%rowtype; seal_id uuid; trace_id uuid; kind text; condition text;
begin
  if auth.uid() is null or not public.current_user_has_role(array['collection_driver','collection_manager','relay_agent','relay_manager','hub_agent','hub_manager','operations_manager','admin','super_admin']) then raise exception 'Seal access denied'; end if;
  if p_action not in ('apply','break') or p_seal_hash !~ '^[a-f0-9]{64}$' or length(p_idempotency_key)<12 then raise exception 'Invalid seal action'; end if;
  select * into st from public.parcel_custody_state where parcel_id=p_parcel_id for update;
  if st.parcel_id is null then raise exception 'Parcel unavailable'; end if;
  if not exists(select 1 from public.parcel_traceability_proofs where id=p_photo_proof_id and parcel_id=p_parcel_id and proof_type='seal_photo' and verification_status='verified') then raise exception 'Verified seal photo required'; end if;
  if p_action='apply' then
    insert into public.parcel_seals(parcel_id,seal_code_hash,applied_at,applied_by,applied_location_id,photo_proof_id)
    values(p_parcel_id,p_seal_hash,now(),auth.uid(),p_location_id,p_photo_proof_id) on conflict(parcel_id,seal_code_hash) do update set seal_code_hash=excluded.seal_code_hash returning id into seal_id;
    kind:='proof_added';condition:='seal_intact';
  else
    if length(trim(coalesce(p_reason,'')))<8 then raise exception 'Break reason required'; end if;
    update public.parcel_seals set status=case when p_authorized then 'broken_authorized' else 'broken_unexpected' end,broken_at=now(),broken_by=auth.uid(),break_reason=p_reason
    where parcel_id=p_parcel_id and seal_code_hash=p_seal_hash and status='intact' returning id into seal_id;
    if seal_id is null then raise exception 'Active seal unavailable'; end if;
    kind:=case when p_authorized then 'proof_added' else 'parcel_damaged' end;condition:='seal_broken';
  end if;
  trace_id:=public.append_verified_operational_trace(st.shipment_id,kind,st.current_stage,st.current_custodian_type,st.current_custodian_id,p_location_id,'parcel_seals',p_idempotency_key,'admin-app',now(),condition,jsonb_build_object('seal_id',seal_id,'action',p_action,'authorized',p_authorized,'reason',p_reason),array[p_photo_proof_id]);
  if p_action='break' and not p_authorized then insert into public.parcel_traceability_anomalies(parcel_id,shipment_id,event_id,anomaly_type,severity,title,details) values(p_parcel_id,st.shipment_id,trace_id,'unexpected_seal_break','critical','Scellé rompu sans autorisation',jsonb_build_object('seal_id',seal_id,'reason',p_reason)); end if;
  return seal_id;
end; $$;
revoke all on function public.record_parcel_seal_action(uuid,text,text,text,uuid,text,boolean,text) from public,anon;
grant execute on function public.record_parcel_seal_action(uuid,text,text,text,uuid,text,boolean,text) to authenticated;

create or replace function public.run_parcel_traceability_consistency_audit() returns jsonb language sql security definer set search_path=public as $$
with ordered as(select e.*,lag(event_hash) over(partition by parcel_id order by sequence_no) expected_hash,row_number() over(partition by parcel_id order by sequence_no) expected_sequence from public.parcel_traceability_events e), checks as(select
 (select count(*) from public.shipment_packages p left join public.parcel_custody_state s on s.parcel_id=p.id where s.parcel_id is null) parcels_without_custodian,
 (select count(*) from ordered where sequence_no<>expected_sequence) sequence_gaps,
 (select count(*) from ordered where sequence_no>1 and previous_event_hash is distinct from expected_hash) broken_hash_links,
 (select count(*) from (select parcel_id from ordered where event_type in ('parcel_delivered','parcel_collected_by_recipient') and validation_status='confirmed' group by parcel_id having count(*)>1)x) duplicate_deliveries,
 (select count(*) from ordered where application_source is null or event_source is null or occurred_at is null or event_version is null) incomplete_events,
 (select count(*) from public.collection_offline_operations where status in ('pending','conflict'))+(select count(*) from public.relay_offline_operations where status='conflict') unresolved_offline,
 (select count(*) from public.parcel_custody_state s where not exists(select 1 from ordered e where e.id=s.last_event_id and e.event_hash=s.last_event_hash and e.sequence_no=s.event_count)) passport_state_mismatches)
select to_jsonb(checks) from checks; $$;
revoke all on function public.run_parcel_traceability_consistency_audit() from public,anon,authenticated;grant execute on function public.run_parcel_traceability_consistency_audit() to service_role;
