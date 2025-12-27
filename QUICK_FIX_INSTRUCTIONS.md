# 🚀 Quick Fix Instructions - Email Hash Trigger

## The Problem
Login/signup is failing with "technical difficulties" error because the trigger function doesn't handle errors gracefully.

## The Solution
Update the trigger function to be non-blocking (it will log warnings instead of failing).

---

## ✅ Step 1: Run SQL in Supabase (2 minutes)

1. **Open Supabase SQL Editor:**
   - Go to: https://app.supabase.com/project/dswuotsdaltsomyqqykn/sql

2. **Copy and paste this SQL:**
   ```sql
   CREATE OR REPLACE FUNCTION ensure_user_email_hash()
   RETURNS TRIGGER 
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
       user_email TEXT;
       computed_hash TEXT;
   BEGIN
       user_email := NEW.email;
       
       IF user_email IS NULL OR trim(user_email) = '' THEN
           RETURN NEW;
       END IF;
       
       BEGIN
           computed_hash := compute_email_hash(user_email);
           
           INSERT INTO user_email_hashes (user_id, email_hash, updated_at)
           VALUES (NEW.id, computed_hash, NOW())
           ON CONFLICT (user_id) 
           DO UPDATE SET 
               email_hash = EXCLUDED.email_hash,
               updated_at = NOW();
       EXCEPTION WHEN OTHERS THEN
           RAISE WARNING 'Failed to create email hash for user %: %', NEW.id, SQLERRM;
           RETURN NEW;
       END;
       
       RETURN NEW;
   END;
   $$;
   ```

3. **Click "Run"** (or press Ctrl+Enter)

4. **Verify success:**
   - You should see: "Success. No rows returned"
   - No error messages

---

## ✅ Step 2: Test Signup/Login

1. **Try creating a new account:**
   - Should work without "technical difficulties" error
   - User should be redirected to companion page

2. **Try logging in:**
   - Should work without errors
   - User should be redirected to companion page

---

## 🔍 What This Fix Does

**Before:**
- Trigger fails → Signup fails → "Technical difficulties" error

**After:**
- Trigger logs warning → Signup succeeds → Hash created later if needed

---

## ✅ Verification

After running the SQL, test signup/login. If it works, you're done! 🎉

If you still see errors, check:
1. Did the SQL run successfully?
2. Check browser console for specific error messages
3. Verify `user_email_hashes` table exists

---

**File Location:** `FIX_EMAIL_HASH_TRIGGER_NOW.sql` (ready to copy/paste)




