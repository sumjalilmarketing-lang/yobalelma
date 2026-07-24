create extension if not exists pgcrypto;

create table public.parcel_traceability_proofs (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references public.shipment_packages(id) on delete restrict,
  shipment_id uuid not null references public.shipments(id) on delete restrict,
  event_id uuid,
  proof_type text not null check (proof_type in ('qr','otp','signature','parcel_photo','seal_photo','barcode_scan','identity','gps','server_confirmation','customs_document','payment','delivery','incident_report')),
  storage_bucket text,
  storage_path text,
  proof_hash text not null,
  captured_at timestamptz not null,
  captured_by uuid references public.profiles(id) on delete set null,
  device_id text,
  latitude numeric(10,7) check(latitude is null or latitude between -90 and 90),
  longitude numeric(10,7) check(longitude is null or longitude between -180 and 180),
  metadata jsonb not null default '{}',
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  verification_status text not null default 'pending' check(verification_status in ('pending','verified','rejected','revoked')),
  retention_until timestamptz not null default (now() + interval '5 years'),
  legal_hold boolean not null default false,
  created_at timestamptz not null default now(),
  unique(parcel_id,proof_hash)
);

create table public.parcel_traceability_events (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references public.shipment_packages(id) on delete restrict,
  shipment_id uuid not null references public.shipments(id) on delete restrict,
  sequence_no bigint not null,
  event_type text not null check(event_type in ('parcel_created','custody_transfer_requested','custody_transfer_started','custody_transfer_confirmed','custody_transfer_rejected','parcel_deposited','parcel_received_at_relay','parcel_collected','parcel_loaded','parcel_in_transit','parcel_received_at_hub','parcel_sorted','parcel_stored','parcel_released_from_hub','parcel_handed_to_traveler','customs_pending','customs_cleared','customs_blocked','parcel_arrived_destination_country','parcel_received_at_destination_hub','parcel_out_for_delivery','parcel_available_at_relay','delivery_attempted','delivery_failed','parcel_delivered','parcel_collected_by_recipient','parcel_return_requested','parcel_returned','parcel_damaged','parcel_lost_suspected','parcel_found','incident_opened','incident_resolved','proof_added','correction_recorded','event_cancelled','tracking_closed')),
  stage_before text,
  stage_after text not null check(stage_after in ('created','at_origin_relay','with_collection_driver','at_origin_hub','with_traveler','at_destination_hub','with_last_mile_driver','at_destination_relay','delivered','returning','returned','closed')),
  previous_custodian_type text,
  previous_custodian_id text,
  new_custodian_type text,
  new_custodian_id text,
  organization_id uuid,
  previous_location_id text,
  new_location_id text,
  mission_id uuid,
  vehicle_id uuid,
  driver_id uuid,
  traveler_id uuid,
  relay_id uuid,
  hub_id uuid,
  country_code text not null check(char_length(country_code)=2),
  latitude numeric(10,7) check(latitude is null or latitude between -90 and 90),
  longitude numeric(10,7) check(longitude is null or longitude between -180 and 180),
  location_accuracy numeric check(location_accuracy is null or location_accuracy >= 0),
  location_source text,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  recorded_by uuid references public.profiles(id) on delete set null,
  recorded_by_role text not null,
  device_id text,
  application_source text not null,
  event_source text not null,
  parcel_condition text not null default 'unknown' check(parcel_condition in ('unknown','intact','light_damage','severe_damage','seal_intact','seal_broken','suspect_content','weight_mismatch','dimension_mismatch','opened','wet','crushed','other')),
  condition_severity text check(condition_severity is null or condition_severity in ('low','medium','high','critical')),
  notes text,
  anomaly_status text not null default 'clear' check(anomaly_status in ('clear','suspected','confirmed','resolved')),
  validation_status text not null default 'confirmed' check(validation_status in ('pending','confirmed','rejected','cancelled','corrected')),
  event_version integer not null default 1 check(event_version > 0),
  correction_of_event_id uuid references public.parcel_traceability_events(id) on delete restrict,
  correction_reason text,
  idempotency_key text not null,
  previous_event_hash text,
  event_hash text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(parcel_id,sequence_no),
  unique(parcel_id,idempotency_key),
  unique(event_hash),
  check((correction_of_event_id is null and correction_reason is null) or (correction_of_event_id is not null and length(trim(correction_reason)) >= 8))
);

