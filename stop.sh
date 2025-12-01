#!/bin/bash

# Stop script for Harvestors application
# Gracefully stops both backend and frontend servers

echo "🛑 Stopping servers..."

# Kill processes on ports 3000 and 5001
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5001 | xargs kill -9 2>/dev/null

# Also kill by process name as backup
pkill -f "node server.js" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null

sleep 1

echo "✅ Servers stopped successfully!"
echo ""
echo "📋 To restart servers, run: ./restart.sh"
