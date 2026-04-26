-- Allow 'linked' as a round source (UDisc parse succeeded but player matching
-- needed manual help — distinct from fully-automatic 'udisc' saves).
alter table rounds drop constraint if exists rounds_source_check;
alter table rounds add constraint rounds_source_check
  check (source in ('udisc', 'manual', 'linked'));
