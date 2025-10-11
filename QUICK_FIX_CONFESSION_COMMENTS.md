# Quick Fix: Confession Comments & Reactions Not Persisting

## The Problem
**Comments, reactions, and poll votes** on confessions disappear within seconds and are not stored in Supabase. After refresh/logout, everything vanishes.

## The Solution (3 Steps)

### Step 1: Apply SQL Migration (CRITICAL - 2 minutes)

**You MUST do this first!** Without RLS policies, comments will continue to fail silently.

1. Open Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Open the file `FIX_CONFESSION_COMMENTS_RLS.sql` from your project root
6. Copy ALL contents and paste into SQL Editor
7. Click **Run** button
8. Wait for success message: "✅ Confession comments RLS policies applied successfully!"

### Step 2: Restart Backend (1 minute)

```powershell
# In your project root
cd server
npm start
```

### Step 3: Restart Frontend (1 minute)

```powershell
# In your project root  
cd client
npm start
```

### Step 4: Test (2 minutes)

1. Open any confession in your browser
2. **Test Comment**: Add a comment → Wait 5 seconds → Refresh (F5) → ✅ Comment persists!
3. **Test Nested Reply**: Click reply on a comment → Add reply → Refresh (F5) → ✅ Reply persists!
4. **Test Reaction**: Click a reaction emoji → Refresh (F5) → ✅ Reaction persists!
5. **Test Poll Vote**: Vote on a poll → Refresh (F5) → ✅ Vote persists!

## What if it doesn't work?

### Check Backend Logs
Look for these success messages when you post a comment:
```
✅ Stored in legacy confession_replies table
✅ Stored in comments_mit_adt
✅ Updated replies_count for confession
```

### Check Browser Console
Open DevTools (F12) and look for errors in Console tab.

### Verify SQL Was Applied
Run this in Supabase SQL Editor:
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'comments_%'
LIMIT 5;
```

You should see policies like `comments_mit_adt_read_all`, `comments_mit_adt_insert_all`, etc.

## What Was Fixed?

### Comments & Replies:
1. **Missing RLS Policies** - Added security policies to allow comment reads/writes
2. **Missing Campus Parameter** - Frontend now sends correct campus code
3. **Missing Parent References** - Nested replies now include parentCommentId
4. **Missing Backend Call for Replies** - Inline replies now save to backend
5. **Auto-Refresh Overwriting** - Comments now merge instead of replace (preserves nested replies)

### Reactions & Polls:
1. **Wrong Database Table** - Backend now updates correct per-campus tables
2. **Real-time Updates** - Added socket events for instant reaction/poll updates
3. **Enhanced Logging** - Better error tracking

## Need Help?

See the full documentation:
- Comments: `CONFESSION_COMMENTS_FIX_COMPLETE.md`
- Reactions/Polls: `CONFESSION_REACTIONS_AND_POLLS_FIX.md`

---

**Time to fix**: ~5 minutes
**Difficulty**: Easy (just run SQL and restart)
**Impact**: Comments, reactions, and poll votes will persist permanently ✅
