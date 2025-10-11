# 🔐 NEXUS AUTHENTICATION & FLOW - COMPLETE GUIDE

## ✅ AUTH DATA STORAGE - Your Question Answered

### **Where Auth Data is Stored:**

#### 1. **Backend (Server-Side):**
- **JWT Tokens:** Stored in HTTP-only cookies
  - `nxa_access` - Access token (15 min expiry)
  - `nxa_refresh` - Refresh token (30 days expiry)
- **Sessions:** Stored in Supabase `sessions` table
- **Why HTTP-only cookies?** JavaScript can't access them = Better security (prevents XSS attacks)

#### 2. **Database (Supabase):**
- **User Authentication:** `users` table
  - id, email, password_hash, phone, name
- **User Profiles:** `userProfileData` table
  - profile info, images, bio, interests
- **Sessions:** `sessions` table
  - Active login sessions, IP, user agent
- **Refresh Tokens:** `refresh_tokens` table
  - Long-lived tokens for session renewal

#### 3. **Frontend (Client-Side):**
- **Auth State:** React Context (in-memory only)
- **NOT in localStorage** - Only stored in memory for security
- **Onboarding Status:** `hasSeenOnboarding` in localStorage (not security-sensitive)

---

## 🚀 APP FLOW - FIXED!

### **NEW PROPER FLOW:**

```
┌─────────────────────────────────────────────────┐
│ 1. Open App (/)                                 │
│    ↓                                            │
│ 2. Check: Has user seen onboarding?            │
│    ├─ NO  → Show onboarding slides             │
│    └─ YES → Check if logged in                 │
│         ├─ Logged in  → Go to /arena/hangout   │
│         └─ Not logged in → Go to /login        │
└─────────────────────────────────────────────────┘

ONBOARDING FLOW:
/onboarding → /onboarding/companion → /onboarding/campus 
→ /onboarding/darkroom → /onboarding/hangout → /register

AFTER LOGIN/REGISTER:
→ /arena/hangout (Main Hub - Hangout Palaces)

BOTTOM NAVIGATION:
Arena | Campus | Companion | Profile
```

### **What Changed:**

#### ✅ **Before (BROKEN):**
- Opening app always showed onboarding
- After login, went to random pages
- Root (/) redirected to onboarding every time
- No way to skip onboarding for returning users

#### ✅ **After (FIXED):**
- First-time users see onboarding once
- Returning users skip directly to main app
- After login → Always go to `/arena/hangout`
- Root (/) now goes to main hub
- Onboarding status saved in localStorage

---

## 📱 APP SECTIONS - Where You Land

### **Main Hub: /arena/hangout**
- **Why here?** Most interactive feature
- Quick access to:
  - Hangout Palaces (public rooms)
  - Dark Room (anonymous chat)
  - Group Chats

### **Bottom Navigation:**
1. **Arena** (`/arena/*`) - Main social hub
   - Hangout Palaces
   - Dark Room
   - Groups
2. **Campus** (`/campus/*`) - College features
   - Confessions
   - Announcements
   - Lost & Found
3. **Companion** (`/companion`) - AI Chat
   - Pre-built characters
   - Create custom AI
4. **Profile** (`/profile`) - Your account
   - Settings
   - Activity
   - Stats

---

## 🔑 AUTHENTICATION METHODS

### **1. Email/Password (Gmail)**
```typescript
POST /api/auth/register/gmail
POST /api/auth/login/gmail
```
- Must be @gmail.com email
- Password min 6 characters
- Returns JWT in HTTP-only cookie

### **2. Phone Number (OTP)**
```typescript
POST /api/auth/send-verification
POST /api/auth/verify-phone
```
- 6-digit SMS code
- Phone stored in database
- Also returns JWT cookie

### **3. Google Sign-In (OAuth)**
```typescript
// Via Firebase SDK
doSignInWithGoogle()
```
- One-click sign-in
- Google account integration

---

