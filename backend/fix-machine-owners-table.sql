-- Remove machine-related columns from machine_owners table
ALTER TABLE machine_owners 
DROP COLUMN IF EXISTS machine_type,
DROP COLUMN IF EXISTS machine_number,
DROP COLUMN IF EXISTS rate_per_acre,
DROP COLUMN IF EXISTS driver_name,
DROP COLUMN IF EXISTS driver_phone;
