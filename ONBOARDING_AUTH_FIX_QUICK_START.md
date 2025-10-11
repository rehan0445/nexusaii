# 🚀 Onboarding Auth Fix - Quick Start Guide

## 📋 What Was Fixed?

**Problem**: Users got "Access token required" error when completing onboarding
**Solution**: Now sends Supabase access token in Authorization header to backend

---

## ✅ What Changed?

### **File Modified**: `client/src/pages/Onboarding.tsx`

#### Before (Broken):
```typescript
// ❌ No token sent
const response = await fetch('/api/v1/chat/create-profile', {
  method: 'POST',
  body: apiFormData,
  credentials: 'include'
});
```

#### After (Fixed):
```typescript
// ✅ Get session and token first
const { data: { session } } = await supabase.auth.getSession();
const accessToken = session.access_token;

// ✅ Send token in Authorization header
const response = await fetch('/api/v1/chat/create-profile', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`, // THE FIX
  },
  body: apiFormData,
  credentials: 'include'
});
```

---

## 🧪 How to Test

### **Option 1: Quick Browser Test**

1. **Start your dev servers**:
   ```bash
   # Terminal 1 - Frontend
   cd client
   npm run dev

   # Terminal 2 - Backend
   cd server
   npm start
   ```

2. **Test the flow**:
   - Go to `http://localhost:5173/signup`
   - Create a new account
   - Complete all 5 onboarding steps
   - Click "Complete"
   - ✅ Should create profile successfully

3. **Check console logs** (F12):
   ```
   ✅ Session verified, access token obtained
   👤 User ID: xxx-xxx-xxx
   📧 Email: user@example.com
   📤 Sending profile creation request with auth token...
   ✅ Profile created successfully!
   ```

### **Option 2: Use Test HTML File**

1. **Configure the test file**:
   ```bash
   # Edit test-onboarding-auth-fix.html
   # Replace with your actual values:
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   const API_URL = 'http://localhost:5000';
   ```

2. **Open in browser**:
   ```bash
   # Open test-onboarding-auth-fix.html in Chrome/Edge
   ```

3. **Run tests**:
   - Click "🔐 Login" or "✍️ Signup"
   - Click "🔍 Check Supabase Session"
   - Click "✅ Test Profile Creation (With Fix)"
   - Check logs panel

---

## 🔍 Verify Session Persistence

### **Test 1: Check Session on Load**
Open browser console (F12) when on `/onboarding/user-details`:

```javascript
// Run in console
const { data: { session } } = await supabase.auth.getSession();
console.log('Session exists:', !!session);
console.log('Access token:', session?.access_token?.substring(0, 30));
```

**Expected output**:
```
Session exists: true
Access token: eyJhbGciOiJIUzI1NiIsInR5cCI...
```

### **Test 2: Check Backend Receives Token**
Open Network tab (F12) when submitting onboarding:

1. Click "Complete" button
2. Find `/api/v1/chat/create-profile` request
3. Check Headers tab
4. ✅ Should see: `Authorization: Bearer eyJhbGc...`

---

## 🐛 Troubleshooting

### **Issue 1: "Session expired. Please log in again."**

**Cause**: Session not found or expired
**Fix**:
```typescript
// Clear old sessions
localStorage.clear();
// Log in again
```

### **Issue 2: "Access token required" still appears**

**Cause**: Frontend not updated or cache issue
**Fix**:
```bash
# Clear browser cache
# Restart dev servers
cd client && npm run dev
cd server && npm start

# Hard refresh browser (Ctrl+Shift+R)
```

### **Issue 3: Console shows "No valid session found"**

**Cause**: User not authenticated
**Fix**:
1. Verify you're logged in
2. Check AuthContext loaded user
3. Try logging out and back in

---

## 📊 Console Log Reference

### **Good Logs (Success)**
```
✅ Current user loaded in onboarding: user@example.com
🔍 Onboarding session check:
  - Session exists: true
  - Access token exists: true
  - User ID: 550e8400-e29b-41d4-a716-446655440000
  - Error: null
🔍 Verifying session before profile creation...
✅ Session verified, access token obtained
👤 User ID: 550e8400-e29b-41d4-a716-446655440000
📧 Email: user@example.com
📤 Sending profile creation request with auth token...
✅ Profile created successfully!
```

### **Bad Logs (Error)**
```
❌ WARNING: No Supabase session found on onboarding load!
❌ No valid session found: [error details]
❌ Profile creation failed: 401 {"success":false,"message":"Access token required"}
```

---

## 🔐 Security Notes

### **Token Handling**
- ✅ Access tokens are sent via HTTPS only
- ✅ Tokens are validated on backend via Supabase Admin API
- ✅ Sessions persist in localStorage with auto-refresh
- ✅ Expired sessions redirect to login

### **Backend Validation**
The backend accepts tokens from:
1. `Authorization: Bearer <token>` header (Supabase JWT) ← **NEW FIX**
2. `nxa_access` cookie (bridged session)
3. `x-user-id` header (dev mode only)

---

## 📝 Complete Test Flow

```bash
# 1. Start servers
npm run dev        # Frontend on :5173
npm run start:server  # Backend on :5000

# 2. Test signup → onboarding flow
# Navigate to: http://localhost:5173/signup

# 3. Fill signup form:
Email: test@example.com
Password: password123
Name: Test User

# 4. Complete onboarding (5 steps):
Step 1: Username (nickname)
Step 2: Birthdate
Step 3: Gender
Step 4: Profile picture (optional)
Step 5: Banner image (optional)

# 5. Click "Complete"
# ✅ Should succeed and redirect to /arena/hangout

# 6. Verify in backend logs:
# ✅ Should see: "Profile created successfully!"
```

---

## 🎯 Success Criteria

- [x] No "Access token required" errors
- [x] Profile creation succeeds on first try
- [x] Session persists across page reloads
- [x] Console shows session verification logs
- [x] Backend receives Authorization header
- [x] User redirected to /arena/hangout after completion

---

## 📚 Related Documentation

- **Full Fix Details**: `ONBOARDING_AUTH_FIX_COMPLETE.md`
- **Test File**: `test-onboarding-auth-fix.html`
- **Source File**: `client/src/pages/Onboarding.tsx`
- **Backend Middleware**: `server/middleware/authMiddleware.js`

---

## 🆘 Need Help?

### Check These First:
1. ✅ Environment variables set? (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
2. ✅ Both servers running? (frontend on :5173, backend on :5000)
3. ✅ Cleared browser cache?
4. ✅ Logged in successfully?

### Debug Commands:
```javascript
// In browser console on onboarding page:
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('Token:', session?.access_token);
console.log('User:', session?.user);
```

---

**Status**: ✅ **FIX DEPLOYED**  
**Tested**: ✅ Yes  
**Ready for Production**: ✅ Yes

