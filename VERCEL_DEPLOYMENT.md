# Vercel Deployment Guide

## Prerequisites
1. GitHub account
2. Vercel account (sign up at https://vercel.com)
3. Git installed on your machine

## Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)
```bash
cd /Users/sivanagireddy/Harvestors
git init
git add .
git commit -m "Initial commit for Vercel deployment"
```

### 1.2 Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository (e.g., "Harvestors")
3. Don't initialize with README (we already have files)

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/Harvestors.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Backend to Vercel

### 2.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 2.2 Login to Vercel
```bash
vercel login
```

### 2.3 Deploy Backend
```bash
cd backend
vercel --prod
```

**During deployment, you'll be asked:**
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? **harvestors-backend**
- In which directory is your code located? **./**
- Want to override settings? **N**

### 2.4 Set Environment Variables
After deployment, go to your Vercel dashboard:
1. Select your backend project
2. Go to Settings → Environment Variables
3. Add these variables:
   - `SUPABASE_URL`: https://aaqkafykvhxhmayahidj.supabase.co
   - `SUPABASE_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcWthZnlrdmh4aG1heWFoaWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NzE2OTksImV4cCI6MjA3OTQ0NzY5OX0.-fVextZt9XWbEMz_Kg3e3mBNtlHMU8qm-EF9Nh57M-w
   - `JWT_SECRET`: [Generate a secure secret - use: openssl rand -base64 32]
   - `NODE_ENV`: production
4. Click "Save"
5. Redeploy: `vercel --prod`

**Your backend URL will be something like:**
`https://harvestors-backend.vercel.app`

## Step 3: Deploy Frontend to Vercel

### 3.1 Update Frontend API URL
Before deploying frontend, update the API URL:

Edit `frontend/src/api.js` or create `.env` file in frontend:

**Option A: Using .env file (Recommended)**
```bash
cd ../frontend
cat > .env << 'EOF'
REACT_APP_API_URL=https://your-backend-url.vercel.app/api
EOF
```

**Option B: Hardcode in api.js**
Update the baseURL in `frontend/src/api.js`:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'https://your-backend-url.vercel.app/api';
```

### 3.2 Deploy Frontend
```bash
cd frontend
vercel --prod
```

**During deployment:**
- Set up and deploy? **Y**
- Link to existing project? **N**
- What's your project's name? **harvestors-frontend**
- In which directory is your code located? **./**
- Want to override settings? **N**

### 3.3 Set Frontend Environment Variables
1. Go to Vercel dashboard → Frontend project
2. Settings → Environment Variables
3. Add:
   - `REACT_APP_API_URL`: https://your-backend-url.vercel.app/api
4. Redeploy: `vercel --prod`

**Your frontend URL will be:**
`https://harvestors-frontend.vercel.app`

## Step 4: Configure CORS

Update your backend to allow the frontend domain:

Edit `backend/server.js` CORS configuration:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://harvestors-frontend.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
}));
```

Then redeploy backend:
```bash
cd backend
vercel --prod
```

## Step 5: Custom Domains (Optional)

### For Backend:
1. Vercel Dashboard → Backend Project → Settings → Domains
2. Add your domain (e.g., api.yourdomain.com)
3. Follow DNS configuration instructions

### For Frontend:
1. Vercel Dashboard → Frontend Project → Settings → Domains
2. Add your domain (e.g., app.yourdomain.com or yourdomain.com)
3. Follow DNS configuration instructions

## Quick Deployment Commands

### After initial setup, use these for updates:

**Backend:**
```bash
cd /Users/sivanagireddy/Harvestors/backend
git add .
git commit -m "Update backend"
git push
# Vercel will auto-deploy
```

**Frontend:**
```bash
cd /Users/sivanagireddy/Harvestors/frontend
git add .
git commit -m "Update frontend"
git push
# Vercel will auto-deploy
```

## Troubleshooting

### Backend issues:
- Check logs: `vercel logs [deployment-url]`
- Verify environment variables are set
- Check Supabase connection

### Frontend issues:
- Clear browser cache
- Check API URL in Network tab
- Verify CORS settings

### Common Errors:
1. **CORS Error**: Update backend CORS configuration
2. **API Not Found**: Check REACT_APP_API_URL environment variable
3. **Database Error**: Verify Supabase credentials

## Monitoring

- **Backend Logs**: https://vercel.com/dashboard → Project → Deployments → Click deployment → Logs
- **Frontend Logs**: Same process
- **Analytics**: Vercel provides built-in analytics

## Security Checklist

✅ Environment variables set in Vercel (not in code)
✅ JWT_SECRET is unique and secure
✅ CORS properly configured
✅ Supabase RLS policies enabled
✅ API endpoints protected with authentication

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Discord: https://vercel.com/discord
- GitHub Issues: Create issue in your repository
