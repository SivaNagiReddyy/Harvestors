-- Fix ALL triggers that reference old rate_per_acre field
-- Run this in Supabase SQL Editor to fix the discount update error

-- ============================================
-- FIX HARVESTING JOBS TRIGGERS
-- ============================================

-- Drop old triggers and functions for harvesting_jobs
DROP TRIGGER IF EXISTS calculate_job_amount ON harvesting_jobs;
DROP TRIGGER IF EXISTS calculate_job_total_trigger ON harvesting_jobs;
DROP FUNCTION IF EXISTS calculate_harvesting_job_amount();
DROP FUNCTION IF EXISTS calculate_job_total();

-- Create new trigger function that only uses rate_per_hour
CREATE OR REPLACE FUNCTION calculate_harvesting_job_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total_amount based on hours * rate_per_hour
    -- Only calculate if total_amount is not explicitly provided
    IF NEW.total_amount IS NULL OR NEW.total_amount = 0 THEN
        IF NEW.hours IS NOT NULL AND NEW.rate_per_hour IS NOT NULL THEN
            NEW.total_amount = NEW.hours * NEW.rate_per_hour;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER calculate_job_amount
    BEFORE INSERT OR UPDATE ON harvesting_jobs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_harvesting_job_amount();

-- ============================================
-- FIX FIELDS TRIGGERS
-- ============================================

-- Drop old triggers and functions for fields
DROP TRIGGER IF EXISTS calculate_field_total_trigger ON fields;
DROP FUNCTION IF EXISTS calculate_field_total();

-- Create new trigger function for fields using rate_per_hour
CREATE OR REPLACE FUNCTION calculate_field_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total_amount based on acres * rate_per_hour
    IF NEW.acres IS NOT NULL AND NEW.rate_per_hour IS NOT NULL THEN
        NEW.total_amount = NEW.acres * NEW.rate_per_hour;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for fields
CREATE TRIGGER calculate_field_total_trigger
    BEFORE INSERT OR UPDATE ON fields
    FOR EACH ROW
    EXECUTE FUNCTION calculate_field_total();

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Triggers fixed successfully!' AS status;
