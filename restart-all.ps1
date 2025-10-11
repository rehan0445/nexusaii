# Restart Nexus App - All Servers
# This script restarts both backend and frontend

Write-Host "🔄 Restarting Nexus App..." -ForegroundColor Cyan
Write-Host ""

# Kill existing node processes on ports 8002 and 3000
Write-Host "🛑 Stopping existing servers..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start backend
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start"
Start-Sleep -Seconds 3

# Start frontend
Write-Host "🎨 Starting Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"

Write-Host ""
Write-Host "✅ Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Access from:" -ForegroundColor Cyan
Write-Host "   Computer: http://localhost:3000" -ForegroundColor White
Write-Host "   Phone:    http://192.168.1.36:3000" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Wait 10 seconds for servers to fully start..." -ForegroundColor Yellow

