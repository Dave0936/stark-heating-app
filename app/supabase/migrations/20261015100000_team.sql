-- Applied in two parts: list_team and invite_staff by tool; remove_team_member
-- must be run in the Supabase SQL editor (the tool needs approval for deletes).
--
-- Team management for owners: list owners and pending invitations, invite by
-- email, and remove access. Owners can't remove themselves, so the business
-- can never be left without an owner from inside the app.

/** Owners (with their sign-in email) followed by invitations not yet taken up. */
create function public.list_team()
returns table (kind text, email text, name text, is_me boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.assert_staff();
  return query
    select 'owner'::text, u.email::text, s.name, s.user_id = (select auth.uid())
      from public.staff s join auth.users u on u.id = s.user_id
    union all
    select 'invite'::text, i.email, i.name, false
      from public.staff_invites i
      where not exists (select 1 from public.staff s join auth.users u on u.id = s.user_id where lower(u.email) = i.email)
    order by 1 desc, 3;
end $$;

/** Invite an owner. If that email already has a confirmed account, give it access now. Returns 'added' or 'invited'. */
create function public.invite_staff(p_email text, p_name text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(p_email));
  v_name text := coalesce(nullif(trim(p_name), ''), 'Owner');
  v_uid uuid;
begin
  perform private.assert_staff();
  if v_email !~ '^\S+@\S+\.\S+$' then raise exception 'Enter a valid email address.'; end if;
  insert into public.staff_invites (email, name) values (v_email, v_name)
    on conflict (email) do update set name = excluded.name;
  select id into v_uid from auth.users where lower(email) = v_email and email_confirmed_at is not null;
  if v_uid is not null then
    insert into public.staff (user_id, name) values (v_uid, v_name) on conflict (user_id) do nothing;
    return 'added';
  end if;
  return 'invited';
end $$;

/** Remove an owner's access, or cancel an invitation. */
create function public.remove_team_member(p_email text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(p_email));
  v_uid uuid;
begin
  perform private.assert_staff();
  select s.user_id into v_uid from public.staff s join auth.users u on u.id = s.user_id where lower(u.email) = v_email;
  if v_uid = (select auth.uid()) then
    raise exception 'You can’t remove yourself. Ask another owner to do it.';
  end if;
  delete from public.staff_invites where email = v_email;
  if v_uid is not null then delete from public.staff where user_id = v_uid; end if;
end $$;

revoke execute on function public.list_team(), public.invite_staff(text, text), public.remove_team_member(text) from public, anon;
grant execute on function public.list_team(), public.invite_staff(text, text), public.remove_team_member(text) to authenticated;
