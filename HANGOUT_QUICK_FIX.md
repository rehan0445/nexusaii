# 🚀 Hangout Quick Fix - 3 Steps, 5 Minutes

## The Problem
Your hangout rooms/palaces stopped working after security hardening because Row Level Security (RLS) is blocking database writes.

## The Solution (Choose One)

### ⭐ Method 1: Supabase Dashboard (RECOMMENDED)
**Time: 2 minutes**

1. Open https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy/paste entire contents of `FIX_HANGOUT_RLS_POLICIES.sql`
6. Click **RUN** (bottom right)
7. Should see: ✅ Success

**Done!** Skip to Step 2 below.

---

### Method 2: Automated Script
**Time: 3 minutes**

```bash
node apply-hangout-fix.js
```

Note: May not work for all statements due to Supabase client limitations. If it fails, use Method 1.

---

## Step 2: Verify Fix
```bash
node test-hangout-fix.js
```

Should see:
```
✅ All tests passed! Hangout rooms are working correctly.
```

---

## Step 3: Restart & Test
```bash
# Restart backend
cd server
npm start

# Test in browser:
# 1. Create a room/palace
# 2. Send messages
# 3. Refresh page - messages should persist
# 4. Test with 2nd account - messages should sync
```

---

## 🎯 Quick Checks

### ✅ Fix Applied Successfully If:
- Test script shows all tests passed
- Room creation works in UI
- Messages persist after refresh
- Messages sync across accounts
- No RLS errors in server logs

### ❌ Still Broken If You See:
- `new row violates row-level security policy`
- `permission denied for table`
- Messages disappear on refresh
- Room creation fails silently

**Fix**: Ensure you ran the SQL in Supabase Dashboard (Method 1)

---

## 🆘 Emergency Checklist

If still not working after running SQL:

1. **Check Environment Variables**
   ```bash
   # In server/.env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (NOT anon key!)
   ```

2. **Verify in Supabase Dashboard**
   - Database → Tables → `rooms` → Policies tab
   - Should see: `rooms_read`, `rooms_write_server`, etc.

3. **Check Server Logs**
   - Look for: ❌ errors about "row-level security"
   - Should see: ✅ "Created new hangout room"

4. **Run Test Script**
   ```bash
   node test-hangout-fix.js
   ```

5. **Read Full Guide**
   - See `HANGOUT_FIX_SUMMARY.md` for overview
   - See `HANGOUT_TROUBLESHOOTING_GUIDE.md` for details

---

## 📚 File Reference

| File | Purpose |
|------|---------|
| `FIX_HANGOUT_RLS_POLICIES.sql` | **RUN THIS** - Main fix |
| `test-hangout-fix.js` | Test if fix worked |
| `apply-hangout-fix.js` | Auto-apply SQL (optional) |
| `HANGOUT_FIX_SUMMARY.md` | Detailed overview |
| `HANGOUT_TROUBLESHOOTING_GUIDE.md` | Full troubleshooting |
| `HANGOUT_QUICK_FIX.md` | This file (quick ref) |

---

## 🧠 What This Fix Does

1. Enables RLS on hangout tables (if not already)
2. Creates policies allowing backend to write data
3. Creates policies allowing users to read data
4. Adds performance indexes
5. Verifies tables exist

Your backend uses `service_role` key → gets full access
Your frontend uses `anon` key → limited access (controlled by backend)

---

**Need help?** Check `HANGOUT_TROUBLESHOOTING_GUIDE.md` or review server logs.

**All good?** Mark this checklist:
- [ ] Ran SQL migration
- [ ] Test script passed
- [ ] Backend restarted
- [ ] Room creation works
- [ ] Messages persist
- [ ] Cross-account sync works

🎉 **You're done!**

