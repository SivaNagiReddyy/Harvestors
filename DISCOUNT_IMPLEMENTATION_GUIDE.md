# 💰 Discount Functionality Implementation Guide

## Overview
A comprehensive discount system has been added to your billing application supporting discounts in both directions:
1. **Owner-to-Me Discount**: Reduces what you pay to machine owners
2. **Me-to-Farmer Discount**: Reduces what farmers pay to you

## 🗄️ Database Changes Required

### Step 1: Run the SQL Migration
Execute the following SQL file in your Supabase SQL Editor:
```
/backend/add-discount-fields.sql
```

This adds:
- `discount_from_owner` - Discount received from owner
- `discount_to_farmer` - Discount given to farmer
- `net_amount_to_owner` - Net amount after owner discount
- `net_amount_from_farmer` - Net amount after farmer discount
- Validation constraints to prevent discounts exceeding amounts
- Similar fields for `machine_rentals` and `payments` tables

### Step 2: Verify Schema Changes
After running the migration, verify these columns exist:

**harvesting_jobs table:**
- discount_from_owner (DECIMAL 10,2)
- discount_to_farmer (DECIMAL 10,2)
- net_amount_to_owner (DECIMAL 15,2)
- net_amount_from_farmer (DECIMAL 15,2)

**payments table:**
- discount_amount (DECIMAL 10,2)
- gross_amount (DECIMAL 15,2)

**machine_rentals table:**
- discount_from_owner (DECIMAL 10,2)
- discount_to_dealer (DECIMAL 10,2)
- net_cost_to_owner (DECIMAL 15,2)
- net_amount_charged (DECIMAL 15,2)

## 🔧 Backend Changes (Already Implemented)

### 1. Jobs Route (`/backend/routes/jobs.js`)
**Changes Made:**
- Added `discountFromOwner` and `discountToFarmer` parameters
- Calculates gross and net amounts automatically
- Validates discounts don't exceed gross amounts
- Updates pending amounts using net values (after discount)
- Stores both gross and net amounts in database

**Sample API Request:**
```json
POST /api/jobs
{
  "farmer": "farmer-uuid",
  "machine": "machine-uuid",
  "hours": 10,
  "ratePerHour": 2500,
  "discountFromOwner": 500,
  "discountToFarmer": 300,
  "workDate": "2025-11-28"
}
```

**Calculations:**
- Gross Revenue (Farmer): 10 hrs × ₹2,500 = ₹25,000
- Net Revenue (after ₹300 discount): ₹24,700
- Owner Cost (using machine rate_per_acre): 10 hrs × ₹2,000 = ₹20,000
- Net Owner Cost (after ₹500 discount): ₹19,500
- Your Profit: ₹24,700 - ₹19,500 = ₹5,200

### 2. Payments Route (`/backend/routes/payments.js`)
**Changes Made:**
- Added `discountAmount` parameter for individual payments
- Stores `gross_amount` and `discount_amount` separately
- Net amount is calculated as: `gross_amount - discount_amount`
- Updates balances using net amounts

**Sample API Request:**
```json
POST /api/payments
{
  "type": "To Machine Owner",
  "machineOwner": "owner-uuid",
  "amount": 10000,
  "discountAmount": 500,
  "paymentMethod": "Cash"
}
```

### 3. Dashboard Route (`/backend/routes/dashboard.js`)
**Changes Made:**
- Uses `net_amount_to_owner` for owner earnings
- Uses `net_amount_from_farmer` for revenue calculations
- All pending calculations use net amounts
- Automatically falls back to gross amounts for old records

## 🎨 Frontend Changes (Already Implemented)

### 1. Jobs Page (`/frontend/src/pages/Jobs.js`)
**New Fields Added:**
- "Discount from Owner" input field (green hint: reduces payment to owner)
- "Discount to Farmer" input field (red hint: reduces collection from farmer)
- Visual section header: "💰 Discount Management"
- Helper text explaining each discount type

**Form Layout:**
```
┌─────────────────────────────────────┐
│ 💰 Discount Management              │
│ Optional discounts to adjust billing│
├─────────────────┬───────────────────┤
│ Discount from   │ Discount to       │
│ Owner (₹)       │ Farmer (₹)        │
│ [input field]   │ [input field]     │
│ ✓ Reduces what  │ ✓ Reduces what    │
│ you pay to owner│ farmer pays to you│
└─────────────────┴───────────────────┘
```

### 2. Payments Page (`/frontend/src/pages/Payments.js`)
**New Fields Added:**
- "Gross Amount" - Original payment amount (before discount)
- "Discount" - Discount amount to apply
- Real-time calculation summary showing:
  - Gross Amount
  - Discount (in red)
  - Net Payment (in green, highlighted)

**Visual Summary:**
```
┌─────────────────────────────────────┐
│ Gross Amount:        ₹10,000        │
│ Discount:            -₹500          │
│ ─────────────────────────────────── │
│ Net Payment:         ₹9,500         │
└─────────────────────────────────────┘
```

## 📊 How It Works

### Scenario 1: Adding a New Job with Discounts
```
Farmer Rate: ₹2,500/hr
Owner Rate: ₹2,000/hr
Hours: 10
Owner Discount: ₹1,000
Farmer Discount: ₹500

Calculations:
- Gross Revenue: 10 × 2,500 = ₹25,000
- Net Revenue: 25,000 - 500 = ₹24,500 (what farmer pays)
- Gross Owner Cost: 10 × 2,000 = ₹20,000
- Net Owner Cost: 20,000 - 1,000 = ₹19,000 (what you pay)
- Your Profit: 24,500 - 19,000 = ₹5,500

Dashboard will show:
- Revenue: ₹24,500 (net from farmer)
- To Pay Owners: ₹19,000 (net to owner)
- Profit: ₹5,500
```

