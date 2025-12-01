# ⚡ Quick Reference - Environment Variables

## 🔐 Supabase Credentials (Get from Supabase Dashboard → Settings → API)

### SUPABASE_URL
Format: `https://xxxxxxxxxxxxx.supabase.co`
Example: `https://abcdefghijklmno.supabase.co`

### SUPABASE_KEY  
Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...` (very long string)
Use: **anon/public key** (NOT the service_role key)

### JWT_SECRET
Generate with: `openssl rand -base64 32`
Or use any random string (minimum 32 characters)

---

## 📝 Backend Environment Variables (Vercel)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your_random_32_char_secret
NODE_ENV=production
```

---

## 📝 Frontend Environment Variables (Vercel)

```
REACT_APP_API_URL=https://your-backend.vercel.app/api
```

---

## 🚀 Deployment Steps

### 1. Supabase Setup
1. Create project at supabase.com
2. Run schema.sql in SQL Editor
3. Get URL and anon key

### 2. Backend Deployment
1. Push code to GitHub
2. Import to Vercel
3. Set Root Directory: `backend`
4. Add environment variables
5. Deploy

### 3. Frontend Deployment
1. Import same repo to Vercel
2. Set Root Directory: `frontend`
3. Add REACT_APP_API_URL
4. Deploy

---

## 🔑 Default Login

```
Username: admin
Password: admin123
```

**⚠️ Change password immediately after first login!**

---

## 📱 URLs After Deployment

- **Frontend**: `https://your-app-name.vercel.app`
- **Backend API**: `https://your-api-name.vercel.app`
- **Health Check**: `https://your-api-name.vercel.app/api/health`

---

## 🐛 Common Issues

### "Missing Supabase environment variables"
→ Check environment variables are set in Vercel

### "Invalid credentials" on login
→ Make sure you ran schema.sql and created admin user

### Frontend can't connect to backend  
→ Check REACT_APP_API_URL is correct
→ Check CORS is enabled in backend

### Database tables not found
→ Run schema.sql in Supabase SQL Editor

---

## ✅ Deployment Checklist

- [ ] Supabase project created
- [ ] schema.sql executed
- [ ] Admin user created
- [ ] Backend deployed to Vercel
- [ ] Backend environment variables set
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variable set
- [ ] Tested login works
- [ ] Changed default password

---

**Need help? Check SUPABASE_VERCEL_GUIDE.md for detailed instructions!**
