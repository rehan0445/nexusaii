Write-Host "Restarting Companion Development Servers..." -ForegroundColor Green
Write-Host ""

Write-Host "Stopping any running processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Starting development servers..." -ForegroundColor Yellow
$env:NODE_OPTIONS = "--no-deprecation"
npm run dev 