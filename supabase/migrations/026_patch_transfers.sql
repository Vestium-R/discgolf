-- Finalize UUID migration for all player/user ID columns, fix bag_discs FK,
-- and create patch_transfers table for admin-driven patch holder overrides.

-- Drop FKs that reference columns being converted
alter table bag_discs drop constraint if exists bag_discs_user_id_fkey;
alter table season_history drop constraint if exists fk_season_history_champion;
alter table season_history drop constraint if exists fk_season_history_badge_holder;

-- Convert all TEXT columns that store UUID values to proper UUID type
alter table players alter column id set data type uuid using id::uuid;
alter table season_history alter column champion_player_id set data type uuid using champion_player_id::uuid;
alter table season_history alter column initial_badge_holder_player_id set data type uuid using initial_badge_holder_player_id::uuid;
alter table bag_discs alter column user_id set data type uuid using user_id::uuid;
alter table disc_throws alter column user_id set data type uuid using user_id::uuid;

-- Re-add season_history FKs (now uuid → uuid)
alter table season_history
  add constraint fk_season_history_champion
  foreign key (champion_player_id) references players(id) on delete set null;
alter table season_history
  add constraint fk_season_history_badge_holder
  foreign key (initial_badge_holder_player_id) references players(id) on delete set null;

-- Fix bag_discs: was wrongly pointing to players(id), correct reference is auth.users
alter table bag_discs
  add constraint bag_discs_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- Admin-driven patch transfers: when a player voluntarily gives up the patch
-- outside normal game rules (i.e. the holder plays and loses).
-- effective_after_round_id = the round after which the new holder takes over.
-- NULL = applies before the first round of the season (overrides initial_badge_holder).
create table if not exists patch_transfers (
  id uuid primary key default gen_random_uuid(),
  season int not null,
  from_player_id uuid references players(id) on delete set null,
  to_player_id uuid not null references players(id) on delete restrict,
  effective_after_round_id text references rounds(id) on delete restrict,
  reason text,
  created_at timestamptz default now()
);

create index if not exists patch_transfers_season_idx on patch_transfers(season);
create index if not exists patch_transfers_round_idx on patch_transfers(effective_after_round_id);
