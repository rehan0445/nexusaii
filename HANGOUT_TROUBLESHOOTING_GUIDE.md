# Hangout Rooms & Palaces - Troubleshooting Guide

## 🔍 Root Cause Analysis

After implementing security hardening (RLS policies), the hangout feature stopped working because:

1. **RLS Enabled Without Policies**: Row Level Security was enabled on `rooms`, `room_messages`, and `room_participants` tables
2. **No Service Role Policies**: The backend (using `service_role` key) had no policies allowing INSERT/UPDATE operations
3. **Silent Failures**: Database operations were failing silently, causing:
   - Room creation to fail
   - Messages not being stored
   - Participants not being tracked
   - Data disappearing on refresh (no persistence)

## 🐛 Issues You Were Experiencing

### Issue #1: Messages Not Being Stored
**Symptom**: Messages appear briefly but disappear on refresh
**Cause**: `INSERT` operations on `room_messages` table blocked by RLS
**Fix**: Added `room_messages_write_server` policy

### Issue #2: Messages Don't Appear Across Accounts
**Symptom**: User A sends message, User B doesn't see it
**Cause**: 
- Messages failing to save to DB (RLS blocking)
- Socket.io room joining might be failing
**Fix**: 
- RLS policies for `room_messages`
- Verify socket join operations in logs

### Issue #3: Rooms/Palaces Creation Failing
**Symptom**: Creation hangs or fails silently
**Cause**: `INSERT` operations on `rooms` table blocked by RLS
**Fix**: Added `rooms_write_server` policy

### Issue #4: "Fails to Fetch Room"
**Symptom**: API returns empty or errors when fetching rooms
**Cause**: `SELECT` operations might be blocked OR no rooms exist due to creation failures
**Fix**: Added `rooms_read` policy (allows all SELECTs)

### Issue #5: Data Disappears on Refresh
**Symptom**: Everything resets when page refreshes
**Cause**: Nothing is persisting to database due to RLS blocking writes
**Fix**: All write policies now in place

## 🚀 Step-by-Step Fix

### Step 1: Run the SQL Migration
```bash
# Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy contents of FIX_HANGOUT_RLS_POLICIES.sql
4. Paste and click "Run"

# Option B: Using psql command line
psql "postgresql://your-supabase-url" -f FIX_HANGOUT_RLS_POLICIES.sql
```

### Step 2: Verify Tables and Policies
Run these verification queries in Supabase SQL Editor:

```sql
-- 1. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('rooms', 'room_messages', 'room_participants');

-- Expected: All should show rowsecurity = true

-- 2. Check if policies exist
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('rooms', 'room_messages', 'room_participants')
ORDER BY tablename, policyname;

-- Expected: Should see policies like:
-- rooms_read (SELECT)
-- rooms_write_server (INSERT)
-- rooms_update_server (UPDATE)
-- (same for room_messages and room_participants)

-- 3. Test if service_role can write
-- This should succeed (run as service_role)
INSERT INTO rooms (id, name, description, category, created_by) 
VALUES ('test-room-1', 'Test Room', 'Test Description', 'General', 'test-user')
ON CONFLICT (id) DO NOTHING;

-- 4. Verify the insert worked
SELECT * FROM rooms WHERE id = 'test-room-1';

-- 5. Clean up test data
DELETE FROM rooms WHERE id = 'test-room-1';
```

### Step 3: Verify Environment Variables
Check your server `.env` file has these:

```bash
# Server .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Must be SERVICE_ROLE key, not anon key!
SUPABASE_ANON_KEY=eyJhbGc... # For client operations
```

**Common Mistake**: Using `SUPABASE_ANON_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY` on the server!

### Step 4: Restart Backend Server
```bash
# Stop server
# Then restart
cd server
npm start

# OR if using PowerShell scripts
.\restart-dev.ps1
```

### Step 5: Test Room Creation

#### Test via Browser Console:
```javascript
// Open your app, open DevTools console, run:
const testRoom = {
  name: "Test Palace",
  description: "Testing room creation",
  category: "General",
  isPrivate: false,
  roomType: "palace",
  tags: ["test"]
};

// Assuming you have hangoutService available
hangoutService.createRoom(testRoom).then(room => {
  console.log("✅ Room created:", room);
}).catch(err => {
  console.error("❌ Room creation failed:", err);
});
```

#### Test via Backend Logs:
Watch your server console for these logs:
```
🏗️ Created new hangout room: [Room Name] (room-xxxxx) in Supabase
```

If you see:
```
❌ Error creating hangout room: new row violates row-level security policy
```
Then RLS policies are still blocking - rerun the SQL migration.

### Step 6: Test Messaging

1. Create or join a room
2. Send a test message
3. Check server logs for:
   ```
   📨 Message sent in Hangout Room [roomId] by [username]
   ```
4. Check for errors:
   ```
   ❌ Failed to save hangout message: [error]
   ```
