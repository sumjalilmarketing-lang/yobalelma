drop policy if exists customs_cases_write on public.customs_cases;
drop policy if exists customs_items_access on public.customs_items;
drop policy if exists customs_documents_access on public.customs_documents;
drop policy if exists customs_rules_manage on public.customs_rule_sets;

create policy customs_cases_update on public.customs_cases for update using (public.current_user_can_access_customs_case(id,true)) with check (public.current_user_can_access_customs_case(id,true));
create policy customs_items_read on public.customs_items for select using (public.current_user_can_access_customs_case(customs_case_id,false));
create policy customs_items_create on public.customs_items for insert with check (public.current_user_can_access_customs_case(customs_case_id,true));
create policy customs_items_update on public.customs_items for update using (public.current_user_can_access_customs_case(customs_case_id,true)) with check (public.current_user_can_access_customs_case(customs_case_id,true));
create policy customs_documents_read on public.customs_documents for select using (public.current_user_can_access_customs_case(customs_case_id,false));
create policy customs_documents_create on public.customs_documents for insert with check (status='pending' and uploaded_by=auth.uid() and public.current_user_can_access_customs_case(customs_case_id,true));
create policy customs_documents_update on public.customs_documents for update using (public.current_user_can_access_customs_case(customs_case_id,true)) with check (public.current_user_can_access_customs_case(customs_case_id,true));
create policy customs_rules_create on public.customs_rule_sets for insert with check (status='draft' and created_by=auth.uid() and public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin']));
create policy customs_rules_update on public.customs_rule_sets for update using (status='draft' and created_by=auth.uid() and public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin'])) with check (status='draft' and approved_by is null and approved_at is null and public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin']));

create or replace function public.enforce_customs_case_transition() returns trigger language plpgsql set search_path=public as $$
begin
  if new.origin_country<>old.origin_country or new.destination_country<>old.destination_country or new.country_scope<>old.country_scope or new.shipment_id<>old.shipment_id then
    raise exception 'Customs case scope is immutable';
  end if;
  if (new.customs_provider is distinct from old.customs_provider or new.broker_id is distinct from old.broker_id or new.declaration_reference is distinct from old.declaration_reference or new.external_reference is distinct from old.external_reference)
    and current_setting('app.customs_sensitive_update',true)<>'1' then raise exception 'Controlled customs update required'; end if;
  if new.status='released' and not exists(select 1 from public.customs_decisions d where d.customs_case_id=new.id and d.decision_type='release' and d.verified) then raise exception 'Verified customs release decision required'; end if;
  if new.released_at is not null and new.status<>'released' then raise exception 'Release timestamp requires released status'; end if;
  if new.final_duties is distinct from old.final_duties and current_setting('app.customs_official_duty',true)<>'1' then raise exception 'Verified official duty function required'; end if;
  if new.status is distinct from old.status and current_setting('app.customs_privileged_transition',true)<>'1' and not (
    (old.status='draft' and new.status in ('documents_required','documents_under_review','ready_for_submission','cancelled')) or
    (old.status='documents_required' and new.status in ('documents_under_review','cancelled')) or
    (old.status='documents_under_review' and new.status in ('documents_required','ready_for_submission','cancelled')) or
    (old.status='ready_for_submission' and new.status in ('documents_required','cancelled'))
  ) then raise exception 'Controlled customs workflow transition required'; end if;
  return new;
end; $$;

create or replace function public.protect_customs_working_records() returns trigger language plpgsql set search_path=public as $$
declare case_status text;
begin
  if tg_op='DELETE' then raise exception 'Customs history cannot be deleted'; end if;
  if tg_table_name='customs_documents' and current_setting('app.customs_document_verification',true)='1' then return new; end if;
  select c.status into case_status from public.customs_cases c where c.id=old.customs_case_id;
  if case_status not in ('draft','documents_required','documents_under_review','ready_for_submission') then raise exception 'Submitted customs records are immutable'; end if;
  if tg_table_name='customs_documents' and old.status<>'pending' then raise exception 'Verified customs documents are immutable'; end if;
  return new;
end; $$;
create trigger customs_items_history_guard before update or delete on public.customs_items for each row execute function public.protect_customs_working_records();
create trigger customs_documents_history_guard before update or delete on public.customs_documents for each row execute function public.protect_customs_working_records();

create or replace function public.protect_customs_rule_history() returns trigger language plpgsql set search_path=public as $$
begin
  if tg_op='DELETE' then raise exception 'Customs rule history cannot be deleted'; end if;
  if current_setting('app.customs_rule_approval',true)='1' then return new; end if;
  if old.status<>'draft' then raise exception 'Approved customs rules are immutable'; end if;
  return new;
end; $$;
create trigger customs_rule_history_guard before update or delete on public.customs_rule_sets for each row execute function public.protect_customs_rule_history();

create or replace function public.verify_customs_document(p_document_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare d public.customs_documents%rowtype;
begin
  select * into d from public.customs_documents where id=p_document_id for update;
  if d.id is null or not public.current_user_can_access_customs_case(d.customs_case_id,true) then raise exception 'Document unavailable'; end if;
  if d.uploaded_by=auth.uid() then raise exception 'Self verification is forbidden'; end if;
  if not public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin']) then raise exception 'Document verification permission required'; end if;
  if not exists(select 1 from public.secure_uploads u where u.id=d.secure_upload_id and u.security_status='clean' and u.content_sha256=d.checksum) then raise exception 'Document security verification required'; end if;
  perform set_config('app.customs_document_verification','1',true);
  update public.customs_documents set status='verified',verified_by=auth.uid(),verified_at=now() where id=d.id;
  insert into public.customs_events(customs_case_id,event_type,source,verified,sanitized_payload,created_by,processed_at) values(d.customs_case_id,'document_verified','yobalelma',true,jsonb_build_object('document_id',d.id),auth.uid(),now());
end; $$;

create or replace function public.assign_customs_broker(p_case_id uuid,p_broker_id uuid,p_reason text) returns void language plpgsql security definer set search_path=public as $$
declare c public.customs_cases%rowtype;
begin
  select * into c from public.customs_cases where id=p_case_id for update;
  if c.id is null or not public.current_user_can_access_customs_case(c.id,true) or not public.current_user_has_role(array['customs_manager','compliance_manager','admin','super_admin']) then raise exception 'Broker assignment permission required'; end if;
  if length(trim(coalesce(p_reason,'')))<8 then raise exception 'Broker assignment reason required'; end if;
  if not exists(select 1 from public.customs_brokers b where b.id=p_broker_id and b.status='active' and b.license_country in (c.origin_country,c.destination_country)) then raise exception 'Eligible licensed broker required'; end if;
  perform set_config('app.customs_sensitive_update','1',true);
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
  perform set_config('app.customs_rule_approval','1',true);
  update public.customs_rule_sets set status='retired' where country_code=r.country_code and status='approved';
  update public.customs_rule_sets set status='approved',approved_by=auth.uid(),approved_at=now() where id=r.id;
end; $$;
