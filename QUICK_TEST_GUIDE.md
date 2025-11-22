# 🧪 Quick Test Guide - Confession Feature

## 🚀 Quick Start

1. **Start Backend**:
   ```powershell
   cd server
   npm start
   ```

2. **Start Frontend**:
   ```powershell
   cd client
   npm run dev
   ```

3. **Open Multiple Browsers**:
   - Browser 1: Regular Chrome
   - Browser 2: Incognito Chrome
   - Browser 3: Firefox (optional)

---

## ✅ Test Scenarios (5 minutes each)

### 1. **Reactions Test** (Critical Fix)

**Browser 1**:
1. Create or find a confession
2. Click a reaction (e.g., 😂)
3. Verify: Reaction count increases, button shows active

**Browser 2**:
1. Navigate to same confession
2. Verify: Reaction count shows correctly (e.g., "😂 1")
3. Click same reaction
4. Verify: Count increases to 2

**Browser 1**:
1. Verify: Reaction count auto-updates to 2 (real-time)
2. Click reaction again to remove
3. Verify: Count decreases, button not active

**Browser 2**:
1. Verify: Count auto-updates to 1 (real-time)

✅ **Pass if**: Reactions sync in real-time across browsers

---

### 2. **Upvote/Downvote Test**

**Browser 1**:
1. Upvote a confession
2. Verify: Score increases, upvote button active, downvote not active
3. Click downvote
4. Verify: Score decreases by 2, downvote active, upvote not active

**Browser 2**:
1. View same confession
2. Verify: Score matches Browser 1
3. Upvote
4. Verify: Score increases

**Browser 1**:
1. Verify: Score auto-updates

✅ **Pass if**: Only one vote type active at a time, scores sync

---

### 3. **Avatar Test** (Critical Fix)

**Browser 1**:
1. Go to Confession page
2. Click "Create Confession"
3. Set alias and upload avatar image
4. Post a confession

**Browser 2**:
1. Refresh confession feed
2. Verify: Avatar image shows on the confession
3. Add a comment

**Browser 1**:
1. View comments
2. Verify: Browser 2's avatar shows on their comment

✅ **Pass if**: Avatars visible to all users on confessions and comments

---

### 4. **Poll Test** (Critical Fix)

**Browser 1**:
1. Create confession with poll (e.g., "Best food?", Options: "Pizza", "Burger", "Pasta")
2. Vote for "Pizza"
3. Verify: Pizza shows 1 vote, 100%

**Browser 2**:
1. Find same confession
2. Verify: Poll shows "Pizza: 1 vote"
3. Vote for "Burger"
4. Verify: Pizza: 50%, Burger: 50%

**Browser 1**:
1. Verify: Poll results auto-update to show 2 votes
2. Click "Pizza" again (to remove vote)
3. Verify: Pizza vote decreases

✅ **Pass if**: Poll votes persist, sync, and prevent duplicate votes

---

### 5. **Image Upload Test**

**Browser 1**:
1. Create confession
2. Click image icon
3. Select an image file
4. Verify: Image preview shows
5. Post confession

**Browser 2**:
1. View confession feed
2. Verify: Image displays in confession

✅ **Pass if**: No "Failed to upload image" error, image shows for all users

---

### 6. **Profanity Filter Test**

**Browser 1**:
1. Create confession with Indian cuss word (e.g., "chutiya")
2. Post confession
3. Verify: Confession is marked as explicit/blurred

**Browser 2**:
1. View same confession
2. Verify: Also shown as explicit/blurred

✅ **Pass if**: Indian profanity properly detected and flagged

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to upload image"
- **Solution**: Check storage bucket permissions (should be public)
- **Check**: `mcp_supabase_execute_sql` - verify buckets exist

### Issue: Reactions not syncing
- **Solution**: Check Socket.io connection in browser console
- **Check**: Look for "🎭 Reaction update broadcasted" in server logs

### Issue: Only 2 confessions showing
- **Solution**: Check browser localStorage, clear if needed
- **Check**: Verify backend returns 20 confessions (check Network tab)

### Issue: Avatar not showing
- **Solution**: Verify Supabase Storage URL is accessible
- **Check**: Open avatar URL in browser directly

---

## 📊 Quick Debug Commands

### Check Storage Buckets:
```javascript
// In Supabase MCP
SELECT * FROM storage.buckets WHERE name IN ('confession-images', 'confession-avatars');
```

### Check Recent Reactions:
```javascript
// In Supabase MCP
SELECT * FROM confession_reactions ORDER BY created_at DESC LIMIT 10;
```

### Check Recent Votes:
```javascript
// In Supabase MCP
SELECT * FROM confession_votes ORDER BY updated_at DESC LIMIT 10;
```

### Check User Aliases:
```javascript
// In Supabase MCP
SELECT * FROM user_aliases ORDER BY created_at DESC LIMIT 10;
```

---

## ✅ All Tests Passed?

If all 6 tests pass, the Confession feature is **production-ready**! 🎉

**Next Steps**:
1. Test on mobile devices
2. Test with 5+ concurrent users
3. Monitor server logs for any errors
4. Check database growth (storage, reactions, votes)

---

## 📞 Support

If any tests fail:
1. Check browser console for errors
2. Check server logs for backend errors
3. Verify Socket.io connection status
4. Check Supabase Storage bucket permissions
5. Verify all database tables exist

**Happy Testing!** 🚀