5. Refresh the page - messages should persist

### Step 7: Test Cross-Account Messaging

1. Open app in two different browsers (or incognito mode)
2. Log in with two different accounts
3. Both join the same room
4. Send message from Account A
5. Verify Account B receives it instantly
6. Check server logs for Socket.io events:
   ```
   🏰 User [userId] joined Hangout Room: [roomId]
   📨 Message sent in Hangout Room [roomId] by [username]
   ```

## 🔧 Additional Debugging

### Check Supabase Client Configuration

**File**: `server/config/supabase.js`
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // ← Must be service_role!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }, // ← Important for server-side
});
```

### Enable Detailed Logging

Add this to `server/services/hangoutRoomsService.js`:

```javascript
static async createRoom(roomData) {
  try {
    console.log('🔍 Attempting to create room:', roomData);
    
    const { data, error } = await supabase
      .from('rooms')
      .insert([roomData])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    console.log('✅ Room created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error creating hangout room:', error);
    return { success: false, error: error.message };
  }
}
```

### Check Network Requests

1. Open browser DevTools → Network tab
2. Filter by "hangout"
3. Try to create a room
4. Check the `/api/hangout/rooms` POST request:
   - **Status 200**: Room created successfully
   - **Status 400**: Validation error (check request body)
   - **Status 500**: Server error (check server logs)
   - **Status 401/403**: Authentication error (check auth token)

### Check Socket.io Connection

Add this to your client console:
```javascript
// Check socket status
hangoutService.socket?.connected
// Should return: true

// Check socket events
hangoutService.socket?.on('receive-hangout-message', (msg) => {
  console.log('📨 Received message:', msg);
});
```

## 🧪 Common Error Messages & Solutions

### Error: "new row violates row-level security policy"
**Solution**: Run `FIX_HANGOUT_RLS_POLICIES.sql` migration

### Error: "null value in column 'created_by' violates not-null constraint"
**Solution**: Ensure `createdBy` is passed in room creation request

### Error: "Failed to create room in database"
**Solution**: 
1. Check Supabase connection (verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`)
2. Check table exists: `SELECT * FROM rooms LIMIT 1;`
3. Check RLS policies (see verification queries above)

### Error: "Messages disappear on refresh"
**Solution**: Messages aren't being saved. Run RLS policy fix.

### Error: "User B doesn't see User A's messages"
**Solution**: 
1. Check both users joined the same Socket.io room
2. Check messages are being saved to DB
3. Check Socket.io is broadcasting to room: `io.to('hangout-{roomId}').emit(...)`

### Error: "Cannot read property 'id' of null" (frontend)
**Solution**: Room creation failed. Check backend logs and RLS policies.

## 📊 Monitoring & Health Checks

### Create a Health Check Endpoint

Add to `server/routes/hangout.js`:

```javascript
// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('rooms')
      .select('count')
      .limit(1);

    if (error) throw error;

    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

Test it: `curl http://localhost:5000/api/hangout/health`

## 🎯 Success Checklist

- [ ] SQL migration `FIX_HANGOUT_RLS_POLICIES.sql` executed successfully
- [ ] All RLS policies verified in Supabase dashboard
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set correctly in server `.env`
- [ ] Backend server restarted after changes
- [ ] Room creation works (test via UI)
- [ ] Messages persist after refresh
- [ ] Messages appear across different accounts in real-time
- [ ] No "permission denied" or RLS errors in server logs
- [ ] Socket.io connection established (check browser console)
- [ ] Health check endpoint returns "healthy"

## 🆘 Still Not Working?

If issues persist after following all steps:

1. **Share Server Logs**: Copy the last 50 lines of server console output
2. **Share Browser Console**: Copy any errors from browser DevTools console
3. **Share SQL Query Results**: Run verification queries and share output
4. **Check Supabase Dashboard**: 
   - Go to Database → Tables → rooms
   - Check if any rooms exist
   - Try manually inserting a row
5. **Verify Network**: Ensure client can reach backend (`curl http://localhost:5000/api/hangout/rooms`)

## 🔐 Security Notes

- The `service_role` key bypasses RLS - keep it SECRET and SERVER-SIDE only!
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Client should use `SUPABASE_ANON_KEY` (has RLS enforced)
- Backend uses `service_role` to perform operations on behalf of users
- Access control is handled at the application layer (backend validates user permissions)

## 📚 Related Files

- `FIX_HANGOUT_RLS_POLICIES.sql` - The main fix
- `server/services/hangoutRoomsService.js` - Room database operations
- `server/app.js` (lines 407-469) - Socket.io message handling
- `server/routes/hangout.js` - REST API endpoints
- `server/config/supabase.js` - Supabase client configuration
- `client/src/services/hangoutService.ts` - Frontend hangout service
- `client/src/contexts/HangoutContext.tsx` - React context for hangout state

Good luck, Ren! Let me know if you hit any snags. 🚀

