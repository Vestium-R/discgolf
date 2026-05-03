-- Track individual disc throws (for distance logging + stats)
create table if not exists disc_throws (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bag_disc_id uuid not null references bag_discs(id) on delete cascade,
  distance_ft int not null check (distance_ft >= 50 and distance_ft <= 600),
  wind_mph int,
  wind_direction text, -- 'calm', 'head', 'tail', 'cross_ltor', 'cross_rtol'
  course_name text,
  hole_number int,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists disc_throws_user_idx on disc_throws(user_id);
create index if not exists disc_throws_disc_idx on disc_throws(bag_disc_id);
alter table disc_throws enable row level security;

create policy "Users can only see own throws" on disc_throws
  for select using (auth.uid() = user_id);
create policy "Users can insert own throws" on disc_throws
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own throws" on disc_throws
  for delete using (auth.uid() = user_id);
