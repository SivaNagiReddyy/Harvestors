# 🚀 Deployment Guide

This guide will help you deploy your Harvester Dealership Management System to production.

## 📋 Pre-Deployment Checklist

### Security:
- [ ] Change JWT_SECRET in .env
- [ ] Change default admin password
- [ ] Enable HTTPS
- [ ] Set up firewall rules
- [ ] Configure CORS for production domain
- [ ] Review and restrict API access

### Database:
- [ ] Set up MongoDB Atlas (cloud) or secure local MongoDB
- [ ] Configure database backups
- [ ] Set up database replication (optional)
- [ ] Update MONGODB_URI in .env

### Application:
- [ ] Test all features locally
- [ ] Build frontend for production
- [ ] Configure production environment variables
- [ ] Set up logging
- [ ] Configure error monitoring

---

## 🌐 Deployment Options

### Option 1: Traditional VPS (Recommended for Beginners)

**Providers:** DigitalOcean, Linode, AWS EC2, Azure VM

#### Step 1: Server Setup
```bash
# SSH into your server
ssh root@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
# Follow: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (Reverse Proxy)
sudo apt install -y nginx
```

#### Step 2: Clone and Setup
```bash
# Create app directory
mkdir -p /var/www/harvester
cd /var/www/harvester

# Clone your code (or upload via FTP)
git clone <your-repo-url> .

# Install dependencies
cd backend
npm install --production
cd ../frontend
npm install
```

#### Step 3: Build Frontend
```bash
cd /var/www/harvester/frontend
npm run build
```

#### Step 4: Configure Backend .env
```bash
cd /var/www/harvester/backend
nano .env
```

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/harvester_dealership
JWT_SECRET=your_secure_random_secret_key_here
NODE_ENV=production
```

#### Step 5: Start Backend with PM2
```bash
cd /var/www/harvester/backend
pm2 start server.js --name harvester-backend
pm2 save
pm2 startup
```

#### Step 6: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/harvester
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/harvester/frontend/build;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/harvester /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 7: Set Up SSL (HTTPS)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

---

### Option 2: MongoDB Atlas (Cloud Database)

#### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Set up database user
4. Whitelist IP addresses (or allow all: 0.0.0.0/0)
5. Get connection string

#### Step 2: Update Backend .env
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/harvester_dealership?retryWrites=true&w=majority
```

---

### Option 3: Heroku (Easy Cloud Deployment)

#### Step 1: Prepare Application
```bash
# In backend directory, create Procfile
echo "web: node server.js" > backend/Procfile

# Update backend package.json
# Add: "start": "node server.js"
```

#### Step 2: Deploy Backend
```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
cd backend
heroku create your-app-backend

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set JWT_SECRET=your_secret_key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Create admin user
heroku run node createAdmin.js
```

#### Step 3: Deploy Frontend
```bash
# Build frontend
cd frontend
npm run build

# Deploy to Netlify/Vercel (recommended)
# Or create separate Heroku app for frontend
```

---

### Option 4: Docker (Advanced)

#### Step 1: Create Dockerfile (Backend)
```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

#### Step 2: Create docker-compose.yml
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/harvester_dealership
      - JWT_SECRET=your_secret_key
      - NODE_ENV=production
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongo-data:
```

#### Step 3: Deploy
```bash
docker-compose up -d
```

---

## 📊 Production Monitoring

### PM2 Monitoring
```bash
# View logs
pm2 logs harvester-backend

# Monitor
pm2 monit

# Restart
pm2 restart harvester-backend
```

### Database Backup
```bash
# Manual backup
mongodump --uri="mongodb://localhost:27017/harvester_dealership" --out=/backup/$(date +%Y%m%d)

# Automated daily backup (cron)
0 2 * * * mongodump --uri="mongodb://localhost:27017/harvester_dealership" --out=/backup/$(date +\%Y\%m\%d)
```

---

## 🔧 Performance Optimization

### Backend:
1. Enable compression
2. Use connection pooling
3. Add Redis for caching (optional)
4. Enable database indexing

### Frontend:
1. Code splitting
2. Lazy loading
3. Image optimization
4. Service workers (PWA)

### Server:
1. Enable Gzip compression
2. Set up CDN (Cloudflare)
3. Optimize Nginx configuration
4. Monitor server resources

---

## 🚨 Troubleshooting Production Issues

### Backend not starting:
```bash
pm2 logs harvester-backend
# Check for errors
```

### Database connection issues:
```bash
# Test MongoDB connection
mongo your-connection-string

# Check firewall
sudo ufw status
```

### Frontend not loading:
```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## 📈 Scaling Strategies

### Horizontal Scaling:
1. Add load balancer
2. Multiple backend instances
3. Database replication
4. Separate frontend CDN

### Vertical Scaling:
1. Upgrade server resources
2. Optimize database queries
3. Add caching layer
4. Use database indexes

---

## 🔐 Security Best Practices

1. **Always use HTTPS**
2. **Regular security updates**
3. **Database backups**
4. **Rate limiting on API**
5. **Input validation**
6. **SQL injection prevention**
7. **XSS protection**
8. **CSRF tokens**
9. **Secure password policies**
10. **Regular security audits**

---

## 📞 Post-Deployment

### Monitoring Setup:
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Configure error tracking (Sentry)
- [ ] Set up analytics (optional)
- [ ] Create backup schedule
- [ ] Document deployment process

### User Training:
- [ ] Train admin users
- [ ] Create user manual
- [ ] Prepare support documentation

---

**Your application is now ready for production! 🎉**
