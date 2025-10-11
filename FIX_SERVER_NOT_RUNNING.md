# 🚨 Backend Server Not Running - Quick Fix

## 🐛 The Problem

Your browser shows errors and the character chat doesn't work because:

**THE BACKEND SERVER IS NOT RUNNING** ❌

All API requests are failing with:
```
Error: connect ECONNREFUSED 127.0.0.1:8002
```

This means the frontend can't connect to the backend on port 8002.

---

## ⚡ 1-Minute Fix

### Run This Command:

```powershell
.\start-backend-server.ps1
```

This will:
1. ✅ Check if server directory exists
2. ✅ Install dependencies if needed
3. ✅ Create .env file if missing
4. ✅ Kill any existing process on port 8002
5. ✅ Start the backend server
6. ✅ Open server logs in new window

---

## 📝 Manual Method

If the script doesn't work:

### Step 1: Open Terminal
```powershell
cd server
```

### Step 2: Install Dependencies (if needed)
```powershell
npm install
```

### Step 3: Start Server
```powershell
npm start
# OR
npm run dev
# OR  
node server.js
```

### Step 4: Check It's Running
Look for:
```
✅ Server running on port 8002
🚀 Backend API ready
```

---

## ✅ How to Know It's Fixed

### Before Fix ❌
```
[vite] http proxy error: /api/v1/chat/ai/claude
Error: connect ECONNREFUSED 127.0.0.1:8002
```

### After Fix ✅
```
Sending Request to the Target: POST /api/v1/chat/ai/claude
✅ Request successful
```

Your character should respond normally!

---

## 🔍 Check Server Status

### Method 1: Check Port
```powershell
Get-NetTCPConnection -LocalPort 8002
```

**Should show:** Active connection on port 8002

### Method 2: Test API
```powershell
curl http://localhost:8002/api/health
# OR
curl http://localhost:8002
```

**Should return:** Server response (not error)

---

## ⚙️ Server Configuration

### Required `.env` File

Location: `server/.env`

```bash
PORT=8002
NODE_ENV=development

# Venice AI (REQUIRED)
VENICE_API_KEY=your_key_here

# Supabase (REQUIRED)
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key

SESSION_SECRET=random_secret
```

### Update These:
1. **VENICE_API_KEY** - Get from https://venice.ai/settings/api-keys
2. **SUPABASE_URL** - Get from Supabase dashboard
3. **SUPABASE_ANON_KEY** - Get from Supabase dashboard
4. **SUPABASE_SERVICE_ROLE_KEY** - Get from Supabase dashboard

---

## 🐛 Troubleshooting

### Issue: "Port 8002 already in use"

**Fix:**
```powershell
# Find process using port 8002
Get-NetTCPConnection -LocalPort 8002 | Select-Object OwningProcess

# Kill it
Stop-Process -Id <PID> -Force
```

### Issue: "Cannot find module"

**Fix:**
```powershell
cd server
rm -r node_modules
rm package-lock.json
npm install
```

### Issue: "VENICE_API_KEY not set"

**Fix:**
1. Get key from https://venice.ai/
2. Add to `server/.env`:
   ```
   VENICE_API_KEY=sk-your-actual-key
   ```
3. Restart server

### Issue: Server starts but crashes

**Check logs for:**
- Missing environment variables
- Database connection errors
- Port conflicts

**Fix:** Update `.env` with correct credentials

---

## 📊 What Should Be Running

For the app to work, you need:

1. ✅ **Backend Server** (port 8002)
   ```
   cd server
   npm start
   ```

2. ✅ **Frontend Dev Server** (port 3000)
   ```
   cd client
   npm run dev
   ```

Both should be running simultaneously!

---

## 🚀 Quick Start Commands

### Start Everything (2 terminals)

**Terminal 1 - Backend:**
```powershell
cd server
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd client  
npm run dev
```

### OR Use the Script:
```powershell
.\start-backend-server.ps1
```

---

## ✅ Verification Checklist

After starting the server:

- [ ] Server terminal shows "Server running on port 8002"
- [ ] No errors in server console
- [ ] `curl http://localhost:8002` responds
- [ ] Port 8002 is listening (check with `Get-NetTCPConnection`)
- [ ] Browser console errors gone
- [ ] Character chat works
- [ ] API requests succeed

---

## 📝 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED 8002` | Server not running | Start server: `cd server && npm start` |
| `EADDRINUSE 8002` | Port already used | Kill process or change port |
| `VENICE_API_KEY not set` | Missing API key | Add to `.env` file |
| `Cannot find module` | Missing dependencies | Run `npm install` |
| `Supabase error` | Wrong credentials | Update `.env` with correct keys |

---

## 🎯 Summary

**Problem:** Backend server not running on port 8002

**Solution:** 
```powershell
.\start-backend-server.ps1
```

**Result:** Character chat works! ✅

---

**Status:** Server should be running now

**Next Step:** Refresh browser and test character chat

---

*Need more help? Check server logs for specific errors*

