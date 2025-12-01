-- Add paid_by column to daily_advances table
ALTER TABLE daily_advances 
ADD COLUMN IF NOT EXISTS paid_by VARCHAR(50) DEFAULT 'Owner' CHECK (paid_by IN ('Owner', 'Farmer'));

-- Update existing records to have default value
UPDATE daily_advances SET paid_by = 'Owner' WHERE paid_by IS NULL;

-- Drop the old given_by column if it exists
ALTER TABLE daily_advances DROP COLUMN IF EXISTS given_by;
