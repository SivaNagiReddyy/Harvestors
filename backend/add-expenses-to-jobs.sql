-- Add expenses_given column to harvesting_jobs table
-- This tracks money given to drivers for daily expenses (deducted from owner payment)

-- Check if column exists, if not, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'harvesting_jobs' AND column_name = 'expenses_given'
  ) THEN
    ALTER TABLE harvesting_jobs 
    ADD COLUMN expenses_given DECIMAL(10, 2) DEFAULT 0;
    
    RAISE NOTICE 'Column expenses_given added successfully';
  ELSE
    RAISE NOTICE 'Column expenses_given already exists';
  END IF;
END $$;

-- Update any NULL values to 0 (just in case)
UPDATE harvesting_jobs 
SET expenses_given = 0 
WHERE expenses_given IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN harvesting_jobs.expenses_given IS 'Daily expenses given to driver by user (deducted from owner payment)';
