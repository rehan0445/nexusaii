@echo off
echo Starting Companion Full Stack Application...
echo.

echo Installing dependencies...
call npm run install:all
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Starting development servers...
set NODE_OPTIONS=--no-deprecation
call npm run dev 