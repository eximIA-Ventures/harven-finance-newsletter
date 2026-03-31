-- Email delivery tracking for Harven Finance Newsletter
-- Run this in Supabase SQL Editor

create table if not exists email_logs (
  id bigint generated always as identity primary key,
  edition_id text not null,
  email text not null,
  resend_id text,
  status text not null default 'sent'
    check (status in ('sent', 'delivered', 'bounced', 'complained', 'failed')),
  error text,
  sent_at timestamptz not null default now(),
  delivered_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_email_logs_edition on email_logs (edition_id);
create index if not exists idx_email_logs_resend_id on email_logs (resend_id) where resend_id is not null;
create index if not exists idx_email_logs_status on email_logs (status);

-- RLS (service key bypasses, but good practice)
alter table email_logs enable row level security;

-- Allow service role full access
create policy "service_role_all" on email_logs
  for all using (true) with check (true);
