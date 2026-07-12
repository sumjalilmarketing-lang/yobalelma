alter type public.user_role add value if not exists 'hub_manager';
alter type public.user_role add value if not exists 'collection_manager';
alter type public.user_role add value if not exists 'relay_manager';
alter type public.user_role add value if not exists 'finance_agent';

insert into public.roles (id, name, description, is_internal, is_critical)
values
  ('hub_manager', 'Hub manager', 'Responsable operationnel d''un ou plusieurs hubs.', true, true),
  ('collection_manager', 'Collection manager', 'Responsable des tournees point relais vers hub.', true, true),
  ('relay_manager', 'Relay manager', 'Responsable reseau et points relais.', true, true),
  ('finance_agent', 'Finance agent', 'Controle paiements, payouts et commissions.', true, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_internal = excluded.is_internal,
  is_critical = excluded.is_critical;

insert into public.permissions (id, resource, action, description, is_critical)
values
  ('traveler:read', 'traveler', 'read', 'Lire les voyageurs, trajets et capacites.', false),
  ('collection:read', 'collection', 'read', 'Lire les collectes et manifestes.', false),
  ('collection:write', 'collection', 'write', 'Modifier les collectes et manifestes.', true),
  ('relay:read', 'relay', 'read', 'Lire les points relais et inventaires.', false),
  ('relay:write', 'relay', 'write', 'Modifier les operations relais.', true),
  ('finance:read', 'finance', 'read', 'Lire les paiements, payouts et commissions.', true),
  ('finance:write', 'finance', 'write', 'Intervenir sur les paiements, payouts et commissions.', true)
on conflict (id) do update set
  resource = excluded.resource,
  action = excluded.action,
  description = excluded.description,
  is_critical = excluded.is_critical;

insert into public.role_permissions (role_id, permission_id)
select role_id, permission_id
from (
  values
    ('hub_manager', 'hub:read'),
    ('hub_manager', 'hub:write'),
    ('hub_manager', 'qr:read'),
    ('hub_manager', 'qr:write'),
    ('hub_manager', 'shipment:read'),
    ('hub_manager', 'traveler:read'),
    ('collection_manager', 'collection:read'),
    ('collection_manager', 'collection:write'),
    ('collection_manager', 'relay:read'),
    ('collection_manager', 'hub:read'),
    ('relay_manager', 'relay:read'),
    ('relay_manager', 'relay:write'),
    ('relay_manager', 'collection:read'),
    ('relay_manager', 'qr:read'),
    ('relay_manager', 'qr:write'),
    ('finance_agent', 'finance:read'),
    ('finance_agent', 'finance:write'),
    ('finance_agent', 'payment:read'),
    ('finance_agent', 'payment:write'),
    ('finance_agent', 'payout:read'),
    ('finance_agent', 'payout:write'),
    ('finance_agent', 'admin:read')
) as seed(role_id, permission_id)
on conflict (role_id, permission_id) do nothing;
