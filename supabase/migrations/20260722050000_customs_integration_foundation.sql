create table public.customs_brokers (
  id uuid primary key default gen_random_uuid(), organization_name text not null, license_reference text not null,
  license_country text not null check (char_length(license_country)=2), covered_offices text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','active','suspended','expired')), sla_minutes integer check (sla_minutes > 0),
  fee_policy jsonb not null default '{}'::jsonb, verified_by uuid references public.profiles(id), verified_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (license_country, license_reference)
);
create table public.customs_broker_agents (
  broker_id uuid not null references public.customs_brokers(id) on delete cascade, profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id text not null check (role_id in ('customs_broker','customs_broker_manager')), active boolean not null default true,
  assigned_by uuid references public.profiles(id), created_at timestamptz not null default now(), primary key (broker_id, profile_id)
);
create table public.customs_offices (
  id uuid primary key default gen_random_uuid(), country_code text not null check (char_length(country_code)=2), office_code text not null,
  name text not null, address jsonb not null default '{}'::jsonb, official_source text, status text not null default 'draft' check (status in ('draft','verified','inactive')),
  verified_by uuid references public.profiles(id), verified_at timestamptz, created_at timestamptz not null default now(), unique(country_code, office_code)
);
create table public.customs_cases (
  id uuid primary key default gen_random_uuid(), shipment_id uuid not null references public.shipments(id) on delete restrict,
  origin_country text not null check (char_length(origin_country)=2), destination_country text not null check (char_length(destination_country)=2),
  customs_provider text not null default 'manual_controlled' check (customs_provider in ('manual_controlled','senegal_customs','licensed_broker')),
  customs_office_id uuid references public.customs_offices(id), broker_id uuid references public.customs_brokers(id),
  declaration_reference text, external_reference text, regime text,
  status text not null default 'draft' check (status in ('draft','documents_required','documents_under_review','ready_for_submission','submitted','accepted','rejected','inspection_required','under_inspection','additional_information_required','duties_assessed','duties_pending_payment','duties_paid','release_pending','released','suspended','seized','returned','cancelled','closed')),
  risk_level text not null default 'unassessed' check (risk_level in ('unassessed','low','medium','high','critical')),
  inspection_required boolean not null default false, declared_value numeric(18,2) not null check (declared_value >= 0), currency text not null check (char_length(currency)=3),
  estimated_duties numeric(18,2) check (estimated_duties >= 0), final_duties numeric(18,2) check (final_duties >= 0),
  country_scope text not null check (char_length(country_scope)=2), created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), submitted_at timestamptz, released_at timestamptz, closed_at timestamptz, updated_at timestamptz not null default now(),
  unique(shipment_id)
);
create table public.customs_items (
  id uuid primary key default gen_random_uuid(), customs_case_id uuid not null references public.customs_cases(id) on delete cascade,
  shipment_item_id uuid references public.shipment_packages(id) on delete restrict, description text not null, quantity numeric(14,3) not null check (quantity > 0),
  weight numeric(14,3) not null check (weight > 0), unit_value numeric(18,2) not null check (unit_value >= 0), total_value numeric(18,2) not null check (total_value >= 0),
  country_of_origin text not null check (char_length(country_of_origin)=2), hs_code text check (hs_code is null or hs_code ~ '^\d{6,10}$'),
  hs_validation_status text not null default 'unvalidated' check (hs_validation_status in ('unvalidated','suggested','validated','rejected')),
  prohibited_status text not null default 'unassessed' check (prohibited_status in ('unassessed','clear','suspected','prohibited')),
  restricted_status text not null default 'unassessed' check (restricted_status in ('unassessed','clear','restricted')), permit_required boolean not null default false,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.customs_documents (
  id uuid primary key default gen_random_uuid(), customs_case_id uuid not null references public.customs_cases(id) on delete cascade,
  document_type text not null, filename text not null, secure_upload_id uuid not null references public.secure_uploads(id) on delete restrict,
  storage_reference text not null, checksum text not null check (checksum ~ '^[a-f0-9]{64}$'), status text not null default 'pending' check (status in ('pending','verified','rejected','expired')),
  uploaded_by uuid not null references public.profiles(id), verified_by uuid references public.profiles(id), created_at timestamptz not null default now(), verified_at timestamptz
);
create table public.customs_events (
  id uuid primary key default gen_random_uuid(), customs_case_id uuid not null references public.customs_cases(id) on delete cascade,
  event_type text not null, source text not null check (source in ('yobalelma','manual','broker','official_provider')),
  external_event_id text, verified boolean not null default false, sanitized_payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(), processed_at timestamptz,
  unique(source, external_event_id)
);
create table public.customs_decisions (
  id uuid primary key default gen_random_uuid(), customs_case_id uuid not null references public.customs_cases(id) on delete restrict,
  decision_type text not null check (decision_type in ('inspection','release','rejection','suspension','seizure','return')),
  decision_reference text not null, authority text not null, reason text, effective_at timestamptz not null, received_at timestamptz not null default now(),
  source text not null check (source in ('manual','broker','official_provider')), verified boolean not null default false,
  proof_document_id uuid references public.customs_documents(id) on delete restrict, created_by uuid references public.profiles(id),
  second_approved_by uuid references public.profiles(id), second_approved_at timestamptz, created_at timestamptz not null default now(),
  unique(source, decision_reference, authority)
);
create table public.customs_duties (
  id uuid primary key default gen_random_uuid(), customs_case_id uuid not null references public.customs_cases(id) on delete restrict,
  duty_type text not null, taxable_base numeric(18,2) not null check (taxable_base >= 0), rate numeric(12,8) check (rate >= 0), amount numeric(18,2) not null check (amount >= 0),
  currency text not null check (char_length(currency)=3), calculation_source text not null check (calculation_source in ('yobalelma_indicative','broker','official_authority')),
  status text not null check (status in ('indicative','official_assessed','paid','cancelled')), external_reference text,
  created_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table public.customs_rule_sets (
  id uuid primary key default gen_random_uuid(), country_code text not null check (char_length(country_code)=2), version integer not null check (version > 0),
  name text not null, status text not null default 'draft' check (status in ('draft','approved','retired')), effective_from date not null, effective_to date,
  source_reference text not null, rules jsonb not null default '[]'::jsonb, created_by uuid not null references public.profiles(id),
  approved_by uuid references public.profiles(id), approved_at timestamptz, created_at timestamptz not null default now(), unique(country_code, version),
  check (effective_to is null or effective_to >= effective_from)
);
create table public.customs_hs_suggestions (
  id uuid primary key default gen_random_uuid(), customs_item_id uuid not null references public.customs_items(id) on delete cascade,
  proposed_code text not null check (proposed_code ~ '^\d{6,10}$'), source text not null, confidence numeric(5,4) not null check (confidence between 0 and 1),
  explanation text not null, status text not null default 'suggested' check (status in ('suggested','validated','rejected')),
  created_by uuid references public.profiles(id), validated_by uuid references public.profiles(id), created_at timestamptz not null default now(), validated_at timestamptz
);
create table public.customs_outbox (
  id uuid primary key default gen_random_uuid(), customs_case_id uuid not null references public.customs_cases(id) on delete cascade,
  operation text not null, idempotency_key text not null unique, sanitized_payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','processing','completed','failed','dead_letter')),
  attempt_count integer not null default 0 check (attempt_count between 0 and 12), max_attempts integer not null default 5 check (max_attempts between 1 and 12),
  next_attempt_at timestamptz not null default now(), locked_until timestamptz, lock_token uuid, last_error_code text,
  created_at timestamptz not null default now(), completed_at timestamptz
);

create index customs_cases_queue_idx on public.customs_cases(status, country_scope, created_at);
create index customs_cases_broker_idx on public.customs_cases(broker_id, status) where broker_id is not null;
create index customs_items_case_idx on public.customs_items(customs_case_id);
create index customs_documents_case_idx on public.customs_documents(customs_case_id, status);
create index customs_events_case_idx on public.customs_events(customs_case_id, created_at desc);
create index customs_decisions_case_idx on public.customs_decisions(customs_case_id, created_at desc);
create index customs_outbox_queue_idx on public.customs_outbox(status, next_attempt_at) where status in ('queued','failed');
create unique index customs_official_duty_reference_idx on public.customs_duties(calculation_source,external_reference,duty_type) where external_reference is not null;

create trigger customs_brokers_updated_at before update on public.customs_brokers for each row execute function public.set_updated_at();
create trigger customs_cases_updated_at before update on public.customs_cases for each row execute function public.set_updated_at();
create trigger customs_items_updated_at before update on public.customs_items for each row execute function public.set_updated_at();

create or replace function public.current_user_can_access_customs_case(p_case_id uuid, p_write boolean default false) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.customs_cases c where c.id=p_case_id and (
    public.current_user_has_role(array['super_admin','admin'])
    or (not p_write and public.current_user_has_role(array['auditor','finance_customs_agent']))
    or exists(select 1 from public.governance_staff_assignments a where a.profile_id=auth.uid() and a.active and a.role_id in ('customs_agent','customs_manager','compliance_agent','compliance_manager') and a.country_code in (c.origin_country,c.destination_country,c.country_scope))
    or exists(select 1 from public.customs_broker_agents ba where ba.profile_id=auth.uid() and ba.active and ba.broker_id=c.broker_id)
  ));
$$;

alter table public.customs_brokers enable row level security; alter table public.customs_broker_agents enable row level security;
alter table public.customs_offices enable row level security; alter table public.customs_cases enable row level security;
alter table public.customs_items enable row level security; alter table public.customs_documents enable row level security;
alter table public.customs_events enable row level security; alter table public.customs_decisions enable row level security;
alter table public.customs_duties enable row level security; alter table public.customs_rule_sets enable row level security;
alter table public.customs_hs_suggestions enable row level security; alter table public.customs_outbox enable row level security;

create policy customs_cases_read on public.customs_cases for select using (public.current_user_can_access_customs_case(id,false));
create policy customs_cases_write on public.customs_cases for all using (public.current_user_can_access_customs_case(id,true)) with check (public.current_user_can_access_customs_case(id,true));
create policy customs_items_access on public.customs_items for all using (public.current_user_can_access_customs_case(customs_case_id,false)) with check (public.current_user_can_access_customs_case(customs_case_id,true));
create policy customs_documents_access on public.customs_documents for all using (public.current_user_can_access_customs_case(customs_case_id,false)) with check (public.current_user_can_access_customs_case(customs_case_id,true));
create policy customs_events_read on public.customs_events for select using (public.current_user_can_access_customs_case(customs_case_id,false));
create policy customs_decisions_read on public.customs_decisions for select using (public.current_user_can_access_customs_case(customs_case_id,false));
create policy customs_duties_read on public.customs_duties for select using (public.current_user_can_access_customs_case(customs_case_id,false));
create policy customs_hs_read on public.customs_hs_suggestions for select using (exists(select 1 from public.customs_items i where i.id=customs_item_id and public.current_user_can_access_customs_case(i.customs_case_id,false)));
create policy customs_hs_create on public.customs_hs_suggestions for insert with check (status='suggested' and validated_by is null and validated_at is null and exists(select 1 from public.customs_items i where i.id=customs_item_id and public.current_user_can_access_customs_case(i.customs_case_id,true)));
create policy customs_brokers_read on public.customs_brokers for select using (public.current_user_has_role(array['customs_agent','customs_manager','compliance_agent','compliance_manager','auditor','admin','super_admin']) or exists(select 1 from public.customs_broker_agents a where a.broker_id=id and a.profile_id=auth.uid() and a.active));
create policy customs_brokers_manage on public.customs_brokers for all using (public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin'])) with check (public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin']));
create policy customs_broker_agents_read on public.customs_broker_agents for select using (profile_id=auth.uid() or public.current_user_has_role(array['customs_manager','compliance_manager','auditor','admin','super_admin']));
create policy customs_broker_agents_manage on public.customs_broker_agents for all using (public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin'])) with check (public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin']));
create policy customs_offices_read on public.customs_offices for select using (public.current_user_has_role(array['customs_agent','customs_manager','compliance_agent','compliance_manager','customs_broker','customs_broker_manager','auditor','admin','super_admin']));
create policy customs_offices_manage on public.customs_offices for all using (public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin'])) with check (public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin']));
create policy customs_rules_read on public.customs_rule_sets for select using (public.current_user_has_role(array['customs_agent','customs_manager','compliance_agent','compliance_manager','auditor','admin','super_admin']));
create policy customs_rules_manage on public.customs_rule_sets for all using (public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin'])) with check (public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin']));
create policy customs_outbox_read on public.customs_outbox for select using (public.current_user_has_role(array['customs_manager','compliance_manager','auditor','admin','super_admin']));

