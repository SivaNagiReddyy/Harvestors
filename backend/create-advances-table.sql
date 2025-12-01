-- Create table for daily advances/expenses given to machine drivers
CREATE TABLE IF NOT EXISTS daily_advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    advance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    paid_by VARCHAR(50) DEFAULT 'Owner' CHECK (paid_by IN ('Owner', 'Farmer')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_advances_machine_id ON daily_advances(machine_id);
CREATE INDEX IF NOT EXISTS idx_daily_advances_date ON daily_advances(advance_date);

-- Add total_advances_given column to machines table to track total advances
ALTER TABLE machines ADD COLUMN IF NOT EXISTS total_advances_given DECIMAL(15, 2) DEFAULT 0;