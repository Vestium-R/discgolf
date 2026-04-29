-- Per-user preferences stored server-side (follows the account across devices).
create table if not exists user_prefs (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  max_dist_ft  integer not null default 300,
  throw_style  text    not null default 'RHBH',  -- RHBH | LHBH | RHFH | LHFH
  play_style   text    not null default 'flat',  -- flat | hyzer_flip | anhyzer | beginner
  years_playing integer,
  updated_at   timestamptz not null default now()
);

alter table user_prefs enable row level security;
