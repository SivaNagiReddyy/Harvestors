#!/bin/bash

# Frontend Development Server
echo "⚛️  Starting Frontend Server..."

cd "$(dirname "$0")/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "✅ Frontend running on http://localhost:3000"
echo "🔗 API: http://localhost:5001"
echo "👤 Login: admin / Krish@143"
echo ""

npm start
