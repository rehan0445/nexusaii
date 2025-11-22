# PowerShell script to start Companion development servers
# This script properly handles PowerShell command chaining

Write-Host "🚀 Starting Companion Development Servers..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the ai directory." -ForegroundColor Red
    exit 1
}

# Start the development servers
Write-Host "📦 Starting client and server..." -ForegroundColor Yellow

try {
    # Use npm run dev which should start both client and server
    npm run dev
} catch {
    Write-Host "❌ Error starting servers: $_" -ForegroundColor Red
    Write-Host "💡 Try running 'npm install' first to install dependencies." -ForegroundColor Yellow
    exit 1
} 