# 🔑 Venice API Key Setup - Complete Guide

## 🐛 Problem

Your character chat shows this error:
```
"I apologize, but I'm having trouble responding right now. Please try again."
```

**Root Cause:** The Venice AI API key is not configured in your server environment.

---

## ✅ Quick Fix (5 Minutes)

### Option 1: Automated Setup (Recommended)

```powershell
.\fix-venice-api-key.ps1
```

This script will:
1. Check if `.env` file exists
2. Prompt you for your Venice API key
3. Create/update the `.env` file
4. Restart the server
5. Get you up and running! 🚀

### Option 2: Manual Setup

**Step 1: Get Your Venice API Key**

1. Go to **https://venice.ai/**
2. Sign up or log in to your account
3. Navigate to: **Settings → API Keys**
4. Click **"Create New Key"**
5. Copy the API key (starts with something like `sk-...`)

**Step 2: Create `.env` File**

Create a file named `.env` in the `server` directory:

```bash
# server/.env

VENICE_API_KEY=sk-your-actual-api-key-here

# Optional settings
VENICE_MAX_CONCURRENT=50
VENICE_TIMEOUT=30000

# Other required settings
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

PORT=5000
NODE_ENV=development
SESSION_SECRET=your_random_secret_here
```

**Step 3: Restart Server**

```bash
cd server
npm start
```

**Step 4: Test**

1. Refresh your browser
2. Try sending a message to your character
3. Should work now! ✅

---

## 🔍 Verification

### Check if API Key is Set

Run this in PowerShell:

```powershell
cd server
node -e "require('dotenv').config(); console.log('VENICE_API_KEY:', process.env.VENICE_API_KEY ? '✅ Set' : '❌ Not Set')"
```

**Expected Output:**
```
VENICE_API_KEY: ✅ Set
```

### Test Venice API Connection

Run the test script:

```bash
cd server
node test-venice.js
```

**Expected Output:**
```
🧪 Testing Venice AI Connection...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VENICE_API_KEY: ✅ Found
   Key length: 45
✅ Venice AI connection successful!
```

---

## 🚨 Troubleshooting

### Issue 1: "VENICE_API_KEY is not set"

**Cause:** The `.env` file is missing or API key is not set

**Solution:**
```powershell
.\fix-venice-api-key.ps1
```

### Issue 2: "401 Unauthorized" from Venice API

**Cause:** Invalid API key

**Solution:**
1. Check your API key at https://venice.ai/settings/api-keys
2. Make sure you copied the entire key
3. Update `.env` file with correct key
4. Restart server

### Issue 3: Still getting error after setting key

**Cause:** Server hasn't reloaded the environment

**Solution:**
```bash
# Stop server (Ctrl+C)
cd server
npm start
```

### Issue 4: ".env file not found"

**Cause:** File is in wrong location

**Solution:**
Make sure `.env` is in the `server` directory:
```
nexus_rev_version/
  ├── server/
  │   ├── .env          ← Should be here!
  │   ├── controllers/
  │   ├── routes/
  │   └── ...
  └── client/
```

---

## 📝 Environment File Template

Here's a complete `.env` template:

```bash
# ============================================
# VENICE AI API CONFIGURATION
# ============================================
# Get your key from: https://venice.ai/settings/api-keys

VENICE_API_KEY=sk-your-actual-api-key-here

# Venice AI Settings (Optional)
VENICE_MAX_CONCURRENT=50
VENICE_TIMEOUT=30000

# ============================================
# SUPABASE CONFIGURATION
# ============================================
# Get these from: https://supabase.com/dashboard

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ============================================
# SERVER CONFIGURATION
# ============================================

PORT=5000
NODE_ENV=development

# ============================================
# SESSION CONFIGURATION
# ============================================
# Generate a random secret for production

SESSION_SECRET=your_random_session_secret_here
```

---

## 🎯 How It Works

### Backend Flow

1. **User sends message** → Frontend makes request to `/api/chat/ai/claude`
2. **Server receives request** → Checks `process.env.VENICE_API_KEY`
3. **If key exists** → Makes request to Venice AI API
4. **Venice responds** → Server processes and returns to frontend
5. **If key missing** → Returns error: "I apologize, but I'm having trouble..."

