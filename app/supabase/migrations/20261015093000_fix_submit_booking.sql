-- Fix the disabled-services check (text = text[] comparison).
create or replace function public.submit_booking(
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
  if coalesce(trim(p_service), '') = '' or exists (select 1 from public.settings where p_service = any (disabled_services)) then
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
