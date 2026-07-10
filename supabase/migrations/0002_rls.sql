alter table events enable row level security;
alter table artists enable row level security;
alter table templates enable row level security;
alter table artist_forms enable row level security;

-- events: direct ownership
create policy "admin_all_events" on events for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- artists / templates / artist_forms: ownership inherited via event_id -> events.created_by
create policy "admin_all_artists" on artists for all
  using (exists (select 1 from events e where e.id = artists.event_id and e.created_by = auth.uid()))
  with check (exists (select 1 from events e where e.id = artists.event_id and e.created_by = auth.uid()));

create policy "admin_all_templates" on templates for all
  using (exists (select 1 from events e where e.id = templates.event_id and e.created_by = auth.uid()))
  with check (exists (select 1 from events e where e.id = templates.event_id and e.created_by = auth.uid()));

create policy "admin_all_artist_forms" on artist_forms for all
  using (exists (select 1 from events e where e.id = artist_forms.event_id and e.created_by = auth.uid()))
  with check (exists (select 1 from events e where e.id = artist_forms.event_id and e.created_by = auth.uid()));

-- Defense in depth: anon gets nothing at the table-grant level, on top of RLS.
-- All artist-side (token-based) access goes through the get-form/submit-form
-- Edge Functions using the service role key, which intentionally bypasses RLS.
revoke all on events, artists, templates, artist_forms from anon;

-- Storage: private bucket for per-artist PDF exports (P0-9). Admin-only
-- access, scoped the same way as the tables above via a join through
-- artist_forms/events. Bucket itself is created via the Supabase dashboard
-- or `supabase storage` CLI as private (not public).
create policy "admin_read_hospitality_exports" on storage.objects for select
  using (
    bucket_id = 'hospitality-exports'
    and exists (
      select 1 from artist_forms af
      join events e on e.id = af.event_id
      where af.id::text = (storage.foldername(name))[2]
      and e.created_by = auth.uid()
    )
  );

create policy "admin_write_hospitality_exports" on storage.objects for insert
  with check (
    bucket_id = 'hospitality-exports'
    and exists (
      select 1 from artist_forms af
      join events e on e.id = af.event_id
      where af.id::text = (storage.foldername(name))[2]
      and e.created_by = auth.uid()
    )
  );
