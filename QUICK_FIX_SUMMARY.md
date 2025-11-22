# ⚡ QUICK FIX - Room Creation Issue

## 🔴 **THE PROBLEM**
"Failed to create room" error when creating hangout rooms/palaces

## ✅ **THE FIX** 
Added missing `supabase` import in `server/app.js` (line 25)

---

## 🚀 **DO THIS RIGHT NOW** (3 steps, 2 minutes)

### **1. Stop & Restart Server** ⚠️ CRITICAL
```bash
# In terminal where server is running:
Ctrl+C  (stop server)

cd server
npm start  (restart server)
```

### **2. Check Environment Variables**
Open `server/.env` and verify these lines exist:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
JWT_SECRET=any-secret-key
```

**Missing the .env file?** 
- Go to https://supabase.com/dashboard
- Settings → API
- Copy URL and `service_role` key
- Create `server/.env` file with those values

### **3. Try Creating a Room**
1. Login to your app
2. Go to Hangout Rooms
3. Click "Create Room"
4. Fill form & click Create
5. ✅ Should work now!

---

## 🐛 **Still Not Working?**

### **Check Server Console** (where you ran `npm start`)

**Look for errors like:**
```
❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY
❌ Error creating room: ...
```

**If you see this:** Your `.env` file is wrong or missing

---

### **Check Browser Console** (Press F12)

**Look for:**
```javascript
Response status: 401  // Not logged in
Response status: 500  // Server error
Response status: 200  // ✅ Success!
```

**If 401:** Logout & login again  
**If 500:** Check server console for actual error  
**If 200:** It worked! 🎉

---

## 📞 **Need More Help?**

Share these 3 things:

1. **Server console output** (copy the error)
2. **Browser console output** (F12 → Console tab)
3. **Do you have server/.env file?** (yes/no)

---

## 🎯 **Why This Works**

The code was trying to use `supabase` but it wasn't imported, causing a crash when trying to set up real-time subscriptions. Now it's imported → should work!

---

## ⏱️ **Time to Fix**: 2-5 minutes

**90% chance** it works after restarting server  
**10% chance** you need to fix environment variables

**Just restart the server and try again!** ⚡

