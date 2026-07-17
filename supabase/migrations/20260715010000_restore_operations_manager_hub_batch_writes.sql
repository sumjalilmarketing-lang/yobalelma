drop policy if exists "hub_batches_insert_staff" on public.hub_batches;
create policy "hub_batches_insert_staff" on public.hub_batches
for insert with check (
  public.current_user_has_role(array[
    'hub_agent',
    'hub_supervisor',
    'hub_manager',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

drop policy if exists "hub_batches_update_staff" on public.hub_batches;
create policy "hub_batches_update_staff" on public.hub_batches
for update using (
  public.current_user_has_role(array[
    'hub_agent',
    'hub_supervisor',
    'hub_manager',
    'operations_manager',
    'admin',
    'super_admin'
  ])
) with check (
  public.current_user_has_role(array[
    'hub_agent',
    'hub_supervisor',
    'hub_manager',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

drop policy if exists "capacity_reservations_write_staff" on public.capacity_reservations;
create policy "capacity_reservations_write_staff" on public.capacity_reservations
for all using (
  public.current_user_has_role(array[
    'hub_agent',
    'hub_supervisor',
    'hub_manager',
    'operations_manager',
    'admin',
    'super_admin'
  ])
) with check (
  public.current_user_has_role(array[
    'hub_agent',
    'hub_supervisor',
    'hub_manager',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);
