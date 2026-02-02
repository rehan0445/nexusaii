# PowerShell script to start the server with proper environment variables

Write-Host "🚀 Starting Nexus Server with Venice AI..." -ForegroundColor Green

# Load environment variables from .env file
if (Test-Path ".env") {
    Write-Host "📄 Loading environment variables from .env..." -ForegroundColor Yellow
    
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#].*)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
            Write-Host "   ✅ Set $name" -ForegroundColor Green
        }
    }
} else {
    Write-Host "⚠️  .env file not found! Creating with template..." -ForegroundColor Red
    @"
VENICE_API_KEY=your_venice_api_key_here
PORT=8000
NODE_ENV=development
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "📝 Please edit .env file with your actual API key" -ForegroundColor Yellow
    exit 1
}

# Verify required environment variables
if (-not $env:VENICE_API_KEY -or $env:VENICE_API_KEY -eq "your_venice_api_key_here") {
    Write-Host "❌ VENICE_API_KEY not set! Please update .env file" -ForegroundColor Red
    exit 1
}

Write-Host "🔑 Venice AI API Key loaded successfully" -ForegroundColor Green
Write-Host "🌐 Starting server on port $($env:PORT)..." -ForegroundColor Blue

# Start the server
npm start
