-- Migration: Remove rate_per_acre columns and ensure rate_per_hour is used everywhere
-- This script completes the migration from acre-based to hour-based rates

-- Step 1: Ensure owner_rate_per_hour exists in machines table (already done by previous migration)
-- If you haven't run rename-rate-column.sql yet, uncomment the next line:
-- ALTER TABLE machines RENAME COLUMN rate_per_acre TO owner_rate_per_hour;

-- Step 2: Drop rate_per_acre column from harvesting_jobs if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='harvesting_jobs' AND column_name='rate_per_acre') THEN
        ALTER TABLE harvesting_jobs DROP COLUMN rate_per_acre;
    END IF;
END $$;

-- Step 3: Ensure rate_per_hour exists in harvesting_jobs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='harvesting_jobs' AND column_name='rate_per_hour') THEN
        ALTER TABLE harvesting_jobs ADD COLUMN rate_per_hour DECIMAL(10, 2) NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Step 4: Drop rate_per_acre column from fields if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='fields' AND column_name='rate_per_acre') THEN
        ALTER TABLE fields DROP COLUMN rate_per_acre;
    END IF;
END $$;

-- Step 5: Ensure rate_per_hour exists in fields
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='fields' AND column_name='rate_per_hour') THEN
        ALTER TABLE fields ADD COLUMN rate_per_hour DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;

-- Step 6: Drop rate_per_acre from machine_rentals if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='machine_rentals' AND column_name='rate_per_acre') THEN
        ALTER TABLE machine_rentals DROP COLUMN rate_per_acre;
    END IF;
END $$;

-- Step 7: Update any remaining triggers or functions that reference rate_per_acre
-- Drop old trigger if exists
DROP TRIGGER IF EXISTS calculate_job_amount ON harvesting_jobs;
DROP FUNCTION IF EXISTS calculate_harvesting_job_amount();

-- Create new trigger function using hours instead of acres
CREATE OR REPLACE FUNCTION calculate_harvesting_job_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total_amount based on hours * rate_per_hour
    -- Only calculate if total_amount is not explicitly provided
    IF NEW.total_amount IS NULL OR NEW.total_amount = 0 THEN
        IF NEW.hours IS NOT NULL AND NEW.rate_per_hour IS NOT NULL THEN
            NEW.total_amount = NEW.hours * NEW.rate_per_hour;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER calculate_job_amount
    BEFORE INSERT OR UPDATE ON harvesting_jobs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_harvesting_job_amount();

-- Step 8: Add comments to document the change
COMMENT ON COLUMN machines.owner_rate_per_hour IS 'Hourly rate paid to machine owner (per hour of work)';
COMMENT ON COLUMN harvesting_jobs.rate_per_hour IS 'Hourly rate charged to farmer (per hour of work)';
COMMENT ON COLUMN fields.rate_per_hour IS 'Hourly rate for field operations (per hour of work)';

-- Step 9: Verify the changes
SELECT 
    table_name, 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('machines', 'harvesting_jobs', 'fields', 'machine_rentals')
    AND column_name LIKE '%rate%'
ORDER BY table_name, column_name;
