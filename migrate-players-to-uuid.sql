-- Migration: Convert players.id from TEXT slug to UUID
-- Preserves all data while fixing the schema design

-- Step 1: Add slug column to store the friendly names
ALTER TABLE players ADD COLUMN slug TEXT;

-- Step 2: Populate slug with current id values (the text slugs)
UPDATE players SET slug = id WHERE slug IS NULL;

-- Step 3: Update players.id to use the correct UUIDs (from your mappings)
UPDATE players SET id = 'e33d8a43-3646-40ec-a92d-d1ff654c155d' WHERE slug = 'jeffrey-rijkse';
UPDATE players SET id = 'c60544c5-faad-4605-9164-0d122ab0dce2' WHERE slug = 'mathieu-jacob';
UPDATE players SET id = '62e39edd-90a7-45ef-b99c-801909f576fa' WHERE slug = 'reginald-roth';
UPDATE players SET id = '9a3d2575-283b-45d8-a755-2c0e46e7180b' WHERE slug = 'john-cormier';

-- Step 4: Update bag_discs to match (they should already be correct from your earlier updates)
-- No update needed if you already ran the fixes

-- Step 5: Make slug NOT NULL and unique
ALTER TABLE players ALTER COLUMN slug SET NOT NULL;
ALTER TABLE players ADD CONSTRAINT players_slug_unique UNIQUE(slug);

-- Step 6: Verify the data looks correct
SELECT id, slug, name FROM players ORDER BY name;

-- Step 7: Verify bag_discs foreign keys are still valid
SELECT COUNT(*) as discs_with_missing_user FROM bag_discs bd
LEFT JOIN players p ON bd.user_id = p.id
WHERE p.id IS NULL;

-- If that count is 0, all foreign keys are valid. Then restore the constraint:
-- ALTER TABLE bag_discs ADD CONSTRAINT bag_discs_user_id_fkey FOREIGN KEY (user_id) REFERENCES players(id) ON DELETE CASCADE;
