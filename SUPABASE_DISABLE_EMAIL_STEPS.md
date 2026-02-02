# 🎯 Quick Steps: Disable Email Verification in Supabase

## ⚡ 5-Minute Setup

Follow these exact steps to disable email verification:

---

## Step 1: Access Supabase Dashboard

1. Open your browser and go to: **https://app.supabase.com**
2. Log in with your credentials
3. Click on your **Nexus** project from the project list

---

## Step 2: Navigate to Email Provider Settings

1. In the left sidebar, click **"Authentication"** (🔐 icon)
2. At the top of the page, click the **"Providers"** tab
3. Scroll down to find **"Email"** in the providers list
4. Click on **"Email"** to expand its settings

---

## Step 3: Disable Email Confirmation

1. Look for the toggle labeled **"Confirm email"**
   - It should currently be **ON** (enabled/green)
2. Click the toggle to turn it **OFF** (disabled/gray)
3. A confirmation dialog may appear - click **"Confirm"** or **"Yes"**
4. Scroll to the bottom and click the **"Save"** button

---

## Step 4: Verify the Change

1. The page should show a success message
2. The "Confirm email" setting should now show as **"Disabled"**
3. Refresh the page to ensure the setting persisted

---

## ✅ That's It!

Your Supabase is now configured for instant registration without email verification.

---

## 🧪 Next Steps

### 1. Verify Existing Users
Run this command to give access to existing unverified users:

```bash
node verify-existing-users.js
```

### 2. Test Registration
- Open your app (dev or production)
- Go to the registration page
- Register a new test user
- Should redirect immediately to `/companion` page
- No email verification needed!

---

## 🔄 To Re-enable Email Verification Later

When your SMTP is fixed:

1. Go back to: **Authentication → Providers → Email**
2. Turn **ON** the "Confirm email" toggle
3. Click **Save**

Your code already handles both scenarios, so no code changes needed!

---

## ❓ Troubleshooting

**If registration still asks for email verification:**
- Clear browser cache
- Sign out and try again
- Wait 1-2 minutes for Supabase settings to propagate
- Double-check the toggle is OFF in Supabase

**If you can't find the settings:**
- Make sure you're in the correct project
- Check you have admin/owner permissions
- Try refreshing the Supabase dashboard

---

## 📱 Support

Having issues? Check:
1. Supabase dashboard shows "Confirm email: Disabled"
2. Browser console for any errors
3. Network tab shows successful signup response with session

---

**Status**: Ready to implement ✅
**Time Required**: 5 minutes
**Technical Level**: No coding required

