# PowerShell Script to Create .env Files
# Run this in PowerShell from the project root

Write-Host "🔧 Creating .env files for Nexus deployment..." -ForegroundColor Cyan

# Create client .env.local
$clientEnv = @"
VITE_SUPABASE_URL=https://dswuotsdaltsomyqqykn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzd3VvdHNkYWx0c29teXFxeWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODM4MjYsImV4cCI6MjA3NDk1OTgyNn0.lIK72gGfcT-3kJN4HhxGQ8hhPvkJgZCUBkX0WBb-4Qc
VITE_SERVER_URL=http://localhost:8002
"@

# Create server .env
$serverEnv = @"
SUPABASE_URL=https://dswuotsdaltsomyqqykn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzd3VvdHNkYWx0c29teXFxeWtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4MzgyNiwiZXhwIjoyMDc0OTU5ODI2fQ.BVCW6hzW6DCY9NFG-Vc4aiLk470A5_0eCVrfjjUxldw
JWT_SECRET=your-random-secret-key-change-in-production-abc123xyz789
PORT=8002
NODE_ENV=development
"@

# Write client .env.local
try {
    $clientEnv | Out-File -FilePath ".\client\.env.local" -Encoding utf8 -NoNewline
    Write-Host "✅ Created client/.env.local" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create client/.env.local: $_" -ForegroundColor Red
}

# Write server .env
try {
    $serverEnv | Out-File -FilePath ".\server\.env" -Encoding utf8 -NoNewline
    Write-Host "✅ Created server/.env" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create server/.env: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Environment files created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your servers (Ctrl+C and restart)" -ForegroundColor White
Write-Host "2. Try logging in again" -ForegroundColor White
Write-Host ""

