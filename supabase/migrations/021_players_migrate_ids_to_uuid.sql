-- Migration 021: Migrate players.id from TEXT slugs to UUID format
-- Maps known text IDs to their corresponding auth.users UUIDs
-- This must be done carefully to maintain referential integrity

-- Step 1: Update player IDs to UUID format using the known mappings
-- NOTE: Update these mappings based on your actual auth.users data
update players set id = 'e33d8a43-3646-40ec-a92d-d1ff654c155d' where slug = 'jeffrey-rijkse';
update players set id = 'c60544c5-faad-4605-9164-0d122ab0dce2' where slug = 'mathieu-jacob';
update players set id = '62e39edd-90a7-45ef-b99c-801909f576fa' where slug = 'reginald-roth';
update players set id = '9a3d2575-283b-45d8-a755-2c0e46e7180b' where slug = 'john-cormier';

-- Step 2: Alter the players.id column to UUID type
-- NOTE: This is a destructive operation and must be done after data migration
-- alter table players alter column id set data type uuid using id::uuid;

-- Step 3: Verify the migration was successful
-- SELECT id, slug, name FROM players ORDER BY name;
