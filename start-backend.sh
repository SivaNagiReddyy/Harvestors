#!/bin/bash

# Backend Development Server
echo "🚜 Starting Backend Server..."

cd "$(dirname "$0")/backend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "✅ Backend running on http://localhost:5000"
echo "📊 Database: Supabase (Production)"
echo "🔐 Auth: JWT"
echo ""

npm run dev
