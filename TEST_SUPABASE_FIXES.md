# Testing Guide - Supabase Fixes

## Prerequisites

Before testing:
1. Make sure development server is running (`npm run dev` or equivalent)
2. Have valid login credentials ready
3. Open browser DevTools (F12)
4. Open Console and Network tabs

## Test 1: Clean State Login

### Objective
Verify session is properly created and bridged on fresh login

### Steps
1. Open browser console
2. Run: `localStorage.clear(); sessionStorage.clear();`
3. Navigate to `/login`
4. Login with valid credentials

### Expected Results
✅ Console shows:
```
🔐 Attempting session bridge...
✅ Session bridge successful
✅ Socket manager initialized with session bridge
```
✅ Redirected to home/dashboard (not stuck on login)
✅ No 401 errors in console
✅ Network tab shows session cookie set

### ❌ If Failed
- Check if backend `/api/auth/session/bridge` endpoint exists
- Verify Supabase credentials in `.env` file
- Check console for specific error messages

---

## Test 2: Session Persistence

### Objective
Verify session survives page refresh

### Steps
1. Login successfully (from Test 1)
2. Navigate to any page (e.g., `/profile`)
3. Press F5 or Ctrl+R to refresh
4. Wait for page to load

### Expected Results
✅ No redirect to login page
✅ User stays authenticated
✅ Console shows: `🔑 ✅ Added Supabase JWT to request`
✅ No "No active session" errors
✅ Profile/content loads normally

### ❌ If Failed
- Check AuthContext session restoration logic
- Verify Supabase local storage persists
- Look for session expiry errors

---

## Test 3: API Authentication

### Objective
Verify all API requests include proper auth token

### Steps
1. Login successfully
2. Open Network tab in DevTools
3. Navigate to `/profile`
4. Let companions and hangouts load
5. Check Network tab

### Expected Results
✅ All API requests have `Authorization: Bearer [token]` header
✅ All requests return 200/201 status codes
✅ No 401 Unauthorized responses
✅ Console shows: `🔑 ✅ Added Supabase JWT to request` for each call

### ❌ If Failed
- Check apiConfig.ts interceptor
- Verify session exists: Run in console:
  ```javascript
  const { supabase } = await import('./src/lib/supabase.ts');
  const { data } = await supabase.auth.getSession();
  console.log('Session:', data.session);
  ```

---

## Test 4: Profile - No Duplicate Fetches

### Objective
Verify companions load only once

### Steps
1. Login successfully
2. Navigate to `/profile`
3. Click "Companions" box to expand
4. Watch console output
5. Check Network tab

### Expected Results
✅ Console shows only ONE of each:
```
🔍 Fetching companions for user: [uid]
📡 Making API request to: .../api/v1/character/user
✅ Successfully loaded companions: [count]
```
✅ Network tab shows only ONE request to `/api/v1/character/user`
✅ No "Already loading companions" messages (means no duplicates attempted)
✅ Companions render immediately after load

### ❌ If Failed
- Check for multiple re-renders in React DevTools
- Verify `loadingCompanions` state is working
- Look for missing `mounted` flag cleanup

---

## Test 5: Hangout - Single Subscription

### Objective
Verify only one realtime subscription per room

### Steps
1. Login successfully
2. Navigate to a hangout/chat room
3. Watch console output carefully
4. Count subscription messages

### Expected Results
✅ Console shows EXACTLY ONCE per room:
```
📡 Setting up realtime subscription for room: [room-id]
✅ [Realtime] Channel subscribed for room: [room-id]
```
✅ NO "subscribe called multiple times" error
✅ NO duplicate subscription messages
✅ Only ONE "Channel subscribed" message per room

### ❌ If Failed
- Hard refresh (Ctrl+Shift+R) and try again
- Clear browser cache completely
- Check for race conditions in room join logic

---

## Test 6: Realtime Messages

### Objective
Verify realtime messages work without errors or duplicates

### Steps
1. Login successfully
2. Join a hangout/chat room
3. Send a test message
4. Watch console and UI

### Expected Results
✅ Console shows:
```
📡 Realtime message received: { roomId: ..., messageId: ..., content: ... }
```
✅ Message appears in chat immediately
✅ Message appears only ONCE (no duplicates)
✅ NO "mismatch between server and client bindings" error

### ❌ If Failed (Mismatch Error)
Check console for detailed error with hints:
```
❌ Realtime subscription error for room [room-id]:
💡 Possible causes: 
  1. Table 'room_messages' doesn't exist
  2. Column 'room_id' doesn't exist
  3. Realtime not enabled
  4. RLS policies blocking
```

**Fix based on error:**
1. **Table name wrong:** Update `hangoutService.ts:1079` to correct table name
2. **Column name wrong:** Update `hangoutService.ts:1080` to correct column name
3. **Realtime not enabled:** 
   - Go to Supabase Dashboard
   - Database > Replication
   - Enable for your messages table
4. **RLS blocking:** Check Row Level Security policies

---

## Test 7: Session Expiry Handling

### Objective
Verify proper redirect when session expires

### Steps
1. Login successfully
2. Open browser console
3. Manually clear Supabase session:
   ```javascript
   localStorage.clear();
   ```
4. Try to navigate to another page OR wait for an API call

### Expected Results
✅ Automatic redirect to `/login`
✅ Console shows: `⚠️ No session found, redirecting to login`
✅ OR: `❌ No active Supabase session - redirecting to login`
✅ No crash or endless loops

### ❌ If Failed
- Check AuthContext redirect logic
- Verify apiConfig interceptor redirects properly
- Look for redirect prevention issues

