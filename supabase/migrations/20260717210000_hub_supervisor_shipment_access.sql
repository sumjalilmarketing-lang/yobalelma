-- Keep the three Hub operational roles aligned when workflows read shipments,
-- packages and status events through security-invoker RPCs.
drop policy if exists "shipments_select_owner_or_staff" on public.shipments;
create policy "shipments_select_owner_or_staff" on public.shipments
for select using (
  sender_id = auth.uid()
  or public.current_user_has_role(array[
    'admin', 'super_admin', 'operations_manager', 'support_agent', 'relay_agent',
    'hub_agent', 'hub_supervisor', 'hub_manager', 'collection_driver', 'local_transporter'
  ])
);

drop policy if exists "shipments_update_staff" on public.shipments;
create policy "shipments_update_staff" on public.shipments
for update using (
  public.current_user_has_role(array[
    'admin', 'super_admin', 'operations_manager', 'support_agent',
    'hub_agent', 'hub_supervisor', 'hub_manager'
  ])
) with check (
  public.current_user_has_role(array[
    'admin', 'super_admin', 'operations_manager', 'support_agent',
    'hub_agent', 'hub_supervisor', 'hub_manager'
  ])
);

drop policy if exists "shipment_addresses_select_owner_or_staff" on public.shipment_addresses;
create policy "shipment_addresses_select_owner_or_staff" on public.shipment_addresses
for select using (
  exists (
    select 1 from public.shipments s
    where s.id = shipment_addresses.shipment_id
      and (
        s.sender_id = auth.uid()
        or public.current_user_has_role(array[
          'admin', 'super_admin', 'operations_manager', 'support_agent', 'relay_agent',
          'hub_agent', 'hub_supervisor', 'hub_manager', 'collection_driver', 'local_transporter'
        ])
      )
  )
);

drop policy if exists "shipment_packages_select_owner_or_staff" on public.shipment_packages;
create policy "shipment_packages_select_owner_or_staff" on public.shipment_packages
for select using (
  exists (
    select 1 from public.shipments s
    where s.id = shipment_packages.shipment_id
      and (
        s.sender_id = auth.uid()
        or public.current_user_has_role(array[
          'admin', 'super_admin', 'operations_manager', 'support_agent', 'relay_agent',
          'hub_agent', 'hub_supervisor', 'hub_manager', 'collection_driver', 'local_transporter'
        ])
      )
  )
);

drop policy if exists "shipment_status_events_select_owner_or_staff" on public.shipment_status_events;
create policy "shipment_status_events_select_owner_or_staff" on public.shipment_status_events
for select using (
  exists (
    select 1 from public.shipments s
    where s.id = shipment_status_events.shipment_id
      and (
        s.sender_id = auth.uid()
        or public.current_user_has_role(array[
          'admin', 'super_admin', 'operations_manager', 'support_agent', 'relay_agent',
          'hub_agent', 'hub_supervisor', 'hub_manager', 'collection_driver', 'local_transporter'
        ])
      )
  )
);

drop policy if exists "shipment_status_events_insert_owner_or_staff" on public.shipment_status_events;
create policy "shipment_status_events_insert_owner_or_staff" on public.shipment_status_events
for insert with check (
  exists (
    select 1 from public.shipments s
    where s.id = shipment_status_events.shipment_id
      and (
        s.sender_id = auth.uid()
        or public.current_user_has_role(array[
          'admin', 'super_admin', 'operations_manager', 'support_agent',
          'hub_agent', 'hub_supervisor', 'hub_manager'
        ])
      )
  )
);
