#!/bin/bash

# Start script for Harvestors application
# Starts both backend and frontend servers

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🚀 Starting backend server..."
cd "$SCRIPT_DIR/backend"
PORT=5001 node server.js &
BACKEND_PID=$!

echo "⏳ Waiting for backend to initialize..."
sleep 3

echo "🚀 Starting frontend server..."
cd "$SCRIPT_DIR/frontend"
npm start &
FRONTEND_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Servers started successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Backend:  http://localhost:5001 (PID: $BACKEND_PID)"
echo "🌐 Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo "📋 To stop servers, run: ./stop.sh"
echo "📋 To restart servers, run: ./restart.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
