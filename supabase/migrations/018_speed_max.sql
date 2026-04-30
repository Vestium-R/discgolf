-- Some discs (e.g. Axiom Tantrum, MVP Relativity) have speed ratings above 14.
-- Widen the check constraint to allow up to 15.
ALTER TABLE bag_discs DROP CONSTRAINT IF EXISTS bag_discs_speed_check;
ALTER TABLE bag_discs ADD CONSTRAINT bag_discs_speed_check CHECK (speed >= 1 AND speed <= 15);
