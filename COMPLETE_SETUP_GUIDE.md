# Complete Setup Guide - Fix Backend Environment & Port Issues

## ✅ What Has Been Fixed

1. **Created PowerShell script** (`create-server-env.ps1`) to generate `server/.env` file
2. **Fixed all hardcoded URLs** - Changed 13 files from `http://localhost:8000` to `/api/` (uses Vite proxy)
3. **Updated port references** - Changed documentation from port 8000 to 8002

## 🚀 Steps to Complete Setup

### Step 1: Create the server/.env File

Run this PowerShell script to create the environment file:

```powershell
.\create-server-env.ps1
```

This will create `server\.env` with all required variables including a secure auto-generated JWT_SECRET.

### Step 2: Add Your Credentials

**CRITICAL:** Edit `server\.env` and replace these placeholders with your actual credentials:

```env
# Replace these three values:
SUPABASE_URL=PASTE_YOUR_SUPABASE_URL_HERE
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVICE_ROLE_KEY_HERE
VENICE_API_KEY=PASTE_YOUR_VENICE_API_KEY_HERE
```

**Where to get these:**

1. **Supabase Credentials:**
   - Go to: https://app.supabase.com/project/YOUR_PROJECT/settings/api
   - Copy "Project URL" → paste as `SUPABASE_URL`
   - Copy "service_role (secret)" → paste as `SUPABASE_SERVICE_ROLE_KEY`

2. **Venice AI API Key:**
   - Go to: https://venice.ai/
   - Sign up/login and get your API key
   - Paste as `VENICE_API_KEY`

### Step 3: Restart Backend Server

**Stop the current server** (if running):
- Press `Ctrl+C` in the terminal where it's running

**Start the server fresh:**

```powershell
cd server
npm start
```

OR if you prefer development mode:

```powershell
cd server
npm run dev
```

**Verify it started correctly** - You should see:
```
✅ Server listening on port 8002
✅ Socket.io server initialized
✅ Database connected
```

### Step 4: Restart Frontend (Optional)

The frontend should automatically pick up the changes, but if you want to be sure:

```powershell
cd client
npm run dev
```

## 🔍 Verification Checklist

After restarting the backend server, check:

- [ ] No `❌ VENICE_API_KEY is not set` errors in backend logs
- [ ] No `❌ Missing SUPABASE_URL` errors in backend logs
- [ ] Server shows "listening on port 8002"
- [ ] Socket.io server initialized successfully
- [ ] Frontend shows no CSP violations for localhost:8000
- [ ] No 500 Internal Server Errors when navigating the app
- [ ] Character chat loads without errors
- [ ] WebSocket connections establish (no websocket errors)

## 🎯 Testing Character Chat

1. Navigate to a character page in the app
2. Send a message to the character
3. You should see:
   - Message appears in the chat
   - Character typing indicator shows
   - Character responds (not "API key not configured")
   - No console errors about 500 responses

## ❌ Common Issues & Solutions

### Issue: "VENICE_API_KEY is not set"
**Solution:** Make sure you edited `server/.env` and pasted your actual Venice API key (not the placeholder text)

### Issue: "Failed to connect to Supabase"
**Solution:** Verify your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct in `server/.env`

### Issue: Still seeing port 8000 errors
**Solution:** 
1. Clear browser cache and hard reload (Ctrl+Shift+R)
2. Restart both frontend and backend servers

### Issue: WebSocket still failing
**Solution:** Make sure backend is running on port 8002 and check that no other process is using that port:

```powershell
# Check what's using port 8002
netstat -ano | findstr :8002

# If something else is using it, kill that process:
# taskkill /PID <PID_NUMBER> /F
```

## 📝 Files Modified

**Created:**
- `create-server-env.ps1` - Script to generate server/.env
- `server/.env` - Environment configuration (you create this by running the script)

**Updated (fixed hardcoded URLs):**
- `client/src/pages/CharacterChat.tsx`
- `client/src/pages/Onboarding.tsx`
- `client/src/pages/Login.tsx`
- `client/src/pages/UserInfoForm.tsx`
- `client/src/pages/AISettings.tsx`
- `client/src/services/progress.ts`
- `client/src/lib/supabase.ts`
- `client/src/components/UserAiCreation.tsx`
- `client/src/components/LikeDebugger.tsx`
- `client/src/components/InfoPage.tsx`
- `client/src/components/HomeFeed.tsx`
- `client/src/components/DebugPanel.tsx`

## 🎉 Success Criteria

You'll know everything is working when:

1. ✅ Backend starts without environment variable errors
2. ✅ No console errors about missing API keys
3. ✅ Character chat responds with AI-generated messages
4. ✅ No 500 Internal Server Errors
5. ✅ No CSP violations for localhost:8000
6. ✅ WebSocket connections establish successfully
7. ✅ All features (affection, quests, greetings) load properly

---

**Need Help?** If you encounter any issues after following these steps, check:
1. Backend terminal logs for specific error messages
2. Browser console for frontend errors
3. Make sure all credentials in `server/.env` are correct (no placeholder text)

