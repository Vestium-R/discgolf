-- Migration 024: Add FK constraints from season_history to players
-- Enforces referential integrity at the database level
-- If a player is deleted, their badge holder or champion references are set to NULL

alter table season_history
  add constraint fk_season_history_champion
  foreign key (champion_player_id)
  references players(id)
  on delete set null;

alter table season_history
  add constraint fk_season_history_badge_holder
  foreign key (initial_badge_holder_player_id)
  references players(id)
  on delete set null;
