# 🚨 QUICK FIX: Venice API Not Working

## The Problem
Your character is saying: **"I apologize, but I'm having trouble responding right now."**

This means the **Venice API key is not configured**.

---

## ⚡ 2-Minute Fix

### Step 1: Get Your API Key
1. Go to **https://venice.ai/**
2. Login/Sign up
3. Go to **Settings → API Keys**
4. Click **Create New Key**
5. **Copy the key** (starts with `sk-...`)

### Step 2: Run This Script
```powershell
.\fix-venice-api-key.ps1
```

When prompted, **paste your API key** and press Enter.

### Step 3: Restart
The script will restart your server automatically.

### Step 4: Test
Refresh your browser and try chatting again! ✅

---

## 📝 Manual Method (If Script Doesn't Work)

1. **Create file:** `server/.env`

2. **Add this line:**
   ```
   VENICE_API_KEY=sk-your-actual-key-here
   ```

3. **Save the file**

4. **Restart server:**
   ```bash
   cd server
   npm start
   ```

5. **Refresh browser** and test!

---

## ✅ How to Know It's Fixed

**Before Fix:**
```
Character: "I apologize, but I'm having trouble responding..."
```

**After Fix:**
```
You: "hey!"
Character: "Hey there! How's it going? 😊"
```

---

## 🐛 Still Not Working?

### Check 1: Is the key in the right file?
```powershell
cat server\.env
```
Should show: `VENICE_API_KEY=sk-...`

### Check 2: Did server restart?
```bash
cd server
npm start
```

### Check 3: Is the key valid?
```bash
cd server
node test-venice.js
```
Should show: `✅ Venice AI connection successful!`

---

## 📞 Need More Help?

See full guide: **`VENICE_API_KEY_SETUP.md`**

Or run automated fix: **`.\fix-venice-api-key.ps1`**

---

**That's it!** Your character chat should work now. 🎉

