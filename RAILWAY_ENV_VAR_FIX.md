# 🚨 Railway Environment Variable Not Loading - Complete Fix

## Problem
Railway shows the environment variable is set, but the backend isn't reading it.
Getting 401 errors even though the API key is valid locally.

## Root Cause
Railway uses a **different method** for environment variables in Node.js apps. The issue is likely:
1. Railway's env vars not accessible via `process.env` 
2. Or the app is crashing before loading env vars
3. Or Railway is using a cached build

## ✅ Complete Fix

### Step 1: Use Railway CLI to Set Variables (Most Reliable)

Install Railway CLI if you haven't:
```bash
npm install -g @railway/cli
```

Login:
```bash
railway login
```

Link to your project:
```bash
railway link
```

Set environment variables via CLI (MOST RELIABLE METHOD):
```bash
railway variables --set VENICE_API_KEY=hAsm7OA9_MGaXedclR-c3_dzDb7sX-5lRvVTyK98AW
railway variables --set VENICE_MAX_CONCURRENT=50
railway variables --set NODE_ENV=production
```

Verify they're set:
```bash
railway variables
```

### Step 2: Verify Railway is Running Latest Code

Check your Railway dashboard:
1. Go to Deployments tab
2. Make sure latest commit is deployed: `9a66d04` or newer
3. Status should be "Active" (green)

If not, trigger redeploy:
```bash
railway up
```

Or in dashboard: Click "Redeploy"

### Step 3: Check Railway Build Logs

In Railway Dashboard → Deployments → Click latest → Build Logs

Look for errors like:
- Module not found
- Import errors
- Syntax errors

If you see errors, the app might be crashing before loading env vars.

### Step 4: Check Railway Runtime Logs

Railway Dashboard → Service → Logs

Filter by "Last 1 hour"

Look for:
```
✅ 🔍 Venice API Environment Check
✅ All environment variables configured correctly!
```

If you DON'T see this, the app is crashing during startup.

### Step 5: Alternative - Use Railway Service Variables

Sometimes Railway needs variables set at service level:

1. Railway Dashboard → Your Service
2. Click "Settings" (not Variables)
3. Scroll to "Environment"
4. Click "Add Variable"
5. Add each variable there instead of in the Variables tab

### Step 6: Check Railway's Node Version

Railway might be using wrong Node version.

Add this to `package.json` in server directory:
```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Step 7: Nuclear Option - Force Complete Rebuild

If nothing works, force Railway to rebuild from scratch:

```bash
# Add a timestamp to force rebuild
echo "# Rebuild $(date)" >> server/app.js

# Commit and push
git add .
git commit -m "Force Railway rebuild"
git push origin main
```

Then in Railway:
1. Go to Settings
2. Scroll to bottom
3. Look for "Restart Deployment" or similar
4. Or just wait for auto-deploy

## 🧪 Test if Environment Variables Are Really Loaded

Create this test endpoint in your Railway deployment.

Add to `server/app.js` (TEMPORARILY):

```javascript
// TEMPORARY: Debug endpoint to check env vars
app.get('/debug-railway-env', (req, res) => {
  res.json({
    node_version: process.version,
    node_env: process.env.NODE_ENV || 'NOT SET',
    has_venice_key: !!process.env.VENICE_API_KEY,
    venice_key_length: process.env.VENICE_API_KEY?.length || 0,
    venice_key_first_8: process.env.VENICE_API_KEY?.substring(0, 8) || 'MISSING',
    all_venice_vars: Object.keys(process.env).filter(k => k.includes('VENICE')),
    railway_env: process.env.RAILWAY_ENVIRONMENT || 'NOT SET',
    railway_service: process.env.RAILWAY_SERVICE_NAME || 'NOT SET'
  });
});
```

Then test:
```bash
curl https://your-railway-domain.com/debug-railway-env
```

## 🎯 Expected Response

If working correctly:
```json
{
  "node_version": "v20.x.x",
  "node_env": "production",
  "has_venice_key": true,
  "venice_key_length": 42,
  "venice_key_first_8": "hAsm7OA9",
  "all_venice_vars": ["VENICE_API_KEY", "VENICE_MAX_CONCURRENT"],
  "railway_env": "production",
  "railway_service": "your-service-name"
}
```

If NOT working:
```json
{
  "has_venice_key": false,
  "venice_key_length": 0,
  "venice_key_first_8": "MISSING"
}
```

## 🔧 If STILL Not Loading

Railway has a known issue where environment variables don't load if:
1. The service is using Nixpacks (check Railway settings)
2. The service has a custom start command that doesn't load .env

**Fix for Nixpacks:**

Create `nixpacks.toml` in project root:
```toml
[phases.setup]
nixPkgs = ['nodejs_20']

[start]
cmd = 'cd server && node app.js'
```

**Fix for custom start command:**

In Railway Settings → Deploy:
- Make sure Start Command is: `cd server && node app.js`
- Or: `npm start` (if package.json has correct start script)

## 📱 Contact Railway Support

If NONE of this works, Railway might have an issue.

1. Railway Dashboard → Help (bottom left)
2. Open a ticket with:
   - "Environment variables not loading in Node.js app"
   - Your service ID
   - Screenshot of Variables tab
   - Screenshot of logs showing missing env vars

## ⚡ Quick Temporary Workaround

While waiting for Railway fix, you can hardcode the key TEMPORARILY:

In `server/controllers/chatAiController.js`, line 206:

```javascript
// TEMPORARY WORKAROUND - REMOVE AFTER RAILWAY FIX
const VENICE_API_KEY = process.env.VENICE_API_KEY || 'hAsm7OA9_MGaXedclR-c3_dzDb7sX-5lRvVTyK98AW';
```

Then use `VENICE_API_KEY` instead of `process.env.VENICE_API_KEY`.

**⚠️ IMPORTANT:** This is TEMPORARY. Remove after Railway env vars work!

---

## Next Steps for You

1. Try Railway CLI method (most reliable)
2. Add the debug endpoint and test it
3. Check Railway runtime logs for startup errors
4. If still failing, use temporary workaround while investigating

