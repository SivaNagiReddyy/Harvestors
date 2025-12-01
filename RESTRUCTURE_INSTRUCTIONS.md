# Database Structure Update - Instructions

## Overview
The application has been restructured to separate Machine Owners from their Machines. Now:
- **Machine Owners**: Store only owner information (name, phone, bank details)
- **Machines**: Each machine belongs to an owner and has its own driver, type, number, and rate

## Step-by-Step Database Update

### 1. Run the SQL script in Supabase SQL Editor

Go to your Supabase dashboard → SQL Editor and run the following:

```sql
-- Create machines table
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

-- Create indexes
CREATE INDEX idx_machines_owner_id ON machines(machine_owner_id);
CREATE INDEX idx_machines_status ON machines(status);

-- Add trigger for updated_at
CREATE TRIGGER update_machines_updated_at 
BEFORE UPDATE ON machines 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update harvesting_jobs to reference machines
ALTER TABLE harvesting_jobs 
ADD COLUMN machine_id UUID REFERENCES machines(id) ON DELETE CASCADE;

CREATE INDEX idx_harvesting_jobs_machine_id ON harvesting_jobs(machine_id);

-- Update payments to reference machines
ALTER TABLE payments 
ADD COLUMN machine_id UUID REFERENCES machines(id) ON DELETE SET NULL;

CREATE INDEX idx_payments_machine_id ON payments(machine_id);

-- Remove check constraint on machine_type (already done)
ALTER TABLE machine_owners DROP CONSTRAINT IF EXISTS machine_owners_machine_type_check;
```

### 2. Migrate Existing Data (if any)

If you have existing machine_owners data, you need to migrate it to machines table:

```sql
-- Migrate existing machine owners to machines table
INSERT INTO machines (
    machine_owner_id,
    machine_type,
    machine_number,
    rate_per_acre,
    driver_name,
    driver_phone,
    total_amount_pending,
    total_amount_paid,
    status
)
SELECT 
    id as machine_owner_id,
    machine_type,
    machine_number,
    rate_per_acre,
    'Driver Name' as driver_name,  -- You'll need to update this manually
    phone as driver_phone,  -- Temporary, update manually
    total_amount_pending,
    total_amount_paid,
    status
FROM machine_owners
WHERE machine_number IS NOT NULL;

-- Update harvesting_jobs to link to machines
-- This requires manual mapping based on machine_number or other identifiers
```

### 3. Clean up machine_owners table (AFTER data migration)

```sql
-- Remove machine-specific columns from machine_owners
ALTER TABLE machine_owners DROP COLUMN IF EXISTS machine_type;
ALTER TABLE machine_owners DROP COLUMN IF EXISTS machine_model;
ALTER TABLE machine_owners DROP COLUMN IF EXISTS machine_number;
ALTER TABLE machine_owners DROP COLUMN IF EXISTS rate_per_acre;

-- Optionally, remove machine owner pending/paid as these will be on machines
-- ALTER TABLE machine_owners DROP COLUMN IF EXISTS total_amount_pending;
-- ALTER TABLE machine_owners DROP COLUMN IF EXISTS total_amount_paid;
```

## What Changed

### Backend
- ✅ Created `/api/machines` route
- ✅ Simplified `/api/machine-owners` route (no machine fields)
- ✅ Added `machines.js` model

### Frontend
- ✅ Simplified Machine Owners page (only owner info + bank details)
- ✅ Created new Machines page (machine details + driver info)
- ✅ Added Machines menu item to sidebar
- ✅ Updated API to include machineAPI

### Database Schema
- New `machines` table with driver details
- `harvesting_jobs.machine_id` links to machines (not machine_owners)
- `payments.machine_id` links to machines
- `machine_owners` simplified to only owner information

## Next Steps (TO DO)

1. **Run the SQL scripts** in Supabase SQL Editor (see Step 1 above)
2. **Restart backend server** if it's running
3. **Refresh frontend** - you should now see "Machines" in the menu
4. **Add Machine Owners** first (these are just owner details now)
5. **Add Machines** - select an owner, then add machine details + driver info
6. **Update Jobs & Payments** pages to work with machines instead of machine_owners (future work)

## Important Notes

- Machine Owners are now just contact/bank info for the owners
- Each Machine belongs to an owner and has its own driver
- One owner can have multiple machines with different drivers
- Jobs and Payments should reference machines, not machine owners directly
