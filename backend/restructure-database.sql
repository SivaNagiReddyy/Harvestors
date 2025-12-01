-- Step 1: Create machines table
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

-- Step 2: Create indexes
CREATE INDEX idx_machines_owner_id ON machines(machine_owner_id);
CREATE INDEX idx_machines_status ON machines(status);

-- Step 3: Add trigger for updated_at
CREATE TRIGGER update_machines_updated_at 
BEFORE UPDATE ON machines 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Update harvesting_jobs to reference machines
ALTER TABLE harvesting_jobs 
ADD COLUMN machine_id UUID REFERENCES machines(id) ON DELETE CASCADE;

CREATE INDEX idx_harvesting_jobs_machine_id ON harvesting_jobs(machine_id);

-- Step 5: Update payments to reference machines
ALTER TABLE payments 
ADD COLUMN machine_id UUID REFERENCES machines(id) ON DELETE SET NULL;

CREATE INDEX idx_payments_machine_id ON payments(machine_id);

-- Step 6: Remove check constraint on machine_type
ALTER TABLE machine_owners DROP CONSTRAINT IF EXISTS machine_owners_machine_type_check;
