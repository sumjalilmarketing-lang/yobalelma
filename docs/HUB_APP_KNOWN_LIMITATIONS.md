# Hub App Known Limitations

- Hub authentication supports real Supabase Auth for assigned internal Hub roles and still keeps signed demo sessions for local demonstrations.
- Hub write actions attempt live Supabase mutations first when a Supabase Hub session is present.
- Real Supabase Hub sessions now read receptions, inventory, locations, inspections, trips, batches, incidents, audit events and notifications from the authenticated Hub under RLS.
- Signed demo sessions intentionally keep the local runtime store; live-session read failures surface as errors and never fall back to demo data.
- Supabase Hub migration `20260714160000_complete_hub_app_access.sql` is applied remotely.
- Supabase Hub migration `20260715010000_restore_operations_manager_hub_batch_writes.sql` is applied remotely.
- Storage buckets for Hub photos, documents and signatures are verified remotely.
- External HTTPS staging is not created.
- Playwright E2E execution is green locally with 18/18 Hub tests and screenshots generated.
