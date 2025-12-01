-- Add machine_id column to payments table
-- This allows tracking payments specific to each machine

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS machine_id UUID REFERENCES machines(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_machine_id ON payments(machine_id);

-- Update existing "To Machine Owner" payments to set machine_id from the job
UPDATE payments 
SET machine_id = (
  SELECT machine_id 
  FROM harvesting_jobs 
  WHERE harvesting_jobs.id = payments.job_id
)
WHERE type = 'To Machine Owner' AND machine_id IS NULL AND job_id IS NOT NULL;
