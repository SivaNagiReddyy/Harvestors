-- Add advance_from_farmer column to harvesting_jobs table
ALTER TABLE harvesting_jobs 
ADD COLUMN IF NOT EXISTS advance_from_farmer DECIMAL(10, 2) DEFAULT 0;

-- Update existing records to have 0 advance
UPDATE harvesting_jobs SET advance_from_farmer = 0 WHERE advance_from_farmer IS NULL;
