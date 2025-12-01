#!/bin/bash

echo "🚜 Harvester Dealership Management System - Setup Script"
echo "=========================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB doesn't appear to be running."
    echo "Please start MongoDB with: brew services start mongodb-community"
    echo ""
fi

# Backend setup
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please update with your settings if needed."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "👤 Creating admin user..."
node createAdmin.js

# Frontend setup
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "=========================================================="
echo "✅ Setup completed successfully!"
echo ""
echo "🚀 To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "🔐 Default Login:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "=========================================================="
