# Quick Fix Reference - Supabase Errors

## What Was Fixed

### Problem 1: Duplicate Subscriptions ✅
**Symptom:** "subscribe called multiple times" error in console

**Root Cause:** Channel tracking Map check wasn't sufficient

**Fix Location:** `client/src/services/hangoutService.ts:1043-1064`

**What Changed:**
- Strengthened duplicate check (checks Map AND channel instance)
- Properly removes old channels before creating new ones
- Cleans up tracking Map when subscriptions fail

### Problem 2: Realtime Config Mismatch ✅
**Symptom:** "mismatch between server and client bindings for postgres changes"

**Root Cause:** Table/column names might not match actual Supabase schema

**Fix Location:** `client/src/services/hangoutService.ts:1116-1122`

**What Changed:**
- Added detailed error messages with 4 possible causes
- Added inline comments showing where to update table/column names
- Automatic cleanup of failed subscriptions

**Action Required (if error persists):**
1. Check console error message
2. Update table name at line 1079: `table: 'room_messages'` → `table: 'your_actual_table'`
3. Update column at line 1080: `room_id` → `your_actual_column`
4. Enable Realtime in Supabase Dashboard > Database > Replication

### Problem 3: No Active Session ✅
**Symptom:** All API calls fail with 401 Unauthorized, "No active Supabase session" warnings

**Root Cause:** Session not restored on app mount, no redirect when session missing

**Fix Locations:**
- `client/src/contexts/AuthContext.tsx:98-122` (session init)
- `client/src/contexts/AuthContext.tsx:180-191` (redirect on logout)
- `client/src/lib/apiConfig.ts:38-101` (request interceptor)
- `client/src/pages/Profile.tsx:148-238` (session guards)
- `client/src/pages/Profile.tsx:240-294` (session guards)

**What Changed:**
- Session properly restored before app renders
- Auto-redirect to `/login` when no session
- All API requests verify session exists first
- Public endpoints whitelisted (login, signup, etc.)
- Duplicate fetch prevention in Profile

## Quick Test Checklist

```bash
# 1. Clear browser state
localStorage.clear()

# 2. Login
# → Should see: "✅ Session bridge successful"

# 3. Refresh page
# → Should stay logged in, no 401 errors

# 4. Open Profile
# → Companions load once, no duplicates

# 5. Open Hangout room
# → One subscription message per room
# → No "subscribe called multiple times"
# → Either success OR clear error with hints

# 6. Check Network tab
# → All requests have "Authorization: Bearer ..." header
# → No 401 responses

# 7. Test logout
# → Auto-redirect to /login
```

## Console Messages to Look For

### ✅ Success Messages:
```
🔐 Attempting session bridge...
✅ Session bridge successful
✅ Socket manager initialized with session bridge
📡 Setting up realtime subscription for room: [room-id]
✅ [Realtime] Channel subscribed for room: [room-id]
🔑 ✅ Added Supabase JWT to request: GET /api/...
✅ Successfully loaded companions: [count]
✅ Successfully loaded hangouts: [count]
```

### ❌ Error Messages (with solutions):
```
❌ Realtime subscription error for room [room-id]:
💡 Possible causes: 
  1. Table 'room_messages' doesn't exist → Update line 1079
  2. Column 'room_id' doesn't exist → Update line 1080  
  3. Realtime not enabled → Enable in Supabase Dashboard
  4. RLS policies blocking → Check your RLS rules

❌ No active Supabase session - redirecting to login
→ This is normal if you're not logged in

❌ No active session - cannot fetch companions
→ Login again or check session bridge
```

## Files Modified

1. `client/src/services/hangoutService.ts` - Realtime subscriptions
2. `client/src/contexts/AuthContext.tsx` - Session restoration
3. `client/src/lib/apiConfig.ts` - Auth interceptor
4. `client/src/pages/Profile.tsx` - Session guards

## Rollback Instructions

If anything breaks:

```bash
# Restore from git
git checkout HEAD -- client/src/services/hangoutService.ts
git checkout HEAD -- client/src/contexts/AuthContext.tsx
git checkout HEAD -- client/src/lib/apiConfig.ts
git checkout HEAD -- client/src/pages/Profile.tsx
```

## Common Issues & Solutions

### Still getting 401 errors?
1. Check if you're logged in: `supabase.auth.getSession()`
2. Verify session bridge endpoint works: Test `/api/auth/session/bridge`
3. Check Supabase project URL in `.env`

### Still getting duplicate subscriptions?
1. Check console for existing subscription messages
2. Clear all local storage and cookies
3. Hard refresh (Ctrl+Shift+R)

### Still getting realtime mismatch?
1. Read the detailed error message in console
2. Check actual table name in Supabase Dashboard
3. Update line 1079 with correct table name
4. Update line 1080 with correct column name
5. Enable Realtime in Dashboard

### Companions loading multiple times?
1. Check for "Already loading companions" in console
2. If not present, check React DevTools for re-renders
3. Verify `useEffect` dependencies are correct

## Contact Points

If you need to modify the behavior:

**Change public routes:** 
- `AuthContext.tsx:108` and `:186`
- `apiConfig.ts:39-46`

**Change realtime table/column:**
- `hangoutService.ts:1079` (table name)
- `hangoutService.ts:1080` (column name)

**Adjust retry logic:**
- `Profile.tsx:151` (MAX_ATTEMPTS)
- `Profile.tsx:210` (retry delay calculation)

**Modify session check:**
- `AuthContext.tsx:68-96` (checkSession function)

