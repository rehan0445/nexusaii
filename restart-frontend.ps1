# Restart Frontend with Network Access
Write-Host "🔄 Restarting Frontend..." -ForegroundColor Cyan

# Kill existing Vite processes
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*client*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start frontend
Write-Host "🎨 Starting Frontend on network..." -ForegroundColor Green
Set-Location client
npm run dev

