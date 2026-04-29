-- Split discs into "in bag" vs "storage" (beat-in, retired, extras)
alter table bag_discs add column if not exists in_storage boolean not null default false;
