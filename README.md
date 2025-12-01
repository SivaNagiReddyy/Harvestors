# Harvester Dealership Management System

A comprehensive web application for managing a harvester dealership business. This system helps dealers manage machine owners, farmers, fields, harvesting jobs, and payment tracking.

## 🌾 Business Flow

1. **Machine Owners** register with their harvesting machines and rates
2. **Farmers** register with their field information
3. **Dealer** creates harvesting **Jobs** by assigning machine owners to fields
4. System tracks **Payments** both to machine owners and from farmers
5. **Dashboard** provides real-time insights into business operations

## 🚀 Features

### Machine Owner Management
- Register machine owners with complete details
- Track machine types, models, and registration numbers
- Manage payment rates per acre
- Store bank details for easy payments
- Track pending and paid amounts

### Farmer Management
- Register farmers with contact information
- Organize by villages
- Track payment history
- Manage multiple fields per farmer

### Field Management
- Add fields with location, survey numbers, and crop types
- Track field sizes in acres
- Set rates per acre
- Monitor field status (Available, Assigned, Completed)

### Job Management
- Assign machine owners to fields
- Schedule harvesting dates
- Track job status (Scheduled, In Progress, Completed, Cancelled)
- Automatic calculation of total amounts
- Add notes for each job

### Payment Tracking
- Record payments to machine owners
- Record payments from farmers
- Support multiple payment methods (Cash, Bank Transfer, UPI, Cheque)
- Track transaction IDs
- Automatic balance updates

### Dashboard & Analytics
- Real-time business statistics
- Financial overview (Revenue, Expenses, Profit)
- Pending payments tracking
- Recent jobs and payments
- Visual indicators for key metrics

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🛠️ Installation & Setup

### Quick Setup (Recommended)

```bash
chmod +x setup.sh
./setup.sh
```

### Manual Setup

#### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/harvester_dealership
JWT_SECRET=your_secret_key_here_change_in_production
NODE_ENV=development
```

Create admin user:
```bash
node createAdmin.js
```

#### 2. Frontend Setup

```bash
cd frontend
npm install
```

#### 3. Start MongoDB

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

## 🎮 Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
Frontend: http://localhost:3000

## 🔐 Default Login

- **Username:** admin
- **Password:** admin123

⚠️ Change password after first login!

## 📱 Usage Guide

### 1. Initial Setup
- Login with admin credentials
- Add machine owners with their machines and rates
- Add farmers with village information
- Add fields for each farmer

### 2. Creating Jobs
- Navigate to "Harvesting Jobs"
- Click "Create Job"
- Select available field and machine owner
- Set scheduled date
- System calculates total automatically

### 3. Recording Payments
- Go to "Payments" → "Add Payment"
- Select payment type (From Farmer / To Machine Owner)
- Choose completed job
- Enter payment details
- Balances update automatically

## 🗂️ Project Structure

```
Harvestors/
├── backend/
│   ├── models/           # Database schemas
│   ├── routes/           # API endpoints
│   ├── middleware/       # Auth middleware
│   ├── server.js         # Express server
│   └── createAdmin.js    # Setup script
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── api.js        # API service
│   │   └── AuthContext.js
│   └── package.json
└── setup.sh              # Auto setup script
```

## 🔧 Technology Stack

**Backend:** Node.js, Express, MongoDB, JWT, bcrypt  
**Frontend:** React, React Router, Axios, React Icons

## 🎨 Key Features

- ✅ Automatic amount calculations
- ✅ Real-time balance updates
- ✅ Field status management
- ✅ Responsive design
- ✅ Form validation
- ✅ Secure authentication

## 📊 API Endpoints

- **Auth:** `/api/auth/login`, `/api/auth/register`
- **Machine Owners:** `/api/machine-owners`
- **Farmers:** `/api/farmers`
- **Fields:** `/api/fields`
- **Jobs:** `/api/jobs`
- **Payments:** `/api/payments`
- **Dashboard:** `/api/dashboard/stats`

## 🚧 Future Enhancements

- SMS/WhatsApp notifications
- PDF invoice generation
- Advanced analytics
- Mobile app
- Multi-language support
- GPS tracking
- Weather integration

## 👨‍💻 Development

Built with ❤️ for harvester dealerships

---

**Happy Harvesting! 🚜🌾**
