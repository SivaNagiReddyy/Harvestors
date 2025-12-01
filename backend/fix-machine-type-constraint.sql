-- Remove the check constraint on machine_type to allow dynamic machine types
ALTER TABLE machine_owners DROP CONSTRAINT machine_owners_machine_type_check;

-- Make machine_type just a VARCHAR without constraints
-- (The column already exists, we just removed the constraint)