alter table public.parcel_traceability_proofs
  add constraint parcel_traceability_proofs_event_fkey foreign key(event_id) references public.parcel_traceability_events(id) on delete restrict;

create table public.parcel_custody_state (
  parcel_id uuid primary key references public.shipment_packages(id) on delete restrict,
  shipment_id uuid not null unique references public.shipments(id) on delete restrict,
  current_stage text not null,
  current_custodian_type text,
  current_custodian_id text,
  current_location_id text,
  current_country_code text not null check(char_length(current_country_code)=2),
  current_latitude numeric(10,7),
  current_longitude numeric(10,7),
  location_source text,
  location_accuracy numeric,
  current_mission_id uuid,
  current_vehicle_id uuid,
  next_stage text,
  next_location_id text,
  eta timestamptz,
  delay_reason text,
  intervention_owner_id uuid references public.profiles(id) on delete set null,
  last_event_id uuid not null references public.parcel_traceability_events(id) on delete restrict,
  last_event_hash text not null,
  event_count bigint not null default 1,
  trust_score integer not null default 100 check(trust_score between 0 and 100),
  trust_reasons jsonb not null default '[]',
  active_anomaly_count integer not null default 0 check(active_anomaly_count >= 0),
  closed_at timestamptz,
  updated_at timestamptz not null default now(),
  check((current_stage not in ('delivered','returned','closed')) or current_custodian_id is not null)
);

create table public.parcel_proof_requirements (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  country_code text,
  custodian_role text,
  risk_level text,
  minimum_declared_value_cents integer,
  required_proof_types text[] not null,
  minimum_proof_count integer not null default 1 check(minimum_proof_count > 0),
  active boolean not null default true,
  priority integer not null default 100,
  created_at timestamptz not null default now(),
  unique(event_type,country_code,custodian_role,risk_level,minimum_declared_value_cents)
);

create table public.parcel_seals (
  id uuid primary key default gen_random_uuid(), parcel_id uuid not null references public.shipment_packages(id) on delete restrict,
  seal_code_hash text not null, applied_at timestamptz not null, applied_by uuid references public.profiles(id), applied_location_id text,
  photo_proof_id uuid references public.parcel_traceability_proofs(id) on delete restrict, status text not null default 'intact' check(status in ('intact','broken_authorized','broken_unexpected','replaced','archived')),
  broken_at timestamptz, broken_by uuid references public.profiles(id), break_reason text, replacement_seal_id uuid references public.parcel_seals(id), created_at timestamptz not null default now(),
  unique(parcel_id,seal_code_hash)
);

create table public.parcel_traceability_anomalies (
  id uuid primary key default gen_random_uuid(), parcel_id uuid not null references public.shipment_packages(id) on delete restrict,
  shipment_id uuid not null references public.shipments(id) on delete restrict, event_id uuid references public.parcel_traceability_events(id) on delete restrict,
  anomaly_type text not null, severity text not null check(severity in ('low','medium','high','critical')), status text not null default 'open' check(status in ('open','assigned','investigating','resolved','dismissed')),
  title text not null, details jsonb not null default '{}', assigned_to uuid references public.profiles(id), incident_id uuid references public.operational_incidents(id) on delete set null,
  detected_at timestamptz not null default now(), resolved_at timestamptz, resolved_by uuid references public.profiles(id), resolution text, created_at timestamptz not null default now()
);

create table public.parcel_passport_access_log (
  id uuid primary key default gen_random_uuid(), parcel_id uuid not null references public.shipment_packages(id) on delete restrict,
  actor_id uuid references public.profiles(id), access_type text not null check(access_type in ('view','search','export','proof_download')),
  application_source text not null, country_code text, purpose text, created_at timestamptz not null default now()
);

