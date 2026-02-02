# 🧪 GA4 User-ID Tracking - Testing Guide

## ✅ Implementation Complete

All code changes have been implemented:
- ✅ SQL migration executed in Supabase
- ✅ API endpoint `/api/auth/user-hash` created
- ✅ Frontend GA tracking utility (`gaTracking.ts`)
- ✅ AuthContext integration
- ✅ Google Analytics script updated
- ✅ PII protection guards added

---

## 🧪 Testing Steps

### Step 1: Verify Database Migration

**Check in Supabase Dashboard:**

1. Go to **Table Editor** → `user_email_hashes`
2. Verify the table exists with columns:
   - `user_id` (UUID, Primary Key)
   - `email_hash` (TEXT, Unique)
   - `created_at` (TIMESTAMPTZ)
   - `updated_at` (TIMESTAMPTZ)

3. Check if existing users have hashes:
   ```sql
   SELECT COUNT(*) FROM user_email_hashes;
   ```
   Should return a number > 0 if you have existing users.

---

### Step 2: Test API Endpoint

**Option A: Browser Console Test (While Logged In)**

1. Open your app and log in
2. Open Browser DevTools (F12) → Console
3. Run this:

```javascript
// Get your auth token
const auth = localStorage.getItem('nexus-auth');
const parsed = JSON.parse(auth);
const token = parsed?.currentSession?.access_token || parsed?.access_token;

if (!token) {
  console.error('❌ No auth token found. Please log in first.');
} else {
  // Test the endpoint
  fetch('/api/auth/user-hash', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  })
  .then(r => r.json())
  .then(data => {
    console.log('📊 API Response:', data);
    if (data.success && data.emailHash) {
      console.log('✅ Email hash retrieved:', data.emailHash.substring(0, 20) + '...');
      console.log('✅ Hash length:', data.emailHash.length, '(should be 64 for SHA-256)');
    } else {
      console.error('❌ Failed to get email hash:', data);
    }
  })
  .catch(err => console.error('❌ Error:', err));
}
```

**Expected Result:**
```javascript
📊 API Response: {success: true, emailHash: "a1b2c3d4..."}
✅ Email hash retrieved: a1b2c3d4e5f6g7h8i9j0...
✅ Hash length: 64 (should be 64 for SHA-256)
```

**Option B: Terminal Test (with curl)**

```bash
# First, get your auth token from browser localStorage
# Then test:
curl -X GET http://localhost:8002/api/auth/user-hash \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

---

### Step 3: Test GA4 User-ID Tracking

**Browser Console Test:**

1. Log in to your app
2. Open DevTools (F12) → Console
3. Check if User-ID is set:

```javascript
// Check dataLayer
console.log('📊 dataLayer:', window.dataLayer);

// Check gtag config
console.log('📊 gtag config:', window.gtag);

// Verify User-ID is set
const hasUserId = window.dataLayer?.some(item => item.user_id);
if (hasUserId) {
  console.log('✅ User-ID found in dataLayer');
  const userEvent = window.dataLayer.find(item => item.user_id);
  console.log('✅ User-ID value:', userEvent.user_id);
  console.log('✅ User-ID length:', userEvent.user_id.length, '(should be 64)');
} else {
  console.warn('⚠️ User-ID not found in dataLayer yet');
  console.log('💡 Try refreshing the page or logging in again');
}
```

**Expected Result:**
```javascript
✅ User-ID found in dataLayer
✅ User-ID value: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
✅ User-ID length: 64 (should be 64)
```

---

### Step 4: Test Complete Flow

**Scenario 1: New User Signup**

1. Create a new test account
2. After signup, check browser console for:
   ```
   ✅ Session bridge successful
   ✅ GA Tracking: User-ID set successfully (hashed)
   ```
3. Verify in dataLayer:
   ```javascript
   window.dataLayer.filter(item => item.user_id)
   ```

**Scenario 2: Existing User Login**

1. Log out (if logged in)
2. Log in with existing account
3. Check console for:
   ```
   🔐 Auth state changed: SIGNED_IN
   ✅ Session bridge successful
   ✅ GA Tracking: User-ID set successfully (hashed)
   ```

**Scenario 3: Page Refresh**

1. While logged in, refresh the page (F5)
2. Check console for:
   ```
   ✅ GA Tracking: User-ID set successfully (hashed)
   ```
3. Verify User-ID persists in dataLayer

**Scenario 4: Logout**

1. Click logout
2. Check console for:
   ```
   ✅ GA Tracking: User-ID cleared
   ```
3. Verify User-ID is removed:
   ```javascript
   // Should return null or undefined
   window.dataLayer.find(item => item.user_id === null)
   ```

---

### Step 5: Verify PII Protection

**Test that NO PII is sent to GA:**

```javascript
// Check dataLayer for any PII
const piiFields = ['email', 'name', 'phone', 'phoneNumber', 'displayName'];
const dataLayerItems = window.dataLayer || [];

