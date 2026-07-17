-- Synthetic, non-personal Enterprise Hub fixtures. Idempotent through stable demo keys.
update public.hub_statuses hs
set operational_status = 'degraded', scanner_status = 'degraded', active_incident_count = 2,
    status_note = 'Scanner capacity under observation', updated_at = now()
from public.airport_hubs h
where hs.hub_id = h.id and h.code = 'BRU-BRUSSELS';

insert into public.hub_alerts (hub_id, alert_type, severity, status, title, message, sla_due_at, channels, metadata)
select h.id, v.alert_type, v.severity, v.status, v.title, v.message, now() + v.sla_minutes * interval '1 minute', array['in_app'], jsonb_build_object('demo_key', v.demo_key, 'synthetic', true)
from public.airport_hubs h
join (values
  ('DSS-DAKAR','dormant_stock','high','acknowledged','Stock dormant','12 colis sont sans mouvement depuis plus de 48 heures.',120,'alert-dss-dormant'),
  ('CDG-PARIS','incomplete_manifest','warning','open','Manifeste incomplet','Le manifeste REC-CDG-204 attend encore 3 colis.',90,'alert-cdg-manifest'),
  ('BRU-BRUSSELS','capacity_threshold','critical','open','Capacité proche du seuil','Les réservations atteignent 85 % de la capacité voyageur.',30,'alert-bru-capacity')
) as v(hub_code, alert_type, severity, status, title, message, sla_minutes, demo_key) on h.code = v.hub_code
where not exists (select 1 from public.hub_alerts a where a.metadata->>'demo_key' = v.demo_key);

insert into public.operational_incidents (incident_code, incident_type, status, priority, hub_id, title, description, blocks_shipment, blocks_batch, metadata)
select v.incident_code, v.incident_type::public.operational_incident_type, v.status::public.operational_incident_status, v.priority::public.operational_priority, h.id, v.title, v.description, false, false, jsonb_build_object('demo_key', v.incident_code, 'synthetic', true, 'sla_minutes', v.sla_minutes)
from public.airport_hubs h
join (values
  ('DSS-DAKAR','INC-DSS-DEMO01','qr_issue','assigned','high','Scanner zone B intermittent','Le scanner bascule périodiquement en mode dégradé.',120),
  ('CDG-PARIS','INC-CDG-DEMO01','damaged_package','open','medium','Colis endommagé à réception','Dossier synthétique pour la démonstration Enterprise.',180),
  ('BRU-BRUSSELS','INC-BRU-DEMO01','storage_issue','escalated','urgent','Écart inventaire étagère C4','Rapprochement physique et système demandé.',90)
) as v(hub_code, incident_code, incident_type, status, priority, title, description, sla_minutes) on h.code = v.hub_code
on conflict (incident_code) do nothing;

insert into public.hub_forecast_snapshots (hub_id, forecast_date, expected_packages, expected_weight_kg, expected_traveler_capacity_kg, recommended_agent_count, recommended_storage_locations, saturation_risk_percent, delay_risk_percent, destination_load, assumptions)
select h.id, current_date + d,
  280 + (case h.code when 'CDG-PARIS' then 140 when 'BRU-BRUSSELS' then 70 else 0 end) + d * 18,
  1400 + (case h.code when 'CDG-PARIS' then 620 when 'BRU-BRUSSELS' then 330 else 0 end) + d * 82,
  600 + d * 25,
  12 + (case h.code when 'CDG-PARIS' then 5 when 'BRU-BRUSSELS' then 3 else 0 end) + ceil(d / 2.0)::integer,
  34 + d,
  least(95, 30 + d * 4 + case h.code when 'BRU-BRUSSELS' then 20 else 0 end),
  least(90, 16 + d * 3),
  jsonb_build_object('Dakar', 0.35, 'Paris', 0.40, 'Bruxelles', 0.25),
  jsonb_build_object('model', 'assisted_demo_v1', 'irreversible_actions', false, 'synthetic', true)
