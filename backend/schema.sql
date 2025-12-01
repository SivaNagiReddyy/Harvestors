-- Harvester Dealership Management System - Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Manager' CHECK (role IN ('Admin', 'Manager')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Machine Owners Table
CREATE TABLE machine_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    address TEXT,
    machine_type VARCHAR(100) NOT NULL CHECK (machine_type IN ('Combine Harvester', 'Tractor', 'Paddy Harvester', 'Wheat Harvester', 'Other')),
    machine_model VARCHAR(255),
    machine_number VARCHAR(100) UNIQUE NOT NULL,
    rate_per_acre DECIMAL(10, 2) NOT NULL,
    bank_account_holder_name VARCHAR(255),
    bank_account_number VARCHAR(100),
    bank_name VARCHAR(255),
    bank_ifsc_code VARCHAR(50),
    total_amount_pending DECIMAL(15, 2) DEFAULT 0,
    total_amount_paid DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farmers Table
CREATE TABLE farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    village VARCHAR(255) NOT NULL,
    address TEXT,
    total_amount_pending DECIMAL(15, 2) DEFAULT 0,
    total_amount_paid DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fields Table
CREATE TABLE fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    location VARCHAR(255) NOT NULL,
    village VARCHAR(255) NOT NULL,
    survey_number VARCHAR(100),
    acres DECIMAL(10, 2) NOT NULL,
    crop_type VARCHAR(100) NOT NULL CHECK (crop_type IN ('Paddy', 'Wheat', 'Corn', 'Cotton', 'Sugarcane', 'Other')),
    rate_per_acre DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Available' CHECK (status IN ('Available', 'Assigned', 'Completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Harvesting Jobs Table
CREATE TABLE harvesting_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    machine_owner_id UUID NOT NULL REFERENCES machine_owners(id) ON DELETE CASCADE,
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    acres DECIMAL(10, 2) NOT NULL,
    rate_per_acre DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('To Machine Owner', 'From Farmer')),
    machine_owner_id UUID REFERENCES machine_owners(id) ON DELETE SET NULL,
    farmer_id UUID REFERENCES farmers(id) ON DELETE SET NULL,
    job_id UUID NOT NULL REFERENCES harvesting_jobs(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('Cash', 'Bank Transfer', 'UPI', 'Cheque')),
    transaction_id VARCHAR(255),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Completed' CHECK (status IN ('Pending', 'Completed', 'Failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_fields_farmer_id ON fields(farmer_id);
CREATE INDEX idx_fields_status ON fields(status);
CREATE INDEX idx_harvesting_jobs_field_id ON harvesting_jobs(field_id);
CREATE INDEX idx_harvesting_jobs_farmer_id ON harvesting_jobs(farmer_id);
CREATE INDEX idx_harvesting_jobs_machine_owner_id ON harvesting_jobs(machine_owner_id);
CREATE INDEX idx_harvesting_jobs_status ON harvesting_jobs(status);
CREATE INDEX idx_payments_machine_owner_id ON payments(machine_owner_id);
CREATE INDEX idx_payments_farmer_id ON payments(farmer_id);
CREATE INDEX idx_payments_job_id ON payments(job_id);
CREATE INDEX idx_payments_type ON payments(type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_machine_owners_updated_at BEFORE UPDATE ON machine_owners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON farmers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_harvesting_jobs_updated_at BEFORE UPDATE ON harvesting_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically calculate field total_amount
CREATE OR REPLACE FUNCTION calculate_field_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount = NEW.acres * NEW.rate_per_acre;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_field_total_trigger
BEFORE INSERT OR UPDATE ON fields
FOR EACH ROW EXECUTE FUNCTION calculate_field_total();

-- Function to automatically calculate job total_amount
CREATE OR REPLACE FUNCTION calculate_job_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount = NEW.acres * NEW.rate_per_acre;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_job_total_trigger
BEFORE INSERT OR UPDATE ON harvesting_jobs
FOR EACH ROW EXECUTE FUNCTION calculate_job_total();
