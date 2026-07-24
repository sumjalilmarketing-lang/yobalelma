create table public.parcel_custody_transfer_requests (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references public.shipment_packages(id) on delete restrict,
  shipment_id uuid not null references public.shipments(id) on delete restrict,
  stage_before text not null,
  stage_after text not null,
  previous_custodian_type text not null,
  previous_custodian_id text not null,
  new_custodian_type text not null,
  new_custodian_id text not null,
  giver_actor_id uuid not null references public.profiles(id) on delete restrict,
  receiver_actor_id uuid not null references public.profiles(id) on delete restrict,
  event_type text not null check(event_type in ('custody_transfer_confirmed','parcel_handed_to_traveler','parcel_delivered','parcel_collected_by_recipient')),
  mission_id uuid,
  vehicle_id uuid,
  location_id text,
  latitude numeric(10,7) not null check(latitude between -90 and 90),
  longitude numeric(10,7) not null check(longitude between -180 and 180),
  location_accuracy numeric(10,2) check(location_accuracy is null or location_accuracy between 0 and 5000),
  proof_ids uuid[] not null,
  event_payload jsonb not null default '{}',
  status text not null default 'pending' check(status in ('pending','confirmed','rejected','expired')),
  giver_confirmed_at timestamptz not null default now(),
  receiver_confirmed_at timestamptz,
  rejected_at timestamptz,
  rejected_by uuid references public.profiles(id) on delete restrict,
  rejection_reason text,
  expires_at timestamptz not null,
  request_idempotency_key text not null,
  decision_idempotency_key text,
  finalized_event_id uuid references public.parcel_traceability_events(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parcel_custody_transfer_distinct_actors check(giver_actor_id<>receiver_actor_id),
  constraint parcel_custody_transfer_distinct_custodians check(previous_custodian_id<>new_custodian_id),
  constraint parcel_custody_transfer_expiry check(expires_at>giver_confirmed_at and expires_at<=giver_confirmed_at+interval '60 minutes'),
  constraint parcel_custody_transfer_request_idempotency unique(parcel_id,request_idempotency_key),
  constraint parcel_custody_transfer_decision_idempotency unique(parcel_id,decision_idempotency_key)
);

create unique index parcel_custody_transfer_one_pending_idx on public.parcel_custody_transfer_requests(parcel_id) where status='pending';
create index parcel_custody_transfer_actor_queue_idx on public.parcel_custody_transfer_requests(receiver_actor_id,status,expires_at);
create index parcel_custody_transfer_shipment_idx on public.parcel_custody_transfer_requests(shipment_id,created_at desc);

alter table public.parcel_custody_transfer_requests enable row level security;
create policy parcel_custody_transfer_actor_read on public.parcel_custody_transfer_requests for select
using(
  auth.uid() in (giver_actor_id,receiver_actor_id)
  or public.current_user_has_role(array['admin','super_admin','operations_manager','security_manager','auditor'])
);
revoke insert,update,delete on public.parcel_custody_transfer_requests from anon,authenticated;

create or replace function public.traceability_distance_meters(p_latitude_a numeric,p_longitude_a numeric,p_latitude_b numeric,p_longitude_b numeric)
returns numeric language sql immutable set search_path=public as $$
  select 6371000*2*asin(sqrt(
    power(sin(radians((p_latitude_b-p_latitude_a)/2)),2)
    +cos(radians(p_latitude_a))*cos(radians(p_latitude_b))*power(sin(radians((p_longitude_b-p_longitude_a)/2)),2)
  ));
$$;
revoke all on function public.traceability_distance_meters(numeric,numeric,numeric,numeric) from public,anon,authenticated;

create or replace function public.assert_verified_traceability_proofs(
  p_parcel_id uuid,p_event_type text,p_actor_role text,p_country_code text,p_proof_ids uuid[]
) returns void language plpgsql security definer set search_path=public as $$
declare required_count integer:=0; required_types text[]:=array[]::text[]; verified_count integer:=0;
begin
  select
    coalesce(max(r.minimum_proof_count),0),
    coalesce(array(
      select distinct proof_type
      from public.parcel_proof_requirements requirement
      cross join unnest(requirement.required_proof_types) proof_type
      where requirement.active
        and requirement.event_type=p_event_type
        and (requirement.country_code is null or requirement.country_code=p_country_code)
        and (requirement.custodian_role is null or requirement.custodian_role=p_actor_role)
    ),array[]::text[])
  into required_count,required_types
  from public.parcel_proof_requirements r
  where r.active and r.event_type=p_event_type
    and (r.country_code is null or r.country_code=p_country_code)
    and (r.custodian_role is null or r.custodian_role=p_actor_role);

  select count(distinct proof.proof_type) into verified_count
  from public.parcel_traceability_proofs proof
  where proof.id=any(coalesce(p_proof_ids,array[]::uuid[]))
    and proof.parcel_id=p_parcel_id
    and proof.verification_status='verified'
    and proof.proof_type=any(required_types);

  if verified_count<required_count then
    raise exception 'Required verified proof types missing';
  end if;
end; $$;
revoke all on function public.assert_verified_traceability_proofs(uuid,text,text,text,uuid[]) from public,anon,authenticated;

create or replace function public.assert_dual_transfer_proofs(
  p_parcel_id uuid,p_stage_after text,p_giver_actor_id uuid,p_proof_ids uuid[],p_require_verified boolean
) returns void language plpgsql security definer set search_path=public as $$
declare required_types text[]; present_count integer:=0;
begin
  required_types:=case p_stage_after
    when 'at_origin_relay' then array['qr','parcel_photo','gps']
    when 'with_collection_driver' then array['qr','server_confirmation','gps']
    when 'at_origin_hub' then array['qr','server_confirmation','gps']
    when 'with_traveler' then array['qr','identity','signature']
    when 'at_destination_hub' then array['qr','server_confirmation','gps']
    when 'with_last_mile_driver' then array['qr','server_confirmation','gps']
    when 'at_destination_relay' then array['qr','server_confirmation','gps']
    when 'delivered' then array['otp','signature','delivery','gps']
    else array[]::text[]
  end;
  if cardinality(required_types)=0 then raise exception 'Unsupported dual transfer stage'; end if;
  select count(distinct proof.proof_type) into present_count
  from public.parcel_traceability_proofs proof
  where proof.id=any(coalesce(p_proof_ids,array[]::uuid[]))
    and proof.parcel_id=p_parcel_id
    and proof.captured_by=p_giver_actor_id
    and proof.proof_type=any(required_types)
    and (not p_require_verified or proof.verification_status='verified')
    and (proof.proof_type<>'parcel_photo' or (nullif(proof.storage_bucket,'') is not null and nullif(proof.storage_path,'') is not null))
    and (proof.proof_type<>'gps' or (proof.latitude is not null and proof.longitude is not null));
  if present_count<cardinality(required_types) then raise exception 'Complete dual transfer evidence missing'; end if;
end; $$;
revoke all on function public.assert_dual_transfer_proofs(uuid,text,uuid,uuid[],boolean) from public,anon,authenticated;

alter function public.record_parcel_traceability_event(jsonb) rename to record_parcel_traceability_event_internal;
revoke all on function public.record_parcel_traceability_event_internal(jsonb) from public,anon,authenticated;

create or replace function public.record_parcel_traceability_event(p_payload jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare st public.parcel_custody_state%rowtype; proof_ids uuid[];
begin
  if p_payload->>'event_type' in ('custody_transfer_confirmed','parcel_handed_to_traveler','parcel_delivered','parcel_collected_by_recipient') then
    raise exception 'Sensitive custody transitions require dual validation';
  end if;
  select * into st from public.parcel_custody_state where parcel_id=(p_payload->>'parcel_id')::uuid;
  if st.parcel_id is null then raise exception 'Traceability state unavailable'; end if;
  select coalesce(array_agg(value::text::uuid),array[]::uuid[]) into proof_ids
  from jsonb_array_elements_text(coalesce(p_payload->'proof_ids','[]'::jsonb));
  perform public.assert_dual_transfer_proofs(st.parcel_id,p_payload->>'stage_after',auth.uid(),proof_ids,false);
  perform public.assert_verified_traceability_proofs(
    st.parcel_id,p_payload->>'event_type',coalesce(nullif(p_payload->>'recorded_by_role',''),'unknown'),
    upper(coalesce(nullif(p_payload->>'country_code',''),st.current_country_code)),proof_ids
  );
  return public.record_parcel_traceability_event_internal(p_payload);
end; $$;
revoke all on function public.record_parcel_traceability_event(jsonb) from public,anon;
grant execute on function public.record_parcel_traceability_event(jsonb) to authenticated;

create or replace function public.request_parcel_custody_transfer(p_payload jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare st public.parcel_custody_state%rowtype; transfer_id uuid; proof_ids uuid[]; event_type text; expires_at timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into st from public.parcel_custody_state where parcel_id=(p_payload->>'parcel_id')::uuid for update;
  if st.parcel_id is null then raise exception 'Traceability state unavailable'; end if;
  if auth.uid()<>(p_payload->>'giver_actor_id')::uuid then raise exception 'Giver identity mismatch'; end if;
  if auth.uid()=(p_payload->>'receiver_actor_id')::uuid then raise exception 'Independent receiver required'; end if;
  if nullif(p_payload->>'previous_custodian_id','') is distinct from st.current_custodian_id then raise exception 'Previous custodian mismatch'; end if;
  if nullif(p_payload->>'new_custodian_id','') is null or p_payload->>'new_custodian_id'=st.current_custodian_id then raise exception 'New custodian required'; end if;
  if not public.is_valid_parcel_stage_transition(st.current_stage,p_payload->>'stage_after') then raise exception 'Invalid parcel stage transition'; end if;
  if nullif(p_payload->>'request_idempotency_key','') is null then raise exception 'Idempotency key required'; end if;
  if nullif(p_payload->>'latitude','') is null or nullif(p_payload->>'longitude','') is null then raise exception 'Position required'; end if;
  expires_at:=coalesce((p_payload->>'expires_at')::timestamptz,now()+interval '15 minutes');
  if expires_at<=now() or expires_at>now()+interval '60 minutes' then raise exception 'Invalid transfer expiration'; end if;
  event_type:=case
    when p_payload->>'stage_after'='with_traveler' then 'parcel_handed_to_traveler'
    when p_payload->>'stage_after'='delivered' and p_payload->>'new_custodian_type'='recipient' then 'parcel_collected_by_recipient'
    when p_payload->>'stage_after'='delivered' then 'parcel_delivered'
    else 'custody_transfer_confirmed'
  end;
  select coalesce(array_agg(value::text::uuid),array[]::uuid[]) into proof_ids
  from jsonb_array_elements_text(coalesce(p_payload->'proof_ids','[]'::jsonb));
  perform public.assert_verified_traceability_proofs(
    st.parcel_id,event_type,coalesce(nullif(p_payload->>'recorded_by_role',''),'unknown'),st.current_country_code,proof_ids
  );
  insert into public.parcel_custody_transfer_requests(
    parcel_id,shipment_id,stage_before,stage_after,previous_custodian_type,previous_custodian_id,new_custodian_type,new_custodian_id,
    giver_actor_id,receiver_actor_id,event_type,mission_id,vehicle_id,location_id,latitude,longitude,location_accuracy,proof_ids,
    event_payload,expires_at,request_idempotency_key
  ) values(
    st.parcel_id,st.shipment_id,st.current_stage,p_payload->>'stage_after',st.current_custodian_type,st.current_custodian_id,
    p_payload->>'new_custodian_type',p_payload->>'new_custodian_id',(p_payload->>'giver_actor_id')::uuid,
    (p_payload->>'receiver_actor_id')::uuid,event_type,nullif(p_payload->>'mission_id','')::uuid,
    nullif(p_payload->>'vehicle_id','')::uuid,p_payload->>'new_location_id',(p_payload->>'latitude')::numeric,
    (p_payload->>'longitude')::numeric,nullif(p_payload->>'location_accuracy','')::numeric,proof_ids,p_payload,expires_at,
    p_payload->>'request_idempotency_key'
  )
  on conflict(parcel_id,request_idempotency_key) do nothing returning id into transfer_id;
  if transfer_id is null then
    select id into transfer_id from public.parcel_custody_transfer_requests
    where parcel_id=st.parcel_id and request_idempotency_key=p_payload->>'request_idempotency_key';
  end if;
  return transfer_id;
end; $$;

create or replace function public.decide_parcel_custody_transfer(
  p_transfer_id uuid,p_decision text,p_decision_idempotency_key text,p_latitude numeric,p_longitude numeric,p_rejection_reason text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare transfer public.parcel_custody_transfer_requests%rowtype; st public.parcel_custody_state%rowtype; event_id uuid; payload jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_decision not in ('confirm','reject') or nullif(trim(p_decision_idempotency_key),'') is null then raise exception 'Invalid decision'; end if;
  select * into transfer from public.parcel_custody_transfer_requests where id=p_transfer_id for update;
  if transfer.id is null then raise exception 'Transfer unavailable'; end if;
  if transfer.status<>'pending' then
    if transfer.decision_idempotency_key=p_decision_idempotency_key then return transfer.finalized_event_id; end if;
    raise exception 'Transfer already finalized';
  end if;
  if transfer.expires_at<=now() then
    update public.parcel_custody_transfer_requests set status='expired',decision_idempotency_key=p_decision_idempotency_key,updated_at=now() where id=transfer.id;
    raise exception 'Transfer expired';
  end if;
  if p_decision='reject' then
    if auth.uid() not in (transfer.giver_actor_id,transfer.receiver_actor_id) then raise exception 'Actor mismatch'; end if;
    if nullif(trim(p_rejection_reason),'') is null then raise exception 'Rejection reason required'; end if;
    update public.parcel_custody_transfer_requests set status='rejected',rejected_at=now(),rejected_by=auth.uid(),
      rejection_reason=left(trim(p_rejection_reason),500),decision_idempotency_key=p_decision_idempotency_key,updated_at=now()
    where id=transfer.id;
    return null;
  end if;
  if auth.uid()<>transfer.receiver_actor_id then raise exception 'Receiver identity mismatch'; end if;
  if p_latitude is null or p_longitude is null or public.traceability_distance_meters(transfer.latitude,transfer.longitude,p_latitude,p_longitude)>2000 then
    raise exception 'Incoherent receiver position';
  end if;
  select * into st from public.parcel_custody_state where parcel_id=transfer.parcel_id for update;
  if st.current_stage<>transfer.stage_before or st.current_custodian_id<>transfer.previous_custodian_id then raise exception 'Custody changed while transfer was pending'; end if;
  update public.parcel_traceability_proofs set verification_status='verified',verified_at=now(),verified_by=auth.uid()
  where id=any(transfer.proof_ids) and parcel_id=transfer.parcel_id and captured_by=transfer.giver_actor_id and verification_status='pending';
  perform public.assert_dual_transfer_proofs(transfer.parcel_id,transfer.stage_after,transfer.giver_actor_id,transfer.proof_ids,true);
  perform public.assert_verified_traceability_proofs(
    transfer.parcel_id,transfer.event_type,coalesce(nullif(transfer.event_payload->>'recorded_by_role',''),'unknown'),
    st.current_country_code,transfer.proof_ids
  );
  payload:=transfer.event_payload||jsonb_build_object(
    'parcel_id',transfer.parcel_id,'event_type',transfer.event_type,'stage_after',transfer.stage_after,
    'previous_custodian_id',transfer.previous_custodian_id,'new_custodian_type',transfer.new_custodian_type,
    'new_custodian_id',transfer.new_custodian_id,'proof_ids',to_jsonb(transfer.proof_ids),
    'idempotency_key','dual-transfer:'||transfer.id::text,'latitude',p_latitude,'longitude',p_longitude,
    'metadata',coalesce(transfer.event_payload->'metadata','{}'::jsonb)||jsonb_build_object(
      'dual_transfer_id',transfer.id,'giver_actor_id',transfer.giver_actor_id,'receiver_actor_id',transfer.receiver_actor_id,
      'giver_confirmed_at',transfer.giver_confirmed_at,'receiver_confirmed_at',now()
    )
  );
  event_id:=public.record_parcel_traceability_event_internal(payload);
  update public.parcel_custody_transfer_requests set status='confirmed',receiver_confirmed_at=now(),
    decision_idempotency_key=p_decision_idempotency_key,finalized_event_id=event_id,updated_at=now()
  where id=transfer.id;
  return event_id;
end; $$;

revoke all on function public.request_parcel_custody_transfer(jsonb) from public,anon;
grant execute on function public.request_parcel_custody_transfer(jsonb) to authenticated;
revoke all on function public.decide_parcel_custody_transfer(uuid,text,text,numeric,numeric,text) from public,anon;
grant execute on function public.decide_parcel_custody_transfer(uuid,text,text,numeric,numeric,text) to authenticated;

comment on table public.parcel_custody_transfer_requests is 'Dual validation ledger: giver request, receiver decision, expiration, evidence and atomic custody finalization.';
