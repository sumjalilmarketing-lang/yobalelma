drop policy if exists positions_own_or_dispatch on public.operational_position_events;
create policy positions_scoped on public.operational_position_events for select using (
  public.current_user_can_view_tracking_subject(profile_id)
);

drop policy if exists location_consents_own on public.operational_location_consents;
create policy location_consents_scoped on public.operational_location_consents for select using (
  public.current_user_can_view_tracking_subject(profile_id)
);
