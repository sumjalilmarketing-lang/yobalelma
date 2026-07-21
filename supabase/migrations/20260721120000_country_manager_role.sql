insert into public.roles(id, name, description, is_internal, is_critical)
values ('country_manager', 'Responsable pays', 'Pilotage des opérations Yobalelma dans un pays assigné.', true, true)
on conflict (id) do update set name = excluded.name, description = excluded.description, is_internal = excluded.is_internal, is_critical = excluded.is_critical, updated_at = now();

insert into public.governance_role_catalog(id, direction_id, service_id, label, responsibility_level)
values ('country_manager', 'executive', 'platform_governance', 'Responsable pays', 'manager')
on conflict (id) do update set direction_id = excluded.direction_id, service_id = excluded.service_id, label = excluded.label, responsibility_level = excluded.responsibility_level, updated_at = now();
