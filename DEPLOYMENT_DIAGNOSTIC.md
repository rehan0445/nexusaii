# 🚨 Website Down - Deployment Diagnostic Checklist

## Immediate Actions Required

Your website went down after pushing to GitHub (auto-deploy to Railway). Follow these steps **in order**:

---

## ✅ Step 1: Check Railway Deployment Status

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app/
   - Navigate to your project
   - Click on your service

2. **Check Deployments Tab:**
   - Look for the latest deployment
   - Check if status is **"Active"** (green) or **"Failed"** (red)
   - Note the commit hash - should match your latest push

3. **If deployment failed:**
   - Click on the failed deployment
   - Review **Build Logs** section
   - Look for errors like:
     - ❌ Module not found
     - ❌ Import errors
     - ❌ Syntax errors
     - ❌ Missing dependencies

---

## ✅ Step 2: Check Railway Runtime Logs

1. **Go to Railway Dashboard → Your Service → Logs**
2. **Filter by "Last 1 hour"**
3. **Look for these patterns:**

### ❌ CRITICAL ERRORS (App is crashing):
```
Error: Cannot find module
SyntaxError
ReferenceError
TypeError: Cannot read property
Error: connect ECONNREFUSED
```

### ❌ STARTUP ERRORS:
```
Missing required environment variables
Failed to load confessions from Supabase
Assignment to constant variable
```

### ✅ GOOD SIGNS (App started successfully):
```
🚀 Server is running on http://localhost:XXXX
✅ All environment variables configured correctly!
🔌 Socket.IO server ready
```

---

## ✅ Step 3: Verify Code Changes Didn't Break Anything

### Check Recent Changes:

1. **All Confessions Endpoint** - `/api/confessions/all`
   - ✅ File: `server/controllers/engagementController.js`
   - ✅ Function: `getAllConfessions` (line 419)
   - ✅ Export: Correctly exported
   - ✅ Import: Correctly imported in `server/routes/confessions.js` (line 14)

2. **Confession Fetch Fix** - `fetchConfessionFromSupabase`
   - ✅ File: `server/routes/confessions.js` (line 275)
   - ✅ Now queries only `confessions` table
   - ✅ No longer iterates through 6 tables

3. **Const Assignment Fix**
   - ✅ Fixed in `server/routes/confessions.js` (line 875)
   - ✅ Changed `const items` to `let items`

---

## ✅ Step 4: Verify Environment Variables in Railway

**Critical Variables Required:**
```
✅ JWT_SECRET
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ PORT=${{PORT}}
✅ VENICE_API_KEY
✅ CORS_ALLOWLIST
✅ COOKIE_DOMAIN
```

**Check in Railway:**
1. Go to **Variables** tab
2. Verify all variables above are set
3. Ensure `PORT=${{PORT}}` (exactly as shown)
4. No extra spaces in variable names/values

---

## ✅ Step 5: Check Common Issues

### Issue 1: Build Failure
**Symptoms:** Deployment shows "Build Failed"
**Check:** Railway Dashboard → Deployments → Build Logs
**Fix:** Look for missing dependencies or build errors

### Issue 2: Runtime Crash
**Symptoms:** Deployment successful but app won't start
**Check:** Railway Dashboard → Logs → Runtime Logs
**Fix:** Look for startup errors, missing env vars, or import errors

### Issue 3: Import Error
**Symptoms:** `Error: Cannot find module` or `SyntaxError`
**Check:** Railway Logs for import-related errors
**Fix:** Verify all imports are correct (especially `getAllConfessions`)

### Issue 4: Database Connection
**Symptoms:** `Failed to load confessions from Supabase` or connection timeouts
**Check:** Railway Logs for Supabase connection errors
**Fix:** Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct

---

## ✅ Step 6: Force Redeploy

If the issue persists, force Railway to redeploy:

```bash
# Push an empty commit to trigger redeploy
git commit --allow-empty -m "Trigger Railway redeploy"
git push origin main
```

**Or in Railway Dashboard:**
1. Go to Deployments tab
2. Click "Deploy" button (top right)
3. Select "Redeploy" from latest commit

---

## 🔍 Quick Diagnostic Commands (Local Testing)

Test if the code works locally:

```bash
# Test syntax
node -c server/routes/confessions.js
node -c server/controllers/engagementController.js

# Test server startup (will fail without env vars, but will show import errors)
cd server && npm start
```

---

## 📊 Expected Railway Logs (When Working)

When the app starts successfully, you should see:

```
🔍 Venice API Environment Check
✅ All environment variables configured correctly!
🚀 Server is running on http://localhost:XXXX (listening on 0.0.0.0)
🔌 Socket.IO server ready for Dark Room connections
📅 Started at: 2025-XX-XX...
```

---

## 🆘 If Still Down

1. **Copy Railway Logs** (last 50-100 lines)
2. **Check Railway Deployments** for error messages
3. **Verify Environment Variables** are all set correctly
4. **Check if recent code changes** introduced any issues

---

## 📝 Recent Code Changes Summary

**What We Changed:**
- ✅ Added `getAllConfessions` function in `engagementController.js`
- ✅ Added `/api/confessions/all` route in `confessions.js`
- ✅ Fixed `fetchConfessionFromSupabase` to query only main table
- ✅ Fixed const assignment error in confessions route
- ✅ Updated frontend components (sidebar menu, feed, etc.)

**All code has been syntax-checked and should work correctly.**

