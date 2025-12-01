# 🚀 Supabase + Vercel Deployment Guide

## Step 1: Setup Supabase

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Click "Start your project"
3. Create a new organization (if needed)
4. Click "New Project"
5. Fill in:
   - **Name**: harvester-dealership
   - **Database Password**: (Create a strong password - SAVE THIS!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine to start
6. Click "Create new project"
7. Wait 2-3 minutes for project to be ready

### 1.2 Run Database Schema
1. In Supabase Dashboard, click "SQL Editor" in left sidebar
2. Click "New Query"
3. Copy the entire content from `/backend/schema.sql`
4. Paste into the SQL editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

### 1.3 Create First Admin User
1. In SQL Editor, create a new query
2. Run this SQL (change password as needed):

```sql
INSERT INTO users (username, password, name, role)
VALUES (
  'admin',
  '$2a$10$rYz6VZhzX.xH4dGxQqJ5K.kKZqYQy5uqI4vXJ8F5gGqJ5K.kKZqYQ',  -- Password: admin123
  'Administrator',
  'Admin'
);
```

Or hash your own password in Node.js:
```javascript
const bcrypt = require('bcryptjs');
console.log(await bcrypt.hash('your_password', 10));
```

### 1.4 Get Supabase Credentials
1. Click "Settings" (gear icon) in left sidebar
2. Click "API" under Project Settings
3. You'll need:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)

## Step 2: Deploy Backend to Vercel

### 2.1 Prepare Backend for Vercel
1. Create `vercel.json` in backend folder (already created below)
2. Make sure `.env` is in `.gitignore`

### 2.2 Deploy to Vercel
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)

5. Add Environment Variables:
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_KEY`: Your Supabase anon key
   - `JWT_SECRET`: Create a random secret (e.g., `openssl rand -base64 32`)
   - `NODE_ENV`: `production`

6. Click "Deploy"
7. Wait 1-2 minutes
8. Your backend URL will be: `https://your-project.vercel.app`

## Step 3: Deploy Frontend to Vercel

### 3.1 Update Frontend API URL
In `frontend/src/api.js`, update the API_URL:

```javascript
const API_URL = process.env.REACT_APP_API_URL || '/api';
```

### 3.2 Deploy Frontend
1. In Vercel, click "Add New Project"
2. Import same repository
3. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

4. Add Environment Variables:
   - `REACT_APP_API_URL`: Your backend URL (e.g., `https://your-backend.vercel.app/api`)

5. Click "Deploy"
6. Your frontend URL will be: `https://your-frontend.vercel.app`

## Step 4: Test Your Deployment

1. Open your frontend URL
2. Login with: `admin` / `admin123` (or password you set)
3. Test creating machine owners, farmers, etc.

## Environment Variables Summary

### Backend (.env)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your_random_secret_key_here
NODE_ENV=production
```

### Frontend (.env)
```
REACT_APP_API_URL=https://your-backend.vercel.app/api
```

## Vercel Configuration

Create `/backend/vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

Create `/frontend/vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

## Troubleshooting

### Backend not connecting to Supabase
- Check environment variables are set correctly
- Verify Supabase URL and key
- Check Supabase project is not paused

### Frontend can't reach backend
- Verify REACT_APP_API_URL is set
- Check CORS settings in backend
- Look at browser console for errors

### Database errors
- Make sure schema.sql was run successfully
- Check Supabase logs: Dashboard → Logs
- Verify table names match (snake_case in database)

### Login not working
- Make sure admin user was created
- Check JWT_SECRET is set
- Verify password was hashed correctly

## Cost Estimate

### Supabase Free Tier:
- 500MB database storage
- 2GB bandwidth
- 50,000 monthly active users
- Good for: Development + Small production

### Vercel Free Tier:
- 100GB bandwidth
- Unlimited deployments
- Custom domains
- Good for: Development + Small production

### Both are FREE for small applications!

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET
- [ ] Enable RLS (Row Level Security) in Supabase (optional)
- [ ] Set up custom domain with HTTPS
- [ ] Regular backups of Supabase database
- [ ] Monitor Vercel deployment logs
- [ ] Set up error tracking (Sentry, etc.)

## Next Steps

1. **Custom Domain**: 
   - Add custom domain in Vercel settings
   - Update DNS records

2. **Backup Strategy**:
   - Supabase Dashboard → Database → Backups
   - Set up automated backups

3. **Monitoring**:
   - Set up Vercel Analytics
   - Monitor Supabase Dashboard

4. **Scale**:
   - Upgrade Supabase plan if needed
   - Upgrade Vercel plan for more bandwidth

---

**Your app is now live! 🎉**

Frontend: `https://your-app.vercel.app`
Backend API: `https://your-api.vercel.app`

Login and start managing your harvester dealership business!
