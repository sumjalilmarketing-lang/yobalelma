-- Operational intelligence persistence. Computation remains advisory and fail-closed.
create table public.operational_ai_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null,
  version integer not null check(version>0),
  country_code text not null check(char_length(country_code)=2),
  city text,
  partner_id uuid references public.profiles(id) on delete set null,
  parcel_type text,
  risk_level text,
  enabled boolean not null default true,
  method text not null default 'business_rule' check(method='business_rule'),
  definition jsonb not null,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique(rule_key,version,country_code,city,partner_id,parcel_type,risk_level),
  check(not enabled or (approved_by is not null and approved_at is not null))
);

create table public.operational_ai_feature_snapshots (
  id uuid primary key default gen_random_uuid(),
  country_code text not null check(char_length(country_code)=2),
  entity_type text not null,
  entity_id text not null,
  feature_key text not null,
  feature_value jsonb,
  source_table text not null,
  observed_at timestamptz not null,
  maximum_age_seconds integer not null check(maximum_age_seconds>0),
  confidence numeric(5,2) not null check(confidence between 0 and 100),
  owner_role text not null,
  validation_status text not null check(validation_status in ('validated','unverified','rejected')),
  created_at timestamptz not null default now()
);
create index operational_ai_features_entity_idx on public.operational_ai_feature_snapshots(country_code,entity_type,entity_id,observed_at desc);

create table public.operational_ai_model_registry (
  id uuid primary key default gen_random_uuid(),
  country_code text not null check(char_length(country_code)=2),
  model_key text not null,
  version text not null,
  method text not null check(method in ('heuristic','calculation','statistic','predictive_model','simulation','anomaly_detection')),
  status text not null check(status in ('draft','validation','approved','disabled','retired')),
  training_data_lineage jsonb not null default '[]',
  minimum_sample_size integer not null default 0 check(minimum_sample_size>=0),
  measured_sample_size integer not null default 0 check(measured_sample_size>=0),
  limitations jsonb not null default '[]',
  metrics jsonb not null default '{}',
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique(country_code,model_key,version),
  check(status<>'approved' or (approved_by is not null and approved_at is not null))
);

