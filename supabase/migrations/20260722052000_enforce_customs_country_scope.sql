create or replace function public.current_user_has_customs_country(p_country_code text,p_manager boolean default false) returns boolean
language sql stable security definer set search_path=public as $$
  select public.current_user_has_role(array['admin','super_admin']) or exists(
    select 1 from public.governance_staff_assignments a where a.profile_id=auth.uid() and a.active and a.country_code=upper(p_country_code)
      and a.role_id = any(case when p_manager then array['customs_manager','compliance_manager']::text[] else array['customs_agent','customs_manager','compliance_agent','compliance_manager']::text[] end)
  );
$$;
revoke all on function public.current_user_has_customs_country(text,boolean) from public;
grant execute on function public.current_user_has_customs_country(text,boolean) to authenticated,service_role;

drop policy if exists customs_hs_create on public.customs_hs_suggestions;
create policy customs_hs_create on public.customs_hs_suggestions for insert with check (
  status='suggested' and created_by=auth.uid() and validated_by is null and validated_at is null
  and exists(select 1 from public.customs_items i where i.id=customs_item_id and public.current_user_can_access_customs_case(i.customs_case_id,true))
);

drop policy if exists customs_brokers_read on public.customs_brokers;
drop policy if exists customs_brokers_manage on public.customs_brokers;
create policy customs_brokers_read on public.customs_brokers for select using (
  public.current_user_has_role(array['admin','super_admin','auditor']) or public.current_user_has_customs_country(license_country,false)
  or exists(select 1 from public.customs_broker_agents a where a.broker_id=id and a.profile_id=auth.uid() and a.active)
);
create policy customs_brokers_manage on public.customs_brokers for all using (public.current_user_has_customs_country(license_country,true)) with check (public.current_user_has_customs_country(license_country,true));

drop policy if exists customs_offices_read on public.customs_offices;
drop policy if exists customs_offices_manage on public.customs_offices;
create policy customs_offices_read on public.customs_offices for select using (
  public.current_user_has_role(array['admin','super_admin','auditor']) or public.current_user_has_customs_country(country_code,false)
  or exists(select 1 from public.customs_broker_agents a join public.customs_brokers b on b.id=a.broker_id where a.profile_id=auth.uid() and a.active and b.license_country=country_code)
);
create policy customs_offices_manage on public.customs_offices for all using (public.current_user_has_customs_country(country_code,true)) with check (public.current_user_has_customs_country(country_code,true));

drop policy if exists customs_rules_read on public.customs_rule_sets;
drop policy if exists customs_rules_create on public.customs_rule_sets;
drop policy if exists customs_rules_update on public.customs_rule_sets;
create policy customs_rules_read on public.customs_rule_sets for select using (public.current_user_has_role(array['admin','super_admin','auditor']) or public.current_user_has_customs_country(country_code,false));
create policy customs_rules_create on public.customs_rule_sets for insert with check (status='draft' and created_by=auth.uid() and public.current_user_has_customs_country(country_code,true));
create policy customs_rules_update on public.customs_rule_sets for update using (status='draft' and created_by=auth.uid() and public.current_user_has_customs_country(country_code,true)) with check (status='draft' and approved_by is null and approved_at is null and public.current_user_has_customs_country(country_code,true));

create or replace function public.approve_customs_rule_set(p_rule_set_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare r public.customs_rule_sets%rowtype;
begin
  select * into r from public.customs_rule_sets where id=p_rule_set_id for update;
  if r.id is null or r.status<>'draft' then raise exception 'Customs rule set unavailable'; end if;
  if r.created_by=auth.uid() then raise exception 'Self approval is forbidden'; end if;
  if not public.current_user_has_customs_country(r.country_code,true) then raise exception 'Rule approval country scope required'; end if;
  perform set_config('app.customs_rule_approval','1',true);
  update public.customs_rule_sets set status='retired' where country_code=r.country_code and status='approved';
  update public.customs_rule_sets set status='approved',approved_by=auth.uid(),approved_at=now() where id=r.id;
end; $$;

create or replace function public.record_indicative_customs_duty(p_case_id uuid,p_duty_type text,p_taxable_base numeric,p_rate numeric,p_amount numeric,p_currency text,p_source_reference text) returns uuid
language plpgsql security definer set search_path=public as $$
declare duty_id uuid;
begin
  if not public.current_user_can_access_customs_case(p_case_id,true) or not public.current_user_has_role(array['customs_agent','customs_manager','compliance_agent','compliance_manager','admin','super_admin']) then raise exception 'Indicative duty permission required'; end if;
  if p_taxable_base<0 or p_rate<0 or p_amount<0 or char_length(p_currency)<>3 or length(trim(coalesce(p_source_reference,'')))<3 then raise exception 'Invalid indicative duty'; end if;
  insert into public.customs_duties(customs_case_id,duty_type,taxable_base,rate,amount,currency,calculation_source,status,external_reference,created_by)
  values(p_case_id,trim(p_duty_type),p_taxable_base,p_rate,p_amount,upper(p_currency),'yobalelma_indicative','indicative',trim(p_source_reference),auth.uid()) returning id into duty_id;
  update public.customs_cases set estimated_duties=(select coalesce(sum(amount),0) from public.customs_duties where customs_case_id=p_case_id and status='indicative') where id=p_case_id;
  insert into public.customs_events(customs_case_id,event_type,source,verified,sanitized_payload,created_by,processed_at)
  values(p_case_id,'indicative_duty_recorded','yobalelma',true,jsonb_build_object('duty_id',duty_id,'official',false),auth.uid(),now());
  return duty_id;
end; $$;
