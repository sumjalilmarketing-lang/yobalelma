-- Close the offline-sync and message acknowledgement gaps found during the
-- Collection App security review. Offline payloads are append-only for drivers.

create policy "collection_offline_insert_own" on public.collection_offline_operations
for insert with check (
  driver_id = auth.uid()
  and status = 'pending'
  and public.current_user_has_role(array['collection_driver','collection_manager','operations_manager'])
);

create policy "collection_offline_manager_update" on public.collection_offline_operations
for update using (
  public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin'])
) with check (
  public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin'])
);

create policy "collection_messages_recipient_ack" on public.collection_messages
for update using (recipient_id = auth.uid())
with check (recipient_id = auth.uid() and sender_id <> auth.uid());
