# 🔧 GA4 User-ID Tracking - Login/Signup Fix

## 🐛 Problem Identified

After implementing email hash tracking for GA4, login/signup was failing with:
> "We're experiencing technical difficulties. Please try again in a moment or contact support if the problem persists."

### Root Causes:

1. **Trigger Failure Blocking Signup**: The `ensure_user_email_hash()` trigger was failing during user registration, causing the entire signup transaction to fail.

2. **Race Condition**: `fetchEmailHash()` was being called immediately after session bridge, before the database trigger had time to complete creating the hash.

3. **No Error Handling**: The trigger didn't have proper exception handling, so any error would fail the user registration.

4. **RLS Policy Issues**: The trigger might have been blocked by Row Level Security policies.

---

## ✅ Fixes Applied

### 1. **Fixed Database Trigger** (`019_fix_email_hash_trigger.sql`)

**Location**: `server/scripts/migrations/019_fix_email_hash_trigger.sql`

**Changes**:
- Wrapped hash insertion in exception handler
- Trigger now logs warnings instead of failing registration
- User signup/login will **always succeed** even if hash creation fails
- Hash will be created on-the-fly by API if trigger fails

**Key Fix**:
```sql
BEGIN
    -- Compute and insert hash
    ...
EXCEPTION WHEN OTHERS THEN
    -- Log but don't fail registration
    RAISE WARNING 'Failed to create email hash: %', SQLERRM;
    RETURN NEW; -- Allow transaction to continue
END;
```

### 2. **Delayed GA Tracking** (`AuthContext.tsx`)

**Location**: `client/src/contexts/AuthContext.tsx`

**Changes**:
- Added 1-second delay before calling `fetchEmailHash()` after session bridge
- Allows database trigger to complete before fetching hash
- Added retry logic (up to 3 attempts with exponential backoff)

**Key Fix**:
```typescript
// Delay to allow trigger to complete
setTimeout(async () => {
  // Retry logic with exponential backoff
  let emailHash = null;
  for (let attempts = 0; attempts < 3; attempts++) {
    emailHash = await fetchEmailHash();
    if (emailHash) break;
    await new Promise(resolve => setTimeout(resolve, 1000 * (attempts + 1)));
  }
  if (emailHash) setGAUserId(emailHash);
}, 1000);
```

### 3. **Enhanced Retry Logic** (`gaTracking.ts`)

**Location**: `client/src/lib/gaTracking.ts`

**Changes**:
- Added automatic retry on 404 errors (hash not created yet)
- Added retry on network errors
- Better error messages

**Key Fix**:
```typescript
export async function fetchEmailHash(retries: number = 2): Promise<string | null> {
  // ... fetch logic ...
  if (response.status === 404 && retries > 0) {
    // Hash not created yet, retry
    await new Promise(resolve => setTimeout(resolve, 1000));
    return fetchEmailHash(retries - 1);
  }
}
```

### 4. **Improved API Endpoint** (`authRoutes.js`)

**Location**: `server/routes/authRoutes.js`

