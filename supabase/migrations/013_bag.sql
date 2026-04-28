-- Disc bag: each signed-in user can store the discs they carry.
create table if not exists bag_discs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  disc_name text not null,
  manufacturer text,
  type text not null check (type in ('putter', 'midrange', 'fairway_driver', 'distance_driver')),
  speed numeric(4,1) not null check (speed >= 1 and speed <= 14),
  glide numeric(4,1) check (glide >= 1 and glide <= 7),
  turn numeric(4,1) check (turn >= -5 and turn <= 2),
  fade numeric(4,1) check (fade >= 0 and fade <= 5),
  plastic text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists bag_discs_user_idx on bag_discs(user_id);
alter table bag_discs enable row level security;
