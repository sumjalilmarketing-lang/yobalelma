alter function public.governance_create_mission_tasks() security definer;
alter function public.governance_notify_mission_event() security definer;
alter function public.governance_apply_automation_rules() security definer;

revoke all on function public.governance_create_mission_tasks() from public;
revoke all on function public.governance_notify_mission_event() from public;
revoke all on function public.governance_apply_automation_rules() from public;
