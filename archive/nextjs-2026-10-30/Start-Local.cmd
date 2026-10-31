@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js before starting this project.
  pause
  exit /b 1
)
if not exist ".env.local" copy ".env.local.example" ".env.local" >nul
if not exist "node_modules\next\package.json" (
  call npm ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Store: http://127.0.0.1:3000
call npm run dev:local
pause
