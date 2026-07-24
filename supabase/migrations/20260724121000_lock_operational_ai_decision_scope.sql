-- Never trust role or country authorization metadata supplied by a decision client.
revoke all on function public.record_operational_ai_decision(uuid,text,text,text[],text) from public,anon,authenticated,service_role;
drop function public.record_operational_ai_decision(uuid,text,text,text[],text);

create or replace function public.record_operational_ai_decision(
  p_recommendation_id uuid,
  p_status text,
  p_justification text
) returns uuid language plpgsql security definer set search_path=public as $$
declare
  v_previous text;
  v_country_code text;
  v_allowed_roles text[];
  v_id uuid;
  v_role_allowed boolean;
begin
  if p_status not in ('approved','rejected','modified') then raise exception 'Human decision required'; end if;
  if length(trim(coalesce(p_justification,'')))<8 then raise exception 'Decision justification required'; end if;

  select w.status,w.country_code,w.allowed_roles
    into v_previous,v_country_code,v_allowed_roles
  from public.operational_ai_recommendation_workflow w
  join public.control_tower_recommendations r
    on r.id=w.recommendation_id and r.country_code=w.country_code
  where w.recommendation_id=p_recommendation_id
  order by w.created_at desc
  limit 1
  for update of w;

  if v_previous is distinct from 'pending' then raise exception 'Recommendation is not pending'; end if;
  if not public.current_user_has_control_tower_country(v_country_code) then raise exception 'Country scope denied'; end if;
  select exists(
    select 1 from public.governance_staff_assignments a
    where a.profile_id=auth.uid() and a.active and a.country_code=v_country_code and a.role_id=any(v_allowed_roles)
  ) or public.current_user_has_role(array['admin','super_admin']) into v_role_allowed;
  if not v_role_allowed then raise exception 'Role denied'; end if;

  insert into public.operational_ai_recommendation_workflow(
    recommendation_id,country_code,status,allowed_roles,sensitive,actor_id,justification
  ) values(
    p_recommendation_id,v_country_code,p_status,v_allowed_roles,true,auth.uid(),trim(p_justification)
  ) returning id into v_id;
  insert into public.operational_ai_audit_log(country_code,actor_id,action,object_type,object_id,metadata)
    values(v_country_code,auth.uid(),p_status,'recommendation',p_recommendation_id::text,jsonb_build_object('justification',trim(p_justification)));
  return v_id;
end $$;
revoke all on function public.record_operational_ai_decision(uuid,text,text) from public,anon;
grant execute on function public.record_operational_ai_decision(uuid,text,text) to authenticated;
