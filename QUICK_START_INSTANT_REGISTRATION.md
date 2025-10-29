# ⚡ Quick Start: Instant Registration (3 Steps)

## 🎯 Goal
Allow users to register and access the platform immediately without email verification.

---

## 📋 3 Simple Steps

### Step 1: Disable Email Verification in Supabase (2 min)

1. Go to https://app.supabase.com → Your Nexus Project
2. **Authentication** → **Providers** → **Email**
3. Turn **OFF** the "Confirm email" toggle
4. Click **Save**

✅ Done!

---

### Step 2: Verify Existing Users (1 min)

Run this command:

```bash
node verify-existing-users.js
```

This gives access to users who registered before but couldn't verify.

✅ Done!

---

### Step 3: Test (1 min)

1. Open your app
2. Go to registration page
3. Register with test email
4. Should redirect to `/companion` immediately

✅ Done!

---

## 🎉 That's It!

Users can now:
- ✅ Register instantly
- ✅ Access platform immediately
- ✅ No email verification needed
- ✅ Start using features right away

---

## 📖 Need More Details?

- **Setup Guide**: `SUPABASE_DISABLE_EMAIL_STEPS.md`
- **Full Deployment**: `INSTANT_REGISTRATION_DEPLOYMENT.md`
- **Complete Guide**: `DISABLE_EMAIL_VERIFICATION_GUIDE.md`

---

## 🔄 To Re-enable Later

When SMTP is fixed:
1. Go back to Supabase
2. Turn **ON** "Confirm email"
3. Save

No code changes needed!

---

**Total Time**: ~4 minutes
**Difficulty**: Easy
**Risk**: Very Low

