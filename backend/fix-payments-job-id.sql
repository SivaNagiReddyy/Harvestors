-- Fix payments table to allow job_id to be NULL
-- This is needed for "To Machine Owner" payments that pay the owner's total balance
-- rather than a specific job

ALTER TABLE payments ALTER COLUMN job_id DROP NOT NULL;
