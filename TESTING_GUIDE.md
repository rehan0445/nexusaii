# 🧪 NEXUS APP - TESTING GUIDE

## ✅ Servers Running:
- **Backend:** http://localhost:8002 ✅
- **Frontend:** http://localhost:3000 ✅

---

## 🖥️ TEST 1: Computer Access (localhost)

### Open in Browser:
http://localhost:3000

### Test These Features:

#### 1. ✅ Registration/Login
- [ ] Click "Register" or "Login"
- [ ] Create new account or login
- [ ] Should work without CSRF errors

#### 2. ✅ DarkRoom (Test apiFetch fix)
- [ ] Go to "Arena" → "Dark Room" tab
- [ ] Accept disclaimer
- [ ] Set an alias
- [ ] Click "+ Create Group"
- [ ] Enter group name
- [ ] Click "Create"
- [ ] **EXPECTED:** Group creates successfully (NO "apiFetch is not defined" error)
- [ ] **If error:** Check browser console (F12) and tell me the error

#### 3. ✅ Confessions
- [ ] Go to "Campus" tab
- [ ] Click "Create Confession"
- [ ] Write something and submit
- [ ] Should post successfully

#### 4. ✅ AI Chat (Images Test)
- [ ] Go to "Companion" tab
- [ ] Click on any AI character
- [ ] **CHECK:** Does character image load?
- [ ] Start a chat
- [ ] Send a message

---

## 📱 TEST 2: Phone Access (Network)

### On Your Phone (Same WiFi):

1. **Open Browser on Phone**
2. **Go to:** http://192.168.1.36:3000

### Test These:

#### 1. ✅ Basic Access
- [ ] Does the site load?
- [ ] Can you see the homepage?
- [ ] **If NOT loading:** Check if phone is on same WiFi

#### 2. ✅ Login from Phone
- [ ] Try to login with same account
- [ ] Should work

#### 3. ✅ Create Something
- [ ] Try creating a confession or darkroom group
- [ ] Should work without CORS errors

---

## 🖼️ TEST 3: Images Loading

### Check These Places:

1. **Character Images:**
   - Go to Companion tab
   - Do AI character avatars load?
   - **If NO:** Need to run `FIX_SUPABASE_STORAGE.sql`

2. **Profile Images:**
   - Click on Profile
   - Does profile picture load?
   - **If NO:** Storage policies not set

3. **Announcement Images:**
   - Go to Campus → Announcements
   - Any images there?

### If Images DON'T Load:

**Quick Fix:**
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/dswuotsdaltsomyqqykn
2. Click **"Storage"** in left sidebar
3. For each bucket (nexus-profile-images, nexus-character-image, nexus-announcements):
   - Click the bucket name
   - Click "Settings" tab
   - Toggle **"Public bucket"** to ON
   - Click "Save"

**OR run the SQL:**
- Go to SQL Editor
- Run `FIX_SUPABASE_STORAGE.sql`

---

## 🔴 COMMON ERRORS & FIXES:

### Error: "apiFetch is not defined"
- **Status:** ✅ Should be FIXED
- **If still seeing:** Clear browser cache (Ctrl+Shift+Delete) and hard refresh (Ctrl+F5)

### Error: "CORS policy blocked"
- **Status:** ✅ Should be FIXED
- **If on phone:** Make sure you're using http://192.168.1.36:3000 (not localhost)
- **If still error:** Check server/.env has your IP in CORS_ALLOWLIST

### Error: Images not loading (broken image icon)
- **Status:** ⚠️ Needs SQL fix
- **Fix:** Run `FIX_SUPABASE_STORAGE.sql` in Supabase
- **OR:** Make buckets public in Supabase Storage settings

### Error: "Failed to fetch" or "Network error"
- **Check:** Is backend running? (http://localhost:8002)
- **Check:** Client/.env has correct VITE_API_URL

---

## 🎯 SUCCESS CRITERIA:

You'll know everything works when:

✅ Can access on computer (localhost:3000)  
✅ Can access on phone (192.168.1.36:3000)  
✅ Can create darkroom groups (no apiFetch error)  
✅ Images load everywhere  
✅ Real-time chat works  
✅ Socket.io connects (check for "🔌 Connected" in console)  

---

## 📊 WHAT TO REPORT:

After testing, tell me:

1. **Computer Test:**
   - [ ] Works / Doesn't work
   - [ ] Any errors?

2. **Phone Test:**
   - [ ] Can access / Can't access
   - [ ] Any CORS errors?

3. **Images:**
   - [ ] Load correctly / Don't load
   - [ ] Which images broken?

4. **DarkRoom:**
   - [ ] Can create groups / Can't create
   - [ ] apiFetch error / Other error

5. **Any Console Errors:**
   - Press F12 → Console tab
   - Copy any red errors

---

## 🚀 READY TO TEST!

Start with Computer Test first, then try Phone Test.

Take your time and report back what works and what doesn't! 💪

