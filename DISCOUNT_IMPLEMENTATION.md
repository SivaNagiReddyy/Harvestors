# Discount Implementation Guide

## Overview
This document describes the complete discount functionality implemented in the Harvesting Rental Application.

## Discount Types

### 1️⃣ Discount From Owner (Hours-Based)
- **Who gives**: Machine owner
- **Format**: Hours (e.g., 2.25 hours)
- **Storage**: `discount_hours_from_owner` column in `harvesting_jobs` table
- **Impact**:
  - ✅ Increases your profit by `discount_hours × rate_for_farmer`
  - ✅ Reduces amount paid to owner by `discount_hours × rate_for_owner`
  - ✅ Hours are NOT counted in total payable hours to owner

### 2️⃣ Discount To Farmers (Money-Based)
- **Who gives**: You (the dealer)
- **Format**: Money amount in ₹ (e.g., ₹500)
- **Storage**: `discount_amount_to_farmer` column in `harvesting_jobs` table
- **Impact**:
  - ✅ Reduces pending amount from farmers
  - ✅ Hours remain same, only money reduces

## Database Schema

### Migration File
**Location**: `backend/add-discount-fields.sql`

```sql
ALTER TABLE harvesting_jobs 
    ADD COLUMN IF NOT EXISTS discount_hours_from_owner DECIMAL(10, 2) DEFAULT 0 CHECK (discount_hours_from_owner >= 0),
    ADD COLUMN IF NOT EXISTS discount_amount_to_farmer DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount_to_farmer >= 0);
```

### Fields Added
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `discount_hours_from_owner` | DECIMAL(10,2) | 0 | Hours discount given by owner |
| `discount_amount_to_farmer` | DECIMAL(10,2) | 0 | Money discount given to farmer |

## Calculations

### Revenue Calculation
```
Revenue = SUM(hours × rate_per_hour)
```
*No change - still charges farmers at full rate*

### Profit Calculation
```
Profit = Revenue 
       - (payable_hours_to_owner × rate_for_owner) 
       + Additional Profit from Owner Discount
       - Farmer Discounts Given

Where:
  payable_hours_to_owner = total_hours - discount_hours_from_owner
  Additional Profit = discount_hours_from_owner × rate_for_farmer
  Farmer Discounts Given = SUM(discount_amount_to_farmer)
```

### Pending Amount from Farmers
```
Pending from Farmer = (hours × rate_per_hour) - discount_amount_to_farmer - advances - payments
```

### Pending Amount to Owners
```
Pending to Owner = (hours - discount_hours_from_owner) × rate_for_owner - payments - expenses
```

## Backend Implementation

### 1. Job Creation Endpoint
**File**: `backend/routes/jobs.js`

**Changes**:
- Added `discountHoursFromOwner` and `discountAmountToFarmer` parameters
- Calculate payable hours: `payableHoursToOwner = hours - discountHours`
- Calculate owner amount using payable hours
- Calculate farmer owes amount: `farmerOwesAmount = totalAmount - farmerDiscount`

### 2. Dashboard Statistics
**File**: `backend/routes/dashboard.js`

**Changes**:
- Added discount fields to all job queries
- Calculate `totalDiscountHoursFromOwners`
- Calculate `additionalProfitFromOwnerDiscount`
- Calculate `totalFarmerDiscountsGiven`
- Update profit calculation to include discount impacts
- Update pending calculations to reflect discounts

**New Response Fields**:
```javascript
harvesting: {
  revenue: number,
  profit: number,  // Now includes discount impacts
  totalHours: number,
  discountHoursFromOwners: number,  // NEW
  discountAmountToFarmers: number,  // NEW
  additionalProfitFromOwnerDiscount: number,  // NEW
  pendingFromFarmers: number,  // Now reflects farmer discounts
  pendingToOwners: number  // Now reflects owner discount hours
}
```

## Frontend Implementation

### 1. Jobs Form
**File**: `frontend/src/pages/Jobs.js`

**Changes**:
- Added two new input fields in the form:
  - **Discount from Owner (Hours) 🕒**: Hours discount from owner
  - **Discount to Farmer (₹) 🎁**: Money discount to farmer
- Updated form state to include `discountHoursFromOwner` and `discountAmountToFarmer`
- Updated edit handler to populate discount values
- Updated close handler to reset discount fields

### 2. Dashboard Display
**File**: `frontend/src/pages/Dashboard.js`

**Changes**:
- Added "Discounts Overview" section in Combined view
- Added "Discounts - Direct Harvesting" section in Harvesting view
- Three discount cards:
  1. **From Owner (Hours)** 🕒 - Shows total discount hours
  2. **Additional Profit** 💰 - Shows extra profit from owner discounts
  3. **To Farmers (Money)** 🎁 - Shows total money discounts given

## Example Scenario

### Machine "Karma" worked 97.25 hours
- **Hours worked**: 97.25
- **Owner discount**: 2.25 hours
- **Rate for farmer**: ₹1000/hour
- **Rate for owner**: ₹800/hour
- **Farmer discount**: ₹500

### Calculations:
1. **Revenue**: 97.25 × ₹1000 = ₹97,250
2. **Payable hours to owner**: 97.25 - 2.25 = 95 hours
3. **Amount to pay owner**: 95 × ₹800 = ₹76,000
4. **Additional profit from owner discount**: 2.25 × ₹1000 = ₹2,250
5. **Profit**: ₹97,250 - ₹76,000 + ₹2,250 - ₹500 = ₹23,000
6. **Pending from farmer**: ₹97,250 - ₹500 = ₹96,750 (minus advances/payments)

## Testing Checklist

- [ ] Run database migration: `backend/add-discount-fields.sql` in Supabase
- [ ] Create a new job with owner discount hours
- [ ] Create a new job with farmer discount amount
- [ ] Create a job with both discounts
- [ ] Verify dashboard shows correct discount totals
- [ ] Verify profit calculation includes discount impacts
- [ ] Verify pending amounts reflect discounts
- [ ] Edit existing job to add discounts
- [ ] Check Combined dashboard view
- [ ] Check Harvesting dashboard view
- [ ] Verify Indian number formatting works

## Files Modified

### Backend
- ✅ `backend/add-discount-fields.sql` (NEW)
- ✅ `backend/routes/jobs.js`
- ✅ `backend/routes/dashboard.js`

### Frontend
- ✅ `frontend/src/pages/Jobs.js`
- ✅ `frontend/src/pages/Dashboard.js`

## Next Steps

1. **Run the migration** in Supabase SQL Editor:
   ```sql
   -- Copy contents of backend/add-discount-fields.sql and execute
   ```

2. **Test with real data**:
   - Create test jobs with discounts
   - Verify calculations in dashboard
   - Check all three dashboard views

3. **Monitor for issues**:
   - Check console logs for errors
   - Verify database queries execute correctly
   - Test edge cases (zero discounts, large discounts, etc.)

## Support

If you encounter any issues:
1. Check browser console for frontend errors
2. Check `backend/server.log` for backend errors
3. Verify database migration ran successfully
4. Ensure all servers are running on correct ports (5001, 3000)