create index parcel_traceability_timeline_idx on public.parcel_traceability_events(parcel_id,sequence_no desc);
create index parcel_traceability_shipment_idx on public.parcel_traceability_events(shipment_id,occurred_at desc);
create index parcel_traceability_country_idx on public.parcel_traceability_events(country_code,occurred_at desc);
create index parcel_traceability_custodian_idx on public.parcel_traceability_events(new_custodian_type,new_custodian_id,occurred_at desc);
create index parcel_traceability_anomaly_queue_idx on public.parcel_traceability_anomalies(status,severity,detected_at desc) where status in ('open','assigned','investigating');
create index parcel_proofs_parcel_idx on public.parcel_traceability_proofs(parcel_id,captured_at desc);

create or replace function public.block_traceability_mutation() returns trigger language plpgsql set search_path=public as $$
begin raise exception 'Traceability history is append-only; record a correction or cancellation event'; end; $$;
create trigger parcel_traceability_events_immutable before update or delete on public.parcel_traceability_events for each row execute function public.block_traceability_mutation();
create trigger parcel_traceability_proofs_immutable before delete on public.parcel_traceability_proofs for each row execute function public.block_traceability_mutation();

create or replace function public.traceability_country_code(value text) returns text language sql immutable set search_path=public as $$
  select case lower(trim(value)) when 'sénégal' then 'SN' when 'senegal' then 'SN' when 'france' then 'FR' when 'mali' then 'ML' when 'guinée' then 'GN' when 'guinee' then 'GN' when 'côte d''ivoire' then 'CI' when 'cote d''ivoire' then 'CI' when 'gambie' then 'GM' when 'gambia' then 'GM' when 'mauritanie' then 'MR' when 'mauritania' then 'MR' else upper(left(trim(value),2)) end;
$$;

create or replace function public.initialize_parcel_traceability() returns trigger language plpgsql security definer set search_path=public as $$
declare s public.shipments%rowtype; event_id uuid; event_hash text; country text;
begin
  select * into s from public.shipments where id=new.shipment_id;
  country:=public.traceability_country_code(s.origin_country);
  event_hash:=encode(digest(concat_ws('|',new.id::text,new.shipment_id::text,'1','parcel_created',s.sender_id::text,s.created_at::text),'sha256'),'hex');
  insert into public.parcel_traceability_events(parcel_id,shipment_id,sequence_no,event_type,stage_after,new_custodian_type,new_custodian_id,country_code,occurred_at,recorded_by,recorded_by_role,application_source,event_source,idempotency_key,event_hash,metadata)
  values(new.id,new.shipment_id,1,'parcel_created','created','sender',s.sender_id::text,country,s.created_at,s.sender_id,'client','user-app','shipment_creation','shipment-created:'||new.shipment_id::text,event_hash,jsonb_build_object('tracking_code',s.tracking_code,'legacy_status',s.status)) returning id into event_id;
  insert into public.parcel_custody_state(parcel_id,shipment_id,current_stage,current_custodian_type,current_custodian_id,current_country_code,next_stage,eta,last_event_id,last_event_hash)
  values(new.id,new.shipment_id,'created','sender',s.sender_id::text,country,'at_origin_relay',s.latest_delivery_date::timestamptz,event_id,event_hash);
  return new;
end; $$;

create trigger shipment_packages_initialize_traceability after insert on public.shipment_packages for each row execute function public.initialize_parcel_traceability();

create or replace function public.import_delivery_proof_to_traceability() returns trigger language plpgsql security definer set search_path=public as $$
declare parcel uuid; mapped_type text; hash_value text;
begin
  select id into parcel from public.shipment_packages where shipment_id=new.shipment_id;
  if parcel is null then return new; end if;
  mapped_type:=case when new.otp_confirmed then 'otp' when new.handover_qr_token_id is not null then 'qr' when new.proof_type::text='signature' then 'signature' when new.proof_type::text='photo' then 'parcel_photo' else 'delivery' end;
  hash_value:=encode(digest(concat_ws('|','delivery_proof',new.id::text,new.shipment_id::text,new.created_at::text),'sha256'),'hex');
  insert into public.parcel_traceability_proofs(parcel_id,shipment_id,proof_type,storage_bucket,storage_path,proof_hash,captured_at,captured_by,metadata,verified_at,verified_by,verification_status)
  values(parcel,new.shipment_id,mapped_type,new.storage_bucket,new.storage_path,hash_value,coalesce(new.captured_at,new.created_at),new.uploaded_by,jsonb_build_object('source_delivery_proof_id',new.id,'mission_id',new.mission_id),new.created_at,new.uploaded_by,'verified')
  on conflict(parcel_id,proof_hash) do nothing;
  return new;
