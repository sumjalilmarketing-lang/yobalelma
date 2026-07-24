create or replace function public.dispatch_local_delivery_missions(
  p_shipment_id uuid,
  p_candidate_limit integer default 3
)
returns table (mission_id uuid, transporter_id uuid, score integer)
language plpgsql
security invoker
set search_path = public, extensions, pg_catalog
as $$
declare
  v_match record;
  v_mission_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  for v_match in
    select * from public.find_local_transporter_matches(p_shipment_id) as candidate
    order by candidate.score desc
    limit greatest(p_candidate_limit, 1)
  loop
    insert into public.local_delivery_missions (
      shipment_id, transporter_id, status, score, reason, offered_at
    ) values (
      p_shipment_id, v_match.transporter_id, 'offered', v_match.score, v_match.reason, now()
    )
    on conflict on constraint local_delivery_missions_shipment_id_transporter_id_key
    do update set
      status = case
        when public.local_delivery_missions.status = 'accepted' then 'accepted'::public.local_delivery_mission_status
        else 'offered'::public.local_delivery_mission_status
      end,
      score = excluded.score,
      reason = excluded.reason,
      offered_at = coalesce(public.local_delivery_missions.offered_at, excluded.offered_at),
      updated_at = now()
    returning id into v_mission_id;

    update public.pickup_requests
    set status = 'dispatched',
        mission_id = coalesce(public.pickup_requests.mission_id, v_mission_id),
        dispatched_at = coalesce(public.pickup_requests.dispatched_at, now())
    where shipment_id = p_shipment_id and status in ('requested', 'dispatched');

    mission_id := v_mission_id;
    transporter_id := v_match.transporter_id;
    score := v_match.score;
    return next;
  end loop;

  update public.shipments set status = 'matching'
  where id = p_shipment_id and status = 'confirmed';
end;
$$;

alter function public.verify_delivery_otp(
  uuid, public.final_delivery_mode, text, uuid, text, text, text, text, text
) set search_path = public, extensions;
