# Venice API Environment Setup Script (PowerShell)
# Supports Railway, Vercel, Netlify, Heroku, and Render

Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 Venice API Environment Setup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Venice API Key
$VENICE_KEY = "hAsm7OA9_MGaXedclR-c3_dzDb7sX-5lRvVTyK98AW"

# Detect platform
function Detect-Platform {
  if ($env:RAILWAY_ENVIRONMENT) { return "railway" }
  elseif ($env:VERCEL) { return "vercel" }
  elseif ($env:NETLIFY) { return "netlify" }
  elseif ($env:DYNO) { return "heroku" }
  elseif ($env:RENDER) { return "render" }
  else { return "unknown" }
}

$PLATFORM = Detect-Platform

Write-Host "📍 Detected Platform: $PLATFORM" -ForegroundColor Yellow
Write-Host ""

# Railway Setup
function Setup-Railway {
  Write-Host "🚂 Setting up Railway environment..." -ForegroundColor Green
  Write-Host ""
  Write-Host "Run these commands in your terminal:" -ForegroundColor White
  Write-Host ""
  Write-Host "railway variables --set VENICE_API_KEY=$VENICE_KEY" -ForegroundColor Cyan
  Write-Host "railway variables --set VENICE_MAX_CONCURRENT=50" -ForegroundColor Cyan
  Write-Host "railway variables --set NODE_ENV=production" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "Or add via Railway Dashboard:" -ForegroundColor White
  Write-Host "1. Go to your Railway project"
  Write-Host "2. Click 'Variables' tab"
  Write-Host "3. Add the following:"
  Write-Host "   VENICE_API_KEY = $VENICE_KEY"
  Write-Host "   VENICE_MAX_CONCURRENT = 50"
  Write-Host "   NODE_ENV = production"
  Write-Host ""
}

# Vercel Setup
function Setup-Vercel {
  Write-Host "▲ Setting up Vercel environment..." -ForegroundColor Green
  Write-Host ""
  Write-Host "Run these commands in your terminal:" -ForegroundColor White
  Write-Host ""
  Write-Host "vercel env add VENICE_API_KEY" -ForegroundColor Cyan
  Write-Host "# When prompted, enter: $VENICE_KEY"
  Write-Host "# Select: Production, Preview, Development"
  Write-Host ""
  Write-Host "vercel env add VENICE_MAX_CONCURRENT" -ForegroundColor Cyan
  Write-Host "# When prompted, enter: 50"
  Write-Host ""
  Write-Host "vercel env add NODE_ENV" -ForegroundColor Cyan
  Write-Host "# When prompted, enter: production"
  Write-Host ""
  Write-Host "Or add via Vercel Dashboard:" -ForegroundColor White
  Write-Host "1. Go to Project Settings → Environment Variables"
  Write-Host "2. Add the variables for all environments"
  Write-Host ""
}

# Netlify Setup
function Setup-Netlify {
  Write-Host "🌐 Setting up Netlify environment..." -ForegroundColor Green
  Write-Host ""
  Write-Host "Via Netlify Dashboard:" -ForegroundColor White
  Write-Host "1. Go to Site Settings → Environment Variables"
  Write-Host "2. Add the following:"
  Write-Host "   VENICE_API_KEY = $VENICE_KEY"
  Write-Host "   VENICE_MAX_CONCURRENT = 50"
  Write-Host "   NODE_ENV = production"
  Write-Host ""
  Write-Host "Or via Netlify CLI:" -ForegroundColor White
  Write-Host "netlify env:set VENICE_API_KEY `"$VENICE_KEY`"" -ForegroundColor Cyan
  Write-Host "netlify env:set VENICE_MAX_CONCURRENT `"50`"" -ForegroundColor Cyan
  Write-Host "netlify env:set NODE_ENV `"production`"" -ForegroundColor Cyan
  Write-Host ""
}

# Heroku Setup
function Setup-Heroku {
  Write-Host "🟪 Setting up Heroku environment..." -ForegroundColor Green
  Write-Host ""
  Write-Host "Run these commands in your terminal:" -ForegroundColor White
  Write-Host ""
  Write-Host "heroku config:set VENICE_API_KEY=$VENICE_KEY" -ForegroundColor Cyan
  Write-Host "heroku config:set VENICE_MAX_CONCURRENT=50" -ForegroundColor Cyan
  Write-Host "heroku config:set NODE_ENV=production" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "Or add via Heroku Dashboard:" -ForegroundColor White
  Write-Host "1. Go to app Settings → Config Vars"
  Write-Host "2. Click 'Reveal Config Vars'"
  Write-Host "3. Add the variables"
  Write-Host ""
}

# Render Setup
function Setup-Render {
  Write-Host "🎨 Setting up Render environment..." -ForegroundColor Green
  Write-Host ""
  Write-Host "Via Render Dashboard:" -ForegroundColor White
  Write-Host "1. Go to your service → Environment"
  Write-Host "2. Add the following environment variables:"
  Write-Host "   VENICE_API_KEY = $VENICE_KEY"
  Write-Host "   VENICE_MAX_CONCURRENT = 50"
  Write-Host "   NODE_ENV = production"
  Write-Host ""
  Write-Host "Changes will trigger automatic redeploy"
  Write-Host ""
}

# Manual Setup
function Setup-Manual {
  Write-Host "📋 Manual Setup Instructions" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Add these environment variables to your deployment platform:" -ForegroundColor White
  Write-Host ""
  Write-Host "VENICE_API_KEY=$VENICE_KEY" -ForegroundColor Cyan
  Write-Host "VENICE_MAX_CONCURRENT=50" -ForegroundColor Cyan
  Write-Host "NODE_ENV=production" -ForegroundColor Cyan
  Write-Host ""
}

# Execute platform-specific setup
switch ($PLATFORM) {
  "railway" { Setup-Railway }
  "vercel" { Setup-Vercel }
  "netlify" { Setup-Netlify }
  "heroku" { Setup-Heroku }
  "render" { Setup-Render }
  default { Setup-Manual }
}

Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Setup Instructions Complete" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "After setting environment variables:" -ForegroundColor White
Write-Host "1. Redeploy your application"
Write-Host "2. Check health: curl https://your-domain.com/api/v1/chat/companion/health"
Write-Host "3. Test characters in production"
Write-Host ""
Write-Host "Need help? Check DEPLOYMENT_VENICE_FIX.md for full guide" -ForegroundColor Yellow
Write-Host ""

