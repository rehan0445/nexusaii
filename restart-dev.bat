@echo off
echo Restarting Companion Development Servers...
echo.

echo Stopping any running processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting development servers...
set NODE_OPTIONS=--no-deprecation
npm run dev 