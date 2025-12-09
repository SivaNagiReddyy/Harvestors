#!/bin/bash

# Vercel Deployment Script for Harvestors
# Deploys Backend and Frontend separately

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Harvestors - Vercel Deployment Script${NC}"
echo -e "${BLUE}==========================================${NC}\n"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed${NC}"
    echo -e "${YELLOW}Install it with: npm install -g vercel${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI is installed${NC}\n"

# Login to Vercel
echo -e "${BLUE}📝 Logging in to Vercel...${NC}"
vercel login

echo ""
echo -e "${YELLOW}===============================================${NC}"
echo -e "${YELLOW}PART 1: DEPLOYING BACKEND${NC}"
echo -e "${YELLOW}===============================================${NC}"
echo ""

# Deploy Backend
echo -e "${BLUE}📦 Deploying Backend...${NC}"
cd backend

echo -e "${YELLOW}Starting backend deployment...${NC}"
vercel --prod

BACKEND_URL=$(vercel --prod 2>&1 | grep -o 'https://[^ ]*' | head -1)

if [ -z "$BACKEND_URL" ]; then
    echo -e "${YELLOW}⚠️  Could not automatically detect backend URL${NC}"
    echo -e "${YELLOW}Please enter your backend URL manually:${NC}"
    read -p "Backend URL: " BACKEND_URL
fi

echo ""
echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
echo -e "${GREEN}Backend URL: ${BACKEND_URL}${NC}"
echo ""

# Reminder for environment variables
echo -e "${YELLOW}⚠️  IMPORTANT: Configure Environment Variables${NC}"
echo -e "${YELLOW}Go to Vercel Dashboard → Backend Project → Settings → Environment Variables${NC}"
echo -e "${YELLOW}Add these variables:${NC}"
echo -e "  - SUPABASE_URL"
echo -e "  - SUPABASE_KEY"
echo -e "  - JWT_SECRET"
echo -e "  - TWILIO_ACCOUNT_SID (optional)"
echo -e "  - TWILIO_AUTH_TOKEN (optional)"
echo -e "  - TWILIO_PHONE_NUMBER (optional)"
echo -e "  - EMAIL_USER (optional)"
echo -e "  - EMAIL_PASSWORD (optional)"
echo ""
read -p "Press Enter after you've added environment variables..." 

echo ""
echo -e "${YELLOW}===============================================${NC}"
echo -e "${YELLOW}PART 2: DEPLOYING FRONTEND${NC}"
echo -e "${YELLOW}===============================================${NC}"
echo ""

# Update Frontend API URL
echo -e "${BLUE}🔧 Updating frontend API URL...${NC}"
cd ../frontend

# Backup original api.js
cp src/api.js src/api.js.backup

# Update API URL in api.js
sed -i.tmp "s|const API_URL = process.env.REACT_APP_API_URL.*|const API_URL = process.env.REACT_APP_API_URL || '${BACKEND_URL}';|" src/api.js
rm src/api.js.tmp

echo -e "${GREEN}✅ Frontend API URL updated to: ${BACKEND_URL}${NC}"
echo ""

# Deploy Frontend
echo -e "${BLUE}📦 Deploying Frontend...${NC}"
vercel --prod

FRONTEND_URL=$(vercel --prod 2>&1 | grep -o 'https://[^ ]*' | head -1)

if [ -z "$FRONTEND_URL" ]; then
    echo -e "${YELLOW}⚠️  Could not automatically detect frontend URL${NC}"
    echo -e "${YELLOW}Please enter your frontend URL manually:${NC}"
    read -p "Frontend URL: " FRONTEND_URL
fi

echo ""
echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
echo -e "${GREEN}Frontend URL: ${FRONTEND_URL}${NC}"
echo ""

# Summary
echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""
echo -e "${GREEN}Backend API:${NC}  ${BACKEND_URL}"
echo -e "${GREEN}Frontend App:${NC} ${FRONTEND_URL}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Open ${FRONTEND_URL}"
echo -e "2. Login with username: admin, password: Krish@143"
echo -e "3. Test all features"
echo ""
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo -e "- Change the default admin password"
echo -e "- Verify all environment variables are set in Vercel"
echo -e "- Check that the dashboard loads data correctly"
echo ""
echo -e "${GREEN}🚀 Happy harvesting!${NC}"
