-- Admin-added discs that aren't in the static discs-db.ts file.
-- Merged with DISC_DB at query time so the audit sees both.
create table if not exists custom_discs (
  id uuid primary key default gen_random_uuid(),
  manufacturer text not null,
  name text not null,
  type text not null check (type in ('putter', 'midrange', 'fairway_driver', 'distance_driver', 'unknown')),
  speed numeric not null,
  glide numeric not null,
  turn numeric not null,
  fade numeric not null,
  created_at timestamptz default now(),
  unique (manufacturer, name)
);