create or replace function public.protect_customs_immutable_records() returns trigger language plpgsql set search_path=public as $$
begin
  if tg_op='DELETE' then raise exception 'Official customs records are immutable'; end if;
  if tg_table_name='customs_decisions' and current_setting('app.customs_decision_approval',true)='1' and tg_op='UPDATE' then return new; end if;
  if tg_table_name='customs_duties' and current_setting('app.customs_duty_status_update',true)='1' and tg_op='UPDATE'
    and new.amount=old.amount and new.taxable_base=old.taxable_base and new.rate is not distinct from old.rate
    and new.currency=old.currency and new.calculation_source=old.calculation_source and new.external_reference is not distinct from old.external_reference
  then return new; end if;
  raise exception 'Official customs records are immutable';
end; $$;
create trigger customs_events_immutable before update or delete on public.customs_events for each row execute function public.protect_customs_immutable_records();
create trigger customs_decisions_immutable before update or delete on public.customs_decisions for each row execute function public.protect_customs_immutable_records();
create trigger customs_duties_immutable before update or delete on public.customs_duties for each row execute function public.protect_customs_immutable_records();

create or replace function public.protect_customs_hs_history() returns trigger language plpgsql set search_path=public as $$
begin
  if tg_op='DELETE' then raise exception 'HS classification history is immutable'; end if;
  if current_setting('app.customs_hs_validation',true)='1' then return new; end if;
  raise exception 'HS classification validation function required';
