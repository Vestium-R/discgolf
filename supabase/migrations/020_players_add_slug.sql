-- Migration 020: Add slug column to players table
-- This preserves player ID history by storing old text IDs as slugs
-- Allows ID migration: id (TEXT slugs) -> slug (TEXT) / id (UUID)

alter table players add column if not exists slug text;

-- Populate slug with current id values (the text slugs like "jeffrey-rijkse")
-- Only for rows where we don't already have a slug
update players set slug = id where slug is null and id not like '________-____-____-____-____________';

comment on column players.slug is 'Legacy text identifier (e.g. "jeffrey-rijkse"), used for compatibility and UDisc handle matching';
