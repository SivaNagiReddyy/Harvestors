-- Migration: Rename rate_per_acre to owner_rate_per_hour in machines table
-- This column represents the hourly rate paid to the machine owner

-- Step 1: Rename the column
ALTER TABLE machines 
RENAME COLUMN rate_per_acre TO owner_rate_per_hour;

-- Step 2: Update the comment to reflect the new name
COMMENT ON COLUMN machines.owner_rate_per_hour IS 'Hourly rate paid to the machine owner (not the rate charged to farmers)';

-- Note: This does not change any data, only the column name
-- All existing rates remain the same, just with a more accurate name
l.