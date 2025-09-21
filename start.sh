#!/bin/bash

echo "Starting Shiv Accounts Cloud..."
echo

echo "Starting Backend Server..."
cd backend
npm run dev &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 5

echo "Starting Frontend Server..."
cd ..
npm start &
FRONTEND_PID=$!

echo
echo "Both servers are starting..."
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:3000"
echo
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID