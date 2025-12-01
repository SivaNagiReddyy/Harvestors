-- Update Schema: Separate Machine Owners from Machines

-- Step 1: Simplify machine_owners table (remove machine-specific fields)
-- First, let's create a new machines table

CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_owner_id UUID NOT NULL REFERENCES machine_owners(id) ON DELETE CASCADE,
    machine_type VARCHAR(100) NOT NULL,
    machine_number VARCHAR(100) UNIQUE NOT NULL,
    rate_per_acre DECIMAL(10, 2) NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    driver_phone VARCHAR(50) NOT NULL,
    total_amount_pending DECIMAL(15, 2) DEFAULT 0,
    total_amount_paid DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for machines table
CREATE INDEX idx_machines_owner_id ON machines(machine_owner_id);
CREATE INDEX idx_machines_status ON machines(status);

-- Step 3: Add updated_at trigger to machines table
CREATE TRIGGER update_machines_updated_at 
BEFORE UPDATE ON machines 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Update harvesting_jobs table to reference machines instead of machine_owners
ALTER TABLE harvesting_jobs 
ADD COLUMN machine_id UUID REFERENCES machines(id) ON DELETE CASCADE;

-- Step 5: Update payments table to reference machines
ALTER TABLE payments 
ADD COLUMN machine_id UUID REFERENCES machines(id) ON DELETE SET NULL;

-- Step 6: Create index for new foreign keys
CREATE INDEX idx_harvesting_jobs_machine_id ON harvesting_jobs(machine_id);
CREATE INDEX idx_payments_machine_id ON payments(machine_id);

-- Step 7: Remove machine-specific columns from machine_owners table
-- (Do this AFTER migrating data to machines table if you have existing data)
-- ALTER TABLE machine_owners DROP COLUMN machine_type;
-- ALTER TABLE machine_owners DROP COLUMN machine_model;
-- ALTER TABLE machine_owners DROP COLUMN machine_number;
-- ALTER TABLE machine_owners DROP COLUMN rate_per_acre;

-- Note: If you have existing data in machine_owners, you should:
-- 1. First migrate existing machine owner records to create corresponding machine records
-- 2. Update harvesting_jobs.machine_id to point to the new machine records
-- 3. Then drop the old columns from machine_owners
