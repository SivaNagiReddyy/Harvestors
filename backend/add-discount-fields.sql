-- ========================================
-- DISCOUNT FIELDS MIGRATION
-- ========================================
-- This script adds discount functionality to the database

-- Step 1: Add discount field to machines table (owner discount is machine-level, cumulative)
ALTER TABLE machines 
    ADD COLUMN IF NOT EXISTS discount_hours DECIMAL(10, 2) DEFAULT 0 CHECK (discount_hours >= 0);

-- Step 2: Add discount field to harvesting_jobs table (farmer discount is job-level)
ALTER TABLE harvesting_jobs 
    ADD COLUMN IF NOT EXISTS discount_amount_to_farmer DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount_to_farmer >= 0);

-- Step 3: Add comments to explain the fields
COMMENT ON COLUMN machines.discount_hours IS 'Total discount hours given by owner across ALL jobs for this machine (cumulative)';
COMMENT ON COLUMN harvesting_jobs.discount_amount_to_farmer IS 'Money discount given to farmer by dealer for this specific job';

-- Verification: Check that columns are added
SELECT 
    table_name, 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND ((table_name = 'machines' AND column_name = 'discount_hours')
    OR (table_name = 'harvesting_jobs' AND column_name = 'discount_amount_to_farmer'))
ORDER BY table_name, ordinal_position;

COMMIT;