end; $$;
create trigger customs_hs_history_immutable before update or delete on public.customs_hs_suggestions for each row execute function public.protect_customs_hs_history();

create or replace function public.enforce_customs_case_transition() returns trigger language plpgsql set search_path=public as $$
begin
  if new.status='released' and not exists(
    select 1 from public.customs_decisions d where d.customs_case_id=new.id and d.decision_type='release' and d.verified
  ) then raise exception 'Verified customs release decision required'; end if;
  if new.released_at is not null and new.status<>'released' then raise exception 'Release timestamp requires released status'; end if;
  if new.final_duties is distinct from old.final_duties and current_setting('app.customs_official_duty',true)<>'1' then
    raise exception 'Verified official duty function required';
  end if;
  if new.status is distinct from old.status and current_setting('app.customs_privileged_transition',true)<>'1' and not (
    (old.status='draft' and new.status in ('documents_required','documents_under_review','ready_for_submission','cancelled')) or
    (old.status='documents_required' and new.status in ('documents_under_review','cancelled')) or
    (old.status='documents_under_review' and new.status in ('documents_required','ready_for_submission','cancelled')) or
    (old.status='ready_for_submission' and new.status in ('documents_required','cancelled'))
  ) then raise exception 'Controlled customs workflow transition required'; end if;
  return new;
