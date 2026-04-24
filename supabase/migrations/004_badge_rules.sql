-- Badge passes only when the current holder plays AND loses.
-- If the holder sits out the round, the badge stays with them.
-- At end of season, the person in #1 of standings becomes season champion.
-- Each season has an initial badge holder (can be randomly chosen at season start).

alter table season_history
  add column if not exists initial_badge_holder_player_id text;

-- 2026: Scott holds the badge at season start (user-defined).
insert into season_history (season, champion_player_id, champion_name, initial_badge_holder_player_id)
values (2026, null, '', 'scott-brohm')
on conflict (season) do update
set initial_badge_holder_player_id = coalesce(season_history.initial_badge_holder_player_id, excluded.initial_badge_holder_player_id);

-- 2025: Jeffrey held the badge as champion.
update season_history
set initial_badge_holder_player_id = coalesce(initial_badge_holder_player_id, 'jeffrey-rijkse')
where season = 2025;
