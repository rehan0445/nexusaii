#!/bin/bash
# Venice API Environment Setup Script
# Supports Railway, Vercel, Netlify, Heroku, and Render

set -e

echo "═══════════════════════════════════════════"
echo "🚀 Venice API Environment Setup"
echo "═══════════════════════════════════════════"
echo ""

# Venice API Key
VENICE_KEY="hAsm7OA9_MGaXedclR-c3_dzDb7sX-5lRvVTyK98AW"

# Detect platform
detect_platform() {
  if [ -n "$RAILWAY_ENVIRONMENT" ]; then
    echo "railway"
  elif [ -n "$VERCEL" ]; then
    echo "vercel"
  elif [ -n "$NETLIFY" ]; then
    echo "netlify"
  elif [ -n "$DYNO" ]; then
    echo "heroku"
  elif [ -n "$RENDER" ]; then
    echo "render"
  else
    echo "unknown"
  fi
}

PLATFORM=$(detect_platform)

echo "📍 Detected Platform: $PLATFORM"
echo ""

# Railway Setup
setup_railway() {
  echo "🚂 Setting up Railway environment..."
  echo ""
  echo "Run these commands in your terminal:"
  echo ""
  echo "railway variables --set VENICE_API_KEY=$VENICE_KEY"
  echo "railway variables --set VENICE_MAX_CONCURRENT=50"
  echo "railway variables --set NODE_ENV=production"
  echo ""
  echo "Or add via Railway Dashboard:"
  echo "1. Go to your Railway project"
  echo "2. Click 'Variables' tab"
  echo "3. Add the following:"
  echo "   VENICE_API_KEY = $VENICE_KEY"
  echo "   VENICE_MAX_CONCURRENT = 50"
  echo "   NODE_ENV = production"
  echo ""
}

# Vercel Setup
setup_vercel() {
  echo "▲ Setting up Vercel environment..."
  echo ""
  echo "Run these commands in your terminal:"
  echo ""
  echo "vercel env add VENICE_API_KEY"
  echo "# When prompted, enter: $VENICE_KEY"
  echo "# Select: Production, Preview, Development"
  echo ""
  echo "vercel env add VENICE_MAX_CONCURRENT"
  echo "# When prompted, enter: 50"
  echo ""
  echo "vercel env add NODE_ENV"
  echo "# When prompted, enter: production"
  echo ""
  echo "Or add via Vercel Dashboard:"
  echo "1. Go to Project Settings → Environment Variables"
  echo "2. Add the variables for all environments"
  echo ""
}

# Netlify Setup
setup_netlify() {
  echo "🌐 Setting up Netlify environment..."
  echo ""
  echo "Via Netlify Dashboard:"
  echo "1. Go to Site Settings → Environment Variables"
  echo "2. Add the following:"
  echo "   VENICE_API_KEY = $VENICE_KEY"
  echo "   VENICE_MAX_CONCURRENT = 50"
  echo "   NODE_ENV = production"
  echo ""
  echo "Or via Netlify CLI:"
  echo "netlify env:set VENICE_API_KEY \"$VENICE_KEY\""
  echo "netlify env:set VENICE_MAX_CONCURRENT \"50\""
  echo "netlify env:set NODE_ENV \"production\""
  echo ""
}

# Heroku Setup
setup_heroku() {
  echo "🟪 Setting up Heroku environment..."
  echo ""
  echo "Run these commands in your terminal:"
  echo ""
  echo "heroku config:set VENICE_API_KEY=$VENICE_KEY"
  echo "heroku config:set VENICE_MAX_CONCURRENT=50"
  echo "heroku config:set NODE_ENV=production"
  echo ""
  echo "Or add via Heroku Dashboard:"
  echo "1. Go to app Settings → Config Vars"
  echo "2. Click 'Reveal Config Vars'"
  echo "3. Add the variables"
  echo ""
}

# Render Setup
setup_render() {
  echo "🎨 Setting up Render environment..."
  echo ""
  echo "Via Render Dashboard:"
  echo "1. Go to your service → Environment"
  echo "2. Add the following environment variables:"
  echo "   VENICE_API_KEY = $VENICE_KEY"
  echo "   VENICE_MAX_CONCURRENT = 50"
  echo "   NODE_ENV = production"
  echo ""
  echo "Changes will trigger automatic redeploy"
  echo ""
}

# Manual Setup
setup_manual() {
  echo "📋 Manual Setup Instructions"
  echo ""
  echo "Add these environment variables to your deployment platform:"
  echo ""
  echo "VENICE_API_KEY=$VENICE_KEY"
  echo "VENICE_MAX_CONCURRENT=50"
  echo "NODE_ENV=production"
  echo ""
}

# Execute platform-specific setup
case $PLATFORM in
  railway)
    setup_railway
    ;;
  vercel)
    setup_vercel
    ;;
  netlify)
    setup_netlify
    ;;
  heroku)
    setup_heroku
    ;;
  render)
    setup_render
    ;;
  *)
    setup_manual
    ;;
esac

echo "═══════════════════════════════════════════"
echo "✅ Setup Instructions Complete"
echo "═══════════════════════════════════════════"
echo ""
echo "After setting environment variables:"
echo "1. Redeploy your application"
echo "2. Check health: curl https://your-domain.com/api/v1/chat/companion/health"
echo "3. Test characters in production"
echo ""
echo "Need help? Check DEPLOYMENT_VENICE_FIX.md for full guide"
echo ""

