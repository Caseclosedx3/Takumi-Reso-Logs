-- Safety migration: ensures all columns and tables added since v0.0.2 exist.
-- Uses CREATE TABLE IF NOT EXISTS and ignores ALTER TABLE errors on pre-existing
-- columns. This migration is a no-op for users with a complete migration history.
--
-- Fixes:
--   Bug 1 (v0.0.6): 'no such column: boss_names' / 'player_names'
--   Bug 2 (v0.0.7): 'no such table: encounter_data'

-- Ensure encounter_data table exists (idempotent)
CREATE TABLE IF NOT EXISTS encounter_data (
    encounter_id INTEGER PRIMARY KEY NOT NULL,
    data BLOB NOT NULL,
    FOREIGN KEY(encounter_id) REFERENCES encounters(id) ON DELETE CASCADE
);

-- Note: ALTER TABLE ADD COLUMN is handled defensively at runtime in init_db()
-- via apply_schema_guards() which ignores errors for pre-existing columns.
-- SQLite does not support IF NOT EXISTS on ALTER TABLE ADD COLUMN.