## 🔐 HOW AUTHENTICATION WORKS

### **Registration Flow:**
```
1. User fills form (email/phone + password)
2. POST /api/auth/register/gmail
3. Backend:
   - Hash password (bcrypt)
   - Store in database
   - Create session
   - Generate JWT tokens
   - Set HTTP-only cookies
4. Frontend:
   - AuthContext detects cookie
   - Updates userLoggedin = true
   - Navigates to /arena/hangout
```

### **Login Flow:**
```
1. User enters credentials
2. POST /api/auth/login/gmail
3. Backend:
   - Verify password
   - Create session
   - Generate JWT
   - Set cookies
4. Frontend:
   - Context updates
   - Navigate to main app
```

### **Session Check (on page load):**
```
1. App loads → AuthContext checks
2. GET /api/auth/profile (with cookies)
3. Backend validates JWT
4. Returns user data if valid
5. Frontend shows logged-in state
```

---

## 🛡️ SECURITY FEATURES

### ✅ **Implemented:**
1. **HTTP-only Cookies** - JS can't steal tokens
2. **JWT with Expiry** - Tokens expire (15 min)
3. **Refresh Tokens** - Long-lived (30 days)
4. **CORS Protection** - Only allowed origins
5. **Rate Limiting** - Prevent brute force
6. **Password Hashing** - bcrypt
7. **CSRF Protection** - (disabled in dev, enabled in production)
8. **Session Tracking** - IP, user agent logged

---

## 🔧 FILES MODIFIED (Flow Fix)

### **Navigation:**
- `client/src/App.tsx` - Root now goes to /arena/hangout
- `client/src/pages/Login.tsx` - Navigate to /arena/hangout after login
- `client/src/pages/Register.tsx` - Navigate to /arena/hangout after register

### **Onboarding:**
- `client/src/pages/onboarding/IntroHangout.tsx` - Marks onboarding complete
- `client/src/pages/WelcomeScreen.tsx` - Smart routing based on state

### **Auth Context:**
- `client/src/contexts/AuthContext.tsx` - Manages auth state

---

## 🧪 TESTING THE FLOW

### **Test 1: New User (First Time)**
1. Clear browser data: `localStorage.clear()` in console
2. Open: http://localhost:3000
3. Should see: Onboarding slides
4. Complete onboarding → Register page
5. Register → Land on /arena/hangout ✅

### **Test 2: Returning User (Not Logged In)**
1. Logout
2. Close browser
3. Re-open: http://localhost:3000
4. Should see: Login page (skip onboarding) ✅

### **Test 3: Logged In User**
1. Login
2. Close browser
3. Re-open: http://localhost:3000
4. Should see: Main app /arena/hangout (skip everything) ✅

---

## 📝 KEY TAKEAWAYS

✅ **Auth uses Backend JWT** (not Firebase directly)  
✅ **Tokens in HTTP-only cookies** (secure)  
✅ **User data in Supabase** (PostgreSQL database)  
✅ **Onboarding shows once** (localStorage flag)  
✅ **Main landing: /arena/hangout** (not companion)  
✅ **Features require login** (JWT middleware)  

---

## 🚀 NEXT: RESTART FRONTEND

After these changes, restart your frontend:

```bash
# Stop current frontend (Ctrl+C)
cd client
npm run dev
```

Then test the new flow!

---

## 🆘 TROUBLESHOOTING

### "Still showing onboarding every time"
- Clear localStorage: Open console → `localStorage.clear()` → Refresh
- Check: IntroHangout.tsx has the localStorage.setItem code

### "Not redirecting after login"
- Check browser console for errors
- Verify cookies are being set: DevTools → Application → Cookies
- Check if backend is returning JWT

### "Features still not working"
- You MUST be logged in first!
- Check: DevTools → Application → Cookies → Should see `nxa_access`
- If no cookie → Login failed, check backend logs

---

**All fixed! Restart frontend and test!** 🎉

