-- Recalculate net amounts for all existing jobs to ensure discounts are properly applied
-- Run this in Supabase SQL Editor after fixing the triggers

-- Update net_amount_to_owner and net_amount_from_farmer for all jobs
UPDATE harvesting_jobs
SET 
    net_amount_to_owner = (
        CASE 
            WHEN hours > 0 AND EXISTS (
                SELECT 1 FROM machines m 
                WHERE m.id = harvesting_jobs.machine_id 
                AND m.owner_rate_per_hour > 0
            ) THEN (
                hours * (SELECT owner_rate_per_hour FROM machines WHERE id = harvesting_jobs.machine_id)
                - COALESCE(discount_from_owner, 0)
            )
            ELSE COALESCE(net_amount_to_owner, 0)
        END
    ),
    net_amount_from_farmer = (
        total_amount - COALESCE(discount_to_farmer, 0)
    )
WHERE 
    net_amount_to_owner IS NULL 
    OR net_amount_from_farmer IS NULL
    OR net_amount_to_owner = 0
    OR net_amount_from_farmer = 0;

-- Verify the update
SELECT 
    id,
    hours,
    rate_per_hour,
    total_amount,
    discount_from_owner,
    discount_to_farmer,
    net_amount_to_owner,
    net_amount_from_farmer,
    (hours * rate_per_hour) as calculated_total,
    (total_amount - COALESCE(discount_to_farmer, 0)) as expected_net_from_farmer
FROM harvesting_jobs
WHERE discount_from_owner > 0 OR discount_to_farmer > 0
LIMIT 10;
