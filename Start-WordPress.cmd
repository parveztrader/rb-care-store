@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0wordpress\dev\start.ps1"
set "RB_COMMAND_EXIT=%errorlevel%"
pause
exit /b %RB_COMMAND_EXIT%
