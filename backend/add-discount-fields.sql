-- Add discount functionality to billing system
-- Owner-to-Me Discount: Discount received from machine owner on their bill
-- Me-to-Farmer Discount: Discount given to farmer on their collection

-- Step 1: Add discount fields to harvesting_jobs table
DO $$ 
BEGIN
    -- Discount from owner (reduces what you pay to owner)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='harvesting_jobs' AND column_name='discount_from_owner') THEN
        ALTER TABLE harvesting_jobs ADD COLUMN discount_from_owner DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- Discount to farmer (reduces what farmer pays to you)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='harvesting_jobs' AND column_name='discount_to_farmer') THEN
        ALTER TABLE harvesting_jobs ADD COLUMN discount_to_farmer DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- Net amount to owner (after discount from owner)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='harvesting_jobs' AND column_name='net_amount_to_owner') THEN
        ALTER TABLE harvesting_jobs ADD COLUMN net_amount_to_owner DECIMAL(15, 2) DEFAULT 0;
    END IF;
    
    -- Net amount from farmer (after discount to farmer)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='harvesting_jobs' AND column_name='net_amount_from_farmer') THEN
        ALTER TABLE harvesting_jobs ADD COLUMN net_amount_from_farmer DECIMAL(15, 2) DEFAULT 0;
    END IF;
END $$;

-- Step 2: Add discount fields to payments table
DO $$ 
BEGIN
    -- Discount applied on this payment
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payments' AND column_name='discount_amount') THEN
        ALTER TABLE payments ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- Gross amount before discount
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payments' AND column_name='gross_amount') THEN
        ALTER TABLE payments ADD COLUMN gross_amount DECIMAL(15, 2);
    END IF;
END $$;

-- Step 3: Add discount fields to machine_rentals table (for dealer rentals)
DO $$ 
BEGIN
    -- Discount from owner on rental cost
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='machine_rentals' AND column_name='discount_from_owner') THEN
        ALTER TABLE machine_rentals ADD COLUMN discount_from_owner DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- Discount to dealer on rental charge
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='machine_rentals' AND column_name='discount_to_dealer') THEN
        ALTER TABLE machine_rentals ADD COLUMN discount_to_dealer DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- Net cost to owner (after discount)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='machine_rentals' AND column_name='net_cost_to_owner') THEN
        ALTER TABLE machine_rentals ADD COLUMN net_cost_to_owner DECIMAL(15, 2) DEFAULT 0;
    END IF;
    
    -- Net amount charged to dealer (after discount)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='machine_rentals' AND column_name='net_amount_charged') THEN
        ALTER TABLE machine_rentals ADD COLUMN net_amount_charged DECIMAL(15, 2) DEFAULT 0;
    END IF;
END $$;

-- Step 4: Update existing records to set net amounts equal to gross amounts (no discount)
UPDATE harvesting_jobs 
SET 
    discount_from_owner = 0,
    discount_to_farmer = 0,
    net_amount_to_owner = COALESCE((hours * (SELECT rate_per_acre FROM machines WHERE machines.id = harvesting_jobs.machine_id)), 0),
    net_amount_from_farmer = COALESCE(total_amount, 0)
WHERE discount_from_owner IS NULL OR discount_to_farmer IS NULL;

UPDATE payments 
SET 
    discount_amount = 0,
    gross_amount = amount
WHERE discount_amount IS NULL OR gross_amount IS NULL;

UPDATE machine_rentals 
SET 
    discount_from_owner = 0,
    discount_to_dealer = 0,
    net_cost_to_owner = COALESCE(total_cost_to_owner, 0),
    net_amount_charged = COALESCE(total_amount_charged, 0)
WHERE discount_from_owner IS NULL OR discount_to_dealer IS NULL;

-- Step 5: Add check constraints to ensure discounts are non-negative
-- Note: Validation that discounts don't exceed amounts is handled in application code
ALTER TABLE harvesting_jobs 
    DROP CONSTRAINT IF EXISTS check_owner_discount_valid,
    ADD CONSTRAINT check_owner_discount_valid 
    CHECK (discount_from_owner >= 0);

ALTER TABLE harvesting_jobs 
    DROP CONSTRAINT IF EXISTS check_farmer_discount_valid,
    ADD CONSTRAINT check_farmer_discount_valid 
    CHECK (discount_to_farmer >= 0);

ALTER TABLE payments 
    DROP CONSTRAINT IF EXISTS check_payment_discount_valid,
    ADD CONSTRAINT check_payment_discount_valid 
    CHECK (discount_amount >= 0);

ALTER TABLE machine_rentals 
    DROP CONSTRAINT IF EXISTS check_rental_owner_discount_valid,
    ADD CONSTRAINT check_rental_owner_discount_valid 
    CHECK (discount_from_owner >= 0);

ALTER TABLE machine_rentals 
    DROP CONSTRAINT IF EXISTS check_rental_dealer_discount_valid,
    ADD CONSTRAINT check_rental_dealer_discount_valid 
    CHECK (discount_to_dealer >= 0);

-- Step 6: Add comments to document the discount fields
COMMENT ON COLUMN harvesting_jobs.discount_from_owner IS 'Discount received from machine owner (reduces payment to owner)';
COMMENT ON COLUMN harvesting_jobs.discount_to_farmer IS 'Discount given to farmer (reduces collection from farmer)';
COMMENT ON COLUMN harvesting_jobs.net_amount_to_owner IS 'Net amount to pay owner after discount';
COMMENT ON COLUMN harvesting_jobs.net_amount_from_farmer IS 'Net amount to collect from farmer after discount';

COMMENT ON COLUMN payments.discount_amount IS 'Discount applied on this payment';
COMMENT ON COLUMN payments.gross_amount IS 'Original amount before discount';

COMMENT ON COLUMN machine_rentals.discount_from_owner IS 'Discount from owner on rental cost';
COMMENT ON COLUMN machine_rentals.discount_to_dealer IS 'Discount to dealer on rental charge';
COMMENT ON COLUMN machine_rentals.net_cost_to_owner IS 'Net cost to pay owner after discount';
COMMENT ON COLUMN machine_rentals.net_amount_charged IS 'Net amount to collect from dealer after discount';

-- Migration complete!
-- Remember to update your application code to use these new discount fields
