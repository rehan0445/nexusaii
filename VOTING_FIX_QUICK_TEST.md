# Quick Test Guide: Confession Voting Fix

## 🚀 Quick Start

### 1. Start Your Server
```bash
# From project root
npm run dev
# or
node server/app.js
```

### 2. Start Your Frontend (if separate)
```bash
cd client
npm run dev
```

### 3. Test Using the Test Page
Open `test-confession-voting.html` in your browser:
```bash
# Windows
start test-confession-voting.html

# Mac
open test-confession-voting.html

# Linux
xdg-open test-confession-voting.html
```

## ✅ Quick Test Scenarios

### Scenario 1: Fresh User Voting
1. Clear your browser's localStorage (F12 → Application → Local Storage → Clear)
2. Open your app and navigate to confessions
3. Click upvote on any confession
   - **Expected:** Button turns blue, score increases by 1
4. Refresh the page (F5)
   - **Expected:** Button still blue, score unchanged

### Scenario 2: Vote Toggle
1. Click upvote on a confession (button turns blue)
2. Click upvote again
   - **Expected:** Button returns to neutral, score decreases by 1
3. Click downvote
   - **Expected:** Button turns red, score decreases by 1
4. Refresh page
   - **Expected:** Button still red, score unchanged

### Scenario 3: Vote Change
1. Click upvote (blue, +1)
2. Click downvote
   - **Expected:** Changes from blue to red, score changes by -2
3. Refresh page
   - **Expected:** Still red, score unchanged

### Scenario 4: Multiple Confessions
1. Go to main feed
2. Upvote 3 different confessions
3. Downvote 2 different confessions
4. Refresh page (F5)
   - **Expected:** All 5 votes persist with correct colors

### Scenario 5: Detail Page
1. Click on a confession to open detail view
2. Vote on it (upvote or downvote)
3. Go back to main feed
   - **Expected:** Same vote shows in main feed
4. Open detail page again
   - **Expected:** Vote still shows correctly

## 🧪 Using the Test HTML Page

### Auto-Test
The page auto-runs Test 1 (Fetch Confessions) on load.

### Manual Tests

**Test 1: Fetch with Vote Status**
- Click "Run Test"
- Should show 5 confessions with their current vote status

**Test 2 & 3: Upvote/Downvote**
1. Copy a confession ID from Test 1
2. Paste into the input field
3. Click "Upvote" or "Downvote"
4. Check the result shows updated score and vote

**Test 4: Toggle**
1. Use the same confession ID
2. Click "Toggle Upvote" twice
   - First click: Upvotes (userVote: 1)
   - Second click: Removes vote (userVote: 0)

**Test 5: Single Fetch**
1. Paste a confession ID
2. Click "Fetch"
3. Verify userVote field shows correct value

## 🔍 What to Check

### ✅ Visual Indicators
- **Upvoted:** Blue button with lighter background
- **Downvoted:** Red button with lighter background
- **No vote:** Gray button with darker background

### ✅ Score Updates
- Upvote: +1 to score
- Downvote: -1 to score
- Remove vote: Returns to previous score

### ✅ Persistence
- After refresh, votes remain
- After navigating away and back, votes remain
- After closing and reopening browser, votes remain (same session)

## 🐛 Common Issues & Solutions

### Issue: Votes don't persist after refresh
**Solution:** Check browser console:
```javascript
localStorage.getItem('confession_session_id')
// Should return a session ID like "1729180800000-abc123"
```
If null, the session isn't being created. Check that your app creates it on load.

### Issue: All userVote values are 0
**Check:**
1. Open Network tab (F12)
2. Find the `/api/confessions` request
3. Check URL includes `&sessionId=...`
4. Check response includes `userVote` field

### Issue: Vote count increases but button doesn't highlight
**Check:**
- Browser console for errors
- Make sure `userVote` is a number (not string)
- Verify CSS classes are being applied

### Issue: Can't vote (button doesn't respond)
**Check:**
1. Server is running (check terminal)
2. No CORS errors in console
3. sessionId exists in localStorage
4. `/api/confessions/:id/vote` endpoint returns 200

## 📊 Database Verification

### Check votes in Supabase
```sql
-- See all votes for a confession
SELECT * FROM confession_votes 
WHERE confession_id = 'your-confession-id';

-- Count votes per confession
SELECT 
  confession_id,
  SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) as upvotes,
  SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) as downvotes,
  SUM(vote) as score
FROM confession_votes
GROUP BY confession_id;

-- Find your votes
SELECT * FROM confession_votes 
WHERE voter_session_id = 'your-session-id';
```

## 🎯 Success Criteria

- [x] Can upvote and see blue button
- [x] Can downvote and see red button
- [x] Can remove vote by clicking again
- [x] Votes persist after refresh
- [x] Vote state loads on page load
- [x] Score updates correctly
- [x] Works in both main feed and detail page
- [x] Multiple confessions can be voted on
- [x] Vote changes work (upvote to downvote)

## 📝 Test Results Template

```
Test Date: ___________
Browser: ___________
Server URL: ___________

Test 1 - Fetch with votes: ☐ Pass ☐ Fail
Test 2 - Upvote: ☐ Pass ☐ Fail
Test 3 - Downvote: ☐ Pass ☐ Fail
Test 4 - Toggle: ☐ Pass ☐ Fail
Test 5 - Persistence: ☐ Pass ☐ Fail
Test 6 - Detail page: ☐ Pass ☐ Fail

Notes:
_________________________________
_________________________________
_________________________________
```

## 🔧 Developer Tools

### Check sessionId in Console
```javascript
// Get session ID
localStorage.getItem('confession_session_id')

// Set custom session ID
localStorage.setItem('confession_session_id', 'test-session-123')

// Clear session (start fresh)
localStorage.removeItem('confession_session_id')
```

### Test API Directly
```bash
# Fetch confessions with votes
curl "http://localhost:5000/api/confessions?campus=general&limit=5&sessionId=test-123"

# Vote on confession
curl -X POST http://localhost:5000/api/confessions/CONFESSION_ID/vote \
  -H "Content-Type: application/json" \
  -d '{"direction": 1, "sessionId": "test-123"}'

# Fetch single confession with vote
curl "http://localhost:5000/api/confessions/CONFESSION_ID?sessionId=test-123"
```

## 🎉 Expected Behavior Summary

**Before Fix:**
- ❌ Votes didn't persist on refresh
- ❌ All confessions showed as "not voted"
- ❌ Vote counts were unreliable

**After Fix:**
- ✅ Votes persist across refreshes
- ✅ Previous votes load correctly
- ✅ Vote counts are accurate
- ✅ UI reflects actual vote state
- ✅ Works in both feed and detail views

---

If all tests pass, the voting system is working correctly! 🎊

