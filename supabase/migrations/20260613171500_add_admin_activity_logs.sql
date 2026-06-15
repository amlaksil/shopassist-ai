create table if not exists admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  actor_name text not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_activity_logs_target on admin_activity_logs(target_type, target_id);
create index if not exists idx_admin_activity_logs_created_at on admin_activity_logs(created_at desc);

alter table public.admin_activity_logs enable row level security;

drop policy if exists support_admin_select on public.admin_activity_logs;
create policy support_admin_select
on public.admin_activity_logs
for select
to authenticated
using (public.is_support_admin());

drop policy if exists support_admin_insert on public.admin_activity_logs;
create policy support_admin_insert
on public.admin_activity_logs
for insert
to authenticated
with check (public.is_support_admin());

drop policy if exists support_admin_update on public.admin_activity_logs;
create policy support_admin_update
on public.admin_activity_logs
for update
to authenticated
using (public.is_support_admin())
with check (public.is_support_admin());

drop policy if exists support_admin_delete on public.admin_activity_logs;
create policy support_admin_delete
on public.admin_activity_logs
for delete
to authenticated
using (public.is_support_admin());
