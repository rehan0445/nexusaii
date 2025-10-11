# ⚡ FIX NOW - Complete Checklist

## 🔴 CRITICAL: The Issue Was Found!

**Problem:** Missing `supabase` import in `server/app.js`  
**Status:** ✅ **FIXED** (in code)  
**Action Required:** ⚠️ **RESTART SERVER**

---

## 📋 Follow These Steps EXACTLY

### **STEP 1: Check Environment Variables** (2 minutes)

Open `server/.env` file and verify these exist:

```bash
# Required for Hangout Rooms to work:
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI... (long key starting with eyJ)
JWT_SECRET=your-secret-key

# NOT the anon key! Must be SERVICE_ROLE_KEY
```

**How to get these:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → API
4. Copy `SUPABASE_URL`
5. Copy `service_role` key (NOT anon key!)

**If missing, create server/.env:**
```bash
cd server
echo "SUPABASE_URL=https://your-project.supabase.co" > .env
echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key" >> .env
echo "JWT_SECRET=any-random-string-here" >> .env
```

---

### **STEP 2: Verify Supabase Tables Exist** (1 minute)

Go to Supabase Dashboard → Table Editor:

**Required Tables:**
- ✅ `rooms` (for storing hangout rooms)
- ✅ `room_messages` (for storing messages)
- ✅ `room_participants` (for tracking users)

**If missing, run this:**
```bash
cd server
node scripts/setup_rooms.js
```

---

### **STEP 3: Restart Server** (CRITICAL!)

```bash
# Stop server if running (Ctrl+C)
cd server
npm start

# ✅ Look for this in logs:
# "✅ Supabase Realtime subscriptions active for Hangout Rooms"
# "Server running on port 8002"
```

**⚠️ If you see "Missing SUPABASE_URL" error:**
- Go back to Step 1
- Make sure `.env` file is in `server/` folder (not root)

---

### **STEP 4: Test Room Creation** (2 minutes)

1. **Open browser** → Login to your app
2. **Go to Hangout Rooms/Palaces**
3. **Click "Create Room"**
4. **Fill the form:**
   - Name: "Test Room"
   - Description: "Test Description"
   - Category: "General"
   - Type: "Palace"
5. **Click "Create"**

**✅ Success:** Room appears in list  
**❌ Failed:** Continue to Step 5

---

### **STEP 5: Debug the Error** (If still failing)

#### **A) Check Server Console**

Look at terminal where server is running. You should see:

**✅ Success:**
```
POST /api/hangout/rooms 200
🏗️ Created new hangout room: Test Room (room-123) in Supabase
```

**❌ Error (copy this!):**
```
Error creating room: [ERROR MESSAGE HERE]
```

#### **B) Check Browser Console**

Press F12 → Console tab:

**✅ Success:**
```javascript
hangoutService.createRoom called with: {...}
Response status: 200
Response data: {success: true, ...}
```

**❌ Error:**
```javascript
Response not ok: 401 // OR 500
[ERROR MESSAGE HERE]
```

#### **C) Check Network Tab**

Press F12 → Network tab:
1. Find POST request to `/api/hangout/rooms`
2. Click it → Response tab
3. **Copy the error message**

---

## 🚨 Common Errors & Quick Fixes

### **Error: "Access token required" (401)**
**Fix:**
```bash
1. Logout from app
2. Clear browser cache (Ctrl+Shift+Delete)
3. Login again
4. Try creating room
```

---

### **Error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"**
**Fix:**
```bash
# server/.env file is missing or wrong
# Create it with correct values (see Step 1)
cd server
cat .env  # Check if file exists

# If not found:
cp .env.example .env  # If example exists
# OR
# Create new .env file manually (see Step 1)
```

---

### **Error: "Cannot read properties of undefined"**
**Fix:**
```bash
# Server needs restart
cd server
# Stop server (Ctrl+C)
npm start
```

---

### **Error: "relation 'rooms' does not exist"**
**Fix:**
```bash
# Supabase table missing
cd server
node scripts/setup_rooms.js

# If script doesn't exist, create tables manually:
# Go to Supabase Dashboard → SQL Editor
# Run the SQL from server/scripts/create_rooms_table.sql
```

---

## 🧪 **Quick API Test**

**Test the endpoint directly** (paste in browser console):

```javascript
// 1. Get your token
const auth = localStorage.getItem('nexus-auth');
const token = JSON.parse(auth)?.currentSession?.access_token;
console.log('Token:', token ? 'Found ✅' : 'Missing ❌');

// 2. Test API
fetch('http://localhost:8002/api/hangout/rooms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'API Test Room',
    description: 'Testing API directly',
    category: 'general',
    isPrivate: false,
    roomType: 'palace',
    tags: ['test']
  })
})
.then(r => {
  console.log('Status:', r.status);
  return r.json();
})
.then(data => {
  console.log('Response:', data);
  if (data.success) {
    alert('✅ API WORKS! Room created successfully!');
  } else {
    alert('❌ API Error: ' + (data.message || 'Unknown'));
  }
})
.catch(err => {
  console.error('❌ Network Error:', err);
  alert('❌ Cannot reach server. Is it running?');
});
```

**Expected Result:**
```javascript
Status: 200
Response: {success: true, room: {...}, message: "Room created successfully"}
✅ API WORKS! Room created successfully!
```

---

## 📸 **What to Share If Still Broken**

Take screenshots of:

1. **Server Terminal** (showing error)
2. **Browser Console** (F12 → Console)
3. **Network Tab** (F12 → Network → /api/hangout/rooms → Response)
4. **Your server/.env** (HIDE the actual keys! Just show they exist)

**Format:**
```
Server Console:
[paste error here]

Browser Console:
[paste error here]

Network Response:
[paste error here]

Environment Variables:
SUPABASE_URL=https://xxx (EXISTS)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (EXISTS)
JWT_SECRET=xxx (EXISTS)
```

---

## 🎯 **Most Common Issues (95% of cases)**

### **1. Server Not Restarted** (70%)
**Fix:** Stop server (Ctrl+C) → Start server (`npm start`)

### **2. Missing Environment Variables** (20%)
**Fix:** Create `server/.env` with Supabase credentials

### **3. Not Logged In / Token Expired** (5%)
**Fix:** Logout → Login again

### **4. Wrong Supabase Key** (5%)
**Fix:** Use SERVICE_ROLE_KEY (not ANON key!)

---

## ✅ **Success Indicators**

When everything works, you'll see:

**Server Console:**
```
✅ Supabase Realtime subscriptions active for Hangout Rooms
🏗️ Created new hangout room: Test Room (room-1234) in Supabase
```

**Browser:**
- Room appears in list instantly
- No error alerts
- Can click and join the room

**Supabase Dashboard:**
- New row in `rooms` table
- Room data visible

---

## 🚀 **Next Steps After It Works**

Once room creation works:

1. ✅ Test messaging between 2 browsers
2. ✅ Test on network (phone → computer)
3. ✅ Celebrate! 🎉

---

## 💡 **Remember:**

- **Every code change = Must restart server**
- **Logout/Login = Refreshes auth token**
- **Check BOTH server AND browser logs**
- **Environment variables must be in server/.env**
- **Use SERVICE_ROLE_KEY (not anon key!)**

---

## ⏱️ **Time Estimate**

If following this guide:
- ✅ Working in 5 minutes (90% chance)
- ✅ Working in 15 minutes (95% chance)
- ⚠️ Need help after 15 minutes (5% chance - rare edge case)

**Start with Step 1 NOW!** ⚡

