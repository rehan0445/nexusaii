# 🚨 DNS Error Fix: Railway Service Down

## ❌ Error: `DNS_PROBE_FINISHED_NXDOMAIN`
**Domain:** `nexuschats.up.railway.app`
**Meaning:** DNS cannot resolve the domain - Railway service is likely down, stopped, or deleted.

---

## ✅ Immediate Actions (Check Railway Dashboard)

### Step 1: Verify Service Exists
1. **Go to Railway Dashboard:** https://railway.app/
2. **Navigate to your project**
3. **Check if the service exists:**
   - Is there a service called "nexuschats" or similar?
   - Or is the service completely missing?

### Step 2: Check Service Status
**If service exists:**
1. Click on the service
2. Check the **status indicator**:
   - 🟢 **Green (Active)** = Service should be running
   - 🟡 **Yellow (Deploying)** = Deployment in progress
   - 🔴 **Red (Failed/Stopped)** = Service is down
   - ⚪ **Gray (Paused)** = Service paused (free tier limit?)

### Step 3: Check Deployment Status
1. Go to **Deployments** tab
2. Look for the latest deployment:
   - ✅ **Active** (green) = Should be working
   - ❌ **Failed** (red) = Deployment failed
   - ⏸️ **Stopped** = Service stopped

### Step 4: Check Service Logs
1. Go to **Logs** tab
2. Filter by **"Last 1 hour"**
3. Look for:
   - ✅ `Server is running on http://localhost:XXXX` = Good
   - ❌ `Error: Cannot find module` = Build/runtime error
   - ❌ `Missing required environment variables` = Config issue
   - ❌ Nothing/Empty logs = Service crashed immediately

---

## 🔧 Common Issues & Fixes

### Issue 1: Service is Stopped/Paused
**Symptoms:** Service shows "Stopped" or "Paused" status
**Fix:**
1. Click **"Deploy"** button in Railway dashboard
2. Select **"Redeploy"** from latest commit
3. Or manually restart the service

### Issue 2: Deployment Failed
**Symptoms:** Latest deployment shows "Failed" (red)
**Fix:**
1. Click on the failed deployment
2. Check **Build Logs** for errors:
   - Missing dependencies → Add to `package.json`
   - Syntax errors → Fix code
   - Import errors → Fix imports
3. Check **Runtime Logs** for startup errors
4. Redeploy after fixing

### Issue 3: Service Deleted/Removed
**Symptoms:** Service doesn't exist in Railway dashboard
**Fix:**
1. **Create new service:**
   - Click **"New"** → **"GitHub Repo"**
   - Connect your repo: `rehan0445/nexusaii`
   - Select branch: `main`
2. **Configure environment variables** (see below)
3. **Deploy**

### Issue 4: Domain Changed/Removed
**Symptoms:** Old domain doesn't work, need to find new domain
**Fix:**
1. Go to Railway → Your Service → **Settings** tab
2. Check **"Networking"** or **"Domains"** section
3. Find the **`.railway.app`** domain (might be different from `nexuschats`)
4. Update any hardcoded URLs if needed

### Issue 5: Free Tier Limit Reached
**Symptoms:** Service was paused due to usage limits
**Fix:**
1. Check Railway dashboard for billing/usage warnings
2. Upgrade plan or wait for billing cycle reset
3. Restart service after limits reset

---

## ⚙️ Required Railway Configuration

If you need to recreate the service, configure these:

### Environment Variables (Required):
```
JWT_SECRET=<your-jwt-secret>
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
VENICE_API_KEY=<your-venice-api-key>
PORT=${{PORT}}
CORS_ALLOWLIST=https://your-actual-domain.railway.app
COOKIE_DOMAIN=.railway.app
```

### Build Settings:
- **Build Command:** (auto-detected from `nixpacks.toml`)
- **Start Command:** `cd server && npm start`

---

## 🔍 Diagnostic Commands

**Check if Railway CLI is available:**
```bash
railway --version
```

**Check service status via CLI:**
```bash
railway status
railway logs
```

**Force redeploy via CLI:**
```bash
railway up
```

---

## 📞 What to Check Right Now

1. **✅ Is the service visible in Railway dashboard?**
2. **✅ What is the service status?** (Active/Stopped/Failed)
3. **✅ What do the logs show?** (Last 50-100 lines)
4. **✅ Is there a new domain?** (Check Settings → Domains)

---

## 🆘 If Service is Missing

If the service was deleted or doesn't exist:

1. **Recreate Service:**
   - Railway Dashboard → New → GitHub Repo
   - Select: `rehan0445/nexusaii`
   - Branch: `main`
   - Auto-deploy: Enabled

2. **Set Environment Variables:**
   - Copy from `.railway-env.template`
   - Add each variable in Railway → Variables tab

3. **Wait for Deployment:**
   - Build: 3-5 minutes
   - Deployment: 1-2 minutes
   - Check logs for success message

4. **Get New Domain:**
   - Railway → Service → Settings → Domains
   - Copy the `.railway.app` domain
   - Update any hardcoded URLs

---

## ✅ Expected Success State

When service is working correctly:
- Service status: 🟢 **Active**
- Latest deployment: ✅ **Active**
- Logs show: `🚀 Server is running on http://localhost:XXXX`
- Domain resolves: `https://your-domain.railway.app` works