from public.airport_hubs h cross join generate_series(1, 14) d
where h.code in ('DSS-DAKAR','CDG-PARIS','BRU-BRUSSELS')
on conflict (hub_id, forecast_date) do update set
  expected_packages=excluded.expected_packages, expected_weight_kg=excluded.expected_weight_kg,
  expected_traveler_capacity_kg=excluded.expected_traveler_capacity_kg,
  recommended_agent_count=excluded.recommended_agent_count,
  recommended_storage_locations=excluded.recommended_storage_locations,
  saturation_risk_percent=excluded.saturation_risk_percent, delay_risk_percent=excluded.delay_risk_percent,
  destination_load=excluded.destination_load, assumptions=excluded.assumptions, generated_at=now();

insert into public.hub_agent_performance (profile_id, hub_id, metric_date, received_packages, completed_inspections, stock_movements, prepared_batches, opened_incidents, resolved_incidents, operation_errors, rework_count, processed_weight_kg, average_operation_seconds, sla_compliance_percent, metadata)
select hsa.profile_id, hsa.hub_id, current_date,
  38 + (row_number() over (order by hsa.profile_id, hsa.hub_id) % 24)::integer,
  25 + (row_number() over (order by hsa.profile_id, hsa.hub_id) % 18)::integer,
  44 + (row_number() over (order by hsa.profile_id, hsa.hub_id) % 30)::integer,
  2 + (row_number() over (order by hsa.profile_id, hsa.hub_id) % 5)::integer,
  1, 1, (row_number() over (order by hsa.profile_id, hsa.hub_id) % 3)::integer, 0,
  320 + (row_number() over (order by hsa.profile_id, hsa.hub_id) % 12) * 48,
  72 + (row_number() over (order by hsa.profile_id, hsa.hub_id) % 16),
  90 + (row_number() over (order by hsa.profile_id, hsa.hub_id) % 9),
  jsonb_build_object('synthetic', true, 'disciplinary_automation', false)
from public.hub_staff_assignments hsa
join public.airport_hubs h on h.id = hsa.hub_id
where hsa.is_active and h.code in ('DSS-DAKAR','CDG-PARIS','BRU-BRUSSELS')
on conflict (profile_id, hub_id, metric_date) do update set
  received_packages=excluded.received_packages, completed_inspections=excluded.completed_inspections,
  stock_movements=excluded.stock_movements, prepared_batches=excluded.prepared_batches,
  processed_weight_kg=excluded.processed_weight_kg, average_operation_seconds=excluded.average_operation_seconds,
  sla_compliance_percent=excluded.sla_compliance_percent, metadata=excluded.metadata, updated_at=now();

insert into public.hub_system_metrics (hub_id, metric_name, metric_value, unit, labels)
select h.id, m.metric_name, m.metric_value, m.unit, jsonb_build_object('synthetic', true, 'service', m.service)
from public.airport_hubs h
cross join (values ('api_latency',86,'ms','api'),('availability',99.97,'percent','platform'),('realtime_latency',112,'ms','realtime'),('scanner_error_rate',0.18,'percent','scanner')) m(metric_name,metric_value,unit,service)
where h.code in ('DSS-DAKAR','CDG-PARIS','BRU-BRUSSELS');

insert into public.hub_audit_events (actor_id, actor_role, hub_id, action, resource_type, resource_id, context, correlation_id, result, risk_level)
select null, 'system', h.id, v.action, v.resource_type, v.resource_id,
  jsonb_build_object('synthetic', true), v.correlation_id, 'success', v.risk_level
from public.airport_hubs h
join (values
  ('DSS-DAKAR','enterprise.demo.initialized','hub','DSS-DAKAR','hub-enterprise-demo-dss','low'),
  ('CDG-PARIS','enterprise.demo.initialized','hub','CDG-PARIS','hub-enterprise-demo-cdg','low'),
  ('BRU-BRUSSELS','enterprise.demo.initialized','hub','BRU-BRUSSELS','hub-enterprise-demo-bru','low')
) v(hub_code,action,resource_type,resource_id,correlation_id,risk_level) on h.code = v.hub_code
where not exists (select 1 from public.hub_audit_events e where e.correlation_id = v.correlation_id);
