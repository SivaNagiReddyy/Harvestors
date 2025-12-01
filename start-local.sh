#!/bin/bash

# Local Development Startup Script
echo "🚜 Starting Munagala AgriTech Local Environment..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exist
echo -e "${BLUE}📦 Checking dependencies...${NC}"

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
fi

echo -e "${GREEN}✅ Dependencies ready!${NC}"
echo ""
echo -e "${BLUE}🚀 Starting servers...${NC}"
echo ""
echo -e "${GREEN}Backend:${NC}  http://localhost:5001"
echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
echo -e "${GREEN}Login:${NC}    admin / Krish@143"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start backend in background
cd "$SCRIPT_DIR/backend" && npm run dev > "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend in background
cd "$SCRIPT_DIR/frontend" && npm start > "$SCRIPT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    # Kill any remaining node processes on these ports
    lsof -ti:5001 | xargs kill -9 2>/dev/null
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Keep script running and show logs
echo -e "${BLUE}📋 Watching logs (backend.log and frontend.log)...${NC}"
echo ""
tail -f "$SCRIPT_DIR/backend.log" "$SCRIPT_DIR/frontend.log" &
TAIL_PID=$!

# Wait for user to stop
wait
