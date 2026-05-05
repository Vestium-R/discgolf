-- Allow shorter throws in disc_throws (min 30ft instead of 50ft)
alter table disc_throws
  drop constraint disc_throws_distance_ft_check;

alter table disc_throws
  add constraint disc_throws_distance_ft_check check (distance_ft >= 30 and distance_ft <= 600);
