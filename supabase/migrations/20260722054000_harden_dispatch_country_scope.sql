alter table public.dispatch_recommendations
  drop constraint if exists dispatch_recommendations_mission_id_candidate_profile_id_status_key;

create unique index if not exists dispatch_recommendations_one_active_candidate_idx
  on public.dispatch_recommendations(mission_id, candidate_profile_id)
  where status = 'proposed';

create or replace function public.current_user_has_dispatch_country(p_country_code text) returns boolean
language sql stable security definer set search_path=public as $$
  select public.current_user_has_role(array['admin','super_admin']) or exists(
    select 1
    from public.governance_staff_assignments a
    where a.profile_id=auth.uid()
      and a.active
      and a.country_code=upper(p_country_code)
      and a.role_id in ('operations_manager','dispatch_manager','local_delivery_manager')
  );
$$;
revoke all on function public.current_user_has_dispatch_country(text) from public;
grant execute on function public.current_user_has_dispatch_country(text) to authenticated,service_role;

drop policy if exists dispatch_rules_read on public.dispatch_rule_sets;
drop policy if exists dispatch_rules_create on public.dispatch_rule_sets;
drop policy if exists dispatch_rules_update_draft on public.dispatch_rule_sets;
create policy dispatch_rules_read on public.dispatch_rule_sets for select using (
  public.current_user_has_role(array['admin','super_admin','auditor'])
  or public.current_user_has_dispatch_country(country_code)
);
create policy dispatch_rules_create on public.dispatch_rule_sets for insert with check (
  status='draft' and created_by=auth.uid() and public.current_user_has_dispatch_country(country_code)
);
create policy dispatch_rules_update_draft on public.dispatch_rule_sets for update using (
  status='draft' and created_by=auth.uid() and public.current_user_has_dispatch_country(country_code)
) with check (
  status='draft' and approved_by is null and public.current_user_has_dispatch_country(country_code)
);

create or replace function public.approve_dispatch_rule_set(p_rule_set_id uuid) returns void
language plpgsql security definer set search_path=public as $$
declare r public.dispatch_rule_sets%rowtype;
begin
  select * into r from public.dispatch_rule_sets where id=p_rule_set_id for update;
  if r.id is null or r.status<>'draft' then raise exception 'Dispatch rule set unavailable'; end if;
  if r.created_by=auth.uid() then raise exception 'Self approval is forbidden'; end if;
  if not public.current_user_has_dispatch_country(r.country_code) then raise exception 'Dispatch approval country scope required'; end if;
  update public.dispatch_rule_sets set status='retired'
    where country_code=r.country_code and city is not distinct from r.city and status='active';
  update public.dispatch_rule_sets set status='active',approved_by=auth.uid(),approved_at=now() where id=r.id;
end; $$;

create or replace function public.approve_dispatch_recommendation(p_recommendation_id uuid,p_reason text) returns void
language plpgsql security definer set search_path=public as $$
declare
  r public.dispatch_recommendations%rowtype;
  current_mission public.local_delivery_missions%rowtype;
  shipment_country text;
  assigned_mission_id uuid;
begin
  select * into r from public.dispatch_recommendations where id=p_recommendation_id for update;
  if r.id is null or r.status<>'proposed' or r.expires_at<=now() then raise exception 'Dispatch recommendation unavailable'; end if;
  if length(trim(coalesce(p_reason,'')))<5 then raise exception 'Dispatch approval reason required'; end if;
  select * into current_mission from public.local_delivery_missions where id=r.mission_id for update;
  select origin_country into shipment_country from public.shipments where id=current_mission.shipment_id;
  if not public.current_user_has_dispatch_country(shipment_country) then raise exception 'Dispatch approval country scope required'; end if;
  update public.dispatch_recommendations set status='assigned',approved_by=auth.uid(),approved_at=now() where id=r.id;
  if current_mission.transporter_id=r.candidate_profile_id then
    update public.local_delivery_missions set status='offered',score=r.score::integer,reason=r.reasons,offered_at=now()
      where id=r.mission_id returning id into assigned_mission_id;
  else
    update public.local_delivery_missions set status='cancelled' where id=current_mission.id;
    insert into public.local_delivery_missions(shipment_id,transporter_id,status,score,reason,offered_at)
      values(current_mission.shipment_id,r.candidate_profile_id,'offered',r.score::integer,r.reasons,now())
      on conflict(shipment_id,transporter_id) do update set status='offered',score=excluded.score,reason=excluded.reason,offered_at=now()
      returning id into assigned_mission_id;
  end if;
  update public.dispatch_recommendations set status='rejected' where mission_id=r.mission_id and id<>r.id and status='proposed';
  insert into public.dispatch_recommendation_events(mission_id,recommendation_id,event_type,actor_id,reason,sanitized_metadata)
    values(r.mission_id,r.id,'recommendation_approved',auth.uid(),trim(p_reason),jsonb_build_object('assigned_mission_id',assigned_mission_id));
end; $$;

revoke all on function public.approve_dispatch_rule_set(uuid) from public;
grant execute on function public.approve_dispatch_rule_set(uuid) to authenticated;
revoke all on function public.approve_dispatch_recommendation(uuid,text) from public;
grant execute on function public.approve_dispatch_recommendation(uuid,text) to authenticated;
