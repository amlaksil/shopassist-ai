create extension if not exists pgcrypto;

create table if not exists faq_articles (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null,
  keywords text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  description text not null,
  price numeric(10, 2) not null,
  currency text not null default 'USD',
  category text not null,
  inventory_status text not null,
  attributes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  channel text not null default 'webchat',
  status text not null,
  provider_used text not null,
  latest_message text not null default '',
  customer_name text,
  customer_email text,
  issue_category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  session_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  provider_used text,
  model_used text,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  name text not null,
  email text not null,
  issue_summary text not null,
  issue_category text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  provider_used text,
  model_used text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_faq_articles_category on faq_articles(category);
create index if not exists idx_products_category on products(category);
create index if not exists idx_conversations_status on conversations(status);
create index if not exists idx_conversations_updated_at on conversations(updated_at desc);
create index if not exists idx_messages_session_id on messages(session_id);
create index if not exists idx_support_tickets_status on support_tickets(status);
create index if not exists idx_support_tickets_created_at on support_tickets(created_at desc);

