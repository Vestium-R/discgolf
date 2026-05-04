-- Migration: Add email and auth_id to players for OAuth linking

-- Step 1: Add columns
ALTER TABLE players ADD COLUMN email TEXT UNIQUE;
ALTER TABLE players ADD COLUMN auth_id UUID UNIQUE;
CREATE INDEX players_auth_id_idx ON players(auth_id);

-- Step 2: Populate existing players with their auth info
UPDATE players SET email = 'jeffreyrijkse@gmail.com', auth_id = 'e33d8a43-3646-40ec-a92d-d1ff654c155d' WHERE id = 'e33d8a43-3646-40ec-a92d-d1ff654c155d';
UPDATE players SET email = 'mathieujacob741@gmail.com', auth_id = 'c60544c5-faad-4605-9164-0d122ab0dce2' WHERE id = 'c60544c5-faad-4605-9164-0d122ab0dce2';
UPDATE players SET email = 'reginald.r151@gmail.com', auth_id = '62e39edd-90a7-45ef-b99c-801909f576fa' WHERE id = '62e39edd-90a7-45ef-b99c-801909f576fa';
UPDATE players SET email = 'johnccormier@hotmail.com', auth_id = '9a3d2575-283b-45d8-a755-2c0e46e7180b' WHERE id = '9a3d2575-283b-45d8-a755-2c0e46e7180b';

-- Step 3: Add Scott as a new player (hasn't been added to roster yet)
INSERT INTO players (id, slug, name, email, auth_id, active)
VALUES ('90387afa-c747-4f63-b08a-9706d6fb9edc', 'scott-boggin', 'Scott', 'bboggin@gmail.com', '90387afa-c747-4f63-b08a-9706d6fb9edc', true);

-- Step 4: Verify all players are linked
SELECT id, slug, name, email, auth_id FROM players ORDER BY name;
