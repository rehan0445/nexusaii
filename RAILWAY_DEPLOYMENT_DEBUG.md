# Railway Deployment Debug Guide

## 🚨 Quick Fix Steps

### Step 1: Check Railway Deployment Status

1. **Go to Railway Dashboard** → Your Project
2. **Check Deployments Tab**
   - Is the latest deployment "Active"?
   - Look for the commit `cd7225a` or `a9eff60`
   - If still showing old commit, **trigger manual redeploy**

### Step 2: Force Railway to Redeploy

Railway might not have redeployed after your git push. Force it:

```bash
# Option 1: Push an empty commit to trigger redeploy
git commit --allow-empty -m "Trigger Railway redeploy"
git push origin main
```

**Or in Railway Dashboard:**
1. Go to Deployments tab
2. Click "Deploy" button (top right)
3. Select "Redeploy"

### Step 3: Check Railway Logs IMMEDIATELY

**Critical:** Check logs RIGHT NOW to see what's happening:

1. Railway Dashboard → Your Service → Logs
2. Look for these messages on startup:

**✅ GOOD (You should see):**
```
🔍 Venice API Environment Check
✅ All environment variables configured correctly!
```

**❌ BAD (If you see):**
```
❌ VENICE_API_KEY is not set
❌ STARTUP FAILED: Critical environment variables missing
```

### Step 4: Verify Environment Variables Are Loaded

Add this temporary debug route to check env vars:

**File: `server/routes/companionChat.js`**

Add this route TEMPORARILY (after line 13):

```javascript
// TEMPORARY DEBUG ROUTE - REMOVE AFTER TESTING
router.get('/debug-env', (req, res) => {
  res.json({
    has_venice_key: !!process.env.VENICE_API_KEY,
    venice_key_length: process.env.VENICE_API_KEY?.length || 0,
    venice_key_preview: process.env.VENICE_API_KEY ? 
      `${process.env.VENICE_API_KEY.substring(0, 8)}...${process.env.VENICE_API_KEY.substring(process.env.VENICE_API_KEY.length - 4)}` : 
      'MISSING',
    max_concurrent: process.env.VENICE_MAX_CONCURRENT || 'not set',
    node_env: process.env.NODE_ENV || 'not set',
    all_env_keys: Object.keys(process.env).filter(k => k.includes('VENICE'))
  });
});
```

Then test:
```bash
curl https://your-railway-domain.com/api/v1/chat/companion/debug-env
```

### Step 5: Test Health Endpoint

```bash
curl https://your-railway-domain.com/api/v1/chat/companion/health
```

**Expected response:**
```json
{
  "status": "ok",
  "configuration": {
    "has_api_key": true,
    "api_key_valid": true,
    "max_concurrent": 50
  }
}
```

**If you see `has_api_key: false`** → Environment variable not loaded!

### Step 6: Check Railway Variables Syntax

In Railway, environment variables should be set like this:

**Format:** `KEY=VALUE` (no quotes, no spaces around =)

✅ **CORRECT:**
```
VENICE_API_KEY=hAsm7OA9_MGaXedclR-c3_dzDb7sX-5lRvVTyK98AW
VENICE_MAX_CONCURRENT=50
NODE_ENV=production
```

❌ **WRONG:**
```
VENICE_API_KEY = "hAsm7OA9_MGaXedclR-c3_dzDb7sX-5lRvVTyK98AW"  # No quotes, no spaces
VENICE_API_KEY="value"  # No quotes
```

### Step 7: Check Build Logs

Railway Dashboard → Deployments → Click on latest → Build Logs

Look for:
- ✅ Build succeeded
- ✅ No TypeScript/import errors
- ❌ Any errors mentioning `companionChatController`

## 🔍 Common Issues & Solutions

### Issue 1: Frontend Still Calling Old Code

**Check browser console for:**
- Network tab → Look for requests to `/api/v1/chat/companion/venice`
- If you see requests to `https://api.venice.ai` → Frontend not updated

**Solution:** Hard refresh browser (Ctrl + Shift + R or Cmd + Shift + R)

### Issue 2: Backend Import Error

**Symptom:** Server crashes on startup

**Check Railway logs for:**
```
Error: Cannot find module '../controllers/companionChatController.js'
```

**Solution:** File might not be pushed to git. Check:
```bash
git ls-files | grep companionChatController
# Should show: server/controllers/companionChatController.js
```

If not there:
```bash
git add server/controllers/companionChatController.js
git commit -m "Add missing controller"
git push origin main
```

### Issue 3: Railway Using Cached Build

**Solution:** Clear Railway cache
1. Go to Settings → Delete Service
2. No wait, **DON'T DELETE**
3. Instead, go to Settings → scroll down
4. Look for "Reset Build Cache" option

Or just redeploy and it should work.

### Issue 4: Environment Variables Set AFTER Deploy

Railway needs to reload environment variables.

**Solution:**
1. After adding env vars in Railway
2. Click "Restart" button on service
3. Or make any code change and push to trigger redeploy

## 🧪 Test Directly in Railway

Open Railway Shell:

1. Railway Dashboard → Your Service
2. Click "..." menu → "Shell"
3. Run these commands:

```bash
# Check if env var is set
echo $VENICE_API_KEY

# Check if file exists
ls -la server/controllers/companionChatController.js

# Check if route is registered
grep -r "companionChat" server/routes/

# Test Node import
node -e "console.log(process.env.VENICE_API_KEY)"
```

## 🚀 Nuclear Option: Complete Redeploy

If nothing works:

```bash
# 1. Make sure all changes are committed
git status

# 2. Add a timestamp to force rebuild
echo "# Last updated: $(date)" >> server/app.js

# 3. Commit and push
git add .
git commit -m "Force complete redeploy with timestamp"
git push origin main

# 4. In Railway: Wait for deployment to complete
# 5. Check logs immediately after deploy
```

## 📞 Quick Diagnostics Checklist

Run through this checklist:

- [ ] Railway shows latest commit deployed (cd7225a or a9eff60)
- [ ] Environment variables visible in Railway Variables tab
- [ ] Railway logs show "Venice API Environment Check" on startup
- [ ] `/api/v1/chat/companion/health` returns `has_api_key: true`
- [ ] Browser network tab shows requests to `/api/v1/chat/companion/venice`
- [ ] No errors in Railway logs
- [ ] Hard refreshed browser (cleared cache)

## 🎯 Most Likely Issue

Based on experience, it's usually **one of these**:

1. **Railway didn't redeploy** → Force redeploy
2. **Frontend cached** → Hard refresh browser (Ctrl+Shift+R)
3. **Env vars not loaded** → Restart Railway service
4. **Wrong endpoint** → Check network tab shows new endpoint

## 📝 What to Send Me

If still not working, send me:

1. Screenshot of Railway deployment logs (startup portion)
2. Response from `/api/v1/chat/companion/health`
3. Browser console errors
4. Network tab showing the failing request
5. Railway environment variables (screenshot - redact sensitive parts)

---

**Most Common Fix:** Railway didn't auto-redeploy. Manually click "Redeploy" in Railway dashboard.

