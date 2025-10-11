# Troubleshooting Room Creation Issues

## ✅ Fix Applied
Fixed missing `supabase` import in `server/app.js`

---

## 🔧 Steps to Fix & Test

### **STEP 1: Restart Your Server** ⚡
```bash
# CRITICAL: Stop your server (Ctrl+C) and restart it
cd server
npm start

# Look for this in server logs:
# "✅ Supabase Realtime subscriptions active for Hangout Rooms"
```

**Why:** The code changes won't take effect until you restart the server!

---

### **STEP 2: Check Server Logs** 👀

When you try to create a room, watch the **server console** for errors. You should see:

**✅ Success logs:**
```
POST /api/hangout/rooms
🏗️ Created new hangout room: [Room Name] (room-123456) in Supabase
```

**❌ Error logs to look for:**
```
Error creating room: [error message]
Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY
Auth middleware error: ...
```

---

### **STEP 3: Check Browser Console** 🔍

Open DevTools (F12) → Console tab. You should see:

**✅ Success:**
```javascript
hangoutService.createRoom called with: {name: "...", ...}
Request body: {...}
Response status: 200
Response ok: true
Response data: {success: true, room: {...}}
```

**❌ Error:**
```javascript
Response not ok: 401 Unauthorized
// OR
Response not ok: 500 Internal Server Error
```

---

## 🐛 Common Issues & Fixes

### **Issue 1: "Access token required" (401 Error)**

**Problem:** Not logged in or token expired

**Fix:**
```bash
1. Logout completely
2. Clear browser cookies/localStorage
3. Login again
4. Try creating room
```

---

### **Issue 2: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"**

**Problem:** Environment variables not set

**Fix:**
```bash
# Check server/.env file has these:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# NOT the ANON key - must be SERVICE_ROLE_KEY!
```

---

### **Issue 3: "Cannot read properties of undefined (reading 'from')"**

**Problem:** Supabase client not initialized (this was our bug)

**Fix:** ✅ Already fixed by adding the import!

---

### **Issue 4: Still Getting "Failed to create room"**

**Problem:** Could be several things

**Debugging Steps:**
1. **Check Network Tab** (F12 → Network)
   - Find the POST request to `/api/hangout/rooms`
   - Click on it → Response tab
   - What's the error message?

2. **Check Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Check if `rooms` table exists
   - Check table permissions (RLS might be blocking)

3. **Check Server Console**
   - Stop server
   - Restart with: `npm start`
   - Watch console when creating room
   - Copy any error messages

---

## 🧪 **Quick Test Script**

Run this in browser console to test the API directly:

```javascript
// Get your auth token
const auth = localStorage.getItem('nexus-auth');
const token = JSON.parse(auth)?.currentSession?.access_token;

// Test room creation
fetch('http://localhost:8002/api/hangout/rooms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Test Room',
    description: 'Test Description',
    category: 'general',
    isPrivate: false,
    roomType: 'palace',
    tags: ['test']
  })
})
.then(r => r.json())
.then(data => console.log('✅ Result:', data))
.catch(err => console.error('❌ Error:', err));
```

**Expected Output:**
```javascript
✅ Result: {
  success: true,
  room: { id: "room-...", name: "Test Room", ... },
  message: "Room created successfully"
}
```

---

## 📊 **Checklist Before Reporting Error**

Before asking for help, please provide:

- [ ] Server console logs (copy/paste full error)
- [ ] Browser console logs (copy/paste)
- [ ] Network tab response (what does server return?)
- [ ] Screenshots of the error
- [ ] Supabase dashboard - does `rooms` table exist?
- [ ] Environment variables - are they set correctly?

---

## 🚀 **Most Likely Fix**

**95% of the time, the issue is:**

1. ✅ **Server not restarted** after code changes
2. ✅ **Supabase credentials missing** in `.env`
3. ✅ **User not logged in** or token expired

**Try this:**
```bash
# 1. Stop server (Ctrl+C)
# 2. Restart server
npm start

# 3. In browser:
#    - Logout
#    - Login again
#    - Try creating room

# 4. Check server console for actual error
```

---

## 🎯 **Expected Flow (When Working)**

1. User clicks "Create Room"
2. Browser sends POST to `/api/hangout/rooms`
3. Server validates token (requireAuth)
4. Server creates room in Supabase
5. Server returns room data
6. Browser shows success

**Any break in this chain = error!**

---

## 💡 **Next Steps**

1. **Restart server NOW**
2. **Try creating room**
3. **Check server console** (this is key!)
4. **Check browser console**
5. **Copy error messages** and share them

The error messages will tell us exactly what's wrong!

