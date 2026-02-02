# ============================================
# Start Backend Server
# ============================================

Write-Host "`n[STARTING] Backend Server..." -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

# Check if server directory exists
if (-not (Test-Path "server")) {
    Write-Host "`n[ERROR] Server directory not found!" -ForegroundColor Red
    Write-Host "   Make sure you're in the project root directory." -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists in server
if (-not (Test-Path "server\node_modules")) {
    Write-Host "`n[WARNING] node_modules not found in server directory" -ForegroundColor Yellow
    Write-Host "   Installing dependencies first..." -ForegroundColor Gray
    
    Push-Location server
    npm install
    Pop-Location
    
    Write-Host "   [SUCCESS] Dependencies installed!" -ForegroundColor Green
}

# Check for .env file
if (-not (Test-Path "server\.env")) {
    Write-Host "`n[WARNING] .env file not found in server directory" -ForegroundColor Yellow
    Write-Host "   Creating basic .env file..." -ForegroundColor Gray
    
    $envContent = @"
# Backend Server Configuration
PORT=8002
NODE_ENV=development

# Venice AI API Key (REQUIRED)
VENICE_API_KEY=your_venice_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Session Secret
SESSION_SECRET=your_random_secret_here
"@
    
    $envContent | Out-File -FilePath "server\.env" -Encoding UTF8
    Write-Host "   [SUCCESS] .env file created!" -ForegroundColor Green
    Write-Host "   [IMPORTANT] Update server\.env with your actual credentials!" -ForegroundColor Yellow
}

# Kill any existing node processes on port 8002
Write-Host "`n[CHECKING] Looking for processes on port 8002..." -ForegroundColor Cyan

$existingProcess = Get-NetTCPConnection -LocalPort 8002 -ErrorAction SilentlyContinue | 
    Select-Object -ExpandProperty OwningProcess -Unique

if ($existingProcess) {
    Write-Host "   Found existing process on port 8002 (PID: $existingProcess)" -ForegroundColor Yellow
    Write-Host "   Stopping process..." -ForegroundColor Gray
    Stop-Process -Id $existingProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "   [SUCCESS] Process stopped!" -ForegroundColor Green
}

# Start the server
Write-Host "`n[STARTING] Starting backend server on port 8002..." -ForegroundColor Cyan

# Check what command to use
if (Test-Path "server\package.json") {
    $packageJson = Get-Content "server\package.json" | ConvertFrom-Json
    if ($packageJson.scripts.dev) {
        $startCommand = "npm run dev"
    } elseif ($packageJson.scripts.start) {
        $startCommand = "npm start"
    } else {
        $startCommand = "node server.js"
    }
} else {
    $startCommand = "node server.js"
}

Write-Host "   Using command: $startCommand" -ForegroundColor Gray
Write-Host ""

# Start server in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; Write-Host '[STARTING] Backend Server...' -ForegroundColor Cyan; $startCommand"

# Wait a moment for server to start
Write-Host "   Waiting for server to start..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Check if server is running
$serverRunning = Get-NetTCPConnection -LocalPort 8002 -ErrorAction SilentlyContinue

if ($serverRunning) {
    Write-Host "`n[SUCCESS] Backend server is running on port 8002!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Server URLs:" -ForegroundColor Cyan
    Write-Host "  http://localhost:8002" -ForegroundColor White
    Write-Host "  http://127.0.0.1:8002" -ForegroundColor White
    Write-Host ""
    Write-Host "What's Next:" -ForegroundColor Cyan
    Write-Host "  1. Backend server is running" -ForegroundColor Green
    Write-Host "  2. Refresh your browser" -ForegroundColor White
    Write-Host "  3. Try chatting with your character" -ForegroundColor White
    Write-Host "  4. Should work now!" -ForegroundColor White
} else {
    Write-Host "`n[WARNING] Server may still be starting..." -ForegroundColor Yellow
    Write-Host "   Check the server window for any errors" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Common Issues:" -ForegroundColor Cyan
    Write-Host "  - Missing Venice API key in .env" -ForegroundColor White
    Write-Host "  - Missing Supabase credentials in .env" -ForegroundColor White
    Write-Host "  - Port 8002 already in use" -ForegroundColor White
    Write-Host "  - Missing dependencies (run: cd server && npm install)" -ForegroundColor White
}

Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "`n[INFO] Server window opened in new terminal" -ForegroundColor Cyan
Write-Host "   Check it for logs and any errors" -ForegroundColor Gray
Write-Host ""

