-- Fix ambiguous PL/pgSQL references in final delivery RPCs.
-- These functions intentionally return a column named "status" for API compatibility.
-- Without the directive below, unqualified SQL column references can conflict with
-- the output parameter in Postgres and break destination QR / OTP workflows.

create or replace function public._yobalelma_apply_variable_conflict_use_column(
  p_signature regprocedure
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_definition text;
  v_patched_definition text;
begin
  select pg_get_functiondef(p_signature)
  into v_definition;

  if v_definition is null then
    raise exception 'Function % not found', p_signature::text;
  end if;

  if position('#variable_conflict use_column' in v_definition) > 0 then
    return;
  end if;

  v_patched_definition := replace(
    v_definition,
    'AS $function$',
    'AS $function$' || chr(10) || '#variable_conflict use_column'
  );

  if v_patched_definition = v_definition then
    raise exception 'Unable to patch function body delimiter for %', p_signature::text;
  end if;

  execute v_patched_definition;
end;
$$;

select public._yobalelma_apply_variable_conflict_use_column(
  'public.confirm_destination_batch_reception(uuid,uuid,text,public.final_delivery_mode)'::regprocedure
);

select public._yobalelma_apply_variable_conflict_use_column(
  'public.verify_delivery_otp(uuid,public.final_delivery_mode,text,uuid,text,text,text,text,text)'::regprocedure
);

select public._yobalelma_apply_variable_conflict_use_column(
  'public.create_final_mile_delivery_mission(uuid,uuid,text)'::regprocedure
);

drop function public._yobalelma_apply_variable_conflict_use_column(regprocedure);
