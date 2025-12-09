# 🚀 Quick Deploy Commands

## Option 1: Automated Script (Recommended)
```bash
cd /Users/sivanagireddy/Harvestors
./deploy-to-vercel.sh
```

## Option 2: Manual Deployment

### Deploy Backend:
```bash
cd /Users/sivanagireddy/Harvestors/backend
vercel login
vercel --prod
```

**Copy the backend URL (e.g., https://harvestors-backend-xxxx.vercel.app)**

### Add Environment Variables to Backend:
Go to: Vercel Dashboard → Backend Project → Settings → Environment Variables

Add:
- `SUPABASE_URL` = your supabase project url
- `SUPABASE_KEY` = your supabase anon key
- `JWT_SECRET` = your_secret_key_here

Then redeploy:
```bash
vercel --prod
```

### Deploy Frontend:
```bash
cd /Users/sivanagireddy/Harvestors/frontend
```

First, update the API URL in `src/api.js`:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'https://your-backend-url.vercel.app';
```

Then deploy:
```bash
vercel --prod
```

## ✅ Done!
Your app is now live at the frontend URL provided by Vercel!

## 📝 Important Notes:
1. Backend and frontend are deployed separately
2. Frontend points to backend API URL
3. Environment variables must be set in Vercel dashboard
4. Login: admin / Krish@143
