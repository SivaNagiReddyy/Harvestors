# 🚀 Vercel Deployment Guide - Separate Frontend & Backend

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- Vercel CLI installed: `npm install -g vercel`
- GitHub account (optional but recommended)

---

## 📦 Part 1: Deploy Backend API

### Step 1: Navigate to Backend Directory
```bash
cd /Users/sivanagireddy/Harvestors/backend
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy Backend
```bash
vercel --prod
```

**During deployment, answer these prompts:**
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name: `harvestors-backend` (or your preferred name)
- Directory: **. (current directory)**
- Override settings? **N**

### Step 4: Configure Environment Variables
After deployment, go to your Vercel dashboard:
1. Navigate to your backend project
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_key_change_in_production
TWILIO_ACCOUNT_SID=your_twilio_sid (optional)
TWILIO_AUTH_TOKEN=your_twilio_token (optional)
TWILIO_PHONE_NUMBER=your_twilio_phone (optional)
EMAIL_USER=your_email@gmail.com (optional)
EMAIL_PASSWORD=your_app_password (optional)
```

### Step 5: Redeploy with Environment Variables
```bash
vercel --prod
```

### Step 6: Note Your Backend URL
After deployment, you'll get a URL like:
```
https://harvestors-backend-xxxxx.vercel.app
```
**Save this URL - you'll need it for the frontend!**

---

## 🎨 Part 2: Deploy Frontend

### Step 1: Update Frontend API URL
Edit `/Users/sivanagireddy/Harvestors/frontend/src/api.js`:

Change this line:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'https://munagala-harvestors-api.vercel.app';
```

To your new backend URL:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'https://harvestors-backend-xxxxx.vercel.app';
```

### Step 2: Navigate to Frontend Directory
```bash
cd /Users/sivanagireddy/Harvestors/frontend
```

### Step 3: Deploy Frontend
```bash
vercel --prod
```

**During deployment, answer these prompts:**
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name: `harvestors-frontend` (or your preferred name)
- Directory: **. (current directory)**
- Override settings? **N**

### Step 4: Configure Environment Variables (Optional)
If you want to use environment variables:
1. Go to Vercel dashboard → Frontend project
2. Settings → Environment Variables
3. Add:
```
REACT_APP_API_URL=https://harvestors-backend-xxxxx.vercel.app
```

### Step 5: Your Frontend URL
After deployment, you'll get:
```
https://harvestors-frontend-xxxxx.vercel.app
```

---

## 🔧 Quick Deployment Script

I've created a script to automate this process. Run:
```bash
cd /Users/sivanagireddy/Harvestors
./deploy-to-vercel.sh
```

---

## 🔄 Updating After Changes

### Update Backend:
```bash
cd backend
vercel --prod
```

### Update Frontend:
```bash
cd frontend
vercel --prod
```

---

## ✅ Verification Checklist

- [ ] Backend deployed successfully
- [ ] Backend URL working: `https://your-backend.vercel.app/api/dashboard/stats`
- [ ] Environment variables added to backend
- [ ] Frontend deployed successfully
- [ ] Frontend API URL updated to point to backend
- [ ] Login working on frontend
- [ ] Dashboard loading data correctly

---

## 🐛 Troubleshooting

### Backend Issues:
1. **500 errors**: Check environment variables in Vercel dashboard
2. **CORS errors**: Ensure `cors` is enabled in server.js
3. **Database connection**: Verify SUPABASE_URL and SUPABASE_KEY

### Frontend Issues:
1. **API errors**: Verify API_URL in src/api.js points to correct backend
2. **Build fails**: Run `npm run build` locally to check for errors
3. **Routes not working**: Check vercel.json has correct rewrites

---

## 📱 Access Your App

**Frontend (User Interface):**
```
https://your-frontend-url.vercel.app
```

**Backend (API):**
```
https://your-backend-url.vercel.app/api
```

**Login Credentials:**
- Username: `admin`
- Password: `Krish@143`

---

## 🔐 Security Notes

After deployment:
1. Change the default admin password
2. Update JWT_SECRET to a strong random string
3. Enable HTTPS only (Vercel does this automatically)
4. Consider adding rate limiting for production

---

## 💡 Pro Tips

1. **Custom Domain**: Add your own domain in Vercel dashboard → Domains
2. **Automatic Deployments**: Connect to GitHub for auto-deploy on push
3. **Preview Deployments**: Every push to non-main branches creates preview URLs
4. **Environment Management**: Use different environments for staging/production

---

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Test backend API endpoints using Postman or curl
