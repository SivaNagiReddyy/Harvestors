-- Add village_name column to dealers table
-- This replaces business_name, email, address, and gst_number with a simple village_name field

ALTER TABLE dealers 
ADD COLUMN IF NOT EXISTS village_name VARCHAR(255);

-- Optional: If you want to migrate existing business_name data to village_name
-- UPDATE dealers SET village_name = business_name WHERE village_name IS NULL AND business_name IS NOT NULL;
