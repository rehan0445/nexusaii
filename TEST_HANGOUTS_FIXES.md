# Quick Test Guide - Hangouts Fixes

## Prerequisites
1. Run the database migration first
2. Restart backend and frontend servers
3. Have two user accounts ready for testing

## 🧪 Test Scenarios

### Test 1: Room Creation & Join ID
**Objective**: Verify ginger-N naming and join ID generation

1. Login as User A
2. Navigate to Hangouts
3. Click the "+" (Create) button
4. Fill in room details (description, category)
5. Click "Create"
6. **Expected**: 
   - Room created successfully
   - Room named "ginger-1" (or next available number)
   - Join ID displayed in success message/response

### Test 2: Join by ID
**Objective**: Verify users can join rooms via join ID

1. Note the join ID from Test 1 (e.g., "ginger-1")
2. Logout and login as User B
3. Navigate to Hangouts
4. Click the Join button (LogIn icon, next to Create)
5. Enter the join ID: "ginger-1"
6. Click "Join"
7. **Expected**:
   - Modal closes
   - User navigates to the room
   - User can see room details
   - User appears in member list

### Test 3: Message Persistence
**Objective**: Verify messages survive refresh/logout

1. As User B in the room, send a message: "Test message 1"
2. Send another message: "Test message 2"
3. Refresh the page (F5)
4. **Expected**:
   - Both messages still visible
   - User not logged out
   - Can continue chatting

5. Logout and login again
6. Navigate back to the room
7. **Expected**:
   - Both messages still visible
   - Message history preserved

### Test 4: Bubble Skins
**Objective**: Verify bubble skins persist and sync

1. As User B, click Nexus button (sparkle icon)
2. Select "Chat Bubble Skins"
3. Choose a skin (e.g., "Aurora")
4. Send a message: "This should be aurora skin"
5. **Expected**:
   - Message displays with aurora skin
   
6. As User A (in same room), refresh page
7. **Expected**:
   - User B's message still shows aurora skin
   - User A sees User B's skin choice

8. As User A, select different skin (e.g., "Liquid")
9. Send message: "This is liquid skin"
10. **Expected**:
    - User A's message shows liquid skin
    - User B's message still shows aurora skin
    - Each user's skin applied correctly

### Test 5: Session Persistence
**Objective**: Verify no auto-logout on refresh

1. Login and navigate to any Hangouts room
2. Send a message
3. Refresh the page multiple times
4. **Expected**:
   - User stays logged in
   - Messages remain visible
   - No redirect to login page
   - Can continue chatting

### Test 6: Reply Functionality
**Objective**: Verify reply context is stored

1. User A sends: "What's your favorite color?"
2. User B clicks reply on that message
3. User B sends: "Blue!"
4. **Expected**:
   - Backend stores reply relationship
   - Reply message references original
   - Both users see the connection

5. Refresh the page
6. **Expected**:
   - Reply relationship persists
   - Original message context preserved

### Test 7: Room Info Display
**Objective**: Verify UI improvements

1. In any room, click the room name/info button
2. **Expected**:
   - Info modal opens
   - Room properties displayed horizontally:
     - Member count
     - Category
     - Join ID (if available)
   - NO "Rules" section
   - NO "Bio" section
   - Join ID prominently displayed
   - Copy button next to join ID works

### Test 8: Multiple Room Numbering
**Objective**: Verify sequential numbering

1. Create room #1
2. Note join ID (e.g., "ginger-1")
3. Create room #2
4. Note join ID (e.g., "ginger-2")
5. Create room #3
6. Note join ID (e.g., "ginger-3")
7. **Expected**:
   - Each room gets unique sequential number
   - No duplicates
   - Numbers increment correctly

### Test 9: Invalid Join ID
**Objective**: Verify error handling

1. Click Join button
2. Enter invalid ID: "invalid-123"
3. Click Join
4. **Expected**:
   - Error message: "Invalid join ID format"
   
5. Enter non-existent ID: "ginger-999999"
6. Click Join
7. **Expected**:
   - Error message: "Room not found"

### Test 10: Real-time Message Sync
**Objective**: Verify < 2 second delivery

1. Open room as User A (Browser 1)
2. Open same room as User B (Browser 2)
3. User A sends message
4. **Expected**:
   - User B receives message in < 2 seconds
   - Bubble skin applied correctly
   - No duplicates

## 🐛 Common Issues & Solutions

### Issue: Migration Fails
**Solution**: 
- Check if tables already exist
- Drop and recreate if needed
- Verify Supabase connection

### Issue: Join ID Not Showing
**Solution**:
- Verify migration ran successfully
- Check `rooms` table has `join_id` column
- Restart backend server

### Issue: Messages Not Persisting
**Solution**:
- Check Socket.io connection
- Verify Supabase credentials
- Check browser console for errors
- Verify `room_messages` table structure

### Issue: Session Expires
**Solution**:
- Verify `/api/hangout/session` endpoint working
- Check authentication middleware
- Verify cookies/session storage

## ✅ Success Checklist

- [ ] Can create rooms with ginger-N naming
- [ ] Join ID generated and displayed
- [ ] Can join rooms via join ID
- [ ] Messages persist after refresh
- [ ] Messages persist after logout/login
- [ ] Bubble skins work correctly
- [ ] Session doesn't expire on refresh
- [ ] Room info shows horizontal layout
- [ ] Join ID visible with copy button
- [ ] No bio or rules sections in UI
- [ ] Multiple users see same room correctly
- [ ] Real-time message delivery < 2 sec

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

Test 1 (Room Creation): ☐ PASS ☐ FAIL
Test 2 (Join by ID): ☐ PASS ☐ FAIL
Test 3 (Message Persistence): ☐ PASS ☐ FAIL
Test 4 (Bubble Skins): ☐ PASS ☐ FAIL
Test 5 (Session Persistence): ☐ PASS ☐ FAIL
Test 6 (Reply Functionality): ☐ PASS ☐ FAIL
Test 7 (Room Info Display): ☐ PASS ☐ FAIL
Test 8 (Multiple Room Numbering): ☐ PASS ☐ FAIL
Test 9 (Invalid Join ID): ☐ PASS ☐ FAIL
Test 10 (Real-time Sync): ☐ PASS ☐ FAIL

Notes:
_________________________________
_________________________________
_________________________________
```

## 🔍 Debugging Tips

1. **Backend Logs**: Check server console for SQL errors, Socket.io events
2. **Frontend Console**: Check for API errors, Socket connection status
3. **Network Tab**: Verify API calls returning correct data
4. **Supabase Dashboard**: Check tables directly for data
5. **PostgreSQL Logs**: Check Supabase logs for query errors

## 📞 Report Issues

If tests fail, provide:
1. Which test failed
2. Error messages (backend + frontend)
3. Steps to reproduce
4. Expected vs actual behavior
5. Screenshots if applicable

