# PowerShell Script to Create .env Files - FIXED VERSION
# This script ensures the files are created properly

Write-Host "🔧 Creating .env files for Nexus deployment..." -ForegroundColor Cyan

# Ensure we're in the correct directory
$projectRoot = "D:\nexus_rehan\aadrikaa"
Set-Location $projectRoot

# Create client .env.local
$clientEnvPath = ".\client\.env.local"
$clientEnvContent = @"
VITE_SUPABASE_URL=https://dswuotsdaltsomyqqykn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzd3VvdHNkYWx0c29teXFxeWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODM4MjYsImV4cCI6MjA3NDk1OTgyNn0.lIK72gGfcT-3kJN4HhxGQ8hhPvkJgZCUBkX0WBb-4Qc
VITE_SERVER_URL=http://localhost:8002
"@

# Create server .env
$serverEnvPath = ".\server\.env"
$serverEnvContent = @"
SUPABASE_URL=https://dswuotsdaltsomyqqykn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzd3VvdHNkYWx0c29teXFxeWtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4MzgyNiwiZXhwIjoyMDc0OTU5ODI2fQ.BVCW6hzW6DCY9NFG-Vc4aiLk470A5_0eCVrfjjUxldw
JWT_SECRET=your-random-secret-key-change-in-production-abc123xyz789
PORT=8002
NODE_ENV=development
"@

Write-Host "Creating client/.env.local..." -ForegroundColor Yellow
try {
    New-Item -ItemType File -Path $clientEnvPath -Force | Out-Null
    Set-Content -Path $clientEnvPath -Value $clientEnvContent -Encoding UTF8
    Write-Host "✅ Created client/.env.local" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create client/.env.local: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Creating server/.env..." -ForegroundColor Yellow
try {
    New-Item -ItemType File -Path $serverEnvPath -Force | Out-Null
    Set-Content -Path $serverEnvPath -Value $serverEnvContent -Encoding UTF8
    Write-Host "✅ Created server/.env" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create server/.env: $($_.Exception.Message)" -ForegroundColor Red
}

# Verify files were created
Write-Host ""
Write-Host "Verifying files exist:" -ForegroundColor Cyan
Write-Host "1. Checking client/.env.local:" -ForegroundColor White
if (Test-Path $clientEnvPath) {
    Write-Host "   ✅ File exists" -ForegroundColor Green
    Write-Host "   Contents preview:" -ForegroundColor White
    Get-Content $clientEnvPath | Select-Object -First 3 | ForEach-Object { Write-Host "   $_" }
} else {
    Write-Host "   ❌ File does not exist" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Checking server/.env:" -ForegroundColor White
if (Test-Path $serverEnvPath) {
    Write-Host "   ✅ File exists" -ForegroundColor Green
    Write-Host "   Contents preview:" -ForegroundColor White
    Get-Content $serverEnvPath | Select-Object -First 3 | ForEach-Object { Write-Host "   $_" }
} else {
    Write-Host "   ❌ File does not exist" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Environment files created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your servers (Ctrl+C and restart)" -ForegroundColor White
Write-Host "2. Clear browser cache and try login again" -ForegroundColor White
Write-Host ""

