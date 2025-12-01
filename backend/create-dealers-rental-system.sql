-- Create Dealers and Machine Rental System
-- This is completely separate from direct harvesting jobs

-- Dealers Table
CREATE TABLE IF NOT EXISTS dealers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    address TEXT,
    business_name VARCHAR(255),
    gst_number VARCHAR(50),
    total_amount_pending DECIMAL(15, 2) DEFAULT 0,
    total_amount_paid DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Machine Rental Agreements Table
CREATE TABLE IF NOT EXISTS machine_rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    season_name VARCHAR(100) NOT NULL, -- e.g., "Kharif 2025", "Rabi 2025"
    start_date DATE NOT NULL,
    end_date DATE,
    hourly_rate_to_dealer DECIMAL(10, 2) NOT NULL, -- Rate charged to dealer
    hourly_cost_from_owner DECIMAL(10, 2) NOT NULL, -- Rate paid to machine owner
    total_hours_used DECIMAL(10, 2) DEFAULT 0,
    total_amount_charged DECIMAL(15, 2) DEFAULT 0, -- Amount to charge dealer
    total_cost_to_owner DECIMAL(15, 2) DEFAULT 0, -- Amount to pay owner
    profit_margin DECIMAL(15, 2) DEFAULT 0, -- Your profit
    advance_paid DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rental Payments Table (separate from regular payments)
CREATE TABLE IF NOT EXISTS rental_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID NOT NULL REFERENCES machine_rentals(id) ON DELETE CASCADE,
    dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('Cash', 'Bank Transfer', 'UPI', 'Cheque')),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Completed' CHECK (status IN ('Pending', 'Completed', 'Failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dealers_status ON dealers(status);
CREATE INDEX IF NOT EXISTS idx_machine_rentals_dealer_id ON machine_rentals(dealer_id);
CREATE INDEX IF NOT EXISTS idx_machine_rentals_machine_id ON machine_rentals(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_rentals_status ON machine_rentals(status);
CREATE INDEX IF NOT EXISTS idx_rental_payments_rental_id ON rental_payments(rental_id);
CREATE INDEX IF NOT EXISTS idx_rental_payments_dealer_id ON rental_payments(dealer_id);

-- Create updated_at trigger for dealers
DROP TRIGGER IF EXISTS update_dealers_updated_at ON dealers;
CREATE TRIGGER update_dealers_updated_at 
BEFORE UPDATE ON dealers 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for machine_rentals
DROP TRIGGER IF EXISTS update_machine_rentals_updated_at ON machine_rentals;
CREATE TRIGGER update_machine_rentals_updated_at 
BEFORE UPDATE ON machine_rentals 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for rental_payments
DROP TRIGGER IF EXISTS update_rental_payments_updated_at ON rental_payments;
CREATE TRIGGER update_rental_payments_updated_at 
BEFORE UPDATE ON rental_payments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically calculate rental amounts when hours are updated
CREATE OR REPLACE FUNCTION calculate_rental_amounts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount_charged = NEW.total_hours_used * NEW.hourly_rate_to_dealer;
    NEW.total_cost_to_owner = NEW.total_hours_used * NEW.hourly_cost_from_owner;
    NEW.profit_margin = NEW.total_amount_charged - NEW.total_cost_to_owner;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS calculate_rental_amounts_trigger ON machine_rentals;
CREATE TRIGGER calculate_rental_amounts_trigger
BEFORE INSERT OR UPDATE ON machine_rentals
FOR EACH ROW EXECUTE FUNCTION calculate_rental_amounts();
