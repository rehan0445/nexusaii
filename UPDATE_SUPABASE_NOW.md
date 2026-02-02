# ⚠️ CRITICAL: Update Supabase Redirect URLs NOW

## 🚨 Your Google OAuth Won't Work Until You Do This!

---

## 🎯 Quick 2-Minute Fix

### Step 1: Get Your Railway URL

1. Go to: https://railway.app
2. Click your Nexus project
3. Click your service
4. Find **Domains** section
5. Copy your URL (e.g., `https://nexus-production-abc123.railway.app`)

---

### Step 2: Update Supabase

1. Go to: https://app.supabase.com
2. Select your Nexus project
3. Click: **Authentication** (left sidebar)
4. Click: **URL Configuration**
5. Scroll to: **Redirect URLs**

---

### Step 3: Update the URLs

**REMOVE these old URLs (if present):**
```
❌ https://your-railway-app.railway.app/companion
❌ http://localhost:5173/companion
```

**ADD these new URLs:**
```
✅ https://YOUR-ACTUAL-RAILWAY-URL.railway.app/auth/callback
✅ http://localhost:5173/auth/callback
```

**Example (replace with YOUR Railway URL):**
```
https://nexus-production-abc123.railway.app/auth/callback
http://localhost:5173/auth/callback
```

---

### Step 4: Save

Click **"Save"** button at the bottom!

---

## ✅ That's It!

Now test:
1. Wait for Railway deployment to complete (~4-6 minutes)
2. Go to your Railway URL: `/login`
3. Click "Continue with Google"
4. Sign in with Google
5. You should see loading screen → then /companion page
6. You're logged in! ✅

---

## 🔍 What If It Doesn't Work?

### Still redirects to localhost?
- Check you saved Supabase settings
- Clear browser cache
- Try in incognito mode

### "Invalid redirect URL" error?
- Double-check the Railway URL is correct
- Make sure you added `/auth/callback` at the end
- No typos in the URL

### Can't find Railway URL?
Railway dashboard → Your service → Settings → Domains

---

## 📋 Final Redirect URLs Checklist

Your Supabase **Redirect URLs** should include:

- [ ] `https://[your-railway-url].railway.app/auth/callback`
- [ ] `http://localhost:5173/auth/callback`
- [ ] (Optional) `https://[your-railway-url].railway.app`
- [ ] (Optional) `http://localhost:5173`

**4 URLs total recommended**

---

## ⏰ Do This NOW

The code is already pushed and deploying. Just update Supabase and you're done!

**Time needed:** 2 minutes  
**Difficulty:** Easy  
**Importance:** CRITICAL ⚠️

---

Railway is deploying your fix right now... Update Supabase while you wait! 🚀

