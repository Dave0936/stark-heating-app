-- Stark Heating & Gas: tables, security and server actions for the customer and owner apps.
--
-- Access model
--   * Staff (the owner) can read everything. Rows in public.staff are created
--     when someone whose email is in public.staff_invites confirms their account.
--   * Customers can read only their own records. Everything a customer changes
--     beyond their profile and properties goes through the security-definer
--     functions at the end of this file, which check ownership and status.

create schema if not exists private;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------- types

create type public.job_status as enum (
  'New request', 'Awaiting review', 'Awaiting quotation', 'Quotation issued', 'Ready to schedule',
  'Scheduled', 'In progress', 'Awaiting parts', 'Reschedule requested', 'Cancellation requested',
  'Follow-up required', 'Completed', 'Cancelled'
);
create type public.quote_status as enum ('Draft', 'Issued', 'Accepted', 'Declined', 'Superseded', 'Expired');
create type public.invoice_status as enum ('Draft', 'Issued', 'Overdue', 'Partially paid', 'Paid');

-- ---------------------------------------------------------------- tables

create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null default 'Owner',
  created_at timestamptz not null default now()
);

create table public.staff_invites (
  email text primary key check (email = lower(email)),
  name text not null default 'Owner'
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  first_name text not null,
  last_name text not null default '',
  name text generated always as (trim(first_name || ' ' || last_name)) stored,
  email text unique check (email = lower(email)),
  phone text not null default '',
  type text not null default 'Residential' check (type in ('Residential', 'Landlord')),
  contact_pref text not null default 'Email' check (contact_pref in ('Email', 'Phone', 'SMS')),
  notify jsonb not null default '{"email": true, "sms": false, "push": false}',
  created_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  nickname text not null,
  address text not null,
  town text not null,
  postcode text not null,
  property_type text not null default 'House',
  relationship text not null default 'Homeowner',
  access_notes text not null default '',
  created_at timestamptz not null default now()
);
create index on public.properties (customer_id);

