# 🚀 NEXUS - QUICK SETUP GUIDE

## Step-by-Step Instructions (15 minutes)

### ✅ STEP 1: Create Supabase Account (2 minutes)

1. Go to: **https://supabase.com**
2. Click **"Sign In"** → Sign up with **GitHub** or **Google**
3. Click **"New Project"**
4. Fill in:
   - **Name:** `nexus-production`
   - **Database Password:** Create a strong password (SAVE IT!)
   - **Region:** Choose closest to you (US East, Europe, Asia Pacific)
   - **Plan:** FREE (500MB database, perfect for launch)
5. Click **"Create new project"**
6. ⏳ Wait 2-3 minutes for setup...

---

### ✅ STEP 2: Get Credentials (1 minute)

1. In Supabase dashboard, click **Settings** (⚙️ gear icon)
2. Click **"API"**
3. **Copy these TWO values:**
   - ✅ **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - ✅ **service_role key** (click "Reveal" to see it - it's long)

---

### ✅ STEP 3: Create Environment File (2 minutes)

#### Option A: Automatic (Recommended)
```bash
node create-env.js
```

Then edit `server/.env` and paste your Supabase credentials.

#### Option B: Manual
Create `server/.env` file with:
```env
SUPABASE_URL=<YOUR_SUPABASE_URL>
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY>
JWT_SECRET=your-random-secret-at-least-32-chars-long
PORT=8002
NODE_ENV=development
CORS_ALLOWLIST=http://localhost:3000,http://localhost:5173
CSRF_ENABLED=false
```

---

### ✅ STEP 4: Set Up Database Tables (3 minutes)

1. In Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New Query"**
3. Open the file: `SUPABASE_QUICK_SETUP.sql`
4. **Copy ENTIRE contents** (Ctrl+A, Ctrl+C)
5. **Paste** into SQL Editor
6. Click **"RUN"** button (bottom right)
7. ✅ Should say "Success" - all tables created!

---

### ✅ STEP 5: Create Storage Buckets (2 minutes)

Run this command:
```bash
node setup-supabase.js
```

This will create 3 storage buckets for images:
- `nexus-profile-images` (user profile pics)
- `nexus-character-image` (AI character avatars)
- `nexus-announcements` (announcement attachments)

---

### ✅ STEP 6: Update Network CORS (Optional - for network access)

If you want to access from other devices on your network:

1. Find your local IP address:
   - **Windows:** Open CMD → type `ipconfig` → look for "IPv4 Address"
   - **Mac/Linux:** Terminal → type `ifconfig` → look for "inet"

2. Edit `server/.env` and update CORS_ALLOWLIST:
   ```env
   CORS_ALLOWLIST=http://localhost:3000,http://localhost:5173,http://YOUR_IP:3000,http://YOUR_IP:5173
   ```
   Replace `YOUR_IP` with your actual IP (e.g., `192.168.1.10`)

---

### ✅ STEP 7: Start Your Server! (1 minute)

```bash
# Install dependencies (if not done)
cd server
npm install

# Start server
npm start
```

You should see:
```
🚀 Server is running on http://localhost:8002
🌐 Network access available on http://[YOUR_IP]:8002
```

---

### ✅ STEP 8: Start Frontend (1 minute)

```bash
# In a new terminal
cd client
npm install
npm run dev
```

---

## 🎉 DONE! Your Nexus app is live!

### 🧪 Test It:
1. Open browser: `http://localhost:5173` (or whatever port Vite shows)
2. Register a new account
3. Create a profile
4. Try creating a confession or character

---

## ⚠️ Troubleshooting

### "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
- Make sure `server/.env` file exists
- Check that you pasted the credentials correctly (no spaces)

### "CORS error" or "Not allowed by CORS"
- Add your frontend URL to `CORS_ALLOWLIST` in `server/.env`

### "Authentication required" errors
- Make sure `CSRF_ENABLED=false` in development
- Check that `JWT_SECRET` is set in `.env`

### Database errors
- Make sure you ran the SQL setup (`SUPABASE_QUICK_SETUP.sql`)
- Check that storage buckets were created

---

## 📊 Supabase Free Tier Limits

Your FREE Supabase account includes:
- ✅ 500 MB database (thousands of users)
- ✅ 1 GB file storage (hundreds of images)
- ✅ Unlimited API requests
- ✅ No credit card required
- ✅ Auto backups
- ✅ Works for MONTHS without issues

Perfect for launch! Upgrade later when you grow.

---

## 🔒 Security Notes

- **NEVER** commit `.env` file to git (it's already in .gitignore)
- **NEVER** share your `service_role` key publicly
- For production deployment, set `NODE_ENV=production` and configure proper CORS origins

---

## 🆘 Need Help?

Check that:
1. ✅ Supabase project is active (green status in dashboard)
2. ✅ `server/.env` has correct credentials
3. ✅ SQL migrations ran successfully
4. ✅ Storage buckets were created
5. ✅ Server is running on port 8002

Good luck with your launch! 🚀

