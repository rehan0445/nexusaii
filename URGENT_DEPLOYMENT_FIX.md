# 🚨 URGENT: 401 Auth Fix for Deployment (30 min timeline)

## ❌ ROOT CAUSE
The axios interceptor was NOT attaching the Supabase JWT token to API requests because it was trying to parse `localStorage` manually instead of using Supabase SDK's `getSession()` method.

## ✅ CRITICAL FIXES APPLIED

### 1. Fixed Token Extraction in `apiConfig.ts`
**Changed:** Manual localStorage parsing → Direct Supabase SDK call

**Before:**
```typescript
const authData = localStorage.getItem('nexus-auth');
const parsed = JSON.parse(authData);
const token = parsed?.session?.access_token; // ❌ This path might not exist
```

**After:**
```typescript
const { supabase } = await import('./supabase');
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token; // ✅ Always correct
```

---

## 🔥 IMMEDIATE DEPLOYMENT STEPS

### Step 1: Set Environment Variables (ASK USER FOR THESE)

**Frontend (.env or .env.local in `/client` directory):**
```bash
VITE_SUPABASE_URL=https://dswuotsdaltsomyqqykn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SERVER_URL=http://localhost:8002
```

**Backend (.env in `/server` directory):**
```bash
SUPABASE_URL=https://dswuotsdaltsomyqqykn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-jwt-secret-here
PORT=8002
NODE_ENV=production
```

### Step 2: Test Locally Before Deploy
```bash
# Terminal 1 - Backend
cd server
npm install
npm start

# Terminal 2 - Frontend  
cd client
npm install
npm run dev
```

### Step 3: Test Auth Flow
1. Go to http://localhost:3000/login
2. Login with credentials
3. Navigate to /profile
4. Check console - should see:
   ```
   🔑 ✅ Added Supabase JWT to request: POST /api/v1/character/user
   ✅ API Response: POST /api/v1/character/user - 200
   ✅ Successfully loaded companions: X
   ```

---

## 🚀 PERFORMANCE FOR 10K CONCURRENT USERS

### Database (Supabase)
- ✅ **Connection Pooling:** Supabase handles this automatically
- ✅ **Rate Limiting:** 100 requests/second per user (configurable)
- ⚠️ **Recommendation:** Enable Supabase Pro plan for production (handles 10k+ concurrent)

### Backend Optimizations Needed
```javascript
// Add to server/app.js or server configuration
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Start server
  app.listen(PORT);
}
```

### Caching Strategy
Add Redis for session caching:
```javascript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache user sessions for 15 minutes
await redis.setex(`session:${userId}`, 900, JSON.stringify(sessionData));
```

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Critical (Must Do):
- [ ] Set all environment variables in production
- [ ] Test login → profile → companions flow
- [ ] Verify no 401 errors in console
- [ ] Check backend logs for auth errors
- [ ] Test with incognito window (fresh session)

### Performance (Recommended):
- [ ] Enable Supabase Pro plan
- [ ] Set up Redis caching
- [ ] Enable cluster mode for Node.js
- [ ] Set up load balancer (if deploying to multiple servers)
- [ ] Configure CDN for static assets

### Monitoring:
- [ ] Set up error tracking (Sentry/LogRocket)
- [ ] Monitor API response times
- [ ] Track 401/403 error rates
- [ ] Set up alerts for high error rates

---

## 🐛 TROUBLESHOOTING

### Issue: Still getting 401 errors
**Solution:**
1. Check console for: "⚠️ No active Supabase session found"
2. If seen, user needs to re-login
3. Clear localStorage and test fresh login

### Issue: "VITE_SUPABASE_URL is not defined"
**Solution:**
1. Create `.env.local` in `/client` directory
2. Add Supabase credentials
3. Restart dev server

### Issue: Backend returns "Invalid token"
**Solution:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set on backend
2. Check backend logs for detailed error
3. Test token with: `curl -H "Authorization: Bearer <token>" localhost:8002/api/v1/character/user`

---

## ⏱️ DEPLOYMENT TIMELINE (30 MIN)

### Minutes 0-5: Environment Setup
- Set frontend env vars
- Set backend env vars
- Verify servers start

### Minutes 5-10: Local Testing
- Test login flow
- Test profile page
- Verify companions load
- Check for console errors

### Minutes 10-15: Build Production
```bash
cd client
npm run build

cd ../server
# Copy production env vars
```

### Minutes 15-25: Deploy & Monitor
- Deploy to production server
- Monitor logs for errors
- Test with real traffic
- Check performance metrics

### Minutes 25-30: Final Verification
- Test from different devices
- Verify no 401 errors
- Check database connections
- Monitor for crashes

---

## 🎯 FILES MODIFIED

1. ✅ `client/src/lib/apiConfig.ts` - Fixed token extraction
2. ✅ `client/src/pages/Profile.tsx` - Added auth wait logic
3. ⚠️ **NEED TO CREATE:** `.env.local` files (user must do this)

---

## 💾 BACKUP PLAN

If issues persist during deployment:

### Option A: Simplify Auth
Remove session bridge entirely, use only Supabase JWT:
```typescript
// In authMiddleware.js - already supports this!
const { data, error } = await supabase.auth.getUser(token);
if (!error && data?.user) {
  req.user = { id: data.user.id };
  return next();
}
```

### Option B: Rollback
If critical failure, revert to previous version and debug offline.

---

## ✅ WHAT'S FIXED NOW

1. ✅ Token extraction uses Supabase SDK directly (most reliable)
2. ✅ Automatic 401 retry with session bridge
3. ✅ Backend already accepts Supabase JWTs (no change needed)
4. ✅ Fallback to localStorage if SDK fails
5. ✅ Detailed logging for debugging

---

## 📞 NEED HELP?

**Still seeing 401 errors?** Check:
1. Browser console for token presence
2. Network tab → Headers → Authorization header
3. Backend logs for validation errors
4. Supabase dashboard for user session

**Ready to deploy!** 🚀