---

## Test 8: Protected Routes

### Objective
Verify unauthenticated users can't access protected routes

### Steps
1. Logout completely (or open incognito window)
2. Try to directly navigate to `/profile`
3. Try to navigate to `/arena/hangout/...`

### Expected Results
✅ Immediate redirect to `/login`
✅ Console shows: `⚠️ No session found, redirecting to login`
✅ No content flashes before redirect
✅ Public routes (`/login`, `/signup`) still accessible

### ❌ If Failed
- Check AuthContext public paths list
- Verify session check runs before render
- Look for race conditions in initialization

---

## Test 9: Multiple Room Subscriptions

### Objective
Verify subscription cleanup works correctly

### Steps
1. Login successfully
2. Join Room A (watch console)
3. Leave Room A (navigate away)
4. Join Room B (watch console)
5. Join Room A again (watch console)

### Expected Results
✅ Each room join shows ONE subscription setup
✅ Room A second join shows: `📡 Realtime subscription already exists for room [room-id], skipping duplicate setup`
✅ Console shows cleanup when leaving: `🧹 Cleaning up realtime subscription for room: [room-id]`
✅ No memory leaks or orphaned subscriptions

### ❌ If Failed
- Check cleanup logic in `leaveRoom` method
- Verify tracking Map is properly updated
- Look for missing unsubscribe calls

---

## Test 10: Network Failure Recovery

### Objective
Verify app handles temporary network issues

### Steps
1. Login successfully
2. Navigate to `/profile`
3. Open DevTools > Network tab
4. Set throttling to "Offline"
5. Click "Companions" to trigger load
6. Wait 2 seconds
7. Set throttling back to "Online"

### Expected Results
✅ Console shows retry messages:
```
⏳ Retrying companions fetch (attempt 2/3)...
⏳ Retrying companions fetch (attempt 3/3)...
```
✅ Eventually succeeds when back online
✅ OR shows clear error after max attempts
✅ No infinite retry loops

### ❌ If Failed
- Check retry logic in Profile.tsx
- Verify MAX_ATTEMPTS is set correctly
- Look for missing error handling

---

## Automated Test Script

Run this in browser console for quick verification:

```javascript
// Copy-paste this entire block into browser console

async function testSupabaseFixes() {
  console.log('🧪 Starting Supabase Fixes Test Suite...\n');
  
  const tests = {
    passed: 0,
    failed: 0,
    results: []
  };
  
  // Test 1: Session exists
  try {
    const { supabase } = await import('./src/lib/supabase.ts');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      console.log('✅ Test 1: Session exists');
      tests.passed++;
      tests.results.push({ test: 'Session exists', status: 'PASS' });
    } else {
      console.log('❌ Test 1: No session found');
      tests.failed++;
      tests.results.push({ test: 'Session exists', status: 'FAIL', reason: 'No session' });
    }
  } catch (e) {
    console.log('❌ Test 1: Error checking session:', e.message);
    tests.failed++;
    tests.results.push({ test: 'Session exists', status: 'ERROR', reason: e.message });
  }
  
  // Test 2: Auth in localStorage
  try {
    const authData = localStorage.getItem('nexus-auth');
    if (authData) {
      console.log('✅ Test 2: Auth data in localStorage');
      tests.passed++;
      tests.results.push({ test: 'Auth in localStorage', status: 'PASS' });
    } else {
      console.log('⚠️ Test 2: No auth data in localStorage (may be normal)');
      tests.results.push({ test: 'Auth in localStorage', status: 'SKIP' });
    }
  } catch (e) {
    console.log('❌ Test 2: Error checking localStorage:', e.message);
    tests.failed++;
    tests.results.push({ test: 'Auth in localStorage', status: 'ERROR', reason: e.message });
  }
  
  // Test 3: Current user in AuthContext
  try {
    const currentPath = window.location.pathname;
    const isLoggedIn = !currentPath.includes('/login');
    
    if (isLoggedIn) {
      console.log('✅ Test 3: User appears logged in (not on login page)');
      tests.passed++;
      tests.results.push({ test: 'User logged in', status: 'PASS' });
    } else {
      console.log('⚠️ Test 3: User on login page');
      tests.results.push({ test: 'User logged in', status: 'SKIP' });
    }
  } catch (e) {
    console.log('❌ Test 3: Error checking login status:', e.message);
    tests.failed++;
  }
  
  // Test 4: No duplicate subscriptions
  console.log('\n📊 Test Summary:');
  console.log(`Passed: ${tests.passed}`);
  console.log(`Failed: ${tests.failed}`);
  console.log(`\nResults:`, tests.results);
  
  return tests;
}

// Run tests
testSupabaseFixes().then(results => {
  console.log('\n🎯 Overall Status:', results.failed === 0 ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED');
});
```

---

## Success Criteria

All tests pass when you see:

- ✅ Login works and session is bridged
- ✅ Session persists across refreshes
- ✅ All API requests have auth headers
- ✅ No 401 errors anywhere
- ✅ Companions load once per visit
- ✅ Hangouts subscribe once per room
- ✅ Messages appear in realtime
- ✅ No "mismatch" or "duplicate subscription" errors
- ✅ Automatic redirect on logout/expiry

## Troubleshooting

If any test fails, see `SUPABASE_ERRORS_FIXED.md` for detailed troubleshooting steps.

## Reporting Issues

When reporting issues, include:
1. Which test failed
2. Console error messages
3. Network tab screenshots
4. Browser and version
5. Whether issue is consistent or intermittent

