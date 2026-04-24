-- Kent Disc Golf schema

create table if not exists players (
  id text primary key,
  name text not null,
  udisc_handle text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists rounds (
  id text primary key,
  date date not null,
  season int not null,
  source text not null check (source in ('udisc', 'manual')),
  udisc_url text,
  course_name text,
  note text,
  results jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists rounds_season_idx on rounds(season, date);

create table if not exists season_history (
  season int primary key,
  champion_player_id text,
  champion_name text not null,
  note text
);

create table if not exists settings (
  id int primary key default 1,
  current_season int not null,
  check (id = 1)
);

-- All DB access goes through the server with the service role key.
-- Enable RLS so anon/authenticated clients can't read/write directly.
alter table players enable row level security;
alter table rounds enable row level security;
alter table season_history enable row level security;
alter table settings enable row level security;