create table public.appliances (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  type text not null,
  make text not null default '',
  model text not null default '',
  serial text not null default '',
  installed_on date,
  warranty_until date,
  last_service date,
  next_service date,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.appliances (property_id);

create sequence public.job_ref_seq start 1001;
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('SHG-' || nextval('public.job_ref_seq')),
  customer_id uuid not null references public.customers (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  appliance_id uuid references public.appliances (id) on delete set null,
  service text not null,
  status public.job_status not null default 'New request',
  appt_date date,
  appt_slot text check (appt_slot in ('08:00–10:00', '10:00–12:00', '12:00–14:00', '14:00–16:00')),
  engineer text not null default '',
  description text not null default '',
  preferred_times text not null default '',
  fault_code text not null default '',
  heating_working text not null default '',
  hot_water_working text not null default '',
  access_notes text not null default '',
  photos text[] not null default '{}',
  reschedule_pref text not null default '',
  quote_id uuid,
  completion jsonb,
  created_at timestamptz not null default now()
);
create index on public.jobs (customer_id);
create index on public.jobs (property_id);
create index on public.jobs (appliance_id);
create index on public.jobs (status);
-- An engineer can't hold two open jobs in the same slot.
create unique index jobs_no_double_booking on public.jobs (appt_date, appt_slot, engineer)
  where appt_date is not null and status not in ('Cancelled', 'Completed');

create table public.job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  body text not null,
  internal boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.job_events (job_id);

create table public.job_notes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  body text not null,
  author uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.job_notes (job_id);

create sequence public.quote_ref_seq start 2001;
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  ref text not null,
  version int not null default 1,
  job_id uuid not null references public.jobs (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  status public.quote_status not null default 'Issued',
  issued_on date not null default current_date,
  expires_on date not null,
  vat_rate int not null check (vat_rate in (0, 5, 20)),
  lines jsonb not null check (jsonb_typeof(lines) = 'array'),
  exclusions text[] not null default '{}',
  decision jsonb,
  created_at timestamptz not null default now(),
  unique (ref, version)
);
create index on public.quotes (job_id);
create index on public.quotes (customer_id);
alter table public.jobs add constraint jobs_quote_id_fkey foreign key (quote_id) references public.quotes (id) on delete set null;
create index on public.jobs (quote_id);

create sequence public.invoice_ref_seq start 401;
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('INV-' || lpad(nextval('public.invoice_ref_seq')::text, 4, '0')),
  customer_id uuid not null references public.customers (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete set null,
  issued_on date not null default current_date,
  due_on date not null default (current_date + 14),
  vat_rate int not null default 20 check (vat_rate in (0, 5, 20)),
  lines jsonb not null check (jsonb_typeof(lines) = 'array'),
  paid int not null default 0 check (paid >= 0),
  status public.invoice_status not null default 'Issued',
  created_at timestamptz not null default now()
);
create index on public.invoices (customer_id);
create index on public.invoices (job_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  amount int not null check (amount > 0),
  method text not null,
  paid_on date not null default current_date,
  recorded_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.payments (invoice_id);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  type text not null,
  title text not null,
  issued_on date not null default current_date,
  job_id uuid references public.jobs (id) on delete set null,
  quote_id uuid references public.quotes (id) on delete set null,
  invoice_id uuid references public.invoices (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.documents (customer_id);
create index on public.documents (property_id);
create index on public.documents (job_id);
create index on public.documents (quote_id);
create index on public.documents (invoice_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  body text not null,
  target text not null default '' check (target in ('', 'quote', 'doc', 'job', 'book')),
  target_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (customer_id, created_at desc);

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  job_id uuid references public.jobs (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.activity (created_at desc);
create index on public.activity (job_id);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  appliance_id uuid not null references public.appliances (id) on delete cascade,
  due date not null,
  log text not null,
  created_at timestamptz not null default now(),
  unique (appliance_id, due)
);

create table public.settings (
  id boolean primary key default true check (id),
  reminder_days int not null default 28 check (reminder_days between 7 and 56),
  disabled_services text[] not null default '{}'
);
insert into public.settings default values;

-- ---------------------------------------------------------------- helpers

create function private.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff where user_id = (select auth.uid()));
$$;

create function private.my_customer_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.customers where user_id = (select auth.uid());
$$;

grant execute on function private.is_staff(), private.my_customer_id() to authenticated;

create function private.assert_staff() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_staff() then
    raise exception 'Only Stark staff can do that.' using errcode = '42501';
  end if;
end $$;

create function private.log_event(p_job uuid, p_body text, p_internal boolean default false) returns void
language sql security definer set search_path = '' as $$
  insert into public.job_events (job_id, body, internal) values (p_job, p_body, p_internal);
$$;

create function private.log_activity(p_body text, p_job uuid default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.activity (body, job_id) values (p_body, p_job);
$$;

create function private.notify(p_customer uuid, p_body text, p_target text default '', p_target_id uuid default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (customer_id, body, target, target_id) values (p_customer, p_body, p_target, p_target_id);
$$;

/** "Wed 14 Oct" */
create function private.fd(d date) returns text
language sql immutable set search_path = '' as $$
  select to_char(d, 'Dy FMDD Mon');
$$;

/** Total in pence (subtotal plus VAT, VAT rounded to the penny). */
create function private.total(p_lines jsonb, p_vat int) returns int
language sql immutable set search_path = '' as $$
  with s as (select coalesce(sum((l ->> 'q')::int * (l ->> 'u')::int), 0) as sub from jsonb_array_elements(p_lines) l)
  select (sub + round(sub * p_vat / 100.0))::int from s;
$$;

create function private.customer_label(s public.job_status) returns text
language sql immutable set search_path = '' as $$
  select case s
    when 'New request' then 'Request received'
    when 'Awaiting review' then 'Awaiting confirmation'
    when 'Ready to schedule' then 'Awaiting scheduling'
    when 'Scheduled' then 'Confirmed'
    when 'Follow-up required' then 'We''ll be in touch'
    else s::text end;
$$;

-- ---------------------------------------------------------------- row level security

alter table public.staff enable row level security;
alter table public.staff_invites enable row level security;
alter table public.customers enable row level security;
alter table public.properties enable row level security;
alter table public.appliances enable row level security;
alter table public.jobs enable row level security;
alter table public.job_events enable row level security;
alter table public.job_notes enable row level security;
alter table public.quotes enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.activity enable row level security;
alter table public.reminders enable row level security;
alter table public.settings enable row level security;

-- Nothing is readable without signing in.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

create policy "staff read staff" on public.staff for select to authenticated using ((select private.is_staff()));
create policy "staff manage invites" on public.staff_invites for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "read own or staff" on public.customers for select to authenticated
  using ((select private.is_staff()) or user_id = (select auth.uid()));
create policy "update own or staff" on public.customers for update to authenticated
  using ((select private.is_staff()) or user_id = (select auth.uid()))
  with check ((select private.is_staff()) or user_id = (select auth.uid()));
create policy "staff insert" on public.customers for insert to authenticated with check ((select private.is_staff()));
create policy "staff delete" on public.customers for delete to authenticated using ((select private.is_staff()));
-- Customers may only edit their own contact details.
revoke update on public.customers from authenticated;
grant update (first_name, last_name, phone, contact_pref, notify) on public.customers to authenticated;

create policy "read own or staff" on public.properties for select to authenticated
  using ((select private.is_staff()) or customer_id = (select private.my_customer_id()));
create policy "insert own or staff" on public.properties for insert to authenticated
  with check ((select private.is_staff()) or customer_id = (select private.my_customer_id()));
create policy "update own or staff" on public.properties for update to authenticated
  using ((select private.is_staff()) or customer_id = (select private.my_customer_id()))
  with check ((select private.is_staff()) or customer_id = (select private.my_customer_id()));
create policy "staff delete" on public.properties for delete to authenticated using ((select private.is_staff()));

create policy "read own or staff" on public.appliances for select to authenticated
  using ((select private.is_staff()) or property_id in (select id from public.properties where customer_id = (select private.my_customer_id())));
create policy "staff write" on public.appliances for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "read own or staff" on public.jobs for select to authenticated
  using ((select private.is_staff()) or customer_id = (select private.my_customer_id()));
create policy "staff write" on public.jobs for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "read own public events or staff" on public.job_events for select to authenticated
  using ((select private.is_staff()) or (not internal and job_id in (select id from public.jobs where customer_id = (select private.my_customer_id()))));
create policy "staff write" on public.job_events for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "staff only" on public.job_notes for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "read own issued or staff" on public.quotes for select to authenticated
  using ((select private.is_staff()) or (customer_id = (select private.my_customer_id()) and status <> 'Draft'));
create policy "staff write" on public.quotes for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "read own issued or staff" on public.invoices for select to authenticated
  using ((select private.is_staff()) or (customer_id = (select private.my_customer_id()) and status <> 'Draft'));
create policy "staff write" on public.invoices for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "read own or staff" on public.payments for select to authenticated
  using ((select private.is_staff()) or invoice_id in (select id from public.invoices where customer_id = (select private.my_customer_id())));
create policy "staff write" on public.payments for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "read own or staff" on public.documents for select to authenticated
  using ((select private.is_staff()) or customer_id = (select private.my_customer_id()));
create policy "staff write" on public.documents for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "read own or staff" on public.notifications for select to authenticated
  using ((select private.is_staff()) or customer_id = (select private.my_customer_id()));
create policy "staff write" on public.notifications for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "staff only" on public.activity for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff only" on public.reminders for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "signed-in read" on public.settings for select to authenticated using (true);
create policy "staff update" on public.settings for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

-- ---------------------------------------------------------------- accounts

-- When an account is confirmed: invited staff become staff; everyone else is
-- linked to the customer record with their email, or gets a new one.
create function private.handle_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(new.email);
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}');
begin
  if new.email_confirmed_at is null then return new; end if;
  if exists (select 1 from public.staff where user_id = new.id)
     or exists (select 1 from public.customers where user_id = new.id) then
    return new;
  end if;
  if exists (select 1 from public.staff_invites where email = v_email) then
    insert into public.staff (user_id, name) select new.id, name from public.staff_invites where email = v_email;
    return new;
  end if;
  update public.customers set user_id = new.id where email = v_email and user_id is null;
  if not found then
    insert into public.customers (user_id, first_name, last_name, email, phone)
    values (new.id, coalesce(nullif(trim(v_meta ->> 'first_name'), ''), 'Customer'), coalesce(trim(v_meta ->> 'last_name'), ''), v_email, coalesce(trim(v_meta ->> 'phone'), ''));
  end if;
  return new;
end $$;

create trigger on_auth_user_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row execute function private.handle_auth_user();

/** Which app the signed-in user gets: {"role":"owner"} or {"role":"customer","cid":...}. */
create function public.whoami() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case
    when private.is_staff() then jsonb_build_object('role', 'owner')
    when private.my_customer_id() is not null then jsonb_build_object('role', 'customer', 'cid', private.my_customer_id())
    else null end;
$$;

-- ---------------------------------------------------------------- customer actions

create function public.submit_booking(
  p_property uuid, p_service text, p_appliance uuid, p_description text, p_fault text,
  p_heating text, p_hot text, p_pref text, p_access text, p_photos text[]
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_cid uuid := private.my_customer_id();
  v_job public.jobs;
begin
  if v_cid is null then raise exception 'Sign in with a customer account to book.' using errcode = '42501'; end if;
  if not exists (select 1 from public.properties where id = p_property and customer_id = v_cid) then
    raise exception 'Choose one of your properties.' using errcode = '42501';
  end if;
  if p_appliance is not null and not exists (select 1 from public.appliances where id = p_appliance and property_id = p_property) then
    raise exception 'That appliance isn''t at this property.';
  end if;
  if coalesce(trim(p_service), '') = '' or p_service = any ((select disabled_services from public.settings)) then
    raise exception 'That service isn''t available to book right now.';
  end if;
  insert into public.jobs (customer_id, property_id, appliance_id, service, description, fault_code, heating_working,
                           hot_water_working, preferred_times, access_notes, photos)
  values (v_cid, p_property, p_appliance, p_service, coalesce(nullif(trim(p_description), ''), p_service), coalesce(trim(p_fault), ''),
          coalesce(p_heating, ''), coalesce(p_hot, ''), coalesce(p_pref, ''), coalesce(p_access, ''), coalesce(p_photos[1:6], '{}'))
  returning * into v_job;
  perform private.log_event(v_job.id, 'Request received');
  perform private.log_activity('New request ' || v_job.ref || ': ' || p_service || ' · ' || (select name from public.customers where id = v_cid), v_job.id);
  perform private.notify(v_cid, 'We''ve received your request ' || v_job.ref || '. We''ll confirm a date with you.', 'job', v_job.id);
  return jsonb_build_object('id', v_job.id, 'ref', v_job.ref);
end $$;

create function public.request_cancellation(p_job uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_job public.jobs;
begin
  select * into v_job from public.jobs where id = p_job and customer_id = private.my_customer_id() for update;
  if not found then raise exception 'Booking not found.' using errcode = '42501'; end if;
  if v_job.status not in ('New request', 'Scheduled', 'Ready to schedule', 'Reschedule requested') then
    raise exception 'This booking can''t be cancelled now. Please call us.';
  end if;
  update public.jobs set status = 'Cancellation requested' where id = p_job;
  perform private.log_event(p_job, 'Cancellation requested by customer');
  perform private.log_activity(v_job.ref || ' cancellation requested · ' || (select name from public.customers where id = v_job.customer_id), p_job);
end $$;

create function public.request_reschedule(p_job uuid, p_pref text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_job public.jobs;
begin
  select * into v_job from public.jobs where id = p_job and customer_id = private.my_customer_id() for update;
  if not found then raise exception 'Booking not found.' using errcode = '42501'; end if;
  if v_job.status <> 'Scheduled' then raise exception 'Only confirmed bookings can be moved.'; end if;
  if coalesce(trim(p_pref), '') = '' then raise exception 'Choose a preferred day.'; end if;
  update public.jobs set status = 'Reschedule requested', reschedule_pref = trim(p_pref) where id = p_job;
  perform private.log_event(p_job, 'Reschedule requested: ' || trim(p_pref) || ' (current booking kept until confirmed)');
  perform private.log_activity(v_job.ref || ' reschedule requested · ' || (select name from public.customers where id = v_job.customer_id), p_job);
end $$;

create function public.decide_quote(p_quote uuid, p_decision text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_q public.quotes;
  v_name text;
begin
  if p_decision not in ('Accepted', 'Declined') then raise exception 'Unknown decision.'; end if;
  select * into v_q from public.quotes where id = p_quote and customer_id = private.my_customer_id() for update;
  if not found then raise exception 'Quotation not found.' using errcode = '42501'; end if;
  if v_q.status <> 'Issued' then raise exception 'This quotation has already been decided or replaced.'; end if;
  if v_q.expires_on < current_date then raise exception 'This quotation has expired. Please call us for an updated price.'; end if;
  select name into v_name from public.customers where id = v_q.customer_id;
  update public.quotes
    set status = p_decision::public.quote_status,
        decision = jsonb_build_object('d', p_decision, 'by', v_name, 'at', now(), 'ver', v_q.version)
    where id = p_quote;
  update public.jobs set status = (case when p_decision = 'Accepted' then 'Ready to schedule' else 'Follow-up required' end)::public.job_status
    where id = v_q.job_id;
  perform private.log_event(v_q.job_id, 'Quotation ' || v_q.ref || ' v' || v_q.version || ' ' || lower(p_decision) || ' by customer');
  perform private.log_activity(v_q.ref || ' v' || v_q.version || ' ' || lower(p_decision) || ' by ' || v_name, v_q.job_id);
end $$;

-- ---------------------------------------------------------------- staff actions

create function public.set_job_status(p_job uuid, p_status public.job_status, p_text text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_job public.jobs;
begin
  perform private.assert_staff();
  select * into v_job from public.jobs where id = p_job for update;
  if not found then raise exception 'Job not found.'; end if;
  if not (
    (p_status = 'In progress' and v_job.status in ('Scheduled', 'Awaiting parts')) or
    (p_status = 'Awaiting parts' and v_job.status = 'In progress') or
    (p_status = 'Cancelled' and v_job.status not in ('Completed', 'Cancelled'))
  ) then
    raise exception 'Can''t move % from % to %.', v_job.ref, v_job.status, p_status;
  end if;
  update public.jobs set status = p_status where id = p_job;
  perform private.log_event(p_job, p_text);
  perform private.notify(v_job.customer_id, v_job.ref || ': ' || private.customer_label(p_status) || '.', 'job', p_job);
  perform private.log_activity(v_job.ref || ' → ' || p_status, p_job);
end $$;

create function public.schedule_job(p_job uuid, p_date date, p_slot text, p_engineer text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_job public.jobs;
  v_clash text;
  v_label text := private.fd(p_date) || ', ' || p_slot || ' · ' || p_engineer;
  v_prev text;
begin
  perform private.assert_staff();
  select * into v_job from public.jobs where id = p_job for update;
  if not found then raise exception 'Job not found.'; end if;
  if v_job.status not in ('New request', 'Awaiting review', 'Ready to schedule', 'Reschedule requested', 'Cancellation requested', 'Scheduled') then
    raise exception '% can''t be scheduled while it is %.', v_job.ref, v_job.status;
  end if;
  if p_date < current_date or extract(isodow from p_date) > 5 then raise exception 'Choose a weekday from today onwards.'; end if;
  select ref into v_clash from public.jobs
    where id <> p_job and appt_date = p_date and appt_slot = p_slot and engineer = p_engineer and status not in ('Cancelled', 'Completed');
  if v_clash is not null then
    raise exception '% is already booked %, % (%). Choose another slot or engineer.', p_engineer, private.fd(p_date), p_slot, v_clash;
  end if;
  v_prev := case when v_job.appt_date is not null then private.fd(v_job.appt_date) || ', ' || v_job.appt_slot end;
  update public.jobs set appt_date = p_date, appt_slot = p_slot, engineer = p_engineer, status = 'Scheduled' where id = p_job;
  perform private.log_event(p_job, case when v_prev is not null then 'Rescheduled from ' || v_prev || ' to ' || v_label else 'Appointment confirmed: ' || v_label end);
  perform private.notify(v_job.customer_id,
    case when v_prev is not null then 'Your appointment ' || v_job.ref || ' has moved to ' else 'Your appointment ' || v_job.ref || ' is confirmed for ' end
      || private.fd(p_date) || ', ' || p_slot || '.', 'job', p_job);
  perform private.log_activity(v_job.ref || ' scheduled ' || v_label, p_job);
end $$;

create function public.add_job_note(p_job uuid, p_body text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_staff();
  if coalesce(trim(p_body), '') = '' then raise exception 'Write a note first.'; end if;
  insert into public.job_notes (job_id, body) values (p_job, trim(p_body));
  perform private.log_event(p_job, 'Internal note added', true);
end $$;

create function public.complete_job(p_job uuid, p_summary text, p_findings text, p_recs text, p_hours text, p_next_due date) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_job public.jobs;
  v_service boolean;
begin
  perform private.assert_staff();
  select * into v_job from public.jobs where id = p_job for update;
  if not found then raise exception 'Job not found.'; end if;
  if v_job.status not in ('In progress', 'Awaiting parts') then raise exception 'Start the job before completing it.'; end if;
  if coalesce(trim(p_summary), '') = '' then raise exception 'Add a summary of the work carried out.'; end if;
  if coalesce(p_hours, '') <> '' and p_hours !~ '^\d+(\.\d+)?$' then raise exception 'Labour should be a number of hours.'; end if;
  if v_job.appliance_id is not null and (p_next_due is null or p_next_due <= current_date) then raise exception 'Set the next service due date.'; end if;
  v_service := v_job.service ~* 'service';
  update public.jobs set status = 'Completed', completion = jsonb_build_object(
      'summary', trim(p_summary), 'findings', coalesce(nullif(trim(p_findings), ''), 'No issues found.'), 'recs', coalesce(trim(p_recs), ''),
      'hours', coalesce(p_hours, ''), 'date', current_date, 'eng', coalesce(nullif(v_job.engineer, ''), 'Owner (you)'))
    where id = p_job;
  if v_job.appliance_id is not null and v_job.service ~* 'service|inspection' then
    update public.appliances set last_service = current_date, next_service = p_next_due where id = v_job.appliance_id;
  end if;
  insert into public.documents (customer_id, property_id, type, title, job_id)
    values (v_job.customer_id, v_job.property_id,
            case when v_service then 'Service report' else 'Job completion report' end,
            case when v_service then 'Boiler service report' else 'Job report: ' || v_job.service end, p_job);
  perform private.log_event(p_job, 'Work completed. Report available.');
  perform private.notify(v_job.customer_id, 'Job ' || v_job.ref || ' is complete. Your report is in Documents.', 'job', p_job);
  perform private.log_activity(v_job.ref || ' completed · ' || (select name from public.customers where id = v_job.customer_id), p_job);
end $$;

create function public.issue_quote(p_job uuid, p_base uuid, p_lines jsonb, p_vat int, p_expires date, p_exclusions text[]) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_job public.jobs;
  v_ref text;
  v_ver int := 1;
  v_id uuid;
  l jsonb;
begin
  perform private.assert_staff();
  select * into v_job from public.jobs where id = p_job for update;
  if not found then raise exception 'Job not found.'; end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then raise exception 'Add at least one item.'; end if;
  for l in select * from jsonb_array_elements(p_lines) loop
    if coalesce(trim(l ->> 'd'), '') = '' or jsonb_typeof(l -> 'q') <> 'number' or (l ->> 'q')::int <= 0
       or jsonb_typeof(l -> 'u') <> 'number' or (l ->> 'u')::int < 0 then
      raise exception 'Every item needs a description, a whole-number quantity and a price like 120.00.';
    end if;
  end loop;
  if p_expires is null or p_expires <= current_date then raise exception 'Set an expiry date after today.'; end if;
  if p_base is not null then
    select ref, version + 1 into v_ref, v_ver from public.quotes where id = p_base and job_id = p_job and status in ('Issued', 'Declined') for update;
    if v_ref is null then raise exception 'Only an issued or declined quotation can be revised.'; end if;
    update public.quotes set status = 'Superseded' where id = p_base;
  else
    v_ref := 'Q-' || nextval('public.quote_ref_seq');
  end if;
  insert into public.quotes (ref, version, job_id, customer_id, status, expires_on, vat_rate, lines, exclusions)
    values (v_ref, v_ver, p_job, v_job.customer_id, 'Issued', p_expires, p_vat, p_lines, coalesce(p_exclusions, '{}'))
    returning id into v_id;
  update public.jobs set status = 'Quotation issued', quote_id = v_id where id = p_job;
  insert into public.documents (customer_id, property_id, type, title, quote_id)
    values (v_job.customer_id, v_job.property_id, 'Quotation', 'Quotation ' || v_ref || ' v' || v_ver, v_id);
  perform private.log_event(p_job, 'Quotation ' || v_ref || ' v' || v_ver || ' issued');
  perform private.notify(v_job.customer_id, 'Your quotation ' || v_ref || case when v_ver > 1 then ' (version ' || v_ver || ')' else '' end || ' is ready to review.', 'quote', v_id);
  perform private.log_activity('Quotation ' || v_ref || ' v' || v_ver || ' issued to ' || (select name from public.customers where id = v_job.customer_id), p_job);
  return v_id;
end $$;

create function public.record_payment(p_invoice uuid, p_amount int, p_method text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_inv public.invoices;
  v_total int;
begin
  perform private.assert_staff();
  select * into v_inv from public.invoices where id = p_invoice for update;
  if not found then raise exception 'Invoice not found.'; end if;
  v_total := private.total(v_inv.lines, v_inv.vat_rate);
  if p_amount is null or p_amount <= 0 then raise exception 'Enter an amount in pounds, e.g. 50.00'; end if;
  if p_amount > v_total - v_inv.paid then raise exception 'That''s more than the balance of £%.', to_char((v_total - v_inv.paid) / 100.0, 'FM999,990.00'); end if;
  insert into public.payments (invoice_id, amount, method) values (p_invoice, p_amount, p_method);
  update public.invoices set paid = paid + p_amount,
    status = (case when paid + p_amount >= v_total then 'Paid' else 'Partially paid' end)::public.invoice_status
    where id = p_invoice;
  perform private.log_activity('Payment £' || to_char(p_amount / 100.0, 'FM999,990.00') || ' recorded on ' || v_inv.ref || ' · ' || (select name from public.customers where id = v_inv.customer_id), v_inv.job_id);
  perform private.notify(v_inv.customer_id, 'Payment of £' || to_char(p_amount / 100.0, 'FM999,990.00') || ' received for ' || v_inv.ref || '. Thank you.');
end $$;

create function public.send_service_reminder(p_appliance uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_app public.appliances;
  v_cid uuid;
begin
  perform private.assert_staff();
  select * into v_app from public.appliances where id = p_appliance;
  if not found or v_app.next_service is null then raise exception 'This appliance has no service date.'; end if;
  select customer_id into v_cid from public.properties where id = v_app.property_id;
  insert into public.reminders (appliance_id, due, log)
    values (p_appliance, v_app.next_service, 'In-app: delivered · Email: not sent (provider not configured)')
    on conflict (appliance_id, due) do nothing;
  if not found then return; end if;
  perform private.notify(v_cid, 'Your ' || lower(v_app.type) || ' service is due on ' || to_char(v_app.next_service, 'FMDD Mon YYYY') || '. Book it in a couple of taps.', 'book');
  perform private.log_activity('Service reminder logged · ' || (select name from public.customers where id = v_cid));
end $$;

-- Only signed-in users may call the API functions; the role checks are inside each one.
revoke execute on function
  public.whoami(), public.submit_booking(uuid, text, uuid, text, text, text, text, text, text, text[]),
  public.request_cancellation(uuid), public.request_reschedule(uuid, text), public.decide_quote(uuid, text),
  public.set_job_status(uuid, public.job_status, text), public.schedule_job(uuid, date, text, text),
  public.add_job_note(uuid, text), public.complete_job(uuid, text, text, text, text, date),
  public.issue_quote(uuid, uuid, jsonb, int, date, text[]), public.record_payment(uuid, int, text),
  public.send_service_reminder(uuid)
  from public, anon;
grant execute on function
  public.whoami(), public.submit_booking(uuid, text, uuid, text, text, text, text, text, text, text[]),
  public.request_cancellation(uuid), public.request_reschedule(uuid, text), public.decide_quote(uuid, text),
  public.set_job_status(uuid, public.job_status, text), public.schedule_job(uuid, date, text, text),
  public.add_job_note(uuid, text), public.complete_job(uuid, text, text, text, text, date),
  public.issue_quote(uuid, uuid, jsonb, int, date, text[]), public.record_payment(uuid, int, text),
  public.send_service_reminder(uuid)
  to authenticated;
revoke execute on all functions in schema private from public, anon;
grant execute on function private.is_staff(), private.my_customer_id() to authenticated;

-- ---------------------------------------------------------------- live updates

alter publication supabase_realtime add table
  public.customers, public.properties, public.appliances, public.jobs, public.job_events, public.job_notes,
  public.quotes, public.invoices, public.payments, public.documents, public.notifications, public.activity,
  public.reminders, public.settings;
