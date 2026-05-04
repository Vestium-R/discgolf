-- Fix bag_discs.user_id using correct player ID mappings
-- These mappings restore the invalid UUIDs back to the correct TEXT player IDs

-- Mapping 1: jeffrey-rijkse
UPDATE bag_discs
SET user_id = 'jeffrey-rijkse'
WHERE user_id = 'e33d8a43-3646-40ec-a92d-d1ff654c155d';

-- Mapping 2: mathieu-jacob
UPDATE bag_discs
SET user_id = 'mathieu-jacob'
WHERE user_id = 'c60544c5-faad-4605-9164-0d122ab0dce2';

-- Mapping 3: reginald-roth
UPDATE bag_discs
SET user_id = 'reginald-roth'
WHERE user_id = '62e39edd-90a7-45ef-b99c-801909f576fa';

-- Mapping 4: john-cormier
UPDATE bag_discs
SET user_id = 'john-cormier'
WHERE user_id = '9a3d2575-283b-45d8-a755-2c0e46e7180b';

-- After all mappings are applied, verify the fix:
-- SELECT DISTINCT user_id FROM bag_discs ORDER BY user_id;
-- SELECT COUNT(*) as total_bag_discs FROM bag_discs;
