-- Add business_source column to payments table
-- This separates Direct Harvesting payments from Dealer Rental payments

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS business_source VARCHAR(50) DEFAULT 'harvesting';

ALTER TABLE payments
ADD CONSTRAINT payments_business_source_check 
CHECK (business_source IN ('harvesting', 'rental'));

COMMENT ON COLUMN payments.business_source IS 'Source: harvesting or rental';

UPDATE payments 
SET business_source = 'harvesting' 
WHERE business_source IS NULL;