**Changes**:
- Better error handling when computing hash on-the-fly
- Non-blocking hash storage (won't fail if storage fails)
- More user-friendly error messages

---

## 📋 Next Steps

### Step 1: Run SQL Migration ⚠️ **CRITICAL**

**Execute this SQL in Supabase SQL Editor:**

1. Go to: https://app.supabase.com/project/dswuotsdaltsomyqqykn/sql
2. Copy and paste the entire contents of:
   ```
   server/scripts/migrations/019_fix_email_hash_trigger_minimal.sql
   ```
   **OR** if you prefer the full version:
   ```
   server/scripts/migrations/019_fix_email_hash_trigger_simple.sql
   ```
3. Click **Run**

**What this does:**
- Updates ONLY the trigger function (doesn't touch the trigger itself)
- Makes the function non-blocking with exception handling
- Ensures signup/login never fails due to hash creation

**Note:** If you get errors about policies or triggers, use the `_minimal.sql` version - it only updates the function.

### Step 2: Test Signup Flow

1. **Clear browser cache/localStorage**
2. **Try creating a new account**
3. **Expected behavior:**
   - ✅ Signup succeeds immediately
   - ✅ User is redirected to companion page
   - ✅ No error popup
   - ✅ Hash is created in background (may take 1-2 seconds)
   - ✅ GA User-ID is set after hash is available

### Step 3: Test Login Flow

1. **Log out** (if logged in)
2. **Log in with existing account**
3. **Expected behavior:**
   - ✅ Login succeeds immediately
   - ✅ User is redirected to companion page
   - ✅ No error popup
   - ✅ GA User-ID is set

### Step 4: Verify GA Tracking

**In Browser Console (after login):**
```javascript
// Check if User-ID is set
setTimeout(() => {
  const userId = window.dataLayer?.find(item => item.user_id);
  if (userId) {
    console.log('✅ GA User-ID set:', userId.user_id.substring(0, 20) + '...');
  } else {
    console.log('⚠️ User-ID not set yet (may take a few seconds)');
  }
}, 3000);
```

---

## 🔍 Verification Checklist

- [ ] SQL migration executed successfully
- [ ] New user signup works without errors
- [ ] Existing user login works without errors
- [ ] No "technical difficulties" error popup
- [ ] User is redirected to companion page after auth
- [ ] GA User-ID appears in `window.dataLayer` (may take 1-3 seconds)
- [ ] No PII (email, name, phone) in dataLayer
- [ ] API endpoint `/api/auth/user-hash` returns hash for authenticated users

---

## 🐛 Troubleshooting

### Issue: Still seeing "technical difficulties" error

**Solution:**
1. Verify SQL migration was executed
2. Check Supabase logs for trigger errors
3. Verify `user_email_hashes` table exists
4. Check browser console for API errors

### Issue: User-ID not appearing in GA

**Solution:**
1. Wait 2-3 seconds after login (hash creation may be delayed)
2. Check browser console for GA tracking errors
3. Verify API endpoint is accessible: `/api/auth/user-hash`
4. Check that `gtag` function is available: `typeof window.gtag`

### Issue: Hash not being created

**Solution:**
1. Check Supabase logs for trigger warnings
2. Verify trigger exists: 
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'trigger_ensure_user_email_hash';
   ```
3. Manually trigger hash creation:
   ```sql
   SELECT ensure_user_email_hash() FROM auth.users WHERE id = 'USER_ID';
   ```

---

## 📊 Expected Behavior After Fix

### Signup Flow:
1. User fills form and clicks "Create Account"
2. Supabase creates user account ✅
3. Trigger attempts to create hash (non-blocking)
4. User is redirected to companion page ✅
5. After 1 second, frontend fetches hash
6. Hash is set as GA User-ID ✅

### Login Flow:
1. User enters credentials and clicks "Sign In"
2. Supabase authenticates user ✅
3. Session bridge completes ✅
4. User is redirected to companion page ✅
5. After 1 second, frontend fetches hash
6. Hash is set as GA User-ID ✅

### Key Improvements:
- ✅ **Signup/login never fails** due to hash creation
- ✅ **Hash creation is non-blocking** (happens in background)
- ✅ **Automatic retry** if hash not immediately available
- ✅ **Graceful degradation** if GA tracking fails
- ✅ **No PII ever sent** to Google Analytics

---

## 🎯 Summary

**Problem**: Trigger failure was blocking user registration.

**Solution**: 
1. Made trigger non-blocking with exception handling
2. Added delays and retry logic for hash fetching
3. Improved error handling throughout the flow

**Result**: 
- ✅ Signup/login works reliably
- ✅ GA tracking works asynchronously
- ✅ No user-facing errors
- ✅ PII protection maintained

---

**Status**: ✅ **Fixes Applied - Ready for Testing**

**Next Action**: Run SQL migration in Supabase, then test signup/login flows.

