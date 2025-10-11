# Quick restart script for servers
# Run this with: .\quick-restart.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Quick Server Restart" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Stop all Node processes
Write-Host "1. Stopping Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   ✓ Processes stopped" -ForegroundColor Green

# Start backend
Write-Host "2. Starting backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start" -WindowStyle Normal
Start-Sleep -Seconds 3
Write-Host "   ✓ Backend starting" -ForegroundColor Green

# Start frontend
Write-Host "3. Starting frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 3
Write-Host "   ✓ Frontend starting" -ForegroundColor Green

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Ready! Check browser: http://localhost:5173" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

