drop policy if exists experience_change_log_insert on public.ad_change_log;
create policy experience_change_log_insert on public.ad_change_log for insert to authenticated
with check (
  actor_id = auth.uid()
  and public.current_user_has_role(array['super_admin','admin','country_manager','partner_manager'])
);

create or replace function public.enforce_ad_campaign_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('approved','scheduled','active')
     and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    if auth.role() <> 'service_role' and not public.current_user_has_role(array['super_admin','admin']) then
      raise exception 'CAMPAIGN_REVIEW_REQUIRED' using errcode = '42501';
    end if;
    if auth.uid() is not null and new.created_by = auth.uid() then
      raise exception 'INDEPENDENT_REVIEW_REQUIRED' using errcode = '42501';
    end if;
    new.approved_by := auth.uid();
  end if;
  return new;
end;
$$;
drop trigger if exists ad_campaign_review_guard on public.ad_campaigns;
create trigger ad_campaign_review_guard before insert or update on public.ad_campaigns
for each row execute function public.enforce_ad_campaign_review();

create or replace function public.enforce_ad_creative_review()
returns trigger language plpgsql security definer set search_path = public as $$
declare campaign_creator uuid;
begin
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    if auth.role() <> 'service_role' and not public.current_user_has_role(array['super_admin','admin']) then
      raise exception 'CREATIVE_REVIEW_REQUIRED' using errcode = '42501';
    end if;
    select created_by into campaign_creator from public.ad_campaigns where id = new.campaign_id;
    if auth.uid() is not null and campaign_creator = auth.uid() then
      raise exception 'INDEPENDENT_REVIEW_REQUIRED' using errcode = '42501';
    end if;
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists ad_creative_review_guard on public.ad_creatives;
create trigger ad_creative_review_guard before insert or update on public.ad_creatives
for each row execute function public.enforce_ad_creative_review();

create or replace function public.enforce_country_experience_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('approved','published')
     and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    if auth.role() <> 'service_role' and not public.current_user_has_role(array['super_admin','admin']) then
      raise exception 'COUNTRY_EXPERIENCE_REVIEW_REQUIRED' using errcode = '42501';
    end if;
    if auth.uid() is not null and new.created_by = auth.uid() then
      raise exception 'INDEPENDENT_REVIEW_REQUIRED' using errcode = '42501';
    end if;
    if new.status = 'approved' then new.approved_by := auth.uid(); new.approved_at := now(); end if;
    if new.status = 'published' then new.published_by := auth.uid(); new.published_at := now(); end if;
  end if;
  return new;
end;
$$;
drop trigger if exists country_experience_review_guard on public.country_experience_configs;
create trigger country_experience_review_guard before insert or update on public.country_experience_configs
for each row execute function public.enforce_country_experience_review();
