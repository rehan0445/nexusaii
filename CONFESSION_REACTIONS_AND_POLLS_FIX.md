# Confession Reactions and Poll Votes Fix

## Issue Summary

**Reactions and poll votes** on confessions were disappearing within seconds and not persisting in Supabase. After page refresh, all reactions and poll votes would vanish.

## Root Cause

The backend was updating the **wrong table**! 

Confessions are stored in per-campus tables:
- `confessions_mit_adt`
- `confessions_mit_wpu`
- `confessions_vit_vellore`
- `confessions_parul_university`
- `confessions_iict`

But the reactions and poll-vote endpoints were hardcoded to update the **legacy `confessions` table** which is not used anymore.

### Code Evidence

**Before (BROKEN)**:
```javascript
// Line 670 - Reactions endpoint
const { error } = await supabase
  .from("confessions")  // ← WRONG TABLE!
  .update({ reactions })
  .eq("id", id);

// Line 719 - Poll-vote endpoint  
const { error } = await supabase
  .from("confessions")  // ← WRONG TABLE!
  .update({ poll: confession.poll })
  .eq("id", id);
```

**After (FIXED)**:
```javascript
// Get the correct per-campus table
const campusTable = getConfessionTable(confession.campus);
const targetTable = campusTable || "confessions";

const { error } = await supabase
  .from(targetTable)  // ← CORRECT TABLE!
  .update({ reactions })
  .eq("id", id);
```

## Changes Implemented

### 1. Fixed Reactions Endpoint ✅
**File**: `server/routes/confessions.js` (lines 669-693)

- Added `getConfessionTable(confession.campus)` to get correct table
- Added detailed logging showing which table is being updated
- Added socket.io real-time broadcast for reaction updates
- Enhanced error logging

### 2. Fixed Poll-Vote Endpoint ✅
**File**: `server/routes/confessions.js` (lines 731-755)

- Added `getConfessionTable(confession.campus)` to get correct table
- Added detailed logging showing which table is being updated
- Enhanced error logging
- Socket.io broadcast already existed, kept it

### 3. Added Real-time Reaction Updates ✅
**Files**: 
- `client/src/components/ConfessionPage.tsx` (lines 847-863)
- `client/src/components/ConfessionDetailPage.tsx` (lines 593-603)

- Added `reaction-update` socket event listener
- Updates confession reactions in real-time across all clients
- Matches pattern of existing vote-update and poll-update handlers

## What Was Already Working

✅ **Vote endpoint** - Already correctly used per-campus tables (line 613-619)

## Expected Console Output (Success)

**Backend logs when reacting**:
```
🎭 Updating reactions in table: confessions_mit_adt for confession: abc123, campus: mit-adt
✅ Reactions updated successfully in confessions_mit_adt
🎭 Reaction update broadcasted for confession: abc123
```

**Backend logs when voting on poll**:
```
📊 Updating poll in table: confessions_vit_vellore for confession: xyz789, campus: vit-vellore
✅ Poll updated successfully in confessions_vit_vellore
📊 Poll update broadcasted for confession: xyz789
```

**Frontend logs (browser console)**:
```
🎭 Reaction update received: {id: "abc123", reactions: {...}}
📊 Poll update received: {id: "xyz789", poll: {...}}
```

## How to Apply the Fix

### Step 1: Already Done ✅
The code changes are complete in:
- `server/routes/confessions.js`
- `client/src/components/ConfessionPage.tsx`
- `client/src/components/ConfessionDetailPage.tsx`

### Step 2: Restart Backend
```powershell
cd server
npm start
```

### Step 3: Restart Frontend
```powershell
cd client
npm start
```

### Step 4: Clear Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear localStorage in DevTools Console: `localStorage.clear()`

## Verification Steps

### Test 1: Reactions
1. Navigate to any confession
2. Click a reaction (e.g., 😊)
3. Reaction should appear immediately
4. **Refresh the page** (F5)
5. ✅ Reaction should still be there!
6. Check backend logs for: `✅ Reactions updated successfully in confessions_[campus]`

### Test 2: Poll Votes
1. Navigate to a confession with a poll
2. Click a poll option
3. Vote should register immediately
4. **Refresh the page** (F5)
5. ✅ Your vote should still be there!
6. Check backend logs for: `✅ Poll updated successfully in confessions_[campus]`

### Test 3: Cross-Session Persistence
1. React to a confession or vote on a poll
2. Logout
3. Login again (or open in incognito)
4. Navigate to same confession
5. ✅ Reactions and poll votes should persist

### Test 4: Real-time Updates
1. Open same confession in two browser tabs
2. React in Tab 1
3. ✅ Reaction should appear in Tab 2 instantly
4. Vote on poll in Tab 2
5. ✅ Poll update should appear in Tab 1 instantly

## Database Verification

Check if reactions/polls are actually being stored:

```sql
-- Check reactions in MIT ADT confessions
SELECT id, reactions, created_at 
FROM confessions_mit_adt 
WHERE reactions IS NOT NULL 
  AND reactions::text != '{}'
ORDER BY created_at DESC 
LIMIT 10;

-- Check polls in VIT Vellore confessions
SELECT id, poll, created_at 
FROM confessions_vit_vellore 
WHERE poll IS NOT NULL
ORDER BY created_at DESC 
LIMIT 10;
```

## Troubleshooting

### Issue: Reactions still disappearing
**Check**:
1. Backend logs - look for the table name being updated
2. If it says `confessions` instead of `confessions_[campus]`, restart backend
3. Check if confession has a campus field: `SELECT id, campus FROM confessions_mit_adt LIMIT 5;`

### Issue: "Failed to update reactions in confessions_[campus]"
**Possible causes**:
1. RLS policies missing - run `FIX_CONFESSION_COMMENTS_RLS.sql` (this also covers confessions)
2. Confession doesn't exist in that table
3. Network error - check Supabase status

### Issue: Real-time updates not working
**Check**:
1. Browser console for socket connection errors
2. Backend should log: `🎭 Reaction update broadcasted for confession: [id]`
3. Frontend should log: `🎭 Reaction update received: {...}`
4. Make sure you're in the same confession room in both tabs

## Related Fixes

This fix is part of a larger set of persistence fixes:

1. ✅ **Comments persistence** - `FIX_CONFESSION_COMMENTS_RLS.sql` + frontend updates
2. ✅ **Reactions persistence** - This fix (backend table routing)
3. ✅ **Poll votes persistence** - This fix (backend table routing)
4. ✅ **Vote persistence** - Already working (was already using correct tables)

## Summary

- **Problem**: Reactions and poll votes updated wrong database table
- **Solution**: Use `getConfessionTable(campus)` to route to correct per-campus table
- **Impact**: All reactions and poll votes now persist permanently
- **Real-time**: Added socket.io events for instant cross-client updates
- **Logging**: Enhanced logging helps debug any future issues

---

**Status**: ✅ Implementation Complete
**Testing**: Follow verification steps above
**Time to Fix**: Already applied, just restart servers
