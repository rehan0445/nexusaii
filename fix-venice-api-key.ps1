# ============================================
# Fix Venice API Key Issue
# ============================================

Write-Host "`n🔧 Venice API Key Setup & Fix" -ForegroundColor Cyan
Write-Host "━" * 60 -ForegroundColor Gray

# Check if .env exists in server directory
$envPath = "server\.env"
$envExists = Test-Path $envPath

Write-Host "`n📋 Step 1: Check Environment File" -ForegroundColor Yellow

if ($envExists) {
    Write-Host "   ✅ .env file exists at server\.env" -ForegroundColor Green
    
    # Check if it contains VENICE_API_KEY
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match "VENICE_API_KEY=(.+)") {
        $apiKey = $matches[1].Trim()
        if ($apiKey -eq "your_venice_api_key_here" -or $apiKey -eq "") {
            Write-Host "   ❌ VENICE_API_KEY is not set properly" -ForegroundColor Red
            $needsKey = $true
        } else {
            Write-Host "   ✅ VENICE_API_KEY is set" -ForegroundColor Green
            Write-Host "   Key preview: $($apiKey.Substring(0, [Math]::Min(15, $apiKey.Length)))..." -ForegroundColor Gray
            $needsKey = $false
        }
    } else {
        Write-Host "   ❌ VENICE_API_KEY not found in .env" -ForegroundColor Red
        $needsKey = $true
    }
} else {
    Write-Host "   ❌ .env file does not exist" -ForegroundColor Red
    $needsKey = $true
}

# If API key needs to be set
if ($needsKey) {
    Write-Host "`n📋 Step 2: Get Your Venice API Key" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   1. Go to: https://venice.ai/" -ForegroundColor White
    Write-Host "   2. Sign up or log in" -ForegroundColor White
    Write-Host "   3. Navigate to: Settings > API Keys" -ForegroundColor White
    Write-Host "   4. Click 'Create New Key'" -ForegroundColor White
    Write-Host "   5. Copy the API key" -ForegroundColor White
    Write-Host ""
    
    # Ask user if they have the key
    $hasKey = Read-Host "   Do you have your Venice API key? (y/n)"
    
    if ($hasKey -eq 'y' -or $hasKey -eq 'Y') {
        Write-Host ""
        $apiKey = Read-Host "   Paste your Venice API key here"
        
        if ($apiKey -and $apiKey -ne "" -and $apiKey -ne "your_venice_api_key_here") {
            Write-Host ""
            Write-Host "   📝 Creating/updating .env file..." -ForegroundColor Cyan
            
            # Create or update .env file
            $envTemplate = @"
# Venice AI API Configuration
VENICE_API_KEY=$apiKey

# Venice AI Settings
VENICE_MAX_CONCURRENT=50
VENICE_TIMEOUT=30000

# Supabase Configuration (if needed)
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Session Configuration
SESSION_SECRET=random_secret_$(Get-Random -Maximum 999999)
"@
            
            if ($envExists) {
                # Update existing file
                $currentContent = Get-Content $envPath -Raw
                if ($currentContent -match "VENICE_API_KEY=.+") {
                    $newContent = $currentContent -replace "VENICE_API_KEY=.+", "VENICE_API_KEY=$apiKey"
                    $newContent | Set-Content $envPath -NoNewline
                } else {
                    Add-Content $envPath "`nVENICE_API_KEY=$apiKey"
                }
            } else {
                # Create new file
                $envTemplate | Set-Content $envPath
            }
            
            Write-Host "   ✅ .env file updated successfully!" -ForegroundColor Green
            $keySet = $true
        } else {
            Write-Host "   ❌ Invalid API key. Please try again." -ForegroundColor Red
            $keySet = $false
        }
    } else {
        Write-Host ""
        Write-Host "   ⚠️  Please get your Venice API key first, then run this script again." -ForegroundColor Yellow
        Write-Host "   📝 Instructions saved to: VENICE_API_KEY_SETUP.md" -ForegroundColor Gray
        $keySet = $false
    }
} else {
    $keySet = $true
}

# Step 3: Restart server
if ($keySet) {
    Write-Host "`n📋 Step 3: Restart Server" -ForegroundColor Yellow
    Write-Host ""
    
    $restart = Read-Host "   Restart server now? (y/n)"
    
    if ($restart -eq 'y' -or $restart -eq 'Y') {
        Write-Host ""
        Write-Host "   🔄 Stopping existing server processes..." -ForegroundColor Cyan
        
        # Stop existing node processes
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { 
            $_.Path -like "*server*" -or $_.MainWindowTitle -like "*server*" 
        } | Stop-Process -Force
        
        Start-Sleep -Seconds 2
        
        Write-Host "   ✅ Existing processes stopped" -ForegroundColor Green
        Write-Host ""
        Write-Host "   🚀 Starting server..." -ForegroundColor Cyan
        
        # Start new server
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start"
        
        Start-Sleep -Seconds 2
        
        Write-Host "   ✅ Server started!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "   ⚠️  Please restart server manually:" -ForegroundColor Yellow
        Write-Host "      cd server" -ForegroundColor Gray
        Write-Host "      npm start" -ForegroundColor Gray
    }
}

# Summary
Write-Host "`n━" * 60 -ForegroundColor Gray
Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host ""

if ($keySet) {
    Write-Host "What's Fixed:" -ForegroundColor Cyan
    Write-Host "  ✅ Venice API key configured" -ForegroundColor Green
    Write-Host "  ✅ .env file created/updated" -ForegroundColor Green
    Write-Host "  ✅ Server ready to use Venice AI" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Refresh your browser" -ForegroundColor White
    Write-Host "  2. Try chatting with the character again" -ForegroundColor White
    Write-Host "  3. Should work perfectly now! 🎉" -ForegroundColor White
} else {
    Write-Host "Action Required:" -ForegroundColor Yellow
    Write-Host "  1. Get your Venice API key from https://venice.ai/" -ForegroundColor White
    Write-Host "  2. Run this script again: .\fix-venice-api-key.ps1" -ForegroundColor White
    Write-Host "  3. Enter your API key when prompted" -ForegroundColor White
}

Write-Host ""
Write-Host "━" * 60 -ForegroundColor Gray
Write-Host ""

