revoke execute on function public.claim_secure_upload_scan(text) from public, anon, authenticated;
revoke execute on function public.complete_secure_upload_scan(uuid,text,public.upload_security_status,text,text,text,text,timestamptz) from public, anon, authenticated;
revoke execute on function public.claim_notification_delivery(text,public.notification_channel[]) from public, anon, authenticated;
revoke execute on function public.complete_notification_delivery(uuid,uuid,boolean,text,text,timestamptz) from public, anon, authenticated;

grant execute on function public.claim_secure_upload_scan(text) to service_role;
grant execute on function public.complete_secure_upload_scan(uuid,text,public.upload_security_status,text,text,text,text,timestamptz) to service_role;
grant execute on function public.claim_notification_delivery(text,public.notification_channel[]) to service_role;
grant execute on function public.complete_notification_delivery(uuid,uuid,boolean,text,text,timestamptz) to service_role;
