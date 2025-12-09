#!/bin/bash

# ========================================
# COMPLETE DISCOUNT CLEANUP SCRIPT
# ========================================
# This script removes ALL discount-related code and files
# Run from project root: bash backend/cleanup-discounts.sh

echo "🧹 Starting complete discount cleanup..."

# Step 1: Delete discount-related files
echo "📁 Deleting discount-related files..."
rm -f backend/add-discount-fields.sql
rm -f backend/add-machine-discounts.sql  
rm -f backend/check-discounts.js
rm -f backend/fix-existing-discounts.js
rm -f backend/fix-discount-trigger.sql
rm -f DISCOUNT_IMPLEMENTATION_GUIDE.md
rm -f frontend/src/pages/Discounts.js

echo "✅ Discount files deleted"

# Step 2: Show files that need manual code removal
echo ""
echo "⚠️  The following files contain discount code that needs review:"
echo ""
echo "BACKEND FILES:"
echo "  - backend/routes/jobs.js (lines 89-227)"
echo "  - backend/routes/dashboard.js (lines 86, 165, 197-198, 260, 359-371, 388)"
echo ""
echo "FRONTEND FILES:"
echo "  - frontend/src/pages/Dashboard.js (lines 472-486, 620-634, 724-728)"
echo "  - frontend/src/pages/Machines.js (lines 516-613)"
echo "  - frontend/src/pages/Farmers.js (lines 500-641)"
echo "  - frontend/src/pages/Payments.js (lines 28, 258, 276, 754-793)"
echo "  - frontend/src/components/Layout.js (line 65)"
echo "  - frontend/src/index.css (lines 2183-2410, 2701-2706)"
echo ""
echo "📋 Next steps:"
echo "1. Run the SQL script: backend/remove-all-discounts.sql in Supabase"
echo "2. Review and clean the files listed above"
echo "3. Restart servers: ./stop.sh && ./start.sh"
echo ""
echo "✨ Discount file cleanup complete!"
