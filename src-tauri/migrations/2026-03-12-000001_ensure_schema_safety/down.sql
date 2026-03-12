-- This migration is intentionally a no-op on rollback.
-- Dropping the encounter_data table would destroy user data.
-- The boss_names/player_names columns cannot be dropped in SQLite without
-- recreating the table, which is handled by the initial schema migration.
SELECT 1;
