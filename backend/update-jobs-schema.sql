-- Update harvesting_jobs table for simplified structure
-- Add hours field and change reference from machine_owner to machine

-- Drop old foreign key
ALTER TABLE harvesting_jobs 
DROP CONSTRAINT IF EXISTS harvesting_jobs_machine_owner_id_fkey;

-- Remove field reference (keep it optional now)
ALTER TABLE harvesting_jobs 
ALTER COLUMN field_id DROP NOT NULL;

-- Add hours column
ALTER TABLE harvesting_jobs 
ADD COLUMN IF NOT EXISTS hours DECIMAL(5, 2);

-- Rename machine_owner_id to machine_id
ALTER TABLE harvesting_jobs 
RENAME COLUMN machine_owner_id TO machine_id;

-- Add foreign key to machines table
ALTER TABLE harvesting_jobs 
ADD CONSTRAINT harvesting_jobs_machine_id_fkey 
FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE;

-- Update rate_per_acre to rate_per_hour (more appropriate for hour-based work)
ALTER TABLE harvesting_jobs 
ADD COLUMN IF NOT EXISTS rate_per_hour DECIMAL(10, 2);

-- Copy data from rate_per_acre to rate_per_hour if needed
UPDATE harvesting_jobs 
SET rate_per_hour = rate_per_acre 
WHERE rate_per_hour IS NULL;

-- Make hours required for new entries
ALTER TABLE harvesting_jobs 
ALTER COLUMN hours SET NOT NULL;
