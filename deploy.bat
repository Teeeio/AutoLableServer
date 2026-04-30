@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "APP_NAME=auto-label-server"
set "ROOT_DIR=%~dp0"
set "LOG_DIR=%ROOT_DIR%logs"
set "PID_FILE=%ROOT_DIR%server.pid"
set "PORT=8787"

cd /d "%ROOT_DIR%"

echo ==> Deploying %APP_NAME%

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is required.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm is required.
  exit /b 1
)

for /f "tokens=1 delims=." %%A in ('node -p "process.versions.node"') do set "NODE_MAJOR=%%A"
if %NODE_MAJOR% LSS 18 (
  echo ERROR: Node.js 18+ is required.
  exit /b 1
)

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "data" mkdir "data"

if not exist ".env" (
  copy /Y ".env.example" ".env" >nul
  echo Created .env from .env.example
)

for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
  if /I "%%A"=="PORT" set "PORT=%%B"
)

if exist "package-lock.json" (
  call npm ci --omit=dev
) else (
  call npm install --omit=dev
)
if errorlevel 1 exit /b 1

where pm2 >nul 2>nul
if not errorlevel 1 (
  pm2 describe "%APP_NAME%" >nul 2>nul
  if errorlevel 1 (
    call pm2 start index.js --name "%APP_NAME%" --update-env
  ) else (
    call pm2 restart "%APP_NAME%" --update-env
  )
  call pm2 save >nul 2>nul
) else (
  if exist "%PID_FILE%" (
    set /p EXISTING_PID=<"%PID_FILE%"
    if defined EXISTING_PID taskkill /PID !EXISTING_PID! /F >nul 2>nul
  )

  powershell -NoProfile -Command ^
    "$out='%LOG_DIR%\server.out.log'; $err='%LOG_DIR%\server.err.log';" ^
    "$p = Start-Process node -ArgumentList 'index.js' -RedirectStandardOutput $out -RedirectStandardError $err -PassThru -WindowStyle Hidden;" ^
    "Set-Content -Path '%PID_FILE%' -Value $p.Id"
  if errorlevel 1 exit /b 1
)

set "HEALTH_OK="
for /L %%I in (1,1,15) do (
  powershell -NoProfile -Command ^
    "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:%PORT%/api/health' -TimeoutSec 3; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
  if not errorlevel 1 (
    set "HEALTH_OK=1"
    goto :done
  )
  timeout /t 1 /nobreak >nul
)

:done
if not defined HEALTH_OK (
  echo ERROR: Health check failed after deploy.
  exit /b 1
)

echo Deployment succeeded: http://127.0.0.1:%PORT%/api/health
exit /b 0
