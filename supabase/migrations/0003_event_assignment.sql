-- Per-event user access: an event can be assigned to a login (auth.users)
-- distinct from the admin who created it. One user may be assigned to many
-- events; an event has at most one assigned user.
alter table events add column assigned_user_id uuid references auth.users(id);
create index events_assigned_user_id_idx on events(assigned_user_id);

-- Role is stored in auth.users.app_metadata.role ('admin' | 'event_user'),
-- set only via the Supabase Admin API (service role) — not readable/writable
-- by the user themselves. RLS below doesn't need to check it: an event's
-- created_by is always the admin who made it, so "created_by OR
-- assigned_user_id" already gives admins full access to their own events and
-- event_users access to only what they're assigned.

drop policy "admin_all_events" on events;
create policy "owner_or_assigned_events" on events for all
  using (created_by = auth.uid() or assigned_user_id = auth.uid())
  with check (created_by = auth.uid() or assigned_user_id = auth.uid());

drop policy "admin_all_artists" on artists;
create policy "owner_or_assigned_artists" on artists for all
  using (exists (
    select 1 from events e where e.id = artists.event_id
    and (e.created_by = auth.uid() or e.assigned_user_id = auth.uid())
  ))
  with check (exists (
    select 1 from events e where e.id = artists.event_id
    and (e.created_by = auth.uid() or e.assigned_user_id = auth.uid())
  ));

drop policy "admin_all_templates" on templates;
create policy "owner_or_assigned_templates" on templates for all
  using (exists (
    select 1 from events e where e.id = templates.event_id
    and (e.created_by = auth.uid() or e.assigned_user_id = auth.uid())
  ))
  with check (exists (
    select 1 from events e where e.id = templates.event_id
    and (e.created_by = auth.uid() or e.assigned_user_id = auth.uid())
  ));

drop policy "admin_all_artist_forms" on artist_forms;
create policy "owner_or_assigned_artist_forms" on artist_forms for all
  using (exists (
    select 1 from events e where e.id = artist_forms.event_id
    and (e.created_by = auth.uid() or e.assigned_user_id = auth.uid())
  ))
  with check (exists (
    select 1 from events e where e.id = artist_forms.event_id
    and (e.created_by = auth.uid() or e.assigned_user_id = auth.uid())
  ));

drop policy "admin_read_hospitality_exports" on storage.objects;
create policy "owner_or_assigned_read_hospitality_exports" on storage.objects for select
  using (
    bucket_id = 'hospitality-exports'
    and exists (
      select 1 from artist_forms af
      join events e on e.id = af.event_id
      where af.id::text = (storage.foldername(name))[2]
      and (e.created_by = auth.uid() or e.assigned_user_id = auth.uid())
    )
  );

drop policy "admin_write_hospitality_exports" on storage.objects;
create policy "owner_or_assigned_write_hospitality_exports" on storage.objects for insert
  with check (
    bucket_id = 'hospitality-exports'
    and exists (
      select 1 from artist_forms af
      join events e on e.id = af.event_id
      where af.id::text = (storage.foldername(name))[2]
      and (e.created_by = auth.uid() or e.assigned_user_id = auth.uid())
    )
  );
