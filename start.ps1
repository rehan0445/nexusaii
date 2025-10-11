Write-Host "Starting Companion Full Stack Application..." -ForegroundColor Green
Write-Host ""

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm run install:all

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Starting development servers..." -ForegroundColor Yellow
$env:NODE_OPTIONS = "--no-deprecation"
npm run dev 