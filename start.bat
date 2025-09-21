@echo off
echo Starting Shiv Accounts Cloud...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd backend && npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "Frontend" cmd /k "npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5001
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul