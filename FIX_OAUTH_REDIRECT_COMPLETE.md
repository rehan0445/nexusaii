# 🚨 COMPLETE FIX: Google OAuth Redirect Issue

## The REAL Problem

Supabase has **TWO different settings** that control OAuth redirects:

1. **Site URL** - The main domain (controls where Supabase thinks your app is)
2. **Redirect URLs** - Allowed callback URLs (whitelist)

**You need to configure BOTH!**

---

## ✅ COMPLETE FIX (5 Minutes)

### Step 1: Find Your Railway URL

1. Go to: https://railway.app
2. Click your Nexus project
3. Click your service
4. Find **Domains** section
5. Copy your full URL

**Example:** `https://nexus-production-abc123.railway.app`

---

### Step 2: Configure Supabase Site URL (CRITICAL!)

1. Go to: https://app.supabase.com
2. Select your project: **dswuotsdaltsomyqqykn**
3. Click: **Authentication** (left sidebar)
4. Click: **URL Configuration**

#### Set Site URL:
```
Site URL: https://YOUR-RAILWAY-URL.railway.app
```

**Example:**
```
Site URL: https://nexus-production-abc123.railway.app
```

⚠️ **DO NOT include `/auth/callback` in Site URL!**  
⚠️ **NO trailing slash!**

---

### Step 3: Configure Redirect URLs

In the same **URL Configuration** page, scroll down to **Redirect URLs**.

#### Add these URLs:

```
https://YOUR-RAILWAY-URL.railway.app/auth/callback
https://YOUR-RAILWAY-URL.railway.app/companion
https://YOUR-RAILWAY-URL.railway.app
http://localhost:5173/auth/callback
http://localhost:5173/companion
http://localhost:5173
```

**With your actual Railway URL!**

---

### Step 4: Additional Auth URL (Optional but Recommended)

Look for **Additional Redirect URLs** or just ensure these patterns are allowed:

```
https://YOUR-RAILWAY-URL.railway.app/*
http://localhost:5173/*
```

---

### Step 5: Save & Wait

1. Click **"Save"** at the bottom
2. Wait 30 seconds for Supabase to apply changes
3. Clear your browser cache (Ctrl+Shift+Delete)

---

## 🧪 Test Now

1. Go to your Railway URL: `https://your-app.railway.app/login`
2. Click **"Continue with Google"**
3. Sign in with Google
4. You should see:
   - Google OAuth page
   - Redirect to your Railway domain
   - Loading screen: "Completing Sign In..."
   - Redirect to `/companion`
   - ✅ You're logged in!

---

## 🔍 Still Having Issues?

### Check #1: Verify Site URL
```
✅ Should be: https://nexus-production-abc123.railway.app
❌ Not: http://localhost:5173
❌ Not: https://nexus-production-abc123.railway.app/
```

### Check #2: Verify Redirect URLs Include
```
✅ https://your-railway-url.railway.app/auth/callback
✅ http://localhost:5173/auth/callback
```

### Check #3: Google Cloud Console

You may also need to update Google OAuth settings:

1. Go to: https://console.cloud.google.com
2. Select your project
3. Go to: **APIs & Services** → **Credentials**
4. Click your OAuth 2.0 Client ID
5. Add to **Authorized redirect URIs**:
   ```
   https://dswuotsdaltsomyqqykn.supabase.co/auth/v1/callback
   ```

---

## 📋 Complete Supabase Configuration Checklist

Go to: https://app.supabase.com → Authentication → URL Configuration

- [ ] **Site URL** = Your Railway production URL (no trailing slash)
- [ ] **Redirect URLs** includes:
  - [ ] `https://your-railway-url.railway.app/auth/callback`
  - [ ] `https://your-railway-url.railway.app/companion`
  - [ ] `https://your-railway-url.railway.app`
  - [ ] `http://localhost:5173/auth/callback`
  - [ ] `http://localhost:5173/companion`
  - [ ] `http://localhost:5173`
- [ ] Clicked **Save**
- [ ] Waited 30 seconds
- [ ] Cleared browser cache

---

## 🎯 Why This Fixes It

### The Problem:
- Site URL was set to `http://localhost:5173`
- Google OAuth redirected back to localhost
- Localhost wasn't running on your device
- "Can't reach this page" error

### The Solution:
- Site URL now points to Railway production
- OAuth redirects to production domain
- AuthCallback page handles the redirect
- User lands on production /companion page
- ✅ Everything works!

---

## 🔧 Alternative: Test Locally First

If you want to test on localhost:

1. **Set Site URL to:** `http://localhost:5173`
2. **Run your dev server:** `cd client && npm run dev`
3. **Test at:** `http://localhost:5173/login`

Then switch Site URL back to Railway URL for production.

---

## 📸 Visual Guide

### Your Supabase Settings Should Look Like:

```
╔════════════════════════════════════════╗
║ Authentication → URL Configuration     ║
╠════════════════════════════════════════╣
║                                        ║
║ Site URL                               ║
║ ┌────────────────────────────────────┐ ║
║ │ https://nexus-production-xxx...    │ ║
║ └────────────────────────────────────┘ ║
║                                        ║
║ Redirect URLs                          ║
║ ┌────────────────────────────────────┐ ║
║ │ https://nexus.../auth/callback     │ ║
║ │ https://nexus.../companion         │ ║
║ │ http://localhost:5173/auth/callback│ ║
║ │ http://localhost:5173/companion    │ ║
║ └────────────────────────────────────┘ ║
║                                        ║
║           [Save] [Cancel]              ║
║                                        ║
╚════════════════════════════════════════╝
```

---

## ⚡ Quick Command to Get Railway URL

```bash
railway status
```

Or check in Railway dashboard under **Deployments** → **Domain**

---

## 🎉 After Fixing

Once configured correctly, your users will:

1. Click "Continue with Google"
2. See Google's login page
3. Authenticate
4. See your app's loading screen
5. Land on /companion page
6. Be fully logged in!

No more localhost errors! 🚀

---

**Your Supabase Project:** dswuotsdaltsomyqqykn  
**Your Supabase URL:** https://dswuotsdaltsomyqqykn.supabase.co

Update the Site URL to your Railway domain NOW! 🔥

