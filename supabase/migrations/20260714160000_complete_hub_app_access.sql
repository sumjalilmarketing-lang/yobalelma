alter type public.user_role add value if not exists 'hub_supervisor';

insert into public.roles (id, name, description, is_internal, is_critical)
values
  ('hub_supervisor', 'Hub supervisor', 'Supervise reception, inspection, batches and handover inside an assigned Hub.', true, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_internal = excluded.is_internal,
  is_critical = excluded.is_critical,
  updated_at = now();

insert into public.role_permissions (role_id, permission_id)
values
  ('hub_supervisor', 'hub:read'),
  ('hub_supervisor', 'hub:write'),
  ('hub_supervisor', 'qr:read'),
  ('hub_supervisor', 'qr:write'),
  ('hub_supervisor', 'shipment:read'),
  ('hub_supervisor', 'traveler:read'),
  ('hub_supervisor', 'operations:read')
on conflict (role_id, permission_id) do nothing;

create or replace function public.current_user_can_access_hub(p_hub_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
    or exists (
      select 1
      from public.hub_agent_profiles hap
      where hap.profile_id = auth.uid()
        and hap.hub_id = p_hub_id
        and hap.is_active
    )
    or exists (
      select 1
      from public.operations_profiles op
      where op.profile_id = auth.uid()
        and op.is_active
        and p_hub_id = any(op.managed_hub_ids)
    );
$$;

drop policy if exists "airport_hubs_select_staff" on public.airport_hubs;
create policy "airport_hubs_select_staff" on public.airport_hubs
for select using (
  public.current_user_has_role(array[
    'hub_agent',
    'hub_supervisor',
    'hub_manager',
    'operations_manager',
    'support_agent',
    'admin',
    'super_admin'
  ])
);

drop policy if exists "hub_agent_profiles_select_staff" on public.hub_agent_profiles;
create policy "hub_agent_profiles_select_staff" on public.hub_agent_profiles
for select using (
  profile_id = auth.uid()
  or public.current_user_has_role(array[
    'hub_supervisor',
    'hub_manager',
    'operations_manager',
    'support_agent',
    'admin',
    'super_admin'
  ])
);

drop policy if exists "hub_batches_select_staff" on public.hub_batches;
create policy "hub_batches_select_staff" on public.hub_batches
for select using (
  public.current_user_has_role(array['hub_agent', 'hub_supervisor', 'hub_manager', 'operations_manager', 'admin', 'super_admin'])
);

drop policy if exists "hub_batches_insert_staff" on public.hub_batches;
create policy "hub_batches_insert_staff" on public.hub_batches
for insert with check (
  public.current_user_has_role(array['hub_agent', 'hub_supervisor', 'hub_manager', 'admin', 'super_admin'])
);

drop policy if exists "hub_batches_update_staff" on public.hub_batches;
create policy "hub_batches_update_staff" on public.hub_batches
for update using (
  public.current_user_has_role(array['hub_agent', 'hub_supervisor', 'hub_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['hub_agent', 'hub_supervisor', 'hub_manager', 'admin', 'super_admin'])
);

drop policy if exists "capacity_reservations_select_participants" on public.capacity_reservations;
create policy "capacity_reservations_select_participants" on public.capacity_reservations
for select using (
  exists (
    select 1 from public.shipments s
    where s.id = capacity_reservations.shipment_id
      and s.sender_id = auth.uid()
  )
  or public.current_user_has_role(array['hub_agent', 'hub_supervisor', 'hub_manager', 'operations_manager', 'admin', 'super_admin'])
);

drop policy if exists "capacity_reservations_write_staff" on public.capacity_reservations;
create policy "capacity_reservations_write_staff" on public.capacity_reservations
for all using (
  public.current_user_has_role(array['hub_agent', 'hub_supervisor', 'hub_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['hub_agent', 'hub_supervisor', 'hub_manager', 'admin', 'super_admin'])
);

create index if not exists hub_batches_hub_status_deadline_idx
  on public.hub_batches (hub_id, status, handover_deadline_at);

create index if not exists hub_inbound_receipt_items_tracking_idx
  on public.hub_inbound_receipt_items (tracking_code, scanned_at desc);
