# Railway Environment Variables Setup Guide

## ✅ Build Status: SUCCESSFUL

Your application builds and deploys successfully! The only remaining step is to configure environment variables in Railway.

## 🚀 Quick Setup (5 minutes)

### Step 1: Generate JWT_SECRET

Run this command in your terminal:

```bash
node generate-jwt-secret.js
```

Copy the generated value - you'll need it in Step 3.

### Step 2: Gather Your Credentials

You'll need these from your existing services:

#### Supabase Credentials
1. Go to: https://app.supabase.com/project/YOUR_PROJECT/settings/api
2. Copy **Project URL** (looks like: `https://xxxxx.supabase.co`)
3. Copy **service_role** key (the secret one, NOT anon key)

#### Venice AI API Key (for AI chat features)
1. Go to: https://venice.ai/
2. Sign in and navigate to API settings
3. Copy your API key

### Step 3: Configure Railway Environment Variables

1. **Open Railway Dashboard**
   - Go to: https://railway.app/
   - Navigate to your project
   - Click on your service

2. **Add Variables Tab**
   - Click "Variables" tab
   - Click "New Variable" for each variable below

3. **Add These Required Variables:**

   ```env
   # CRITICAL - App won't start without this
   JWT_SECRET=<paste value from Step 1>
   
   # Supabase Configuration (from Step 2)
   SUPABASE_URL=<your-project-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   
   # AI Features
   VENICE_API_KEY=<your-venice-api-key>
   
   # Port Configuration
   PORT=${{PORT}}
   
   # CORS Configuration (use your Railway app URL)
   CORS_ALLOWLIST=https://your-app-name.railway.app
   
   # Cookie Configuration
   COOKIE_DOMAIN=.railway.app
   
   # Security (recommended)
   CSRF_ENABLED=true
   ```

4. **Click "Deploy"** to restart with new variables

### Step 4: Verify Deployment

After Railway redeploys, check the logs. You should see:

✅ **Success:**
```
✅ Server listening on port XXXX
✅ Socket.io server initialized
```

❌ **Before (error you're seeing now):**
```
Missing required environment variables: JWT_SECRET
```

## 🔧 Troubleshooting

### Still seeing JWT_SECRET error?
- Double-check the variable name is exactly `JWT_SECRET` (case-sensitive)
- Ensure the value doesn't have extra spaces
- Try redeploying: Railway → Service → "Deploy" button

### CORS errors after fixing JWT_SECRET?
- Update `CORS_ALLOWLIST` with your actual Railway URL
- Format: `https://your-service-name.railway.app`

### Need to find your Railway URL?
- Go to your service in Railway
- Click "Settings" tab
- Look for "Domains" section
- Copy the `railway.app` domain

## 📚 Additional Configuration (Optional)

### Admin Users
Add admin emails (comma-separated):
```env
ROLE_ADMIN_EMAILS=admin@example.com,another@example.com
```

### Captcha Protection
If you're using captcha:
```env
CAPTCHA_PROVIDER=hcaptcha
HCAPTCHA_SECRET=your-hcaptcha-secret
```

### Custom Domain
If using a custom domain:
```env
COOKIE_DOMAIN=.yourdomain.com
CORS_ALLOWLIST=https://yourdomain.com,https://www.yourdomain.com
```

## 🎉 You're Done!

Once environment variables are configured, your app will:
- ✅ Start successfully
- ✅ Accept user authentication
- ✅ Enable AI chat features
- ✅ Serve your React frontend
- ✅ Handle WebSocket connections

## 📖 Reference Documentation

- Full secrets guide: `SECRETS.md`
- Complete setup: `COMPLETE_SETUP_GUIDE.md`
- Environment validation code: `server/utils/envCheck.js`

## 🆘 Need Help?

If you encounter any issues after setting environment variables, check:
1. Railway deployment logs for specific errors
2. Ensure all required variables are set (JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
3. Verify your Supabase credentials are correct
4. Check that PORT is set to `${{PORT}}` (Railway's dynamic port variable)

