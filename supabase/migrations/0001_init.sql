create extension if not exists "pgcrypto";

create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  start_date date,
  end_date date,
  created_by uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table artists (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  role text not null check (role in ('lead', 'band', 'musician', 'crew')),
  is_vip boolean not null default false,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);
create index artists_event_id_idx on artists(event_id);

create table templates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  role text not null check (role in ('lead', 'band', 'musician', 'crew')),
  schema jsonb not null,
  created_at timestamptz not null default now()
);
create index templates_event_id_idx on templates(event_id);
-- Phase 1 assumption: one seeded template per role per event. Relax (drop
-- this constraint) when Phase 2 (P1-2) adds multiple templates per role.
create unique index templates_event_role_idx on templates(event_id, role);

create table artist_forms (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  artist_id uuid not null references artists(id) on delete cascade,
  source_template_id uuid references templates(id) on delete set null,
  token text not null unique,
  form_schema jsonb not null,
  response_data jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'sent', 'opened', 'submitted', 'locked')),
  deadline timestamptz,
  opened_at timestamptz,
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index artist_forms_event_id_idx on artist_forms(event_id);
create index artist_forms_artist_id_idx on artist_forms(artist_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger artist_forms_set_updated_at
  before update on artist_forms
  for each row execute function set_updated_at();
