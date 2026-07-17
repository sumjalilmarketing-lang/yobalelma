drop policy if exists "handover_qr_tokens_select_participants" on public.handover_qr_tokens;
create policy "handover_qr_tokens_select_participants" on public.handover_qr_tokens
for select using (
  traveler_id = auth.uid()
  or created_by = auth.uid()
  or public.current_user_has_role(array[
    'hub_agent', 'hub_supervisor', 'hub_manager', 'relay_agent',
    'operations_manager', 'admin', 'super_admin'
  ])
);

drop policy if exists "handover_qr_tokens_write_staff" on public.handover_qr_tokens;
create policy "handover_qr_tokens_write_staff" on public.handover_qr_tokens
for all using (
  public.current_user_has_role(array[
    'hub_agent', 'hub_supervisor', 'hub_manager', 'relay_agent',
    'operations_manager', 'admin', 'super_admin'
  ])
) with check (
  public.current_user_has_role(array[
    'hub_agent', 'hub_supervisor', 'hub_manager', 'relay_agent',
    'operations_manager', 'admin', 'super_admin'
  ])
);
