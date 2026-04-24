-- Seed roster + 2025 champion + current season.
-- Safe to re-run: on conflict do nothing.

insert into players (id, name, udisc_handle, active) values
  ('jeffrey-rijkse', 'Jeffrey Rijkse', null, true),
  ('joel-pinet', 'Joel Pinet', null, true),
  ('john-cormier', 'John Cormier', null, true),
  ('kevin-belliveau', 'Kevin Belliveau', 'Theyellowdart', true),
  ('marc-durette', 'Marc Durette', null, true),
  ('mathieu-jacob', 'Mathieu Jacob', null, true),
  ('matthew-mckeigan', 'Matthew McKeigan', null, true),
  ('reginald-roth', 'Reginald Roth', null, true),
  ('scott-brohm', 'Scott Brohm', null, true)
on conflict (id) do nothing;

insert into season_history (season, champion_player_id, champion_name, note) values
  (2025, 'jeffrey-rijkse', 'Jeffrey Rijkse', 'No round-by-round stats recorded')
on conflict (season) do nothing;

insert into settings (id, current_season) values (1, extract(year from now())::int)
on conflict (id) do nothing;
