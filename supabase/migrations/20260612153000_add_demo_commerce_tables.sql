create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  customer_code text not null unique,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references customers(id) on delete cascade,
  status text not null check (status in ('processing', 'packed', 'shipped', 'delivered', 'exception', 'cancelled')),
  total_amount numeric(10, 2) not null,
  currency text not null default 'USD',
  placed_at timestamptz not null,
  shipping_address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_name text not null,
  sku text not null,
  quantity integer not null,
  unit_price numeric(10, 2) not null,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  tracking_number text not null unique,
  carrier text not null,
  status text not null check (status in ('label_created', 'in_transit', 'out_for_delivery', 'delivered', 'delayed', 'exception')),
  latest_update text not null,
  last_location text,
  estimated_delivery_date date,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null check (status in ('requested', 'approved', 'received', 'completed', 'rejected')),
  reason text not null,
  requested_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null check (status in ('pending', 'processed', 'failed')),
  amount numeric(10, 2) not null,
  currency text not null default 'USD',
  requested_at timestamptz not null,
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_email on customers(email);
create index if not exists idx_orders_customer_id on orders(customer_id);
create index if not exists idx_orders_placed_at on orders(placed_at desc);
create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_shipments_order_id on shipments(order_id);
create index if not exists idx_returns_order_id on returns(order_id);
create index if not exists idx_refunds_order_id on refunds(order_id);
