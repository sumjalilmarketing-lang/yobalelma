create or replace function public.hash_handover_token(p_token text)
returns text
language sql
immutable
set search_path = public, extensions, pg_catalog
as $$
  select encode(digest(p_token, 'sha256'), 'hex');
$$;

alter function public.create_handover_qr_token(uuid, public.handover_qr_token_type, integer)
  set search_path = public, extensions, pg_catalog;

alter function public.scan_handover_qr_token(text, public.handover_qr_token_type, text, text)
  set search_path = public, extensions, pg_catalog;