end; $$;
create trigger delivery_proofs_import_traceability after insert on public.delivery_proofs for each row execute function public.import_delivery_proof_to_traceability();

insert into public.parcel_traceability_events(parcel_id,shipment_id,sequence_no,event_type,stage_after,new_custodian_type,new_custodian_id,country_code,occurred_at,recorded_by,recorded_by_role,application_source,event_source,idempotency_key,event_hash,metadata)
select p.id,s.id,1,'parcel_created','created','sender',s.sender_id::text,public.traceability_country_code(s.origin_country),s.created_at,s.sender_id,'client','admin-app','migration','shipment-created:'||s.id::text,
  encode(digest(concat_ws('|',p.id::text,s.id::text,'1','parcel_created',s.sender_id::text,s.created_at::text),'sha256'),'hex'),jsonb_build_object('tracking_code',s.tracking_code,'legacy_status',s.status,'imported_from','shipments')
from public.shipment_packages p join public.shipments s on s.id=p.shipment_id
on conflict(parcel_id,idempotency_key) do nothing;

insert into public.parcel_custody_state(parcel_id,shipment_id,current_stage,current_custodian_type,current_custodian_id,current_country_code,next_stage,eta,last_event_id,last_event_hash)
select e.parcel_id,e.shipment_id,'created','sender',e.new_custodian_id,e.country_code,'at_origin_relay',s.latest_delivery_date::timestamptz,e.id,e.event_hash
from public.parcel_traceability_events e join public.shipments s on s.id=e.shipment_id where e.sequence_no=1
on conflict(parcel_id) do nothing;

insert into public.parcel_proof_requirements(event_type,required_proof_types,minimum_proof_count,priority) values
('custody_transfer_confirmed',array['qr','signature','server_confirmation'],1,100),
('parcel_handed_to_traveler',array['qr','identity','signature'],2,50),
('parcel_delivered',array['otp','qr','signature','delivery'],1,10),
('parcel_collected_by_recipient',array['otp','qr','signature','delivery'],1,10),
('parcel_damaged',array['parcel_photo','incident_report'],1,20)
on conflict do nothing;

create or replace function public.is_valid_parcel_stage_transition(previous_stage text,next_stage text) returns boolean language sql immutable set search_path=public as $$
  select previous_stage=next_stage or (previous_stage,next_stage) in (
    ('created','at_origin_relay'),('created','with_collection_driver'),('created','closed'),
    ('at_origin_relay','with_collection_driver'),('at_origin_relay','returning'),
    ('with_collection_driver','at_origin_hub'),('with_collection_driver','at_destination_relay'),('with_collection_driver','returning'),
    ('at_origin_hub','with_traveler'),('at_origin_hub','at_destination_hub'),('at_origin_hub','returning'),
    ('with_traveler','at_destination_hub'),('with_traveler','returning'),
    ('at_destination_hub','with_last_mile_driver'),('at_destination_hub','at_destination_relay'),('at_destination_hub','returning'),
    ('with_last_mile_driver','at_destination_relay'),('with_last_mile_driver','delivered'),('with_last_mile_driver','returning'),
    ('at_destination_relay','with_last_mile_driver'),('at_destination_relay','delivered'),('at_destination_relay','returning'),
    ('delivered','closed'),('returning','returned'),('returned','closed')
  );
$$;

