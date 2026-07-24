revoke all on function public.record_parcel_traceability_event_internal(jsonb) from public,anon,authenticated,service_role;
revoke all on function public.assert_verified_traceability_proofs(uuid,text,text,text,uuid[]) from public,anon,authenticated,service_role;
revoke all on function public.assert_dual_transfer_proofs(uuid,text,uuid,uuid[],boolean) from public,anon,authenticated,service_role;
revoke all on function public.traceability_distance_meters(numeric,numeric,numeric,numeric) from public,anon,authenticated,service_role;
