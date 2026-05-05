-- Migration 023: Add constraints for data integrity
-- Makes slug NOT NULL and ensures uniqueness
-- This must run AFTER 020_players_add_slug and 021_players_migrate_ids_to_uuid

-- Make slug NOT NULL (all rows must already have values from migration 020)
alter table players alter column slug set not null;

-- Add unique constraint on slug
alter table players add constraint players_slug_unique unique(slug);

-- Verify the data looks correct
-- SELECT id, slug, name, email, auth_id FROM players ORDER BY name;

-- (Future) Add foreign key constraints for referential integrity
-- These ensure that season_history and rounds always reference valid players:
-- alter table season_history add constraint fk_champion_player
--   foreign key (champion_player_id) references players(id) on delete set null;
-- alter table season_history add constraint fk_badge_holder_player
--   foreign key (initial_badge_holder_player_id) references players(id) on delete set null;