end; $$;
create trigger customs_case_workflow_guard before update on public.customs_cases for each row execute function public.enforce_customs_case_transition();

create or replace function public.create_customs_case(p_shipment_id uuid,p_origin_country text,p_destination_country text,p_regime text,p_customs_office_id uuid,p_declared_value numeric,p_currency text) returns uuid
language plpgsql security definer set search_path=public as $$
declare case_id uuid;
begin
  if auth.uid() is null or not public.current_user_has_role(array['customs_agent','customs_manager','compliance_agent','compliance_manager','admin','super_admin']) then raise exception 'Customs case creation permission required'; end if;
  if not exists(select 1 from public.shipments s where s.id=p_shipment_id) then raise exception 'Shipment unavailable'; end if;
  if char_length(p_origin_country)<>2 or char_length(p_destination_country)<>2 or char_length(p_currency)<>3 or p_declared_value<0 then raise exception 'Invalid customs case data'; end if;
  if not public.current_user_has_role(array['admin','super_admin']) and not exists(select 1 from public.governance_staff_assignments a where a.profile_id=auth.uid() and a.active and a.role_id in ('customs_agent','customs_manager','compliance_agent','compliance_manager') and a.country_code in (upper(p_origin_country),upper(p_destination_country))) then raise exception 'Customs country scope required'; end if;
  insert into public.customs_cases(shipment_id,origin_country,destination_country,regime,customs_office_id,declared_value,currency,country_scope,created_by)
  values(p_shipment_id,upper(p_origin_country),upper(p_destination_country),nullif(trim(p_regime),''),p_customs_office_id,p_declared_value,upper(p_currency),upper(p_origin_country),auth.uid()) returning id into case_id;
  insert into public.customs_events(customs_case_id,event_type,source,verified,sanitized_payload,created_by,processed_at) values(case_id,'case_created','yobalelma',true,'{}',auth.uid(),now());
  return case_id;
end; $$;

