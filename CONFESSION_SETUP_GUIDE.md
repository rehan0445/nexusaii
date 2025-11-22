# Confession Feature - Quick Setup Guide

## Prerequisites
- Node.js installed
- Supabase account and project set up
- Environment variables configured

## Step-by-Step Setup

### 1. Apply RLS Policies to Supabase

**Option A: Using Supabase Dashboard (Recommended)**
1. Open your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `FIX_CONFESSIONS_RLS.sql`
4. Paste and run the SQL in the editor
5. Verify success message appears

**Option B: Verify policies are working**
```bash
node apply-confession-rls.js
```

### 2. Verify Table Structure

Run the table checker:
```bash
cd server
node check-tables.js
```

Expected output:
```
✅ Table 'confessions' exists
✅ ALL TABLES EXIST! Your database is ready!
```

### 3. Test Confession Creation

Run the test script:
```bash
node test-confession-creation.js
```

Expected output:
```
✅ Confession created successfully!
✅ Confession found in Supabase!
✅ Confessions API accessible!
✅ RLS policies allow reading confessions!
```

### 4. Start the Server

```bash
# Start backend server
cd server
npm start

# OR use the main start script
npm run start
```

### 5. Start the Frontend

```bash
# Start frontend
cd client
npm run dev
```

### 6. Verify in Browser

1. Open browser and navigate to `http://localhost:5173` (or your Vite port)
2. Navigate to Campus → Confessions
3. Create a test confession
4. Open browser console and verify logs:
   - `📤 Posting confession to server`
   - `✅ Confession created successfully`
   - `🔌 Socket.IO connected successfully`
5. Open another browser/incognito window
6. Navigate to Confessions
7. Verify the confession appears (should appear within 3 seconds)

## Troubleshooting

### Issue: "Confessions not appearing"

**Check:**
1. Server is running: `http://localhost:8002`
2. Browser console for errors
3. Server logs for Supabase insert errors
4. RLS policies are applied correctly

**Solution:**
```bash
# 1. Check server logs
# Look for: "✅ Confession stored in Supabase successfully"

# 2. Verify RLS policies
node apply-confession-rls.js

# 3. Check Supabase table
# Go to Supabase Dashboard → Table Editor → confessions
```

### Issue: "Socket.IO not connecting"

**Check:**
1. CORS configuration in server
2. Server URL in client (`VITE_SERVER_URL`)
3. Firewall/antivirus blocking WebSocket connections

**Solution:**
```bash
# Check browser console for:
# "🔌 Socket.IO connected successfully"

# If not connecting:
# 1. Verify VITE_SERVER_URL in client/.env
# 2. Check server CORS settings in server/app.js
# 3. Try disabling firewall temporarily
```

### Issue: "Supabase insert failing"

**Check:**
1. Supabase URL and anon key are correct
2. RLS policies are applied
3. Table schema matches expected structure

**Solution:**
```bash
# 1. Verify environment variables
cat server/.env | grep SUPABASE

# 2. Check table structure
node server/check-tables.js

# 3. Re-apply RLS policies
# Run FIX_CONFESSIONS_RLS.sql in Supabase Dashboard
```

### Issue: "Auto-refresh not working"

**Check:**
1. Browser console for refresh errors
2. Tab is active (auto-refresh pauses on hidden tabs)
3. Network throttling disabled

**Solution:**
```javascript
// Check browser console for:
// Background refresh failed: [error]

// Verify interval is set to 3 seconds in ConfessionPage.tsx
// Line 634 should be: }, 3000);
```

## Performance Optimization

### For High Traffic (1000+ users):

1. **Enable Redis for Socket.IO** (optional):
   ```env
   REDIS_URL=redis://your-redis-url
   ```

2. **Increase rate limits** in `server/app.js`:
   ```javascript
   max: Number(process.env.RATE_LIMIT_MAX || 2000)
   ```

3. **Add CDN for static assets**

4. **Enable Supabase connection pooling**

## Monitoring

### Server-side Logs to Monitor:
```bash
✅ Confession stored in Supabase successfully: {id}
📢 New confession broadcasted to all clients: {id}
📊 Connected clients: {count}
```

### Client-side Logs to Monitor:
```javascript
🔌 Socket.IO connected successfully
📤 Posting confession to server
✅ Confession created successfully
📨 New confession received
```

## Health Checks

### Quick Health Check:
```bash
# 1. Server health
curl http://localhost:8002/api/health

# 2. Confessions API
curl http://localhost:8002/api/confessions?limit=5

# 3. Create test confession
node test-confession-creation.js
```

## Next Steps After Setup

1. ✅ Test confession creation in multiple browsers
2. ✅ Verify auto-refresh works (wait 3 seconds)
3. ✅ Test Socket.IO real-time updates
4. ✅ Monitor server logs for errors
5. ✅ Test with multiple concurrent users

## Success Criteria

- ✅ Confessions can be created successfully
- ✅ Confessions are visible to all users
- ✅ Auto-refresh works within 3 seconds
- ✅ Socket.IO real-time updates work
- ✅ Confessions are stored in Supabase
- ✅ No errors in server logs
- ✅ No errors in browser console

## Support

If you encounter issues not covered here, check:
- `CONFESSION_FIXES_COMPLETE.md` for detailed documentation
- Server logs for detailed error messages
- Supabase Dashboard for database issues
- Browser DevTools Network tab for API errors

---

**Setup Time**: ~5-10 minutes
**Difficulty**: Easy
**Status**: ✅ Ready for Production

