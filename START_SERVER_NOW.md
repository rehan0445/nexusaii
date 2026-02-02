# ⚡ Start Your Backend Server - Fixed!

The script has been fixed! Run this command now:

```powershell
.\start-backend-server.ps1
```

## What It Does

1. ✅ Checks if server directory exists
2. ✅ Installs dependencies if needed
3. ✅ Creates .env file if missing
4. ✅ Kills any process using port 8002
5. ✅ Starts backend server on port 8002
6. ✅ Opens server logs in new window

---

## After Running

You should see:
```
[STARTING] Backend Server...
============================================================
[CHECKING] Looking for processes on port 8002...
[STARTING] Starting backend server on port 8002...

[SUCCESS] Backend server is running on port 8002!

Server URLs:
  http://localhost:8002
  http://127.0.0.1:8002

What's Next:
  1. Backend server is running
  2. Refresh your browser
  3. Try chatting with your character
  4. Should work now!
```

---

## Important: Configure Venice API Key

After the server starts, you MUST add your Venice API key:

1. **Get your key** from: https://venice.ai/settings/api-keys

2. **Edit** `server/.env`:
   ```bash
   VENICE_API_KEY=sk-your-actual-key-here
   ```

3. **Restart server** (close server window and run script again)

---

## Quick Test

After server is running:

```powershell
# Test if server responds
curl http://localhost:8002
```

Should return a response (not error)

---

## Alternative: Manual Start

If script still has issues:

```powershell
cd server
npm install
npm start
```

Then refresh your browser!

---

**Run the script now and your character chat will work!** 🚀

