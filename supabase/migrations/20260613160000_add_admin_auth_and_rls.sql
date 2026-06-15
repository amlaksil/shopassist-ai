create table if not exists support_admin_emails (
  email text primary key,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_admin_emails_is_active on support_admin_emails(is_active);

insert into support_admin_emails (email, display_name, is_active)
values
  ('support@shopassist.local', 'Support Lead', true),
  ('hana@shopassist.local', 'Hana Tesfaye', true),
  ('samuel@shopassist.local', 'Samuel Bekele', true),
  ('meklit@shopassist.local', 'Meklit Alemu', true)
on conflict (email) do update set
  display_name = excluded.display_name,
  is_active = excluded.is_active,
  updated_at = now();

create or replace function public.is_support_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.support_admin_emails
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and is_active = true
  );
$$;

do $$
declare
  table_name text;
  protected_tables text[] := array[
    'faq_articles',
    'products',
    'customers',
    'orders',
    'order_items',
    'shipments',
    'returns',
    'refunds',
    'conversations',
    'messages',
    'support_tickets',
    'support_admin_emails'
  ];
begin
  foreach table_name in array protected_tables loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists support_admin_select on public.%I', table_name);
    execute format(
      'create policy support_admin_select on public.%I for select to authenticated using (public.is_support_admin())',
      table_name
    );
    execute format('drop policy if exists support_admin_insert on public.%I', table_name);
    execute format(
      'create policy support_admin_insert on public.%I for insert to authenticated with check (public.is_support_admin())',
      table_name
    );
    execute format('drop policy if exists support_admin_update on public.%I', table_name);
    execute format(
      'create policy support_admin_update on public.%I for update to authenticated using (public.is_support_admin()) with check (public.is_support_admin())',
      table_name
    );
    execute format('drop policy if exists support_admin_delete on public.%I', table_name);
    execute format(
      'create policy support_admin_delete on public.%I for delete to authenticated using (public.is_support_admin())',
      table_name
    );
  end loop;
end $$;
