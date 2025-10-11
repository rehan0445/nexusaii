# PowerShell script to fix database issues and restart servers
# Run this with: .\fix-and-restart-servers.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Fixing Database & Restarting Servers" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all Node processes
Write-Host "1. Stopping all Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   ✓ Processes stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Apply database fixes
Write-Host "2. Applying database fixes..." -ForegroundColor Yellow
Write-Host "   Note: You need to manually run FIX_HANGOUT_FOREIGN_KEYS.sql" -ForegroundColor Yellow
Write-Host "   in Supabase Dashboard → SQL Editor" -ForegroundColor Yellow
Write-Host ""

# Show the SQL content
Write-Host "   SQL to run in Supabase:" -ForegroundColor White
Write-Host "   -----------------------" -ForegroundColor Gray
try {
    $sqlContent = Get-Content "FIX_HANGOUT_FOREIGN_KEYS.sql" -Raw
    Write-Host $sqlContent -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Could not read FIX_HANGOUT_FOREIGN_KEYS.sql" -ForegroundColor Red
}
Write-Host "   -----------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "   ⚠️  Please run the above SQL in Supabase Dashboard!" -ForegroundColor Yellow
Write-Host "   Press Enter after you've run the SQL..." -ForegroundColor White
Read-Host

# Step 3: Start backend server
Write-Host "3. Starting backend server..." -ForegroundColor Yellow
$backendPath = Join-Path $PWD "server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🚀 Starting Backend Server...' -ForegroundColor Cyan; npm start" -WindowStyle Normal
Start-Sleep -Seconds 5
Write-Host "   ✓ Backend server starting on port 8002" -ForegroundColor Green
Write-Host ""

# Step 4: Start frontend dev server
Write-Host "4. Starting frontend dev server..." -ForegroundColor Yellow
$frontendPath = Join-Path $PWD "client"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '⚡ Starting Frontend Dev Server...' -ForegroundColor Cyan; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 5
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
Write-Host "1. Test API: curl http://localhost:8002/api/health" -ForegroundColor White
Write-Host "2. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host "3. Navigate to Confessions page" -ForegroundColor White
Write-Host "4. Check browser console for success messages" -ForegroundColor White
Write-Host ""
Write-Host "Expected Console Output:" -ForegroundColor Yellow
Write-Host "  🔌 Socket.IO connected successfully" -ForegroundColor Green
Write-Host "  📤 Posting confession to server" -ForegroundColor Green
Write-Host "  ✅ Confession created successfully" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