create or replace function public.record_parcel_traceability_event(p_payload jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare st public.parcel_custody_state%rowtype; pkg public.shipment_packages%rowtype; shp public.shipments%rowtype;
  v_event_id uuid:=gen_random_uuid(); seq bigint; prev_hash text; new_hash text; actor_role text; event_type text; next_stage text;
  previous_id text; new_id text; proof_ids uuid[]; required_count integer:=0; verified_count integer:=0; country text; occurred timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into pkg from public.shipment_packages where id=(p_payload->>'parcel_id')::uuid;
  select * into shp from public.shipments where id=pkg.shipment_id;
  if pkg.id is null or not (shp.sender_id=auth.uid() or public.current_user_has_role(array['admin','super_admin','operations_manager','collection_driver','relay_agent','hub_agent','local_transporter','traveler','support_agent'])) then raise exception 'Parcel unavailable'; end if;
  select * into st from public.parcel_custody_state where parcel_id=pkg.id for update;
  event_type:=p_payload->>'event_type'; next_stage:=p_payload->>'stage_after'; previous_id:=nullif(p_payload->>'previous_custodian_id',''); new_id:=nullif(p_payload->>'new_custodian_id','');
  actor_role:=coalesce(nullif(p_payload->>'recorded_by_role',''),'unknown'); country:=upper(coalesce(nullif(p_payload->>'country_code',''),st.current_country_code)); occurred:=coalesce((p_payload->>'occurred_at')::timestamptz,now());
  if occurred > now()+interval '5 minutes' then raise exception 'Future event rejected'; end if;
  if not public.is_valid_parcel_stage_transition(st.current_stage,next_stage) then raise exception 'Invalid parcel stage transition'; end if;
  if st.current_stage in ('delivered','closed') and event_type in ('parcel_delivered','parcel_collected_by_recipient') then raise exception 'Parcel already delivered'; end if;
  if event_type in ('custody_transfer_confirmed','parcel_handed_to_traveler','parcel_delivered','parcel_collected_by_recipient') then
    if previous_id is distinct from st.current_custodian_id then raise exception 'Previous custodian mismatch'; end if;
    if new_id is null then raise exception 'New custodian required'; end if;
  end if;
  if next_stage='delivered' and event_type not in ('parcel_delivered','parcel_collected_by_recipient') then raise exception 'Final delivery event required'; end if;
  select coalesce(max(minimum_proof_count),0) into required_count from public.parcel_proof_requirements r where r.active and r.event_type=event_type and (r.country_code is null or r.country_code=country) and (r.custodian_role is null or r.custodian_role=actor_role);
  select coalesce(array_agg(value::text::uuid),array[]::uuid[]) into proof_ids from jsonb_array_elements_text(coalesce(p_payload->'proof_ids','[]'::jsonb));
  select count(*) into verified_count from public.parcel_traceability_proofs p where p.id=any(proof_ids) and p.parcel_id=pkg.id and p.verification_status='verified';
  if verified_count<required_count then raise exception 'Required verified proofs missing'; end if;
  seq:=st.event_count+1; prev_hash:=st.last_event_hash;
  new_hash:=encode(digest(concat_ws('|',v_event_id::text,pkg.id::text,seq::text,event_type,coalesce(previous_id,''),coalesce(new_id,''),next_stage,occurred::text,prev_hash,coalesce(p_payload->>'idempotency_key','')),'sha256'),'hex');
  insert into public.parcel_traceability_events(id,parcel_id,shipment_id,sequence_no,event_type,stage_before,stage_after,previous_custodian_type,previous_custodian_id,new_custodian_type,new_custodian_id,previous_location_id,new_location_id,mission_id,vehicle_id,driver_id,traveler_id,relay_id,hub_id,country_code,latitude,longitude,location_accuracy,location_source,occurred_at,recorded_by,recorded_by_role,device_id,application_source,event_source,parcel_condition,condition_severity,notes,correction_of_event_id,correction_reason,idempotency_key,previous_event_hash,event_hash,metadata)
  values(v_event_id,pkg.id,pkg.shipment_id,seq,event_type,st.current_stage,next_stage,st.current_custodian_type,previous_id,p_payload->>'new_custodian_type',new_id,st.current_location_id,p_payload->>'new_location_id',nullif(p_payload->>'mission_id','')::uuid,nullif(p_payload->>'vehicle_id','')::uuid,nullif(p_payload->>'driver_id','')::uuid,nullif(p_payload->>'traveler_id','')::uuid,nullif(p_payload->>'relay_id','')::uuid,nullif(p_payload->>'hub_id','')::uuid,country,nullif(p_payload->>'latitude','')::numeric,nullif(p_payload->>'longitude','')::numeric,nullif(p_payload->>'location_accuracy','')::numeric,p_payload->>'location_source',occurred,auth.uid(),actor_role,p_payload->>'device_id',coalesce(p_payload->>'application_source','unknown'),coalesce(p_payload->>'event_source','api'),coalesce(p_payload->>'parcel_condition','unknown'),nullif(p_payload->>'condition_severity',''),p_payload->>'notes',nullif(p_payload->>'correction_of_event_id','')::uuid,p_payload->>'correction_reason',coalesce(nullif(p_payload->>'idempotency_key',''),gen_random_uuid()::text),prev_hash,new_hash,coalesce(p_payload->'metadata','{}'));
  update public.parcel_traceability_proofs p set event_id=v_event_id where p.id=any(proof_ids) and p.event_id is null;
  update public.parcel_custody_state set current_stage=next_stage,current_custodian_type=coalesce(nullif(p_payload->>'new_custodian_type',''),current_custodian_type),current_custodian_id=coalesce(new_id,current_custodian_id),current_location_id=coalesce(nullif(p_payload->>'new_location_id',''),current_location_id),current_country_code=country,current_latitude=coalesce(nullif(p_payload->>'latitude','')::numeric,current_latitude),current_longitude=coalesce(nullif(p_payload->>'longitude','')::numeric,current_longitude),location_source=coalesce(nullif(p_payload->>'location_source',''),location_source),location_accuracy=coalesce(nullif(p_payload->>'location_accuracy','')::numeric,location_accuracy),current_mission_id=coalesce(nullif(p_payload->>'mission_id','')::uuid,current_mission_id),current_vehicle_id=coalesce(nullif(p_payload->>'vehicle_id','')::uuid,current_vehicle_id),next_stage=nullif(p_payload->>'next_stage',''),next_location_id=nullif(p_payload->>'next_location_id',''),eta=nullif(p_payload->>'eta','')::timestamptz,delay_reason=nullif(p_payload->>'delay_reason',''),intervention_owner_id=nullif(p_payload->>'intervention_owner_id','')::uuid,last_event_id=v_event_id,last_event_hash=new_hash,event_count=seq,closed_at=case when next_stage='closed' then now() else null end,updated_at=now() where parcel_id=pkg.id;
  insert into public.control_tower_events(source_module,source_event_id,event_type,entity_type,entity_id,country_code,occurred_at,severity,sanitized_payload)
  values('parcel_traceability',v_event_id::text,event_type,'shipment',pkg.shipment_id::text,country,occurred,case when event_type in ('parcel_damaged','parcel_lost_suspected','customs_blocked') then 'critical' else 'info' end,jsonb_build_object('parcel_id',pkg.id,'stage',next_stage,'custodian_type',p_payload->>'new_custodian_type','location_id',p_payload->>'new_location_id','trust_score',st.trust_score))
  on conflict(source_module,source_event_id) do nothing;
  insert into public.control_tower_outbox(event_id,destination) select c.id,d from public.control_tower_events c cross join unnest(array['digital_twin','snapshot','recommendations','notifications','analytics']) d where c.source_module='parcel_traceability' and c.source_event_id=v_event_id::text on conflict do nothing;
  return v_event_id;
exception when unique_violation then
  select id into v_event_id from public.parcel_traceability_events where parcel_id=pkg.id and idempotency_key=p_payload->>'idempotency_key';
  if v_event_id is null then raise; end if; return v_event_id;
end; $$;

create or replace function public.register_parcel_traceability_proof(p_payload jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare pkg public.shipment_packages%rowtype; shp public.shipments%rowtype; proof_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into pkg from public.shipment_packages where id=(p_payload->>'parcel_id')::uuid; select * into shp from public.shipments where id=pkg.shipment_id;
  if pkg.id is null or not (shp.sender_id=auth.uid() or public.current_user_has_role(array['admin','super_admin','operations_manager','collection_driver','relay_agent','hub_agent','local_transporter','traveler','support_agent'])) then raise exception 'Parcel unavailable'; end if;
  insert into public.parcel_traceability_proofs(parcel_id,shipment_id,proof_type,storage_bucket,storage_path,proof_hash,captured_at,captured_by,device_id,latitude,longitude,metadata,verified_at,verified_by,verification_status)
  values(pkg.id,pkg.shipment_id,p_payload->>'proof_type',p_payload->>'storage_bucket',p_payload->>'storage_path',p_payload->>'proof_hash',coalesce((p_payload->>'captured_at')::timestamptz,now()),auth.uid(),p_payload->>'device_id',nullif(p_payload->>'latitude','')::numeric,nullif(p_payload->>'longitude','')::numeric,coalesce(p_payload->'metadata','{}'),case when p_payload->>'proof_type'='server_confirmation' then now() end,case when p_payload->>'proof_type'='server_confirmation' then auth.uid() end,case when p_payload->>'proof_type'='server_confirmation' then 'verified' else 'pending' end) returning id into proof_id;
  return proof_id;
end; $$;

alter table public.parcel_traceability_events enable row level security; alter table public.parcel_traceability_proofs enable row level security;
alter table public.parcel_custody_state enable row level security; alter table public.parcel_proof_requirements enable row level security;
alter table public.parcel_seals enable row level security; alter table public.parcel_traceability_anomalies enable row level security; alter table public.parcel_passport_access_log enable row level security;

create policy parcel_events_scoped_read on public.parcel_traceability_events for select using(exists(select 1 from public.shipments s where s.id=shipment_id and (s.sender_id=auth.uid() or public.current_user_has_control_tower_country(country_code))));
create policy parcel_proofs_scoped_read on public.parcel_traceability_proofs for select using(exists(select 1 from public.shipments s where s.id=shipment_id and (s.sender_id=auth.uid() or public.current_user_has_role(array['admin','super_admin','operations_manager','support_agent','relay_agent','hub_agent','collection_driver','local_transporter']))));
create policy parcel_state_scoped_read on public.parcel_custody_state for select using(exists(select 1 from public.shipments s where s.id=shipment_id and (s.sender_id=auth.uid() or public.current_user_has_control_tower_country(current_country_code))));
create policy parcel_requirements_staff_read on public.parcel_proof_requirements for select using(public.current_user_has_role(array['admin','super_admin','operations_manager','security_manager','auditor']));
create policy parcel_seals_scoped_read on public.parcel_seals for select using(exists(select 1 from public.parcel_custody_state c where c.parcel_id=parcel_seals.parcel_id and public.current_user_has_control_tower_country(c.current_country_code)));
create policy parcel_anomalies_scoped_read on public.parcel_traceability_anomalies for select using(exists(select 1 from public.parcel_custody_state c where c.parcel_id=parcel_traceability_anomalies.parcel_id and public.current_user_has_control_tower_country(c.current_country_code)));
create policy parcel_access_log_auditor_read on public.parcel_passport_access_log for select using(public.current_user_has_role(array['admin','super_admin','security_manager','auditor']));

revoke all on function public.record_parcel_traceability_event(jsonb) from public,anon; grant execute on function public.record_parcel_traceability_event(jsonb) to authenticated;
revoke all on function public.register_parcel_traceability_proof(jsonb) from public,anon; grant execute on function public.register_parcel_traceability_proof(jsonb) to authenticated;
revoke insert,update,delete on public.parcel_traceability_events,public.parcel_custody_state,public.parcel_traceability_anomalies,public.parcel_passport_access_log from anon,authenticated;
revoke insert,delete on public.parcel_traceability_proofs from anon,authenticated;
