-- Safe update script for harvesting_jobs table
-- This script checks if columns/constraints exist before modifying

-- Step 1: Add hours column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='harvesting_jobs' AND column_name='hours') THEN
        ALTER TABLE harvesting_jobs ADD COLUMN hours DECIMAL(5, 2);
    END IF;
END $$;

-- Step 2: Add rate_per_hour column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='harvesting_jobs' AND column_name='rate_per_hour') THEN
        ALTER TABLE harvesting_jobs ADD COLUMN rate_per_hour DECIMAL(10, 2);
    END IF;
END $$;

-- Step 3: Copy data from rate_per_acre to rate_per_hour if rate_per_hour is NULL
UPDATE harvesting_jobs 
SET rate_per_hour = rate_per_acre 
WHERE rate_per_hour IS NULL AND rate_per_acre IS NOT NULL;

-- Step 4: Make field_id optional (nullable)
ALTER TABLE harvesting_jobs ALTER COLUMN field_id DROP NOT NULL;

-- Step 5: Update any NULL hours to 0 before making it required
UPDATE harvesting_jobs SET hours = 0 WHERE hours IS NULL;

-- Step 6: Make hours NOT NULL
ALTER TABLE harvesting_jobs ALTER COLUMN hours SET NOT NULL;

-- Done! The harvesting_jobs table is now updated for the simplified structure.
