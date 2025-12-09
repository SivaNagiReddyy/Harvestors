-- ========================================
-- COMPLETE DISCOUNT REMOVAL SCRIPT
-- ========================================
-- This script removes ALL discount functionality from the database
-- Run this in Supabase SQL Editor to clean up discount fields

-- Step 1: Drop constraints related to discounts
ALTER TABLE harvesting_jobs 
    DROP CONSTRAINT IF EXISTS check_owner_discount_valid,
    DROP CONSTRAINT IF EXISTS check_farmer_discount_valid;

ALTER TABLE payments 
    DROP CONSTRAINT IF EXISTS check_payment_discount_valid;

ALTER TABLE machine_rentals 
    DROP CONSTRAINT IF EXISTS check_rental_owner_discount_valid,
    DROP CONSTRAINT IF EXISTS check_rental_dealer_discount_valid;

-- Step 2: Remove discount columns from harvesting_jobs table
ALTER TABLE harvesting_jobs 
    DROP COLUMN IF EXISTS discount_from_owner,
    DROP COLUMN IF EXISTS discount_to_farmer,
    DROP COLUMN IF EXISTS net_amount_to_owner,
    DROP COLUMN IF EXISTS net_amount_from_farmer;

-- Step 3: Remove discount columns from payments table
ALTER TABLE payments 
    DROP COLUMN IF EXISTS discount_amount,
    DROP COLUMN IF EXISTS gross_amount;

-- Step 4: Remove discount columns from machine_rentals table
ALTER TABLE machine_rentals 
    DROP COLUMN IF EXISTS discount_from_owner,
    DROP COLUMN IF EXISTS discount_to_dealer,
    DROP COLUMN IF EXISTS net_cost_to_owner,
    DROP COLUMN IF EXISTS net_amount_charged;

-- Step 5: Remove discount column from machines table (if it exists)
ALTER TABLE machines 
    DROP COLUMN IF EXISTS discount_from_owner_hours;

-- Verification: Check that columns are removed
SELECT 
    table_name, 
    column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name LIKE '%discount%'
ORDER BY table_name, column_name;

-- If the above query returns no rows, cleanup is complete!

COMMIT;
