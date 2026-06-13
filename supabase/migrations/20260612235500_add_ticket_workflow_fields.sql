alter table support_tickets
  drop constraint if exists support_tickets_status_check;

alter table support_tickets
  add column if not exists assignee text,
  add constraint support_tickets_status_check
    check (status in ('open', 'in_progress', 'waiting_on_customer', 'resolved'));
