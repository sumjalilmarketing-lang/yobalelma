-- Collection managers own dispatch and stop planning, while drivers remain
-- unable to mutate route assignments directly.

drop policy if exists "collection_routes_write_staff" on public.collection_routes;
create policy "collection_routes_write_managers" on public.collection_routes
for all using (
  public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin'])
) with check (
  public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin'])
);

drop policy if exists "collection_route_stops_write_staff" on public.collection_route_stops;
create policy "collection_stops_write_managers" on public.collection_route_stops
for all using (
  public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin'])
) with check (
  public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin'])
);
