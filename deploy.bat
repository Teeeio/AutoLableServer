@echo off
REM Auto Label Server Deployment Script for Windows

echo =========================================
echo   Auto Label Server - Deployment
echo =========================================

REM 1. Check Node.js
echo [1/5] Checking environment...
node -v >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found
    pause
    exit /b 1
)
echo OK: Node.js is installed

REM 2. Install dependencies
echo [2/5] Installing dependencies...
call npm install --production
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

REM 3. Create data directory
echo [3/5] Creating data directory...
if not exist "data" mkdir data

REM 4. Configure environment
echo [4/5] Configuring environment variables...
if not exist ".env" (
    copy .env.example .env
    echo.
    echo WARNING: Please edit .env file for production settings
    echo.
    choice /C YN /M "Edit .env file now?"
    if errorlevel 2 (
        notepad .env
    )
)

REM 5. Start server
echo [5/5] Starting server...
echo.
echo Choose startup mode:
echo 1. Start in foreground
echo 2. Start in background
echo.
choice /C 12 /N /M "Select option (1 or 2): "

if errorlevel 2 (
    REM Option 2: Background
    echo.
    echo Starting server in background...
    start /B node index.js > server.log 2>&1
    echo.
    echo =========================================
    echo   Server Started!
    echo =========================================
    echo.
    echo Server is running in background
    echo View logs: type server.log
    echo Stop server: taskkill /F /IM node.exe
    echo.
    echo Server URL: http://localhost:8787
    echo Health Check: http://localhost:8787/api/health
    echo.
    pause
    exit /b 0
) else (
    REM Option 1: Foreground
    echo.
    echo Starting server in foreground...
    echo Press Ctrl+C to stop
    echo.
    node index.js
)

echo.
pause
