create extension if not exists pgcrypto;

create table if not exists public.governance_directions (
  id text primary key,
  slug text not null unique,
  label text not null,
  description text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.governance_services (
  id text primary key,
  direction_id text not null references public.governance_directions(id) on delete restrict,
  label text not null,
  mission_label text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.governance_role_catalog (
  id text primary key references public.roles(id) on delete cascade,
  direction_id text not null references public.governance_directions(id) on delete restrict,
  service_id text not null references public.governance_services(id) on delete restrict,
  label text not null,
  responsibility_level text not null check (responsibility_level in ('executive','manager','supervisor','agent','specialist','auditor')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.governance_organizations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  organization_type text not null default 'yobalelma',
  country_code text not null default 'SN' check (char_length(country_code) = 2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.governance_teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.governance_organizations(id) on delete cascade,
  service_id text not null references public.governance_services(id) on delete restrict,
  code text not null,
  name text not null,
  country_code text not null default 'SN' check (char_length(country_code) = 2),
  region_code text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists public.governance_operational_zones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.governance_organizations(id) on delete cascade,
  code text not null,
  name text not null,
  country_code text not null default 'SN' check (char_length(country_code) = 2),
  region_code text,
  geometry jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists public.governance_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null,
  email text not null,
  role_id text not null references public.governance_role_catalog(id) on delete restrict,
  direction_id text not null references public.governance_directions(id) on delete restrict,
  service_id text not null references public.governance_services(id) on delete restrict,
  country_code text not null check (char_length(country_code) = 2),
  region_code text,
  organization_id uuid references public.governance_organizations(id) on delete restrict,
  hub_id uuid references public.airport_hubs(id) on delete restrict,
  relay_point_id uuid references public.relay_points(id) on delete restrict,
  team_id uuid references public.governance_teams(id) on delete restrict,
  operational_zone_id uuid references public.governance_operational_zones(id) on delete restrict,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  active boolean not null default true,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create unique index if not exists governance_staff_active_role_scope_idx on public.governance_staff_assignments (
  profile_id, role_id, country_code, coalesce(region_code, ''), coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(hub_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(relay_point_id, '00000000-0000-0000-0000-000000000000'::uuid)
) where active;

create table if not exists public.governance_workflow_definitions (
  id uuid primary key default gen_random_uuid(),
  workflow_key text not null,
  version integer not null check (version > 0),
  label text not null,
  direction_id text not null references public.governance_directions(id) on delete restrict,
  service_id text not null references public.governance_services(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','active','retired')),
  description text,
  published_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workflow_key, version)
);

create unique index if not exists governance_workflow_one_active_idx on public.governance_workflow_definitions(workflow_key) where status = 'active';

create table if not exists public.governance_workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_definition_id uuid not null references public.governance_workflow_definitions(id) on delete cascade,
  step_key text not null,
  position integer not null check (position > 0),
  label text not null,
  owner_role_ids text[] not null default '{}',
  sla_minutes integer not null check (sla_minutes > 0),
  required_validation boolean not null default false,
  required_proof_types text[] not null default '{}',
  entry_conditions jsonb not null default '{}'::jsonb,
  completion_conditions jsonb not null default '{}'::jsonb,
  escalation_policy jsonb not null default '{}'::jsonb,
  notification_policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workflow_definition_id, step_key),
  unique (workflow_definition_id, position)
);

create table if not exists public.governance_workflow_transitions (
  id uuid primary key default gen_random_uuid(),
  workflow_definition_id uuid not null references public.governance_workflow_definitions(id) on delete cascade,
  from_step_key text not null,
  to_step_key text not null,
  action_key text not null,
  allowed_role_ids text[] not null default '{}',
  conditions jsonb not null default '{}'::jsonb,
  requires_all_proofs boolean not null default true,
  created_at timestamptz not null default now(),
  unique (workflow_definition_id, from_step_key, action_key)
);

create table if not exists public.governance_missions (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  workflow_key text not null,
  workflow_definition_id uuid references public.governance_workflow_definitions(id) on delete restrict,
  direction_id text not null references public.governance_directions(id) on delete restrict,
  service_id text not null references public.governance_services(id) on delete restrict,
  title text not null,
  description text not null,
  status text not null default 'draft' check (status in ('draft','assigned','in_progress','awaiting_validation','correction_required','validated','closed','cancelled')),
  current_step_key text,
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  creator_id uuid not null references public.profiles(id) on delete restrict,
  creator_name text not null,
  assignee_id uuid references public.profiles(id) on delete set null,
  assignee_name text,
  country_code text not null default 'SN' check (char_length(country_code) = 2),
  region_code text,
  organization_id uuid references public.governance_organizations(id) on delete restrict,
  hub_id uuid references public.airport_hubs(id) on delete restrict,
  relay_point_id uuid references public.relay_points(id) on delete restrict,
  team_id uuid references public.governance_teams(id) on delete restrict,
  operational_zone_id uuid references public.governance_operational_zones(id) on delete restrict,
  source_event_id uuid unique,
  due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  sla_state text not null default 'on_track' check (sla_state in ('on_track','at_risk','breached','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.governance_tasks (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.governance_missions(id) on delete cascade,
  workflow_step_id uuid references public.governance_workflow_steps(id) on delete restrict,
  step_key text not null,
  position integer not null,
  label text not null,
  status text not null default 'pending' check (status in ('pending','ready','in_progress','blocked','awaiting_validation','completed','cancelled')),
  owner_role_ids text[] not null default '{}',
  assignee_id uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  required_proof_types text[] not null default '{}',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mission_id, step_key)
);

create table if not exists public.governance_mission_proofs (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.governance_missions(id) on delete cascade,
  task_id uuid references public.governance_tasks(id) on delete cascade,
  proof_type text not null,
  reference text not null,
  metadata jsonb not null default '{}'::jsonb,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  submitted_by_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.governance_mission_events (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references public.governance_missions(id) on delete cascade,
  action text not null,
  from_status text,
  to_status text,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.governance_missions add constraint governance_missions_source_event_fk foreign key (source_event_id) references public.governance_mission_events(id) on delete set null;

create table if not exists public.governance_mission_dependencies (
  mission_id uuid not null references public.governance_missions(id) on delete cascade,
  depends_on_mission_id uuid not null references public.governance_missions(id) on delete cascade,
  dependency_type text not null default 'blocks',
  created_at timestamptz not null default now(),
  primary key (mission_id, depends_on_mission_id),
  check (mission_id <> depends_on_mission_id)
);

create table if not exists public.governance_escalations (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.governance_missions(id) on delete cascade,
  task_id uuid references public.governance_tasks(id) on delete cascade,
  escalation_level integer not null default 1 check (escalation_level between 1 and 5),
  reason text not null,
  target_role_ids text[] not null default '{}',
  acknowledged_by uuid references public.profiles(id) on delete set null,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.governance_notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  service_id text references public.governance_services(id) on delete cascade,
  mission_id uuid references public.governance_missions(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.governance_automation_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_service_id text not null references public.governance_services(id) on delete cascade,
  source_action text not null,
  target_service_id text not null references public.governance_services(id) on delete cascade,
  target_workflow_key text not null,
  target_title_template text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_service_id, source_action, target_service_id, target_workflow_key)
);

create index if not exists governance_missions_service_status_idx on public.governance_missions(service_id, status, due_at);
create index if not exists governance_missions_assignee_idx on public.governance_missions(assignee_id, status);
create index if not exists governance_tasks_mission_position_idx on public.governance_tasks(mission_id, position);
create index if not exists governance_events_mission_created_idx on public.governance_mission_events(mission_id, created_at desc);

create or replace function public.governance_validate_assignment() returns trigger language plpgsql set search_path = public as $$
declare expected_direction text; expected_service text;
begin
  select direction_id, service_id into expected_direction, expected_service from public.governance_role_catalog where id = new.role_id and active;
  if expected_direction is null or expected_direction <> new.direction_id or expected_service <> new.service_id then raise exception 'ROLE_SERVICE_MISMATCH'; end if;
  return new;
end $$;

drop trigger if exists governance_staff_assignment_guard on public.governance_staff_assignments;
create trigger governance_staff_assignment_guard before insert or update on public.governance_staff_assignments for each row execute function public.governance_validate_assignment();

create or replace function public.governance_can_access_service(required_service text) returns boolean language sql stable security definer set search_path = public as $$
  select public.current_user_has_role(array['admin','super_admin']) or exists (
    select 1 from public.governance_staff_assignments a where a.profile_id = auth.uid() and a.active and a.service_id = required_service and (a.ends_at is null or a.ends_at > now())
  ) or exists (
    select 1 from public.governance_staff_assignments a where a.profile_id = auth.uid() and a.active and a.role_id = 'operations_manager' and (a.ends_at is null or a.ends_at > now())
  );
$$;

create or replace function public.governance_can_manage_service(required_service text) returns boolean language sql stable security definer set search_path = public as $$
  select public.current_user_has_role(array['admin','super_admin']) or exists (
    select 1 from public.governance_staff_assignments a join public.governance_role_catalog r on r.id = a.role_id
    where a.profile_id = auth.uid() and a.active and (a.service_id = required_service or a.role_id = 'operations_manager')
      and r.responsibility_level in ('executive','manager') and (a.ends_at is null or a.ends_at > now())
  );
$$;

create or replace function public.governance_guard_mission_transition() returns trigger language plpgsql set search_path = public as $$
declare allowed boolean := false;
begin
  if old.status = new.status then return new; end if;
  allowed := case old.status
    when 'draft' then new.status in ('assigned','cancelled')
    when 'assigned' then new.status in ('assigned','in_progress','cancelled')
    when 'in_progress' then new.status in ('assigned','awaiting_validation','cancelled')
    when 'awaiting_validation' then new.status in ('correction_required','validated')
    when 'correction_required' then new.status in ('assigned','in_progress','awaiting_validation')
    when 'validated' then new.status = 'closed'
    else false end;
  if not allowed then raise exception 'WORKFLOW_TRANSITION_DENIED'; end if;
  if new.status = 'awaiting_validation' and not exists (select 1 from public.governance_mission_proofs p where p.mission_id = new.id) then raise exception 'MISSION_PROOF_REQUIRED'; end if;
  if new.status = 'closed' and old.status <> 'validated' then raise exception 'MISSION_VALIDATION_REQUIRED'; end if;
  return new;
end $$;

drop trigger if exists governance_mission_transition_guard on public.governance_missions;
create trigger governance_mission_transition_guard before update of status on public.governance_missions for each row execute function public.governance_guard_mission_transition();

create or replace function public.governance_create_mission_tasks() returns trigger language plpgsql security definer set search_path = public as $$
declare workflow_id uuid;
begin
  select id into workflow_id from public.governance_workflow_definitions where workflow_key = new.workflow_key and status = 'active' order by version desc limit 1;
  if workflow_id is null then return new; end if;
  update public.governance_missions set workflow_definition_id = workflow_id where id = new.id;
  insert into public.governance_tasks (mission_id, workflow_step_id, step_key, position, label, status, owner_role_ids, assignee_id, due_at, required_proof_types)
  select new.id, s.id, s.step_key, s.position, s.label, case when s.position = 1 then 'ready' else 'pending' end,
    s.owner_role_ids, case when s.position = 1 then new.assignee_id else null end,
    new.created_at + make_interval(mins => sum(s.sla_minutes) over (order by s.position)::integer), s.required_proof_types
  from public.governance_workflow_steps s where s.workflow_definition_id = workflow_id order by s.position;
  return new;
end $$;

drop trigger if exists governance_mission_tasks_create on public.governance_missions;
create trigger governance_mission_tasks_create after insert on public.governance_missions for each row execute function public.governance_create_mission_tasks();

create or replace function public.governance_notify_mission_event() returns trigger language plpgsql security definer set search_path = public as $$
declare mission_record record;
begin
  select service_id, assignee_id, reference into mission_record from public.governance_missions where id = new.mission_id;
  if mission_record.assignee_id is not null then
    insert into public.governance_notifications(profile_id, service_id, mission_id, title, message)
    values (mission_record.assignee_id, mission_record.service_id, new.mission_id, 'Mise à jour de mission', mission_record.reference || ' · ' || replace(new.action, '_', ' '));
  end if;
  return new;
end $$;

drop trigger if exists governance_event_notification on public.governance_mission_events;
create trigger governance_event_notification after insert on public.governance_mission_events for each row when (new.mission_id is not null) execute function public.governance_notify_mission_event();

create or replace function public.governance_apply_automation_rules() returns trigger language plpgsql security definer set search_path = public as $$
declare source_mission record; rule record; new_reference text;
begin
  if new.mission_id is null then return new; end if;
  select * into source_mission from public.governance_missions where id = new.mission_id;
  for rule in select * from public.governance_automation_rules where active and source_service_id = source_mission.service_id and source_action = new.action loop
    new_reference := 'YB-AUTO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    insert into public.governance_missions(reference, workflow_key, direction_id, service_id, title, description, status, priority, creator_id, creator_name, country_code, region_code, organization_id, hub_id, relay_point_id, team_id, operational_zone_id, source_event_id, due_at)
    select new_reference, rule.target_workflow_key, s.direction_id, rule.target_service_id,
      replace(rule.target_title_template, '{reference}', source_mission.reference),
      'Mission créée automatiquement à la suite de la décision ' || new.action || ' sur ' || source_mission.reference || '.',
      'draft', source_mission.priority, coalesce(new.actor_id, source_mission.creator_id), coalesce(new.actor_name, 'Orchestration Yobalelma'),
      source_mission.country_code, source_mission.region_code, source_mission.organization_id, source_mission.hub_id, source_mission.relay_point_id, source_mission.team_id, source_mission.operational_zone_id, new.id,
      now() + interval '8 hours'
    from public.governance_services s where s.id = rule.target_service_id
    on conflict (source_event_id) do nothing;
  end loop;
  return new;
end $$;

drop trigger if exists governance_event_automation on public.governance_mission_events;
create trigger governance_event_automation after insert on public.governance_mission_events for each row execute function public.governance_apply_automation_rules();

create or replace function public.governance_escalate_overdue_missions() returns integer language plpgsql security definer set search_path = public as $$
declare affected integer;
begin
  update public.governance_missions set sla_state = case when due_at < now() then 'breached' else 'at_risk' end, updated_at = now()
  where status not in ('closed','cancelled') and due_at < now() + interval '1 hour' and sla_state in ('on_track','at_risk');
  get diagnostics affected = row_count;
  insert into public.governance_escalations(mission_id, escalation_level, reason, target_role_ids)
  select m.id, case when m.priority = 'critical' then 2 else 1 end, 'Délai de mission dépassé', array_agg(distinct r.id)
  from public.governance_missions m join public.governance_role_catalog r on r.service_id = m.service_id and r.responsibility_level = 'manager'
  where m.sla_state = 'breached' and not exists (select 1 from public.governance_escalations e where e.mission_id = m.id and e.acknowledged_at is null)
  group by m.id, m.priority;
  return affected;
end $$;

insert into public.governance_directions(id, slug, label, description) values
('executive','direction-generale','Direction générale','Gouvernance de la plateforme, arbitrages et contrôle global.'),
('operations','operations','Direction des opérations','Orchestration des hubs, relais, collectes, dispatch et livraisons locales.'),
('travelers','voyageurs','Direction voyageurs','Validation, accompagnement et qualité du réseau voyageurs.'),
('customs','douane-conformite','Direction douane & conformité','Contrôles douaniers, conformité réglementaire et décisions documentées.'),
('finance','finance','Direction finance','Paiements, rapprochements, commissions, remboursements et clôtures.'),
('customer_service','service-client','Direction service client','Assistance, litiges, réclamations et satisfaction client.'),
('security','securite','Direction sécurité','Maîtrise des risques, contrôles internes et audits indépendants.'),
('partners','partenaires','Direction partenaires','Pilotage des partenaires, points relais, transporteurs et compagnies aériennes.')
on conflict (id) do update set slug=excluded.slug,label=excluded.label,description=excluded.description,updated_at=now();

insert into public.governance_services(id,direction_id,label,mission_label) values
('platform_governance','executive','Administration plateforme','Gouvernance plateforme'),('central_operations','operations','Pilotage opérationnel','Mission opérationnelle'),
('hub_operations','operations','Opérations Hub','Mission Hub'),('relay_operations','operations','Opérations points relais','Mission point relais'),
('collection_operations','operations','Collectes','Mission de collecte'),('dispatch','operations','Dispatch','Mission de dispatch'),('local_delivery','operations','Livraison locale','Mission de livraison'),
('traveler_management','travelers','Gestion voyageurs','Mission voyageur'),('traveler_validation','travelers','Validation voyageurs','Dossier de validation'),('traveler_support','travelers','Support voyageurs','Mission assistance voyageur'),
('customs_operations','customs','Opérations douanières','Contrôle douanier'),('compliance','customs','Conformité','Revue de conformité'),
('finance_control','finance','Pilotage financier','Mission financière'),('accounting','finance','Comptabilité','Écriture comptable'),('reconciliation','finance','Rapprochements','Rapprochement'),('payments','finance','Paiements','Contrôle de paiement'),('commissions','finance','Commissions','Contrôle de commission'),('refunds','finance','Remboursements','Demande de remboursement'),
('customer_support','customer_service','Service client','Dossier client'),('security_control','security','Sécurité','Contrôle de sécurité'),('internal_audit','security','Audit interne','Mission audit'),
('partner_management','partners','Pilotage partenaires','Mission partenaire'),('orange_partnership','partners','Partenariat Orange','Mission Orange'),('relay_partnership','partners','Réseau points relais','Mission réseau relais'),('carrier_partnership','partners','Transporteurs','Mission transporteur'),('airline_partnership','partners','Compagnies aériennes','Mission compagnie aérienne')
on conflict (id) do update set direction_id=excluded.direction_id,label=excluded.label,mission_label=excluded.mission_label,updated_at=now();

insert into public.roles(id,name,description,is_internal,is_critical) values
('collection_supervisor','Superviseur collecte','Supervision des missions de collecte.',true,true),('dispatch_manager','Responsable dispatch','Pilotage du dispatch.',true,true),('local_delivery_manager','Responsable livraison locale','Pilotage des livraisons locales.',true,true),
('traveler_manager','Responsable voyageurs','Pilotage des opérations voyageurs.',true,true),('traveler_validation','Chargé validation voyageurs','Validation des dossiers voyageurs.',true,true),('traveler_support','Chargé support voyageurs','Assistance aux voyageurs.',true,false),
('customs_manager','Responsable douane','Pilotage des opérations douanières.',true,true),('customs_agent','Agent douane','Contrôles douaniers.',true,true),('compliance_manager','Responsable conformité','Pilotage conformité.',true,true),('compliance_agent','Chargé conformité','Revues de conformité.',true,true),
('finance_manager','Responsable finance','Pilotage financier.',true,true),('accounting_agent','Comptable','Opérations comptables.',true,true),('reconciliation_agent','Chargé rapprochements','Rapprochements financiers.',true,true),('payment_agent','Chargé paiements','Contrôle paiements.',true,true),('commission_agent','Chargé commissions','Contrôle commissions.',true,true),('refund_agent','Chargé remboursements','Traitement remboursements.',true,true),
('customer_support_manager','Responsable service client','Pilotage du service client.',true,true),('customer_support_agent','Conseiller service client','Traitement des demandes clients.',true,false),('security_manager','Responsable sécurité','Pilotage sécurité.',true,true),('auditor','Auditeur','Audit indépendant.',true,true),
('partner_manager','Responsable partenaires','Pilotage des partenaires.',true,true),('orange_partner_manager','Responsable partenariat Orange','Pilotage du partenariat Orange.',true,true),('relay_partner_manager','Responsable réseau relais','Pilotage des partenaires relais.',true,true),('carrier_partner_manager','Responsable transporteurs','Pilotage des transporteurs.',true,true),('airline_partner_manager','Responsable compagnies aériennes','Pilotage des compagnies aériennes.',true,true)
on conflict (id) do update set name=excluded.name,description=excluded.description,is_internal=excluded.is_internal,is_critical=excluded.is_critical,updated_at=now();

insert into public.governance_role_catalog(id,direction_id,service_id,label,responsibility_level) values
('super_admin','executive','platform_governance','Super Admin','executive'),('admin','executive','platform_governance','Administrateur plateforme','executive'),
('operations_manager','operations','central_operations','Responsable des opérations','manager'),('hub_manager','operations','hub_operations','Responsable Hub','manager'),('hub_supervisor','operations','hub_operations','Superviseur Hub','supervisor'),('hub_agent','operations','hub_operations','Agent Hub','agent'),
('relay_manager','operations','relay_operations','Responsable points relais','manager'),('relay_agent','operations','relay_operations','Agent point relais','agent'),('collection_manager','operations','collection_operations','Responsable collecte','manager'),('collection_supervisor','operations','collection_operations','Superviseur collecte','supervisor'),('collection_driver','operations','collection_operations','Agent de collecte','agent'),('dispatch_manager','operations','dispatch','Responsable dispatch','manager'),('local_delivery_manager','operations','local_delivery','Responsable livraison locale','manager'),
('traveler_manager','travelers','traveler_management','Responsable voyageurs','manager'),('traveler_validation','travelers','traveler_validation','Chargé de validation voyageurs','specialist'),('traveler_support','travelers','traveler_support','Chargé de support voyageurs','agent'),
('customs_manager','customs','customs_operations','Responsable douane','manager'),('customs_agent','customs','customs_operations','Agent douane','agent'),('compliance_manager','customs','compliance','Responsable conformité','manager'),('compliance_agent','customs','compliance','Chargé de conformité','specialist'),
('finance_manager','finance','finance_control','Responsable finance','manager'),('finance_agent','finance','finance_control','Chargé finance','agent'),('accounting_agent','finance','accounting','Comptable','specialist'),('reconciliation_agent','finance','reconciliation','Chargé des rapprochements','specialist'),('payment_agent','finance','payments','Chargé des paiements','specialist'),('commission_agent','finance','commissions','Chargé des commissions','specialist'),('refund_agent','finance','refunds','Chargé des remboursements','specialist'),
('customer_support_manager','customer_service','customer_support','Responsable service client','manager'),('customer_support_agent','customer_service','customer_support','Conseiller service client','agent'),('support_agent','customer_service','customer_support','Conseiller service client','agent'),
('security_manager','security','security_control','Responsable sécurité','manager'),('auditor','security','internal_audit','Auditeur','auditor'),
('partner_manager','partners','partner_management','Responsable partenaires','manager'),('orange_partner_manager','partners','orange_partnership','Responsable partenariat Orange','manager'),('relay_partner_manager','partners','relay_partnership','Responsable réseau points relais','manager'),('carrier_partner_manager','partners','carrier_partnership','Responsable transporteurs','manager'),('airline_partner_manager','partners','airline_partnership','Responsable compagnies aériennes','manager')
on conflict (id) do update set direction_id=excluded.direction_id,service_id=excluded.service_id,label=excluded.label,responsibility_level=excluded.responsibility_level,updated_at=now();

insert into public.governance_organizations(code,name,organization_type,country_code) values ('YB-SN','Yobalelma Sénégal','yobalelma','SN') on conflict (code) do update set name=excluded.name,updated_at=now();

with workflow_seed(workflow_key,label,direction_id,service_id) as (values
('executive_standard','Workflow Gouvernance','executive','platform_governance'),('operations_standard','Workflow Opérations','operations','central_operations'),
('travelers_standard','Workflow Voyageurs','travelers','traveler_management'),('customs_standard','Workflow Conformité','customs','compliance'),
('finance_standard','Workflow Finance','finance','finance_control'),('customer_service_standard','Workflow Service client','customer_service','customer_support'),
('security_standard','Workflow Sécurité','security','security_control'),('partners_standard','Workflow Partenaires','partners','partner_management'))
insert into public.governance_workflow_definitions(workflow_key,version,label,direction_id,service_id,status,description,published_at)
select workflow_key,1,label,direction_id,service_id,'active','Circuit standard configurable avec contrôle qualité et clôture.',now() from workflow_seed
on conflict (workflow_key,version) do update set label=excluded.label,direction_id=excluded.direction_id,service_id=excluded.service_id,status='active',updated_at=now();

insert into public.governance_workflow_steps(workflow_definition_id,step_key,position,label,owner_role_ids,sla_minutes,required_validation,required_proof_types,escalation_policy,notification_policy)
select w.id, s.step_key, s.position, s.label,
  coalesce((select array_agg(r.id) from public.governance_role_catalog r where r.service_id=w.service_id and r.responsibility_level in (case when s.position in (3,4) then 'manager' else 'agent' end, 'specialist','supervisor')), '{}'),
  s.sla_minutes, s.required_validation, s.required_proof_types,
  jsonb_build_object('after_minutes',s.sla_minutes,'target','service_manager'), jsonb_build_object('on_entry',true,'on_overdue',true)
from public.governance_workflow_definitions w cross join (values
('qualification',1,'Qualification',120,false,array[]::text[]),('execution',2,'Exécution',480,false,array['activity_report']::text[]),('quality_control',3,'Contrôle qualité',240,true,array['quality_check']::text[]),('closure',4,'Validation et clôture',120,true,array['closure_report']::text[])
) as s(step_key,position,label,sla_minutes,required_validation,required_proof_types)
where w.version=1
on conflict (workflow_definition_id,step_key) do update set position=excluded.position,label=excluded.label,owner_role_ids=excluded.owner_role_ids,sla_minutes=excluded.sla_minutes,required_validation=excluded.required_validation,required_proof_types=excluded.required_proof_types,updated_at=now();

insert into public.governance_workflow_transitions(workflow_definition_id,from_step_key,to_step_key,action_key,allowed_role_ids,requires_all_proofs)
select w.id,t.from_step,t.to_step,t.action_key,coalesce((select array_agg(r.id) from public.governance_role_catalog r where r.service_id=w.service_id and (r.responsibility_level in ('manager','executive') or t.action_key='submit')), '{}'::text[]),true
from public.governance_workflow_definitions w cross join (values ('qualification','execution','start'),('execution','quality_control','submit'),('quality_control','execution','request_correction'),('quality_control','closure','validate'),('closure','closed','close')) t(from_step,to_step,action_key)
where w.version=1 on conflict (workflow_definition_id,from_step_key,action_key) do update set to_step_key=excluded.to_step_key,allowed_role_ids=excluded.allowed_role_ids,requires_all_proofs=excluded.requires_all_proofs;

insert into public.governance_automation_rules(name,source_service_id,source_action,target_service_id,target_workflow_key,target_title_template) values
('Contrôle conformité après validation partenaire','partner_management','validated','compliance','customs_standard','Contrôler la conformité de {reference}'),
('Mise en paiement après validation opérationnelle','central_operations','validated','payments','finance_standard','Préparer le règlement de {reference}'),
('Libération opérationnelle après conformité','compliance','validated','central_operations','operations_standard','Libérer les opérations de {reference}'),
('Information client après validation financière','finance_control','validated','customer_support','customer_service_standard','Informer le client pour {reference}')
on conflict (source_service_id,source_action,target_service_id,target_workflow_key) do update set name=excluded.name,target_title_template=excluded.target_title_template,active=true,updated_at=now();

alter table public.governance_directions enable row level security;
alter table public.governance_services enable row level security;
alter table public.governance_role_catalog enable row level security;
alter table public.governance_organizations enable row level security;
alter table public.governance_teams enable row level security;
alter table public.governance_operational_zones enable row level security;
alter table public.governance_staff_assignments enable row level security;
alter table public.governance_workflow_definitions enable row level security;
alter table public.governance_workflow_steps enable row level security;
alter table public.governance_workflow_transitions enable row level security;
alter table public.governance_missions enable row level security;
alter table public.governance_tasks enable row level security;
alter table public.governance_mission_proofs enable row level security;
alter table public.governance_mission_events enable row level security;
alter table public.governance_mission_dependencies enable row level security;
alter table public.governance_escalations enable row level security;
alter table public.governance_notifications enable row level security;
alter table public.governance_automation_rules enable row level security;

create policy governance_catalog_read on public.governance_directions for select to authenticated using (true);
create policy governance_services_read on public.governance_services for select to authenticated using (true);
create policy governance_roles_read on public.governance_role_catalog for select to authenticated using (true);
create policy governance_org_read on public.governance_organizations for select to authenticated using (public.current_user_has_role(array['admin','super_admin','operations_manager']));
create policy governance_team_scope on public.governance_teams for select to authenticated using (public.governance_can_access_service(service_id));
create policy governance_zone_staff on public.governance_operational_zones for select to authenticated using (exists(select 1 from public.governance_staff_assignments a where a.profile_id=auth.uid() and a.active and (a.operational_zone_id=id or a.operational_zone_id is null)) or public.current_user_has_role(array['admin','super_admin']));
create policy governance_staff_scope_read on public.governance_staff_assignments for select to authenticated using (profile_id=auth.uid() or public.governance_can_access_service(service_id));
create policy governance_staff_manage on public.governance_staff_assignments for all to authenticated using (public.governance_can_manage_service(service_id)) with check (public.governance_can_manage_service(service_id));
create policy governance_workflow_read on public.governance_workflow_definitions for select to authenticated using (public.governance_can_access_service(service_id));
create policy governance_workflow_manage on public.governance_workflow_definitions for all to authenticated using (public.governance_can_manage_service(service_id)) with check (public.governance_can_manage_service(service_id));
create policy governance_steps_read on public.governance_workflow_steps for select to authenticated using (exists(select 1 from public.governance_workflow_definitions w where w.id=workflow_definition_id and public.governance_can_access_service(w.service_id)));
create policy governance_steps_manage on public.governance_workflow_steps for all to authenticated using (exists(select 1 from public.governance_workflow_definitions w where w.id=workflow_definition_id and public.governance_can_manage_service(w.service_id))) with check (exists(select 1 from public.governance_workflow_definitions w where w.id=workflow_definition_id and public.governance_can_manage_service(w.service_id)));
create policy governance_transitions_read on public.governance_workflow_transitions for select to authenticated using (exists(select 1 from public.governance_workflow_definitions w where w.id=workflow_definition_id and public.governance_can_access_service(w.service_id)));
create policy governance_transitions_manage on public.governance_workflow_transitions for all to authenticated using (exists(select 1 from public.governance_workflow_definitions w where w.id=workflow_definition_id and public.governance_can_manage_service(w.service_id))) with check (exists(select 1 from public.governance_workflow_definitions w where w.id=workflow_definition_id and public.governance_can_manage_service(w.service_id)));
create policy governance_mission_read on public.governance_missions for select to authenticated using (assignee_id=auth.uid() or creator_id=auth.uid() or public.governance_can_access_service(service_id));
create policy governance_mission_create on public.governance_missions for insert to authenticated with check (creator_id=auth.uid() and public.governance_can_manage_service(service_id));
create policy governance_mission_update on public.governance_missions for update to authenticated using (assignee_id=auth.uid() or public.governance_can_manage_service(service_id)) with check (assignee_id=auth.uid() or public.governance_can_manage_service(service_id));
create policy governance_tasks_scope on public.governance_tasks for select to authenticated using (exists(select 1 from public.governance_missions m where m.id=mission_id and (m.assignee_id=auth.uid() or public.governance_can_access_service(m.service_id))));
create policy governance_tasks_update on public.governance_tasks for update to authenticated using (assignee_id=auth.uid() or exists(select 1 from public.governance_missions m where m.id=mission_id and public.governance_can_manage_service(m.service_id)));
create policy governance_proofs_read on public.governance_mission_proofs for select to authenticated using (exists(select 1 from public.governance_missions m where m.id=mission_id and (m.assignee_id=auth.uid() or public.governance_can_access_service(m.service_id))));
create policy governance_proofs_create on public.governance_mission_proofs for insert to authenticated with check (submitted_by=auth.uid() and exists(select 1 from public.governance_missions m where m.id=mission_id and (m.assignee_id=auth.uid() or public.governance_can_manage_service(m.service_id))));
create policy governance_events_read on public.governance_mission_events for select to authenticated using (mission_id is null or exists(select 1 from public.governance_missions m where m.id=mission_id and (m.assignee_id=auth.uid() or public.governance_can_access_service(m.service_id))));
create policy governance_events_create on public.governance_mission_events for insert to authenticated with check (actor_id=auth.uid() and (mission_id is null or exists(select 1 from public.governance_missions m where m.id=mission_id and (m.assignee_id=auth.uid() or public.governance_can_manage_service(m.service_id)))));
create policy governance_dependencies_scope on public.governance_mission_dependencies for select to authenticated using (exists(select 1 from public.governance_missions m where m.id=mission_id and public.governance_can_access_service(m.service_id)));
create policy governance_dependencies_manage on public.governance_mission_dependencies for all to authenticated using (exists(select 1 from public.governance_missions m where m.id=mission_id and public.governance_can_manage_service(m.service_id))) with check (exists(select 1 from public.governance_missions m where m.id=mission_id and public.governance_can_manage_service(m.service_id)));
create policy governance_escalations_scope on public.governance_escalations for select to authenticated using (exists(select 1 from public.governance_missions m where m.id=mission_id and public.governance_can_access_service(m.service_id)));
create policy governance_notifications_own on public.governance_notifications for select to authenticated using (profile_id=auth.uid() or (profile_id is null and public.governance_can_access_service(service_id)));
create policy governance_notifications_update on public.governance_notifications for update to authenticated using (profile_id=auth.uid());
create policy governance_automation_read on public.governance_automation_rules for select to authenticated using (public.governance_can_access_service(source_service_id) or public.governance_can_access_service(target_service_id));
create policy governance_automation_manage on public.governance_automation_rules for all to authenticated using (public.current_user_has_role(array['admin','super_admin'])) with check (public.current_user_has_role(array['admin','super_admin']));

revoke all on function public.governance_escalate_overdue_missions() from public;
grant execute on function public.governance_escalate_overdue_missions() to service_role;
