-- Cache UDisc profile image URLs per player, picked up from scorecards.
alter table players add column if not exists udisc_avatar_url text;
