create extension if not exists pgcrypto;

create or replace function public.yobalelma_random_bytes(p_length integer)
returns bytea
language sql
volatile
set search_path = public, extensions, pg_catalog
as $$
  select gen_random_bytes(p_length);
$$;

create or replace function public.generate_tracking_code()
returns text
language sql
volatile
as $$
  select 'YBL-' || upper(substr(encode(public.yobalelma_random_bytes(6), 'hex'), 1, 8));
$$;

alter function public.create_handover_qr_token(uuid, public.handover_qr_token_type, integer)
  set search_path = public, extensions, pg_catalog;

alter function public.scan_handover_qr_token(text, public.handover_qr_token_type, text, text)
  set search_path = public, extensions, pg_catalog;

alter table public.hub_inbound_receipts
  alter column receipt_code
  set default ('HIR-' || upper(substr(encode(public.yobalelma_random_bytes(8), 'hex'), 1, 12)));

alter table public.operational_incidents
  alter column incident_code
  set default ('INC-' || upper(substr(encode(public.yobalelma_random_bytes(8), 'hex'), 1, 12)));
