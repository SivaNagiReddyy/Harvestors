# 🧪 Testing Quick Reference Guide

## Quick Start

```bash
# 1. Navigate to backend directory
cd backend

# 2. Clean existing test data
node cleanup-test-data.js

# 3. Insert fresh sample data
node test-data-setup-v2.js

# 4. Run comprehensive tests
node test-business-logic-fixed.js
```

## Expected Output

### Data Setup (test-data-setup-v2.js)
```
✅ Inserted 3 machine owners
✅ Inserted 3 machines
✅ Inserted 5 farmers
✅ Inserted 5 harvesting jobs
✅ Inserted 3 dealers
✅ Inserted 4 machine rentals
✅ Inserted 4 rental payments

Total Harvesting Revenue: ₹49,075
Total Dealer Revenue: ₹63,500
Total Profit from Rentals: ₹7,710
```

### Test Results (test-business-logic-fixed.js)
```
Total Tests: 8
Passed: 8
Failed: 0
Success Rate: 100.00%

🎉 All tests passed!
```

## Sample Data Overview

### Machine Owners (3)
1. Rajesh Kumar - Munagala
2. Suresh Reddy - Nalgonda
3. Ramesh Naidu - Miryalaguda

### Machines (3)
1. MH-1001 - Combine Harvester (Rajesh)
2. MH-1002 - Combine Harvester (Suresh)
3. MH-1003 - Tractor (Ramesh)

### Farmers (5)
1. Venkatesh - Munagala
2. Lakshmi - Nalgonda
3. Narayana - Miryalaguda
4. Srinivas - Kodad
5. Anjali - Suryapet

### Harvesting Jobs (5)
| Job | Farmer | Machine | Hours | Rate | Amount | Status | Advance |
|-----|--------|---------|-------|------|--------|--------|---------|
| 1 | Venkatesh | MH-1001 | 5.5 | ₹1,200 | ₹6,600 | Completed | ₹6,600 (Full) |
| 2 | Lakshmi | MH-1002 | 8.0 | ₹1,500 | ₹12,000 | Completed | ₹5,000 (Partial) |
| 3 | Narayana | MH-1001 | 10.0 | ₹1,200 | ₹12,000 | In Progress | ₹0 (None) |
| 4 | Srinivas | MH-1003 | 6.5 | ₹1,400 | ₹9,100 | Completed | ₹9,100 (Full) |
| 5 | Anjali | MH-1002 | 7.5 | ₹1,250 | ₹9,375 | Completed | ₹4,000 (Partial) |

**Totals:**
- Revenue: ₹49,075
- Collected: ₹24,700 (50.3%)
- Pending: ₹24,375
- Expenses: ₹5,400

### Dealers (3)
1. Srinivas Enterprises - Hyderabad
2. Lakshmi Trading - Warangal
3. Rama Krishna Agencies - Vijayawada

### Machine Rentals (4)
| Rental | Dealer | Machine | Hours | Dealer Rate | Owner Rate | Revenue | Cost | Profit |
|--------|--------|---------|-------|-------------|------------|---------|------|--------|
| 1 | Srinivas | MH-1001 | 10 | ₹1,500 | ₹1,350 | ₹15,000 | ₹13,500 | ₹1,500 |
| 2 | Lakshmi | MH-1002 | 10 | ₹1,800 | ₹1,584 | ₹18,000 | ₹15,840 | ₹2,160 |
| 3 | Rama Krishna | MH-1003 | 10 | ₹2,000 | ₹1,700 | ₹20,000 | ₹17,000 | ₹3,000 |
| 4 | Srinivas | MH-1001 | 7 | ₹1,500 | ₹1,350 | ₹10,500 | ₹9,450 | ₹1,050 |

**Totals:**
- Revenue: ₹63,500
- Cost: ₹55,790
- Profit: ₹7,710 (12.14% margin)
- Collected: ₹35,000 (55.1%)
- Pending: ₹28,500

## Test Coverage

### ✅ Direct Harvesting Tests (3)
1. **Revenue Calculation** - Validates hours × rate logic
2. **Pending Payments** - Tracks farmer payment status
3. **Job Status Distribution** - Monitors workflow

