alter table support_tickets
  add column if not exists order_number text,
  add column if not exists checkout_email text,
  add column if not exists shipment_status text,
  add column if not exists escalation_reason text,
  add column if not exists priority text check (priority in ('high', 'medium', 'low')),
  add column if not exists timeline_summary text;
