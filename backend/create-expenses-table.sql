-- Create daily_expenses table for tracking money given to drivers
-- This tracks expenses that should be deducted from machine owner payments

CREATE TABLE IF NOT EXISTS daily_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_expenses_machine_id ON daily_expenses(machine_id);
CREATE INDEX IF NOT EXISTS idx_daily_expenses_expense_date ON daily_expenses(expense_date);

-- Add comments for documentation
COMMENT ON TABLE daily_expenses IS 'Tracks daily expenses given to drivers (deducted from owner payments)';
COMMENT ON COLUMN daily_expenses.machine_id IS 'Reference to the machine/driver receiving the expense';
COMMENT ON COLUMN daily_expenses.amount IS 'Amount given to driver for daily expenses';
COMMENT ON COLUMN daily_expenses.expense_date IS 'Date when expense was given';
COMMENT ON COLUMN daily_expenses.notes IS 'Optional notes about the expense (fuel, food, etc.)';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_expenses_updated_at
  BEFORE UPDATE ON daily_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_expenses_updated_at();
