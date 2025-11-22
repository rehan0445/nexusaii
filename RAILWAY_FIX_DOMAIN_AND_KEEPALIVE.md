# 🚨 Railway Fix: Domain Missing + Container Stopping

## ✅ Issue Identified

From your logs:
1. **Server starts successfully** on port 8080 ✅
2. **Railway stops container** after ~2 seconds (`Stopping Container` + `SIGTERM`) ❌
3. **No public domain** configured - DNS can't resolve `nexuschats.up.railway.app` ❌

---

## 🔧 Solution: Configure Railway Domain & Health Check

### Step 1: Generate Public Domain in Railway

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app/
   - Navigate to your project
   - Click on your service

2. **Go to Settings Tab:**
   - Click **"Settings"** tab
   - Scroll to **"Networking"** or **"Domains"** section

3. **Generate Public Domain:**
   - Click **"Generate Domain"** or **"Add Domain"**
   - Railway will create a domain like: `your-service-name-production.up.railway.app`
   - **Copy this domain** - you'll need it!

4. **If Domain Already Exists:**
   - Check what domain is listed
   - It might be different from `nexuschats.up.railway.app`
   - Use the actual domain shown in Railway

### Step 2: Update Environment Variables

1. **Go to Railway → Your Service → Variables Tab**

2. **Update `CORS_ALLOWLIST`:**
   - Find `CORS_ALLOWLIST` variable
   - Update value to match your **actual Railway domain**:
     ```
     CORS_ALLOWLIST=https://your-actual-domain.up.railway.app
     ```
   - Replace `your-actual-domain` with the domain from Step 1

3. **Verify Other Variables:**
   ```
   PORT=${{PORT}}
   JWT_SECRET=<your-secret>
   SUPABASE_URL=<your-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-key>
   VENICE_API_KEY=<your-key>
   COOKIE_DOMAIN=.railway.app
   ```

### Step 3: Configure Railway Health Check (Keep Container Alive)

Railway needs to know your service is healthy, or it will stop it.

1. **Go to Railway → Your Service → Settings Tab**

2. **Find "Health Check" or "Probe" Section:**
   - Look for **"Healthcheck Path"** or **"Health Check"** settings

3. **Configure Health Check:**
   - **Path:** `/health`
   - **Interval:** `30s` (or default)
   - **Timeout:** `10s` (or default)

   **OR if Railway uses environment variables:**
   - Add variable: `RAILWAY_HEALTHCHECK_PATH=/health`
   - Add variable: `RAILWAY_HEALTHCHECK_TIMEOUT_SEC=10`

4. **Alternative: Add to `nixpacks.toml`:**

   Add this to your `nixpacks.toml` file:
   ```toml
   [start]
   cmd = "cd server && npm start"
   
   [healthcheck]
   httpPath = "/health"
   httpTimeout = 10
   ```

### Step 4: Verify Health Endpoint Works

Your app already has health endpoints:
- ✅ `GET /health` - Basic health check
- ✅ `GET /api/health` - API health check with Supabase

These should work automatically once Railway can reach your service.

### Step 5: Redeploy Service

After configuring domain and health check:

1. **In Railway Dashboard:**
   - Click **"Deploy"** button
   - Select **"Redeploy"** from latest commit
   - Wait 3-5 minutes for deployment

2. **Check Logs:**
   - Should see: `🚀 Server is running on http://localhost:8080`
   - Should NOT see: `Stopping Container` immediately after
   - Container should stay running

3. **Test Domain:**
   - Visit: `https://your-actual-domain.up.railway.app`
   - Should load your React app
   - Test: `https://your-actual-domain.up.railway.app/health`
   - Should return JSON: `{ "status": "running", ... }`

---

## 🔍 Troubleshooting

### If Container Still Stops Immediately:

1. **Check Railway Logs** for errors after startup
2. **Verify Health Check Path:**
   - Railway might be checking wrong path
   - Try: `/health` or `/api/health`
3. **Check Resource Limits:**
   - Railway free tier has limits
   - Service might be hitting memory/CPU limits
   - Check Railway dashboard for resource usage

### If Domain Still Doesn't Work:

1. **DNS Propagation:**
   - Railway domains can take 1-5 minutes to propagate
   - Try accessing after 5 minutes
   - Clear browser cache/DNS cache

2. **Verify Domain in Railway:**
   - Settings → Domains section
   - Should show status: **"Active"** or **"Configured"**

3. **Check Railway Service Status:**
   - Should show: 🟢 **Active** (not Stopped/Failed)

### If Service Won't Start:

1. **Check Build Logs:**
   - Railway Dashboard → Deployments → Latest → Build Logs
   - Look for build errors

2. **Check Runtime Logs:**
   - Look for startup errors
   - Missing environment variables
   - Port conflicts

---

## ✅ Expected Success State

After fixing:

1. **Railway Dashboard:**
   - Service status: 🟢 **Active**
   - Domain: `https://your-service.up.railway.app` (status: Active)

2. **Logs:**
   ```
   🚀 Server is running on http://localhost:8080
   🔌 Socket.IO server ready
   ✅ All environment variables configured correctly!
   ```
   - NO "Stopping Container" immediately after startup

3. **Browser:**
   - `https://your-domain.up.railway.app` loads your app
   - `/health` endpoint returns JSON response
   - No DNS errors

---

## 🆘 Still Having Issues?

**Share these details:**
1. What domain shows in Railway Settings → Domains?
2. What's the service status in Railway dashboard?
3. Are there any errors in Railway logs after "Server is running"?
4. Can you access `/health` endpoint via Railway domain?

