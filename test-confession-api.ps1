# PowerShell script to test confession API
# Run this with: .\test-confession-api.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Testing Confession API" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$serverUrl = "http://localhost:8002"

# Test 1: Server Health
Write-Host "Test 1: Checking server health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$serverUrl/api/health" -Method GET -UseBasicParsing -TimeoutSec 5
    $data = $response.Content | ConvertFrom-Json
    if ($data.ok -eq $true) {
        Write-Host "   ✓ Server is healthy!" -ForegroundColor Green
        Write-Host "   Supabase: $($data.supabase)" -ForegroundColor White
    } else {
        Write-Host "   ✗ Server health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Cannot connect to server at $serverUrl" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Make sure the backend server is running:" -ForegroundColor Yellow
    Write-Host "   cd server && npm start" -ForegroundColor White
    exit 1
}
Write-Host ""

# Test 2: Get Confessions
Write-Host "Test 2: Fetching confessions..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$serverUrl/api/confessions?limit=5" -Method GET -UseBasicParsing -TimeoutSec 5
    $data = $response.Content | ConvertFrom-Json
    if ($data.success -eq $true) {
        Write-Host "   ✓ Confessions API is working!" -ForegroundColor Green
        Write-Host "   Total confessions: $($data.data.items.Count)" -ForegroundColor White
        if ($data.data.items.Count -gt 0) {
            Write-Host "   Latest confession preview:" -ForegroundColor White
            $latest = $data.data.items[0]
            Write-Host "     ID: $($latest.id)" -ForegroundColor Gray
            Write-Host "     Content: $($latest.content.Substring(0, [Math]::Min(50, $latest.content.Length)))..." -ForegroundColor Gray
        }
    } else {
        Write-Host "   ✗ Confessions API returned error" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Failed to fetch confessions" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Create Test Confession
Write-Host "Test 3: Creating test confession..." -ForegroundColor Yellow
try {
    $body = @{
        content = "🧪 Test confession from PowerShell script - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        alias = @{
            name = "TestUser"
            emoji = "🧪"
            color = "#3b82f6"
        }
        sessionId = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
    } | ConvertTo-Json -Depth 10

    $response = Invoke-WebRequest -Uri "$serverUrl/api/confessions" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success -eq $true) {
        Write-Host "   ✓ Test confession created successfully!" -ForegroundColor Green
        Write-Host "   Confession ID: $($data.data.id)" -ForegroundColor White
        Write-Host "   Content: $($data.data.content)" -ForegroundColor White
    } else {
        Write-Host "   ✗ Failed to create confession" -ForegroundColor Red
        Write-Host "   Message: $($data.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Error creating confession" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  API Testing Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If all tests passed, the confession feature should work!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next: Open browser and test manually" -ForegroundColor White
Write-Host "  1. Navigate to http://localhost:5173" -ForegroundColor Gray
Write-Host "  2. Go to Confessions page" -ForegroundColor Gray
Write-Host "  3. Create a confession" -ForegroundColor Gray
Write-Host "  4. Check browser console for success messages" -ForegroundColor Gray
Write-Host ""

