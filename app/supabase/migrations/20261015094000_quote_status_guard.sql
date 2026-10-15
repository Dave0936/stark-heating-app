-- Only quote jobs that are waiting for a price (or being re-quoted), and reset the
-- reference counters used up while testing.
create or replace function public.issue_quote(p_job uuid, p_base uuid, p_lines jsonb, p_vat int, p_expires date, p_exclusions text[]) returns uuid
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
  if v_job.status not in ('New request', 'Awaiting review', 'Awaiting quotation', 'Quotation issued', 'Follow-up required') then
    raise exception '% is % and can''t be quoted now.', v_job.ref, v_job.status;
  end if;
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

select setval('public.job_ref_seq', 1001, false);
select setval('public.quote_ref_seq', 2001, false);
