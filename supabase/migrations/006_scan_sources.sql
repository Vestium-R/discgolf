-- Sources the daily cron can scan for new rounds.
-- Populate with UDisc League URLs (which ARE public). Profile URLs won't work — 404.

create table if not exists scan_sources (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  kind text not null default 'udisc-league', -- udisc-league | udisc-event
  label text,
  enabled boolean not null default true,
  last_scanned_at timestamptz,
  created_at timestamptz not null default now()
);

alter table scan_sources enable row level security;

-- Log every auto-import attempt (for debugging / audit).
create table if not exists scan_log (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references scan_sources(id) on delete cascade,
  ran_at timestamptz not null default now(),
  rounds_added int not null default 0,
  notes text
);

alter table scan_log enable row level security;
