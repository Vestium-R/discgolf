-- Per-season badge images. Each season gets its own rotating trophy.

alter table season_history
  add column if not exists badge_image_url text;

-- 2025: cat-themed badge
update season_history
set badge_image_url = 'https://m.media-amazon.com/images/I/91Epb+TzaQL._AC_UF894,1000_QL80_.jpg'
where season = 2025;

-- 2026: redbubble badge
insert into season_history (season, champion_player_id, champion_name, badge_image_url)
values (2026, null, '', 'https://ih1.redbubble.net/image.4441310192.0640/bg,f8f8f8-flat,750x,075,f-pad,750x1000,f8f8f8.jpg')
on conflict (season) do update set badge_image_url = excluded.badge_image_url;
