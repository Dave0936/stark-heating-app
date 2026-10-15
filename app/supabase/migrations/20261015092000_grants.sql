-- This project doesn't grant table privileges to the API roles by default, so
-- grant them explicitly. Row-level security still decides which rows each
-- user can see or change; the anon role gets nothing.

grant select on all tables in schema public to authenticated;
grant insert, delete on public.customers to authenticated;
grant insert, update, delete on
  public.staff_invites, public.properties, public.appliances, public.jobs, public.job_events, public.job_notes,
  public.quotes, public.invoices, public.payments, public.documents, public.notifications, public.activity, public.reminders
  to authenticated;
grant update on public.settings to authenticated;

grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