const foundPII = dataLayerItems.filter(item => {
  if (!item || typeof item !== 'object') return false;
  return Object.keys(item).some(key => 
    piiFields.some(field => key.toLowerCase().includes(field.toLowerCase()))
  );
});

if (foundPII.length > 0) {
  console.error('❌ PII FOUND IN DATALAYER:', foundPII);
} else {
  console.log('✅ No PII found in dataLayer - Protection working!');
}

// Verify only hashed email (user_id) is present
const userIdItems = dataLayerItems.filter(item => item.user_id);
if (userIdItems.length > 0) {
  const userId = userIdItems[0].user_id;
  // SHA-256 hashes are always 64 characters (hex)
  if (userId.length === 64 && /^[a-f0-9]+$/i.test(userId)) {
    console.log('✅ User-ID is properly hashed (SHA-256)');
  } else {
    console.error('❌ User-ID does not look like a hash!');
  }
}
```

---

### Step 6: Verify in Google Analytics

**In GA4 Dashboard:**

1. Go to **Admin** → **Data Streams** → Select your stream
2. Go to **DebugView** (or use Real-time reports)
3. Trigger an event (e.g., page view, button click)
4. Check the event details:
   - **User-ID** should be present
   - **User-ID** should be a 64-character hex string (SHA-256 hash)
   - **NO email, name, or phone** should appear in event parameters

**Expected in GA4:**
- ✅ `user_id`: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`
- ❌ NO `email` field
- ❌ NO `name` field
- ❌ NO `phone` field

---

## 🐛 Troubleshooting

### Issue: API returns 401 Unauthorized

**Solution:**
- Make sure you're logged in
- Check that your auth token is valid
- Verify session bridge completed successfully

### Issue: Email hash not found

**Solution:**
- Check if user exists in `auth.users` table
- Verify user has an email address
- Check if trigger fired: `SELECT * FROM user_email_hashes WHERE user_id = 'YOUR_USER_ID';`
- If missing, the API will compute it on-the-fly

### Issue: User-ID not set in GA

**Solution:**
1. Check browser console for errors
2. Verify `gaTracking.ts` is imported correctly
3. Check that `gtag` function is available: `typeof window.gtag`
4. Verify AuthContext is calling `fetchEmailHash()` and `setGAUserId()`

### Issue: PII appears in dataLayer

**Solution:**
- Check `sanitizeForGA()` function in `gaTracking.ts`
- Verify no other code is pushing PII to dataLayer
- Check custom event tracking calls

---

## ✅ Success Criteria

Your implementation is working correctly if:

- [x] `user_email_hashes` table exists in Supabase
- [x] API endpoint `/api/auth/user-hash` returns hashed email
- [x] User-ID appears in `window.dataLayer` after login
- [x] User-ID is set in `gtag('config')` call
- [x] User-ID persists after page refresh
- [x] User-ID is cleared on logout
- [x] NO PII (email, name, phone) appears in dataLayer
- [x] User-ID is 64-character hex string (SHA-256)
- [x] GA4 DebugView shows User-ID in events

---

## 🎯 Next Steps After Testing

1. **Monitor GA4 Reports:**
   - Check User-ID coverage in GA4
   - Verify unique user counts are accurate
   - Test with multiple accounts from same device

2. **Production Deployment:**
   - Ensure all environment variables are set
   - Test on production domain
   - Verify GA4 tracking in production

3. **Documentation:**
   - Document the User-ID tracking for your team
   - Note the PII protection measures
   - Keep SQL migration file for future reference

---

## 📊 Expected Behavior Summary

| Scenario | Expected Behavior |
|---------|------------------|
| **New Signup** | Hash computed automatically, User-ID set in GA |
| **Login** | Hash fetched from DB, User-ID set in GA |
| **Page Refresh** | Hash fetched, User-ID persists in GA |
| **Email Change** | Hash updated automatically, User-ID updated in GA |
| **Logout** | User-ID cleared from GA |
| **Multiple Accounts** | Each account gets unique User-ID (different hashes) |

---

## 🆘 Need Help?

If you encounter issues:

1. Check browser console for errors
2. Check server logs for API errors
3. Verify Supabase table structure
4. Test API endpoint directly (Step 2)
5. Check GA4 DebugView for events

---

**Implementation Date:** $(date)
**Status:** ✅ Ready for Testing