### Code Reference

**Location:** `server/controllers/chatAiController.js`

```javascript
// Line 116-119
if (!process.env.VENICE_API_KEY) {
  console.error('❌ VENICE_API_KEY is not set in environment variables');
  throw new Error('Venice AI API key not configured');
}

// Line 153-158
veniceResponse = await fetch('https://api.venice.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.VENICE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  // ...
});
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Store API key in `.env` file
- Add `.env` to `.gitignore`
- Keep API key secret
- Rotate keys periodically
- Use environment variables

### ❌ DON'T:
- Commit `.env` to version control
- Share API key publicly
- Hardcode API key in code
- Use same key for dev and production
- Leave default values

---

## 📊 Testing Checklist

After setting up your API key, verify:

- [ ] `.env` file exists in `server/` directory
- [ ] `VENICE_API_KEY` is set in `.env`
- [ ] API key is not the default placeholder
- [ ] Server restarted after setting key
- [ ] Test script passes (`node test-venice.js`)
- [ ] Character chat responds without error
- [ ] No "trouble responding" messages

---

## 🎉 Success Indicators

You'll know it's working when:

1. **Console logs show:**
   ```
   🔑 Venice AI Request: {
     model: 'qwen3-4b',
     hasApiKey: true,
     ...
   }
   ```

2. **Character responds naturally:**
   ```
   User: "hey!"
   Character: "Hey there! How's it going? 😊"
   ```

3. **No error messages** in browser console

4. **Server logs show:**
   ```
   ✅ Venice AI response received (2.3s)
   ```

---

## 💡 Pro Tips

### 1. **Test API Key Immediately**
After getting your key, test it:
```bash
cd server
node test-venice.js
```

### 2. **Monitor Usage**
Check your Venice AI dashboard for API usage and limits

### 3. **Keep Backup Key**
Generate a backup API key for emergencies

### 4. **Set Rate Limits**
Configure `VENICE_MAX_CONCURRENT` based on your plan:
- Free tier: `10`
- Basic: `30`
- Pro: `50+`

### 5. **Enable Logging**
Watch server console for API issues:
```bash
cd server
npm start
# Watch for Venice AI logs
```

---

## 📞 Still Having Issues?

### Check Server Logs
Look for these error messages:
```
❌ VENICE_API_KEY is not set in environment variables
❌ Venice AI Error Response: 401
⚠️ Venice AI queue full
```

### Verify Everything
Run this checklist:
```powershell
# 1. Check .env exists
Test-Path server\.env

# 2. Check key is set
cd server
node -e "require('dotenv').config(); console.log(process.env.VENICE_API_KEY ? 'Set' : 'Not Set')"

# 3. Test connection
node test-venice.js

# 4. Restart server
npm start
```

---

## 🚀 Quick Commands Reference

```bash
# Setup (automated)
.\fix-venice-api-key.ps1

# Test API key
cd server && node test-venice.js

# Restart server
cd server && npm start

# Check logs
cd server && npm start | Select-String "Venice"

# Verify .env
cat server\.env
```

---

## 📁 Related Files

| File | Purpose |
|------|---------|
| `server/.env` | Environment variables (API key here) |
| `fix-venice-api-key.ps1` | Automated setup script |
| `server/test-venice.js` | API connection test |
| `server/controllers/chatAiController.js` | Venice AI integration |
| `VENICE_API_KEY_SETUP.md` | This guide |

---

## ✅ Final Checklist

- [ ] Got Venice API key from https://venice.ai/
- [ ] Created `server/.env` file
- [ ] Added `VENICE_API_KEY=sk-...` to `.env`
- [ ] Saved the file
- [ ] Restarted server (`npm start`)
- [ ] Tested connection (`node test-venice.js`)
- [ ] Tried character chat
- [ ] Everything working! 🎉

---

**Status:** Ready to chat with AI characters! 🚀

**Support:** If issues persist, check server logs and ensure all steps completed.

---

*Last Updated: October 10, 2025*
*Version: 1.0*

