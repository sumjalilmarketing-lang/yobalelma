-- reserve_hub_batch_capacity_v2 locks the selected trip with FOR UPDATE.
-- Supervisor and manager roles therefore need the same operational update
-- policy as hub_agent for that transactional lock to be visible.
drop policy if exists "trips_update_operations" on public.trips;
create policy "trips_update_operations" on public.trips
for update using (
  public.current_user_has_role(array[
    'operations_manager', 'hub_agent', 'hub_supervisor', 'hub_manager', 'admin', 'super_admin'
  ])
) with check (
  public.current_user_has_role(array[
    'operations_manager', 'hub_agent', 'hub_supervisor', 'hub_manager', 'admin', 'super_admin'
  ])
);
