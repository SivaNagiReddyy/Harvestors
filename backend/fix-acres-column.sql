-- Make acres column optional since we now use hours instead
ALTER TABLE harvesting_jobs ALTER COLUMN acres DROP NOT NULL;

-- Make rate_per_acre optional since we now use rate_per_hour instead
ALTER TABLE harvesting_jobs ALTER COLUMN rate_per_acre DROP NOT NULL;

-- Set default values for existing records
UPDATE harvesting_jobs SET acres = 0 WHERE acres IS NULL;
UPDATE harvesting_jobs SET rate_per_acre = 0 WHERE rate_per_acre IS NULL;
