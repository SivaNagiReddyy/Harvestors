# Quick Start Guide - Harvester Dealership Management System

## ⚡ Fast Setup (5 minutes)

### Step 1: Ensure Prerequisites
```bash
# Check Node.js
node --version  # Should be v14 or higher

# Check MongoDB
mongod --version  # Should be v4.4 or higher
```

### Step 2: Install & Setup
```bash
# Run automated setup
./setup.sh
```

### Step 3: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Step 4: Access Application
- Open browser: http://localhost:3000
- Login: admin / admin123

---

## 📋 Common Tasks

### Add a Machine Owner
1. Login → Machine Owners → Add Machine Owner
2. Fill details: Name, Phone, Machine Type, Number, Rate
3. Optional: Add bank details
4. Click Create

### Add a Farmer
1. Farmers → Add Farmer
2. Fill: Name, Phone, Village
3. Click Create

### Add a Field
1. Fields → Add Field
2. Select Farmer
3. Add: Location, Village, Acres, Crop Type, Rate
4. Click Create

### Create a Harvesting Job
1. Jobs → Create Job
2. Select Field (farmer auto-filled)
3. Select Machine Owner
4. Set Scheduled Date
5. Click Create

### Record Payment

**From Farmer:**
1. Payments → Add Payment
2. Type: "From Farmer"
3. Select Job
4. Enter Amount and Method
5. Click Create

**To Machine Owner:**
1. Payments → Add Payment
2. Type: "To Machine Owner"
3. Select Job
4. Enter Amount and Method
5. Click Create

---

## 🔍 Troubleshooting

### MongoDB Connection Error
```bash
# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### Port Already in Use
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in backend/.env
PORT=5001
```

### React App Won't Start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Cannot Create Admin User
```bash
cd backend
# Make sure MongoDB is running
node createAdmin.js
```

---

## 🎯 Business Workflow Example

1. **Machine Owner Registration**
   - Raju (Combine Harvester, ₹1500/acre)
   - Kumar (Paddy Harvester, ₹1200/acre)

2. **Farmer Registration**
   - Venkat (Village: Repalle)
   - Prasad (Village: Bapatla)

3. **Field Addition**
   - Venkat's field: 10 acres, Paddy, ₹1500/acre

4. **Job Creation**
   - Assign Raju's machine to Venkat's field
   - Scheduled: Tomorrow
   - Amount: ₹15,000

5. **After Completion**
   - Mark job as "Completed"
   - Record payment from Venkat: ₹15,000
   - Record payment to Raju: ₹15,000

6. **Dashboard**
   - Total Jobs: 1
   - Revenue: ₹15,000
   - Expenses: ₹15,000
   - Profit: ₹0 (dealer earns from margins)

---

## 💡 Tips

- Set different rates for dealers and owners to earn profit
- Use the Dashboard to monitor pending payments
- Update job status as work progresses
- Record partial payments if needed
- Use notes field for important information

---

## 🆘 Need Help?

1. Check the main README.md
2. Review error messages in terminal
3. Check MongoDB logs
4. Verify .env configuration

---

**Ready to Go! 🚀**