create table public.operational_ai_analyses (
  id uuid primary key default gen_random_uuid(),
  country_code text not null check(char_length(country_code)=2),
  analysis_type text not null,
  method text not null check(method in ('business_rule','heuristic','calculation','statistic','predictive_model','simulation','anomaly_detection')),
  entity_type text not null,
  entity_id text not null,
  severity text not null check(severity in ('info','warning','critical')),
  score numeric(5,2) check(score between 0 and 100),
  explanation jsonb not null,
  source_refs jsonb not null default '[]',
  missing_data jsonb not null default '[]',
  model_registry_id uuid references public.operational_ai_model_registry(id),
  rule_id uuid references public.operational_ai_rules(id),
  observed_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index operational_ai_analyses_queue_idx on public.operational_ai_analyses(country_code,severity,expires_at);

create table public.operational_ai_recommendation_workflow (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.control_tower_recommendations(id) on delete cascade,
  country_code text not null check(char_length(country_code)=2),
  status text not null check(status in ('created','analysed','proposed','pending','approved','rejected','modified','executed','verified','closed')),
  allowed_roles text[] not null,
  sensitive boolean not null default true,
  actor_id uuid references public.profiles(id),
  justification text,
  source_refs jsonb not null default '[]',
  result jsonb,
  actual_impact jsonb,
  prediction_delta jsonb,
  created_at timestamptz not null default now()
);
create index operational_ai_workflow_history_idx on public.operational_ai_recommendation_workflow(recommendation_id,created_at);

create table public.operational_ai_simulations (
  id uuid primary key default gen_random_uuid(),
  country_code text not null check(char_length(country_code)=2),
  scenario_type text not null,
  baseline_snapshot jsonb not null,
  assumptions jsonb not null,
  result jsonb not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check(coalesce((result->>'read_only')::boolean,false))
);

create table public.operational_ai_feedback (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.control_tower_recommendations(id) on delete cascade,
  country_code text not null check(char_length(country_code)=2),
  outcome text not null check(outcome in ('accepted','rejected','corrected')),
  reason text not null check(length(trim(reason))>=8),
  actual_gain numeric,
  actual_delay_minutes integer,
  satisfaction smallint check(satisfaction between 1 and 5),
  human_correction text,
  submitted_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.operational_ai_monitoring (
  id uuid primary key default gen_random_uuid(),
  country_code text not null check(char_length(country_code)=2),
  module text not null,
  model_version text,
  window_started_at timestamptz not null,
  window_ended_at timestamptz not null,
  latency_p50_ms integer,
  latency_p95_ms integer,
  latency_p99_ms integer,
  error_rate numeric(8,5),
  availability numeric(8,5),
  missing_data_rate numeric(8,5),
  rejection_rate numeric(8,5),
  false_positive_rate numeric(8,5),
  false_negative_rate numeric(8,5),
  drift_score numeric(8,5),
  inference_cost numeric,
  alert_status text not null default 'nominal' check(alert_status in ('nominal','warning','critical','unavailable')),
  created_at timestamptz not null default now(),
  check(window_ended_at>=window_started_at)
);

create table public.operational_ai_audit_log (
  id uuid primary key default gen_random_uuid(),
  country_code text not null check(char_length(country_code)=2),
  actor_id uuid references public.profiles(id),
  action text not null,
  object_type text not null,
  object_id text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.operational_ai_rules enable row level security;
alter table public.operational_ai_feature_snapshots enable row level security;
alter table public.operational_ai_model_registry enable row level security;
alter table public.operational_ai_analyses enable row level security;
alter table public.operational_ai_recommendation_workflow enable row level security;
alter table public.operational_ai_simulations enable row level security;
alter table public.operational_ai_feedback enable row level security;
alter table public.operational_ai_monitoring enable row level security;
alter table public.operational_ai_audit_log enable row level security;

create policy operational_ai_rules_read on public.operational_ai_rules for select using(public.current_user_has_control_tower_country(country_code));
create policy operational_ai_features_read on public.operational_ai_feature_snapshots for select using(public.current_user_has_control_tower_country(country_code));
create policy operational_ai_models_read on public.operational_ai_model_registry for select using(public.current_user_has_control_tower_country(country_code));
create policy operational_ai_analyses_read on public.operational_ai_analyses for select using(public.current_user_has_control_tower_country(country_code));
create policy operational_ai_workflow_read on public.operational_ai_recommendation_workflow for select using(public.current_user_has_control_tower_country(country_code));
create policy operational_ai_simulations_read on public.operational_ai_simulations for select using(public.current_user_has_control_tower_country(country_code));
create policy operational_ai_feedback_read on public.operational_ai_feedback for select using(public.current_user_has_control_tower_country(country_code));
create policy operational_ai_monitoring_read on public.operational_ai_monitoring for select using(public.current_user_has_control_tower_country(country_code));
create policy operational_ai_audit_read on public.operational_ai_audit_log for select using(public.current_user_has_control_tower_country(country_code));

-- All ingestion and model/rule activation remain service-only. No direct client write policy exists.
grant select on public.operational_ai_rules,public.operational_ai_feature_snapshots,public.operational_ai_model_registry,public.operational_ai_analyses,public.operational_ai_recommendation_workflow,public.operational_ai_simulations,public.operational_ai_feedback,public.operational_ai_monitoring,public.operational_ai_audit_log to authenticated;
grant all on public.operational_ai_rules,public.operational_ai_feature_snapshots,public.operational_ai_model_registry,public.operational_ai_analyses,public.operational_ai_recommendation_workflow,public.operational_ai_simulations,public.operational_ai_feedback,public.operational_ai_monitoring,public.operational_ai_audit_log to service_role;

create or replace function public.record_operational_ai_decision(
  p_recommendation_id uuid,
  p_country_code text,
  p_status text,
  p_allowed_roles text[],
  p_justification text
) returns uuid language plpgsql security definer set search_path=public as $$
declare
  v_previous text;
  v_id uuid;
  v_role_allowed boolean;
begin
  if not public.current_user_has_control_tower_country(upper(p_country_code)) then raise exception 'Country scope denied'; end if;
  if p_status not in ('approved','rejected','modified') then raise exception 'Human decision required'; end if;
  if length(trim(coalesce(p_justification,'')))<8 then raise exception 'Decision justification required'; end if;
  select status into v_previous from public.operational_ai_recommendation_workflow
    where recommendation_id=p_recommendation_id order by created_at desc limit 1 for update;
  if v_previous is distinct from 'pending' then raise exception 'Recommendation is not pending'; end if;
  select exists(
    select 1 from public.governance_staff_assignments a
    where a.profile_id=auth.uid() and a.active and a.country_code=upper(p_country_code) and a.role_id=any(p_allowed_roles)
  ) or public.current_user_has_role(array['admin','super_admin']) into v_role_allowed;
  if not v_role_allowed then raise exception 'Role denied'; end if;
  insert into public.operational_ai_recommendation_workflow(recommendation_id,country_code,status,allowed_roles,sensitive,actor_id,justification)
    values(p_recommendation_id,upper(p_country_code),p_status,p_allowed_roles,true,auth.uid(),trim(p_justification)) returning id into v_id;
  insert into public.operational_ai_audit_log(country_code,actor_id,action,object_type,object_id,metadata)
    values(upper(p_country_code),auth.uid(),p_status,'recommendation',p_recommendation_id::text,jsonb_build_object('justification',trim(p_justification)));
  return v_id;
end $$;
revoke all on function public.record_operational_ai_decision(uuid,text,text,text[],text) from public,anon;
grant execute on function public.record_operational_ai_decision(uuid,text,text,text[],text) to authenticated;

comment on table public.operational_ai_model_registry is 'Registry only; production retraining is never automatic.';
comment on table public.operational_ai_simulations is 'Read-only counterfactual artifacts; never applied to operational state.';
