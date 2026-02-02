# 🚨 URGENT: Railway Deployment Fix Guide

## Immediate Actions Required

Your website is down due to Supabase connection timeouts. Follow these steps **in order**:

---

## ✅ Step 1: Disable the Problematic Trigger (CRITICAL)

1. **Go to Supabase SQL Editor:**
   - Visit: https://app.supabase.com/project/dswuotsdaltsomyqqykn/sql
   - Login if needed

2. **Run this SQL command:**
   ```sql
   -- Disable the auto-create user profile trigger
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   DROP FUNCTION IF EXISTS public.handle_new_user();
   ```

3. **Verify it's disabled:**
   ```sql
   SELECT trigger_name 
   FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```
   - Should return **0 rows**

---

## ✅ Step 2: Verify Railway Environment Variables

1. **Open Railway Dashboard:**
   - Go to: https://railway.app/
   - Navigate to your project
   - Click on your service
   - Click "Variables" tab

2. **Verify these variables exist:**

   ```
   SUPABASE_URL=https://dswuotsdaltsomyqqykn.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzd3VvdHNkYWx0c29teXFxeWtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4MzgyNiwiZXhwIjoyMDc0OTU5ODI2fQ.BVCW6hzW6DCY9NFG-Vc4aiLk470A5_0eCVrfjjUxldw
   VENICE_API_KEY=<your-venice-api-key>
   JWT_SECRET=<your-jwt-secret>
   PORT=${{PORT}}
   ```

3. **If any variables are missing:**
   - Click "New Variable"
   - Add the variable name and value
   - **DO NOT include quotes** around values

---

## ✅ Step 3: Redeploy to Railway

The code has been fixed with:
- ✅ Environment variable support for Supabase credentials
- ✅ Connection timeout handling (5-second timeout)
- ✅ Graceful error handling instead of crashes
- ✅ Circuit breaker pattern for database queries

**To deploy:**

1. **If you haven't pushed the fixes yet:**
   ```bash
   git add .
   git commit -m "fix: Add Supabase connection timeout handling and environment variable support"
   git push origin main
   ```

2. **Railway will auto-deploy** (takes 2-3 minutes)

---

## ✅ Step 4: Monitor the Deployment

1. **Watch Railway Logs:**
   - In Railway dashboard, click "Logs" tab
   - Look for these success messages:
     ```
     ✅ Using Supabase credentials from environment variables
     ✅ Server listening on port XXXX
     🔌 Socket.IO server ready
     ```

2. **Check for errors:**
   - If you see "⚠️ Using fallback Supabase credentials" → Environment variables not set
   - If you see "upstream connect error" → Trigger might still be active
   - If you see "❌ Missing SUPABASE_URL" → Add the environment variables

---

## 🔍 What Was Fixed

### 1. **Supabase Configuration** (`server/config/supabase.js`)
- Now uses environment variables first, with local fallback
- Logs which credentials are being used
- Added connection timeout configuration

### 2. **Error Handling** (characterController.js, viewsController.js)
- Added 5-second timeout for all database queries
- Graceful fallback instead of 500 errors
- Better error logging with full error details
- Circuit breaker pattern to prevent cascade failures

### 3. **Trigger Disabled**
- The `on_auth_user_created` trigger was causing excessive database load
- Will re-enable later with better configuration once site is stable

---

## ⚠️ Expected Behavior After Fix

1. **Website should load** within 30 seconds of deployment
2. **Database queries** will timeout after 5 seconds instead of hanging
3. **Errors will be graceful** - users won't see 500 errors
4. **Logs will be cleaner** - less spam, more useful error details

---

## 📝 Next Steps (After Site is Stable)

1. Monitor for 10-15 minutes to ensure stability
2. Check user registration/login works
3. Test character features
4. Optionally re-enable the trigger with improved error handling

---

## 🆘 If Site is Still Down

1. **Check Supabase Status:**
   - Visit: https://status.supabase.com/
   - Ensure no ongoing incidents

2. **Verify Supabase Credentials:**
   - Go to: https://app.supabase.com/project/dswuotsdaltsomyqqykn/settings/api
   - Confirm the URL and service_role key match what's in Railway

3. **Check Railway Service Logs:**
   - Look for the exact error message
   - Share the error if you need help

---

## 📊 Key Improvements

- **Timeout Handling:** 5-second timeout prevents infinite hangs
- **Graceful Degradation:** Returns empty data instead of crashing
- **Environment Variables:** Proper separation of credentials
- **Better Logging:** Full error details for debugging
- **Circuit Breaker:** Prevents cascade failures

Your site should be back online within 5-10 minutes of completing these steps! 🚀

