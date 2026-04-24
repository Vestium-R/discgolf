-- Round variants. Non-standard variants (Chiplocked, Legends of the Chains, etc.)
-- are kept for history but don't affect standings or the patch.

alter table rounds add column if not exists variant text not null default 'standard';
alter table rounds add column if not exists counts boolean not null default true;

-- Backfill: all existing rounds keep the defaults (standard / counts=true)
