drop policy if exists "trips_select_visible" on public.trips;
create policy "trips_select_visible" on public.trips
for select using (
  auth.uid() = traveler_id
  or status in ('planned', 'boarding')
  or public.current_user_has_role(array[
    'operations_manager',
    'hub_agent',
    'admin',
    'super_admin'
  ])
);

drop policy if exists "trips_update_operations" on public.trips;
create policy "trips_update_operations" on public.trips
for update using (
  public.current_user_has_role(array[
    'operations_manager',
    'hub_agent',
    'admin',
    'super_admin'
  ])
) with check (
  public.current_user_has_role(array[
    'operations_manager',
    'hub_agent',
    'admin',
    'super_admin'
  ])
);
