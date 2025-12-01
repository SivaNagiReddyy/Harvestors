# 🚜 Munagala AgriTech - Local Development Guide

## Quick Start

### Option 1: Run Both Servers Together (Recommended)
```bash
./start-local.sh
```

### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
./start-backend.sh
```

**Terminal 2 - Frontend:**
```bash
./start-frontend.sh
```

### Option 3: Manual Start

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

---

## 🌐 Local URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Login Credentials:** 
  - Username: `admin`
  - Password: `Krish@143`

---

## 📁 Project Structure

```
Harvestors/
├── backend/                 # Express.js API
│   ├── config/             # Database configuration
│   ├── middleware/         # Auth middleware
│   ├── models/             # Data models
│   ├── routes/             # API endpoints
│   ├── .env                # Environment variables
│   └── server.js           # Entry point
│
├── frontend/               # React application
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── api.js         # API client
│   │   ├── App.js         # Main app
│   │   └── index.js       # Entry point
│   └── .env.local         # Local environment
│
├── start-local.sh         # Start both servers
├── start-backend.sh       # Start backend only
└── start-frontend.sh      # Start frontend only
```

---

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- Supabase (PostgreSQL)
- JWT Authentication
- bcrypt for passwords

**Frontend:**
- React 18
- React Router v6
- Axios for API calls
- React Icons

---

## 🔧 Environment Configuration

### Backend (.env)
```env
PORT=5000
SUPABASE_URL=https://aaqkafykvhxhmayahidj.supabase.co
SUPABASE_KEY=your_key_here
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
```

### Frontend (.env.local)
```env
REACT_APP_API_URL=http://localhost:5000
```

---

## 🚀 Adding New Features

### 1. Backend API Endpoint

Create a new route file in `backend/routes/`:

```javascript
// backend/routes/myNewFeature.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../config/supabase');

// GET endpoint
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('my_table')
      .select('*');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

Register in `backend/server.js`:
```javascript
app.use('/api/my-new-feature', require('./routes/myNewFeature'));
```

### 2. Frontend Page

Create a new page in `frontend/src/pages/`:

```javascript
// frontend/src/pages/MyNewFeature.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MyNewFeature = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/my-new-feature', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My New Feature</h1>
      </div>
      {/* Your content here */}
    </div>
  );
};

export default MyNewFeature;
```

Add route in `frontend/src/App.js`:
```javascript
import MyNewFeature from './pages/MyNewFeature';

// In your Routes:
<Route path="/my-new-feature" element={<MyNewFeature />} />
```

Add to sidebar in `frontend/src/components/Layout.js`:
```javascript
{ path: '/my-new-feature', icon: <FaIcon />, label: 'My Feature' }
```

---

## 🧪 Testing Workflow

1. **Start Local Environment:**
   ```bash
   ./start-local.sh
   ```

2. **Make Your Changes** in `backend/` or `frontend/`

3. **Test in Browser:** http://localhost:3000

4. **Check Console** for errors:
   - Browser DevTools (F12)
   - Backend terminal logs

5. **Commit Changes:**
   ```bash
   git add .
   git commit -m "Add new feature: description"
   git push origin main
   ```

6. **Deploy to Production:**
   ```bash
   cd backend && vercel --prod
   cd ../frontend && vercel --prod
   ```

---

## 📝 Common Tasks

### Create New Database Table
Execute in Supabase SQL Editor:
```sql
CREATE TABLE my_table (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Add New API Endpoint
1. Create route file in `backend/routes/`
2. Add to `server.js`
3. Test with Postman or curl

### Add New Page
1. Create component in `frontend/src/pages/`
2. Add route in `App.js`
3. Add menu item in `Layout.js`

### Stop Servers
- Press `Ctrl+C` in terminal
- Or kill processes:
  ```bash
  lsof -ti:5000 | xargs kill -9  # Backend
  lsof -ti:3000 | xargs kill -9  # Frontend
  ```

---

## 🐛 Troubleshooting

**Port Already in Use:**
```bash
lsof -ti:5000 | xargs kill -9  # Kill backend
lsof -ti:3000 | xargs kill -9  # Kill frontend
```

**Dependencies Issues:**
```bash
cd backend && rm -rf node_modules package-lock.json && npm install
cd frontend && rm -rf node_modules package-lock.json && npm install
```

**Environment Variables Not Loading:**
- Check `.env` exists in backend
- Check `.env.local` exists in frontend
- Restart servers after changes

**Database Connection Failed:**
- Check `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Verify Supabase project is active

---

## 📚 Useful Commands

```bash
# Backend
cd backend
npm run dev              # Start with nodemon (auto-reload)
npm start               # Start production mode
npm install <package>   # Add new dependency

# Frontend
cd frontend
npm start               # Start development server
npm run build           # Build for production
npm install <package>   # Add new dependency

# Git
git status              # Check changes
git add .               # Stage all changes
git commit -m "message" # Commit changes
git push origin main    # Push to GitHub

# Deployment
cd backend && vercel --prod
cd frontend && vercel --prod
```

---

## 🎯 Next Steps

1. Start local environment: `./start-local.sh`
2. Open browser: http://localhost:3000
3. Login with: admin / Krish@143
4. Make your changes
5. Test thoroughly
6. Deploy to production

---

## 📞 Support

- **Production URL:** https://munagala-agritech.vercel.app
- **Backend API:** https://munagala-harvestors-ne60no599.vercel.app
- **Database:** Supabase PostgreSQL

Happy Coding! 🚜✨
