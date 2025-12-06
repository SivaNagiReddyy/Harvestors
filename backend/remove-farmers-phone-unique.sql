-- Remove UNIQUE constraint from farmers phone column
ALTER TABLE farmers DROP CONSTRAINT IF EXISTS farmers_phone_key;
