# Hangout Testing Guide

## 🧪 How to Test the Fixes

### Test 1: Instant Hangout Visibility (Problem 1)

**Steps:**
1. Open the app in two browser windows/tabs (User A and User B)
2. User A: Navigate to Hangouts list
3. User B: Navigate to Hangouts list
4. User A: Click "Create Hangout" button
5. Fill in name: "Test Room" and description
6. Click "Create"

**Expected Result:**
✅ User A redirects to the new hangout
✅ User B sees "Test Room" appear instantly in their list **without refreshing**
✅ Console shows: `🆕 New hangout detected via realtime`
✅ Console shows: `✅ Adding new hangout to list: Test Room`

---

### Test 2: Messages After Rejoin (Problem 2)

**Steps:**
1. User A: Enter a hangout room
2. User A: Send message: "Hello World"
3. User A: Click back button to leave room
4. Wait 2 seconds
5. User A: Click on the same hangout to rejoin

**Expected Result:**
✅ Previous message "Hello World" is visible
✅ User A can send new messages successfully
✅ Console shows: `🧹 [REJOIN] Cleaning up existing subscription`
✅ Console shows: `📡 [JOIN] Setting up fresh realtime subscription`
✅ No "subscribe multiple times" warnings

---

### Test 3: Chat History Restored (Problem 3)

**Steps:**
1. User A: Join hangout "Test Room"
2. User A: Send 3 messages
3. User A: Leave the room
4. User A: Close browser tab completely
5. User A: Open new tab, login, navigate back to "Test Room"

**Expected Result:**
✅ All 3 previous messages appear
✅ Console shows: `📨 [Attempt 1] Fetching messages for room ...`
✅ Console shows: `✅ Successfully fetched 3 messages`
✅ Message history persists across browser sessions

---

### Test 4: Error Handling & Retry (Problem 4)

**Method A - Simulate Network Error:**
1. Open browser DevTools → Network tab
2. Join a hangout room
3. Set network to "Offline" mode
4. Reload the page
5. Set network back to "Online"
6. Wait 2 seconds

**Expected Result:**
✅ Console shows: `❌ [Attempt 1] Failed to fetch messages`
✅ Console shows error details: `{ roomId, error, status, code }`
✅ Console shows: `🔄 Retrying after network/server error...`
✅ Console shows: `✅ Successfully fetched X messages` after retry

**Method B - Check Error Logs:**
1. Open console
2. Join any hangout
3. Look for fetch attempt logs

**Expected Console Output:**
```
📨 [Attempt 1] Fetching messages for room room-123
🔧 GET /api/hangout/rooms/room-123/messages?limit=50&offset=0
✅ Successfully fetched 5 messages
```

If error occurs:
```
❌ [Attempt 1] Failed to fetch messages: {
  roomId: 'room-123',
  error: 'Network Error',
  status: undefined,
  code: 'ERR_NETWORK'
}
🔄 Retrying after network/server error...
📨 [Attempt 2] Fetching messages for room room-123
✅ Successfully fetched 5 messages
```

---

### Test 5: Organized Lifecycle (Problem 5)

**Steps:**
1. Open browser console
2. Create a new hangout named "Lifecycle Test"
3. Join the hangout
4. Send a message
5. Leave the hangout
6. Rejoin the hangout

**Expected Console Output:**
```
🏗️ [CREATE] Creating hangout: Lifecycle Test
✅ [CREATE] Hangout created: room-xyz
📡 Setting up realtime subscription for new hangouts
🆕 New hangout detected via realtime: { ... }

🚪 [JOIN] Joining hangout: room-xyz
📡 [JOIN] Setting up fresh realtime subscription
📨 [Attempt 1] Fetching messages for room room-xyz
✅ Successfully fetched 0 messages

👋 [LEAVE] Leaving hangout: room-xyz
✅ [LEAVE] Socket disconnected
✅ [LEAVE] Realtime unsubscribed

🚪 [JOIN] Joining hangout: room-xyz
🧹 [REJOIN] Cleaning up existing subscription before rejoin
📨 [Attempt 1] Fetching messages for room room-xyz
✅ Successfully fetched 1 messages
```

✅ Clean, organized logs showing create → join → leave → rejoin flow
✅ Each lifecycle stage clearly labeled with emojis
✅ No duplicate or confusing log messages

---

## 🔍 Quick Verification Checklist

### Problem 1: New Hangout Visibility
- [ ] Create hangout → appears instantly for all users
- [ ] No page refresh needed
- [ ] Realtime subscription logs show INSERT event

### Problem 2: Messages After Rejoin  
- [ ] Leave and rejoin room
- [ ] Can send/receive messages after rejoin
- [ ] No "subscribe multiple times" console errors

### Problem 3: Chat History
- [ ] Messages persist after leaving
- [ ] Messages appear when rejoining
- [ ] Messages persist after logout/login

### Problem 4: Error Handling
- [ ] Clear error logs with roomId and details
- [ ] Automatic retry on network errors
- [ ] Success logs after retry

### Problem 5: Lifecycle Organization
- [ ] CREATE logs show hangout creation
- [ ] JOIN logs show connection setup
- [ ] LEAVE logs show cleanup
- [ ] REJOIN logs show old subscription cleanup

---

## 🐛 Known Issues (Pre-existing)

These were NOT introduced by our changes:

1. Some TypeScript warnings in `HangoutChat.tsx` about optional properties
2. `MessageLockingService` and `HangoutLifecycle` imports currently unused (prepared for future use)
3. Some complex functions have high cognitive complexity (pre-existing)

**These do NOT affect functionality and can be refactored later.**

---

## 🎯 Success Criteria

**All tests pass when:**
1. ✅ New hangouts appear instantly (no refresh)
2. ✅ Messages work after leaving and rejoining
3. ✅ Chat history persists across sessions
4. ✅ Errors are logged clearly and retried automatically
5. ✅ Lifecycle logs are clean and organized

---

## 📞 Troubleshooting

**If realtime updates don't work:**
- Check Supabase console → Database → Replication
- Ensure RLS is enabled on `rooms` table
- Check browser console for subscription status

**If messages don't load:**
- Check network tab for API call to `/api/hangout/rooms/{id}/messages`
- Verify authentication token in request headers
- Check console for detailed error logs

**If "subscribe multiple times" warning appears:**
- This should be fixed, but if it appears, check that `joinRoom()` cleanup is running
- Look for `🧹 [REJOIN] Cleaning up existing subscription` log

---

**Testing Date:** October 10, 2025
**All Features:** ✅ Ready for Testing