create or replace function public.verify_customs_document(p_document_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare d public.customs_documents%rowtype;
begin
  select * into d from public.customs_documents where id=p_document_id for update;
  if d.id is null or not public.current_user_can_access_customs_case(d.customs_case_id,true) then raise exception 'Document unavailable'; end if;
  if d.uploaded_by=auth.uid() then raise exception 'Self verification is forbidden'; end if;
  if not public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin']) then raise exception 'Document verification permission required'; end if;
  if not exists(select 1 from public.secure_uploads u where u.id=d.secure_upload_id and u.security_status='clean' and u.content_sha256=d.checksum) then raise exception 'Document security verification required'; end if;
  update public.customs_documents set status='verified',verified_by=auth.uid(),verified_at=now() where id=d.id;
  insert into public.customs_events(customs_case_id,event_type,source,verified,sanitized_payload,created_by,processed_at) values(d.customs_case_id,'document_verified','yobalelma',true,jsonb_build_object('document_id',d.id),auth.uid(),now());
end; $$;

create or replace function public.record_manual_customs_decision(p_case_id uuid,p_type text,p_reference text,p_authority text,p_reason text,p_effective_at timestamptz,p_proof_document_id uuid) returns uuid
language plpgsql security definer set search_path=public as $$
declare decision_id uuid;
begin
  if not public.current_user_can_access_customs_case(p_case_id,true) then raise exception 'Customs case unavailable'; end if;
  if not public.current_user_has_role(array['customs_agent','customs_manager','compliance_agent','compliance_manager','admin','super_admin']) then raise exception 'Customs decision permission required'; end if;
  if p_type not in ('inspection','release','rejection','suspension','seizure','return') then raise exception 'Invalid customs decision'; end if;
  if length(trim(coalesce(p_reference,'')))<3 or length(trim(coalesce(p_authority,'')))<2 then raise exception 'Official reference and authority required'; end if;
  if p_proof_document_id is null or not exists(select 1 from public.customs_documents d where d.id=p_proof_document_id and d.customs_case_id=p_case_id and d.status='verified') then raise exception 'Verified decision proof required'; end if;
  insert into public.customs_decisions(customs_case_id,decision_type,decision_reference,authority,reason,effective_at,source,verified,proof_document_id,created_by)
  values(p_case_id,p_type,trim(p_reference),trim(p_authority),nullif(trim(p_reason),''),p_effective_at,'manual',false,p_proof_document_id,auth.uid()) returning id into decision_id;
  perform set_config('app.customs_privileged_transition','1',true);
  update public.customs_cases set status=case when p_type='release' then 'release_pending' else 'suspended' end where id=p_case_id;
  insert into public.customs_events(customs_case_id,event_type,source,verified,sanitized_payload,created_by) values(p_case_id,'manual_decision_recorded','manual',false,jsonb_build_object('decision_id',decision_id,'decision_type',p_type),auth.uid());
  return decision_id;
end; $$;

create or replace function public.approve_manual_customs_decision(p_decision_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare d public.customs_decisions%rowtype;
begin
  select * into d from public.customs_decisions where id=p_decision_id for update;
  if d.id is null or d.source<>'manual' or d.verified then raise exception 'Manual decision unavailable'; end if;
  if d.created_by=auth.uid() then raise exception 'Self approval is forbidden'; end if;
  if not public.current_user_can_access_customs_case(d.customs_case_id,true) or not public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin']) then raise exception 'Second approval permission required'; end if;
  if not exists(select 1 from public.customs_documents cd where cd.id=d.proof_document_id and cd.status='verified') then raise exception 'Verified decision proof required'; end if;
  perform set_config('app.customs_decision_approval','1',true);
  update public.customs_decisions set verified=true,second_approved_by=auth.uid(),second_approved_at=now() where id=d.id;
  perform set_config('app.customs_privileged_transition','1',true);
  update public.customs_cases set status=case d.decision_type when 'release' then 'released' when 'inspection' then 'inspection_required' when 'rejection' then 'rejected' when 'seizure' then 'seized' when 'return' then 'returned' else 'suspended' end,
    released_at=case when d.decision_type='release' then now() else released_at end where id=d.customs_case_id;
  insert into public.customs_events(customs_case_id,event_type,source,verified,sanitized_payload,created_by,processed_at) values(d.customs_case_id,'manual_decision_approved','manual',true,jsonb_build_object('decision_id',d.id,'decision_type',d.decision_type),auth.uid(),now());
end; $$;

create or replace function public.shipment_has_verified_customs_release(p_shipment_id uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.customs_cases c join public.customs_decisions d on d.customs_case_id=c.id where c.shipment_id=p_shipment_id and c.status='released' and d.decision_type='release' and d.verified);
$$;

create or replace function public.apply_verified_customs_event(p_case_id uuid,p_provider text,p_external_event_id text,p_event_type text,p_status text,p_sanitized_payload jsonb,p_decision_type text,p_decision_reference text,p_authority text,p_effective_at timestamptz) returns void
language plpgsql security definer set search_path=public as $$
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  if p_provider<>'senegal_customs' then raise exception 'Unsupported official customs provider'; end if;
  if p_status not in ('submitted','accepted','rejected','inspection_required','under_inspection','additional_information_required','duties_assessed','duties_pending_payment','duties_paid','release_pending','released','suspended','seized','returned','cancelled','closed') then raise exception 'Invalid official customs status'; end if;
  if exists(select 1 from public.customs_events where source='official_provider' and external_event_id=p_external_event_id) then return; end if;
  if p_status='released' and (p_decision_type<>'release' or length(trim(coalesce(p_decision_reference,'')))<3 or length(trim(coalesce(p_authority,'')))<2) then raise exception 'Verified official release decision required'; end if;
  insert into public.customs_events(customs_case_id,event_type,source,external_event_id,verified,sanitized_payload,processed_at) values(p_case_id,p_event_type,'official_provider',p_external_event_id,true,coalesce(p_sanitized_payload,'{}'),now());
  if p_decision_type is not null then
    insert into public.customs_decisions(customs_case_id,decision_type,decision_reference,authority,effective_at,source,verified)
    values(p_case_id,p_decision_type,p_decision_reference,p_authority,p_effective_at,'official_provider',true)
    on conflict(source,decision_reference,authority) do nothing;
  end if;
  perform set_config('app.customs_privileged_transition','1',true);
  update public.customs_cases set status=p_status,released_at=case when p_status='released' then now() else released_at end,closed_at=case when p_status='closed' then now() else closed_at end where id=p_case_id;
end; $$;

create or replace function public.assign_customs_broker(p_case_id uuid,p_broker_id uuid,p_reason text) returns void
language plpgsql security definer set search_path=public as $$
declare c public.customs_cases%rowtype;
begin
  select * into c from public.customs_cases where id=p_case_id for update;
  if c.id is null or not public.current_user_can_access_customs_case(c.id,true) or not public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin']) then raise exception 'Broker assignment permission required'; end if;
  if length(trim(coalesce(p_reason,'')))<8 then raise exception 'Broker assignment reason required'; end if;
  if not exists(select 1 from public.customs_brokers b where b.id=p_broker_id and b.status='active' and b.license_country in (c.origin_country,c.destination_country)) then raise exception 'Eligible licensed broker required'; end if;
  update public.customs_cases set broker_id=p_broker_id,customs_provider='licensed_broker' where id=c.id;
  insert into public.customs_events(customs_case_id,event_type,source,verified,sanitized_payload,created_by,processed_at) values(c.id,'broker_assigned','yobalelma',true,jsonb_build_object('broker_id',p_broker_id,'reason',trim(p_reason)),auth.uid(),now());
end; $$;

create or replace function public.approve_customs_rule_set(p_rule_set_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare r public.customs_rule_sets%rowtype;
begin
  select * into r from public.customs_rule_sets where id=p_rule_set_id for update;
  if r.id is null or r.status<>'draft' then raise exception 'Customs rule set unavailable'; end if;
  if r.created_by=auth.uid() then raise exception 'Self approval is forbidden'; end if;
  if not public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin']) then raise exception 'Rule approval permission required'; end if;
  update public.customs_rule_sets set status='retired' where country_code=r.country_code and status='approved';
  update public.customs_rule_sets set status='approved',approved_by=auth.uid(),approved_at=now() where id=r.id;
end; $$;

create or replace function public.validate_customs_hs_suggestion(p_suggestion_id uuid,p_accept boolean,p_reason text) returns void
language plpgsql security definer set search_path=public as $$
declare s public.customs_hs_suggestions%rowtype; item_case uuid;
begin
  select * into s from public.customs_hs_suggestions where id=p_suggestion_id for update;
  select customs_case_id into item_case from public.customs_items where id=s.customs_item_id;
  if s.id is null or s.status<>'suggested' or not public.current_user_can_access_customs_case(item_case,true) then raise exception 'HS suggestion unavailable'; end if;
  if s.created_by=auth.uid() then raise exception 'Self validation is forbidden'; end if;
  if not public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin']) then raise exception 'HS validation permission required'; end if;
  if not p_accept and length(trim(coalesce(p_reason,'')))<8 then raise exception 'HS rejection reason required'; end if;
  perform set_config('app.customs_hs_validation','1',true);
  update public.customs_hs_suggestions set status=case when p_accept then 'validated' else 'rejected' end,validated_by=auth.uid(),validated_at=now() where id=s.id;
  update public.customs_items set hs_code=case when p_accept then s.proposed_code else hs_code end,hs_validation_status=case when p_accept then 'validated' else 'rejected' end where id=s.customs_item_id;
  insert into public.customs_events(customs_case_id,event_type,source,verified,sanitized_payload,created_by,processed_at)
  values(item_case,'hs_suggestion_reviewed','yobalelma',true,jsonb_build_object('suggestion_id',s.id,'accepted',p_accept,'reason',nullif(trim(p_reason),'')),auth.uid(),now());
end; $$;

create or replace function public.record_indicative_customs_duty(p_case_id uuid,p_duty_type text,p_taxable_base numeric,p_rate numeric,p_amount numeric,p_currency text,p_source_reference text) returns uuid
language plpgsql security definer set search_path=public as $$
declare duty_id uuid;
begin
  if not public.current_user_can_access_customs_case(p_case_id,true) then raise exception 'Customs case unavailable'; end if;
  if p_taxable_base<0 or p_rate<0 or p_amount<0 or char_length(p_currency)<>3 or length(trim(coalesce(p_source_reference,'')))<3 then raise exception 'Invalid indicative duty'; end if;
  insert into public.customs_duties(customs_case_id,duty_type,taxable_base,rate,amount,currency,calculation_source,status,external_reference,created_by)
  values(p_case_id,trim(p_duty_type),p_taxable_base,p_rate,p_amount,upper(p_currency),'yobalelma_indicative','indicative',trim(p_source_reference),auth.uid()) returning id into duty_id;
  update public.customs_cases set estimated_duties=(select coalesce(sum(amount),0) from public.customs_duties where customs_case_id=p_case_id and status='indicative') where id=p_case_id;
  insert into public.customs_events(customs_case_id,event_type,source,verified,sanitized_payload,created_by,processed_at)
  values(p_case_id,'indicative_duty_recorded','yobalelma',true,jsonb_build_object('duty_id',duty_id,'official',false),auth.uid(),now());
  return duty_id;
end; $$;

create or replace function public.apply_verified_customs_duty(p_case_id uuid,p_duty_type text,p_taxable_base numeric,p_rate numeric,p_amount numeric,p_currency text,p_official_reference text) returns uuid
language plpgsql security definer set search_path=public as $$
declare duty_id uuid;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  if p_taxable_base<0 or p_rate<0 or p_amount<0 or char_length(p_currency)<>3 or length(trim(coalesce(p_official_reference,'')))<3 then raise exception 'Invalid official duty'; end if;
  insert into public.customs_duties(customs_case_id,duty_type,taxable_base,rate,amount,currency,calculation_source,status,external_reference)
  values(p_case_id,trim(p_duty_type),p_taxable_base,p_rate,p_amount,upper(p_currency),'official_authority','official_assessed',trim(p_official_reference))
  on conflict(calculation_source,external_reference,duty_type) where external_reference is not null do update set duty_type=excluded.duty_type returning id into duty_id;
  perform set_config('app.customs_official_duty','1',true);
  perform set_config('app.customs_privileged_transition','1',true);
  update public.customs_cases set final_duties=(select coalesce(sum(amount),0) from public.customs_duties where customs_case_id=p_case_id and status in ('official_assessed','paid')),status='duties_assessed' where id=p_case_id;
  insert into public.customs_events(customs_case_id,event_type,source,external_event_id,verified,sanitized_payload,processed_at)
  values(p_case_id,'official_duty_assessed','official_provider',trim(p_official_reference)||':'||trim(p_duty_type),true,jsonb_build_object('duty_id',duty_id),now()) on conflict(source,external_event_id) do nothing;
  return duty_id;
end; $$;

create or replace function public.apply_verified_customs_duty_payment(p_case_id uuid,p_official_payment_reference text) returns void
language plpgsql security definer set search_path=public as $$
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  if length(trim(coalesce(p_official_payment_reference,'')))<3 or not exists(select 1 from public.customs_duties where customs_case_id=p_case_id and status='official_assessed') then raise exception 'Verified official duty payment required'; end if;
  perform set_config('app.customs_duty_status_update','1',true);
  update public.customs_duties set status='paid' where customs_case_id=p_case_id and status='official_assessed';
  perform set_config('app.customs_privileged_transition','1',true);
  update public.customs_cases set status='duties_paid' where id=p_case_id;
  insert into public.customs_events(customs_case_id,event_type,source,external_event_id,verified,sanitized_payload,processed_at)
  values(p_case_id,'official_duty_payment_confirmed','official_provider',trim(p_official_payment_reference),true,'{}',now()) on conflict(source,external_event_id) do nothing;
end; $$;

create or replace function public.claim_customs_outbox(p_provider text) returns table(outbox_id uuid,lock_token uuid,operation text,sanitized_payload jsonb,idempotency_key text)
language plpgsql security definer set search_path=public as $$ begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  return query with candidate as (select id from public.customs_outbox where status in ('queued','failed') and next_attempt_at<=now() and (locked_until is null or locked_until<now()) and attempt_count<max_attempts order by created_at for update skip locked limit 1),
  claimed as (update public.customs_outbox o set status='processing',attempt_count=o.attempt_count+1,locked_until=now()+interval '2 minutes',lock_token=gen_random_uuid() from candidate where o.id=candidate.id returning o.id,o.lock_token,o.operation,o.sanitized_payload,o.idempotency_key) select * from claimed;
end; $$;

create or replace function public.complete_customs_outbox(p_outbox_id uuid,p_lock_token uuid,p_success boolean,p_error_code text) returns void
language plpgsql security definer set search_path=public as $$ declare attempts integer; maximum integer; begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  select attempt_count,max_attempts into attempts,maximum from public.customs_outbox where id=p_outbox_id and lock_token=p_lock_token and locked_until>=now() for update;
  if not found then raise exception 'Customs outbox lease invalid'; end if;
  update public.customs_outbox set status=case when p_success then 'completed' when attempts>=maximum then 'dead_letter' else 'failed' end,
    last_error_code=case when p_success then null else coalesce(nullif(p_error_code,''),'PROVIDER_FAILURE') end,
    next_attempt_at=case when not p_success and attempts<maximum then now()+make_interval(secs=>least(900,30*power(2,least(attempts-1,5))::integer)) else next_attempt_at end,
    completed_at=case when p_success then now() else null end,locked_until=null,lock_token=null where id=p_outbox_id;
end; $$;

insert into public.roles(id,name,description,is_internal,is_critical) values
('customs_broker','Agent commissionnaire','Traitement des dossiers attribués à un commissionnaire agréé.',false,true),
('customs_broker_manager','Responsable commissionnaire','Supervision des dossiers attribués à son organisation.',false,true),
('finance_customs_agent','Agent finance douanière','Rapprochement des droits et taxes douaniers.',true,true)
on conflict(id) do update set name=excluded.name,description=excluded.description,is_internal=excluded.is_internal,is_critical=excluded.is_critical,updated_at=now();
insert into public.governance_role_catalog(id,direction_id,service_id,label,responsibility_level) values
('customs_broker','customs','customs_operations','Agent commissionnaire','agent'),('customs_broker_manager','customs','customs_operations','Responsable commissionnaire','manager'),('finance_customs_agent','customs','customs_operations','Agent finance douanière','specialist')
on conflict(id) do update set direction_id=excluded.direction_id,service_id=excluded.service_id,label=excluded.label,responsibility_level=excluded.responsibility_level,updated_at=now();

revoke all on function public.current_user_can_access_customs_case(uuid,boolean) from public; grant execute on function public.current_user_can_access_customs_case(uuid,boolean) to authenticated,service_role;
revoke all on function public.create_customs_case(uuid,text,text,text,uuid,numeric,text) from public; grant execute on function public.create_customs_case(uuid,text,text,text,uuid,numeric,text) to authenticated;
revoke all on function public.verify_customs_document(uuid) from public; grant execute on function public.verify_customs_document(uuid) to authenticated;
revoke all on function public.record_manual_customs_decision(uuid,text,text,text,text,timestamptz,uuid) from public; grant execute on function public.record_manual_customs_decision(uuid,text,text,text,text,timestamptz,uuid) to authenticated;
revoke all on function public.approve_manual_customs_decision(uuid) from public; grant execute on function public.approve_manual_customs_decision(uuid) to authenticated;
revoke all on function public.shipment_has_verified_customs_release(uuid) from public; grant execute on function public.shipment_has_verified_customs_release(uuid) to authenticated,service_role;
revoke all on function public.apply_verified_customs_event(uuid,text,text,text,text,jsonb,text,text,text,timestamptz) from public,anon,authenticated; grant execute on function public.apply_verified_customs_event(uuid,text,text,text,text,jsonb,text,text,text,timestamptz) to service_role;
revoke all on function public.assign_customs_broker(uuid,uuid,text) from public; grant execute on function public.assign_customs_broker(uuid,uuid,text) to authenticated;
revoke all on function public.approve_customs_rule_set(uuid) from public; grant execute on function public.approve_customs_rule_set(uuid) to authenticated;
revoke all on function public.validate_customs_hs_suggestion(uuid,boolean,text) from public; grant execute on function public.validate_customs_hs_suggestion(uuid,boolean,text) to authenticated;
revoke all on function public.record_indicative_customs_duty(uuid,text,numeric,numeric,numeric,text,text) from public; grant execute on function public.record_indicative_customs_duty(uuid,text,numeric,numeric,numeric,text,text) to authenticated;
revoke all on function public.apply_verified_customs_duty(uuid,text,numeric,numeric,numeric,text,text) from public,anon,authenticated; grant execute on function public.apply_verified_customs_duty(uuid,text,numeric,numeric,numeric,text,text) to service_role;
revoke all on function public.apply_verified_customs_duty_payment(uuid,text) from public,anon,authenticated; grant execute on function public.apply_verified_customs_duty_payment(uuid,text) to service_role;
revoke all on function public.claim_customs_outbox(text) from public,anon,authenticated; grant execute on function public.claim_customs_outbox(text) to service_role;
revoke all on function public.complete_customs_outbox(uuid,uuid,boolean,text) from public,anon,authenticated; grant execute on function public.complete_customs_outbox(uuid,uuid,boolean,text) to service_role;
