-- Migration 022: Add email and auth_id columns for OAuth linking
-- Allows players to be linked to auth.users for authentication

alter table players add column if not exists email text unique;
alter table players add column if not exists auth_id uuid unique;

-- Create index for faster lookups by auth_id
create index if not exists players_auth_id_idx on players(auth_id);

-- Populate auth_id with matching UUID values (after ID migration, id should match auth_id for existing players)
update players set auth_id = id::uuid where auth_id is null and id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Populate email for known players (update these based on your actual email addresses)
update players set email = 'jeffreyrijkse@gmail.com' where slug = 'jeffrey-rijkse' and email is null;
update players set email = 'mathieujacob741@gmail.com' where slug = 'mathieu-jacob' and email is null;
update players set email = 'reginald.r151@gmail.com' where slug = 'reginald-roth' and email is null;
update players set email = 'johnccormier@hotmail.com' where slug = 'john-cormier' and email is null;

comment on column players.email is 'Email address for OAuth and authentication';
comment on column players.auth_id is 'Reference to auth.users(id) for authentication';
