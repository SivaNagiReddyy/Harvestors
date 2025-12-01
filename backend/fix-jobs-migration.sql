-- Complete fix for harvesting_jobs table migration
-- This handles the transition from machine_owner_id to machine_id

-- Step 1: Check if we still have machine_owner_id column
DO $$ 
BEGIN
    -- If machine_owner_id exists and machine_id doesn't, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='harvesting_jobs' AND column_name='machine_owner_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='harvesting_jobs' AND column_name='machine_id') THEN
        
        -- Drop the old foreign key constraint
        ALTER TABLE harvesting_jobs 
        DROP CONSTRAINT IF EXISTS harvesting_jobs_machine_owner_id_fkey;
        
        -- Rename the column
        ALTER TABLE harvesting_jobs 
        RENAME COLUMN machine_owner_id TO machine_id;
        
        -- Add new foreign key to machines table
        ALTER TABLE harvesting_jobs 
        ADD CONSTRAINT harvesting_jobs_machine_id_fkey 
        FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE;
        
    -- If both exist, we need to handle data migration
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='harvesting_jobs' AND column_name='machine_owner_id')
          AND EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='harvesting_jobs' AND column_name='machine_id') THEN
        
        -- Drop machine_owner_id since we have machine_id now
        ALTER TABLE harvesting_jobs 
        DROP CONSTRAINT IF EXISTS harvesting_jobs_machine_owner_id_fkey;
        
        ALTER TABLE harvesting_jobs 
        DROP COLUMN machine_owner_id;
    END IF;
END $$;

-- Step 2: Add hours column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='harvesting_jobs' AND column_name='hours') THEN
        ALTER TABLE harvesting_jobs ADD COLUMN hours DECIMAL(5, 2);
    END IF;
END $$;

-- Step 3: Add rate_per_hour column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='harvesting_jobs' AND column_name='rate_per_hour') THEN
        ALTER TABLE harvesting_jobs ADD COLUMN rate_per_hour DECIMAL(10, 2);
    END IF;
END $$;

-- Step 4: Copy data from rate_per_acre to rate_per_hour if needed
UPDATE harvesting_jobs 
SET rate_per_hour = rate_per_acre 
WHERE rate_per_hour IS NULL AND rate_per_acre IS NOT NULL;

-- Step 5: Make field_id optional (nullable)
ALTER TABLE harvesting_jobs ALTER COLUMN field_id DROP NOT NULL;

-- Step 6: Update any NULL hours to 0 before making it required
UPDATE harvesting_jobs SET hours = 0 WHERE hours IS NULL;

-- Step 7: Make hours NOT NULL (only if there are no NULL values)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM harvesting_jobs WHERE hours IS NULL) THEN
        ALTER TABLE harvesting_jobs ALTER COLUMN hours SET NOT NULL;
    END IF;
END $$;

-- Done! Check the results
SELECT 'Migration completed successfully!' as status;