### Scenario 2: Making a Payment with Discount
```
Owner Bill: ₹15,000
Payment with Discount: ₹14,500 (₹500 discount)

Database stores:
- gross_amount: 15,000
- discount_amount: 500
- amount: 14,500 (net)

Owner's Balance: reduces by ₹14,500 (not ₹15,000)
```

## ✅ Validation Rules

1. **Owner Discount**: Must be ≥ 0 and ≤ Gross Owner Amount
2. **Farmer Discount**: Must be ≥ 0 and ≤ Total Amount
3. **Payment Discount**: Must be ≥ 0 and ≤ Gross Amount
4. Database constraints enforce these rules automatically

## 🧪 Testing Checklist

### 1. Test Job Creation with Discounts
- [ ] Create job without discounts (should work as before)
- [ ] Create job with owner discount only
- [ ] Create job with farmer discount only
- [ ] Create job with both discounts
- [ ] Try invalid discount (> amount) - should fail with error
- [ ] Verify dashboard shows net amounts

### 2. Test Payment with Discounts
- [ ] Make payment without discount
- [ ] Make payment with discount
- [ ] Verify net payment summary appears
- [ ] Check balances update correctly with net amounts
- [ ] Try discount > gross amount - should fail

### 3. Test Dashboard Calculations
- [ ] Verify "Revenue" shows net amounts (after farmer discount)
- [ ] Verify "To Pay Owners" shows net amounts (after owner discount)
- [ ] Verify profit calculation is correct
- [ ] Check pending amounts use net values

### 4. Test Edit Functionality
- [ ] Edit existing job, add discounts
- [ ] Edit existing job, change discounts
- [ ] Edit payment, add discount
- [ ] Verify old records without discounts still work

## 📈 Reports and Analytics

The dashboard automatically shows:
- **Net Revenue**: What farmers actually pay (after their discounts)
- **Net Owner Cost**: What you actually pay owners (after their discounts)
- **Accurate Profit**: Based on net amounts, not gross

All pending amounts, balances, and summaries use net values to reflect actual cash flow.

## 🔄 Migration for Existing Data

The SQL migration automatically:
1. Sets `discount_from_owner = 0` for existing jobs
2. Sets `discount_to_farmer = 0` for existing jobs
3. Calculates `net_amount_to_owner` = gross amount
4. Calculates `net_amount_from_farmer` = total amount
5. Updates all existing payments with `gross_amount = amount` and `discount_amount = 0`

**No manual data updates required!**

## 🚀 Deployment Steps

1. **Backup Database** (Important!)
   ```sql
   -- Create backup of critical tables
   CREATE TABLE harvesting_jobs_backup AS SELECT * FROM harvesting_jobs;
   CREATE TABLE payments_backup AS SELECT * FROM payments;
   ```

2. **Run Migration**
   - Open Supabase SQL Editor
   - Copy content from `/backend/add-discount-fields.sql`
   - Execute the migration
   - Verify no errors

3. **Restart Application**
   ```bash
   cd /Users/sivanagireddy/Harvestors
   ./restart.sh
   ```

4. **Test Thoroughly**
   - Follow the testing checklist above
   - Create a test job with discounts
   - Verify dashboard calculations
   - Check all reports

## 💡 Usage Tips

1. **Owner Discounts**: Use when:
   - Owner gives you a volume discount
   - Special arrangement with long-term partners
   - Promotional/seasonal discounts

2. **Farmer Discounts**: Use when:
   - Offering discounts for prompt payment
   - Loyalty discounts for regular customers
   - Special pricing for difficult conditions

3. **Payment Discounts**: Use when:
   - Settling final accounts with adjustments
   - Applying negotiated discounts at payment time
   - Correcting previous billing errors

## 🐛 Troubleshooting

**Issue: "Discount exceeds amount" error**
- Solution: Check that discount ≤ gross amount
- Database constraints prevent invalid discounts

**Issue: Old jobs showing wrong amounts**
- Solution: Migration sets net = gross for old records
- They work exactly as before (0 discount)

**Issue: Dashboard showing unexpected values**
- Solution: Refresh browser cache
- Verify database migration completed successfully
- Check console for any API errors

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Check backend logs for validation errors
3. Verify SQL migration completed without errors
4. Ensure all required fields are populated

## 🎯 Next Steps

After successful implementation:
1. Train staff on using discount fields
2. Document your discount policies
3. Monitor profit margins with new discount tracking
4. Consider adding discount reports/analytics
5. Set up alerts for large discounts (if needed)

---

**Implementation Status**: ✅ Code Complete - Ready for Database Migration

**Files Modified**:
- ✅ `/backend/routes/jobs.js`
- ✅ `/backend/routes/payments.js`
- ✅ `/backend/routes/dashboard.js`
- ✅ `/frontend/src/pages/Jobs.js`
- ✅ `/frontend/src/pages/Payments.js`

**Files Created**:
- ✅ `/backend/add-discount-fields.sql`
- ✅ `/DISCOUNT_IMPLEMENTATION_GUIDE.md`
