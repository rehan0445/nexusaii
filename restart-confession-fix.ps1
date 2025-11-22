# PowerShell script to restart servers with confession fixes
# Run this with: .\restart-confession-fix.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Restarting Servers with Confession Fixes" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Kill existing Node processes
Write-Host "1. Stopping existing Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   ✓ Processes stopped" -ForegroundColor Green
Write-Host ""

# Start backend server in background
Write-Host "2. Starting backend server..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Starting Backend Server...' -ForegroundColor Cyan; npm start" -WindowStyle Normal
Start-Sleep -Seconds 3
Write-Host "   ✓ Backend server starting on port 8002" -ForegroundColor Green
Write-Host ""

# Start frontend server in background
Write-Host "3. Starting frontend dev server..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "client"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Starting Frontend Dev Server...' -ForegroundColor Cyan; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 3
Write-Host "   ✓ Frontend server starting on port 5173" -ForegroundColor Green
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Servers Started!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:8002" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Wait 10 seconds for servers to fully start" -ForegroundColor White
Write-Host "2. Open browser to http://localhost:5173" -ForegroundColor White
Write-Host "3. Navigate to Confessions page" -ForegroundColor White
Write-Host "4. Open DevTools (F12) and check console" -ForegroundColor White
Write-Host "5. Try creating a confession" -ForegroundColor White
Write-Host ""
Write-Host "Expected Console Output:" -ForegroundColor Yellow
Write-Host "  🔌 Socket.IO connected successfully" -ForegroundColor Green
Write-Host "  📤 Posting confession to server" -ForegroundColor Green
Write-Host "  ✅ Confession created successfully" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