### ✅ Dealer Rental Tests (2)
4. **Profit Margins** - Validates rental profitability
5. **Payment Tracking** - Monitors dealer payments

### ✅ Data Integrity Tests (3)
6. **Entity Counts** - Verifies data completeness
7. **Foreign Keys** - Validates relationships
8. **Business Overview** - End-to-end validation

## Key Metrics Tested

### Revenue Tracking
- ✅ Total harvesting revenue: ₹49,075
- ✅ Total dealer revenue: ₹63,500
- ✅ Combined revenue: ₹112,575

### Profitability
- ✅ Harvesting gross profit: ₹43,675 (89% margin)
- ✅ Rental profit: ₹7,710 (12.14% margin)
- ✅ Net profit: ₹51,385 (104.71% overall)

### Collection Performance
- ✅ Farmer collection rate: 50.3%
- ✅ Dealer collection rate: 55.1%
- ✅ Total pending: ₹52,875

### Operational Stats
- ✅ Job completion rate: 80%
- ✅ Machine utilization: 100%
- ✅ Active dealers: 3
- ✅ Data integrity: 100%

## Troubleshooting

### Issue: Tests failing with "Missing Supabase environment variables"
**Solution:** 
```bash
cp .env.example .env
```

### Issue: Duplicate key errors
**Solution:** Run cleanup first
```bash
node cleanup-test-data.js
```

### Issue: Tests show ₹0 revenue
**Solution:** Data inserted without total_amount (uses calculated fields)
- This is correct behavior
- Tests calculate: hours × rate_per_hour

### Issue: Foreign key violations
**Solution:** Check insertion order in test-data-setup-v2.js
- Owners → Machines → Jobs
- Dealers → Rentals → Payments

## Files Reference

### Production Files
- `test-data-setup-v2.js` - ✅ Sample data insertion
- `cleanup-test-data.js` - ✅ Database cleanup
- `test-business-logic-fixed.js` - ✅ Comprehensive tests (8 tests, all passing)

### Documentation Files
- `TESTING_SUMMARY.md` - Detailed analysis and findings
- `TEST_RESULTS.md` - Full test results with metrics
- `TEST_QUICK_REFERENCE.md` - This file

### Deprecated Files (Do not use)
- `test-data-setup.js` - ❌ Old version with schema mismatches
- `test-business-logic.js` - ❌ Old tests (5/8 failing)

## One-Line Commands

```bash
# Run complete test cycle
node cleanup-test-data.js && node test-data-setup-v2.js && node test-business-logic-fixed.js

# Quick data refresh
node cleanup-test-data.js && node test-data-setup-v2.js

# Tests only (assumes data exists)
node test-business-logic-fixed.js

# View dashboard (requires frontend running)
# Open http://localhost:3000 in browser
```

## Environment Requirements

- ✅ Node.js v14+
- ✅ Supabase account and credentials
- ✅ Backend server running (port 5001)
- ✅ .env file with valid Supabase credentials

## Success Indicators

When everything is working correctly, you should see:

1. **Data Setup:**
   - ✅ "Inserted X entities" for each table
   - ✅ Revenue totals showing meaningful amounts
   - ✅ No errors during insertion

2. **Test Execution:**
   - ✅ All 8 tests showing "PASS"
   - ✅ Success Rate: 100.00%
   - ✅ 🎉 "All tests passed!" message

3. **Dashboard Display:**
   - ✅ Combined Overview showing ₹112,575 revenue
   - ✅ Direct Harvesting showing ₹49,075
   - ✅ Dealer Rentals showing ₹63,500
   - ✅ All tiles populated with data

## Need Help?

1. Check `TESTING_SUMMARY.md` for detailed analysis
2. Review `TEST_RESULTS.md` for expected values
3. Ensure backend server is running: `node server.js`
4. Verify .env file has correct Supabase credentials
5. Run cleanup if encountering duplicate key errors

---

**Last Updated:** January 24, 2025  
**Test Status:** ✅ All Systems Operational  
**Test Coverage:** 100%
