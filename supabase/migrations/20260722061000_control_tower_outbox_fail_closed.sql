create policy control_tower_outbox_fail_closed on public.control_tower_outbox
  for all using (false) with check (false);
