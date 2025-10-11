# Railway Full-Stack Deployment Guide

## ✅ Setup Complete!

Your application is now configured to deploy **both frontend and backend** together on Railway!

## 🎯 What Was Changed

### 1. Backend Now Serves Frontend Static Files

**File:** `server/app.js`

Added functionality to serve the React build:
- Serves static files from `client/dist/`
- Handles SPA routing (React Router works correctly)
- API routes remain on `/api/*`
- All other routes serve `index.html`

### 2. Frontend API Configuration Updated

**File:** `client/src/lib/config.ts`

Updated API URL detection:
- ✅ Development: Uses `localhost:8002` (as before)
- ✅ Railway: Uses same domain (no port)
- ✅ Auto-detects Railway deployments

### 3. Build Process

**File:** `package.json`

Build script already configured:
```bash
npm run build
```
This:
1. Installs client dependencies (with TypeScript/Vite)
2. Installs server dependencies
3. Builds React app → `client/dist/`
4. Server serves this build in production

## 🚀 How It Works on Railway

```
Railway Deployment Flow:
├── npm ci (install root deps)
├── npm run build
│   ├── Install client deps (with TypeScript & Vite)
│   ├── Install server deps
│   └── Build React → client/dist/
├── npm run start
│   └── Express server starts
│       ├── Serves API on /api/*
│       └── Serves React app on all other routes
└── ✅ Single URL for everything!
```

## 🔧 Railway Environment Variables

Make sure you have these configured in Railway → Variables:

### Required:
```env
JWT_SECRET=<your-generated-secret>
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
VENICE_API_KEY=<your-venice-api-key>
PORT=${{PORT}}
```

### Recommended:
```env
CORS_ALLOWLIST=https://your-app.railway.app
COOKIE_DOMAIN=.railway.app
CSRF_ENABLED=true
```

## 📱 How to Deploy

### 1. Commit Changes

```bash
git add .
git commit -m "Configure Railway full-stack deployment"
git push
```

### 2. Railway Auto-Deploys

Railway will automatically:
1. ✅ Build the frontend (Vite build)
2. ✅ Install all dependencies
3. ✅ Start the Express server
4. ✅ Serve frontend + backend from single URL

### 3. Access Your App

Go to your Railway URL:
```
https://your-app-xyz123.railway.app
```

You should see:
- ✅ React frontend loads
- ✅ API calls work (same domain)
- ✅ WebSocket connections work
- ✅ Authentication works
- ✅ All features functional

## 🔍 Testing the Deployment

### Frontend Test:
Visit: `https://your-app.railway.app/`
- Should show your React app

### API Test:
Visit: `https://your-app.railway.app/health`
- Should return API health check

### React Router Test:
Visit: `https://your-app.railway.app/login`
- Should show login page (not 404)

## 🐛 Troubleshooting

### Issue: Getting 404 errors
**Solution:** Make sure `client/dist/` folder exists after build
- Check Railway build logs for "vite build" success

### Issue: API calls fail with CORS errors
**Solution:** Update `CORS_ALLOWLIST` in Railway variables
```env
CORS_ALLOWLIST=https://your-actual-railway-url.railway.app
```

### Issue: "Frontend not found" error
**Solution:** Build failed. Check Railway logs for:
- TypeScript compilation errors
- Vite build errors
- Missing dependencies

### Issue: WebSocket connection fails
**Solution:** Railway uses WSS (secure WebSocket)
- Update Socket.IO config if needed
- Check `CORS_ALLOWLIST` includes your domain

## 📊 Performance Tips

### Cache Optimization
Static files are cached for 1 year (already configured):
```javascript
maxAge: '1y'  // JS, CSS, images cached
```

HTML is not cached (fresh on every reload):
```javascript
if (filepath.endsWith('.html')) {
  res.setHeader('Cache-Control', 'no-cache');
}
```

### Build Optimization
Client build uses Vite production optimizations:
- Code splitting
- Tree shaking
- Minification
- Asset optimization

## 🎉 Success Checklist

After deployment, verify:

- [ ] Railway URL loads your React app
- [ ] You can navigate between pages (React Router works)
- [ ] API calls work (check Network tab)
- [ ] Authentication works
- [ ] WebSocket connections establish
- [ ] No CORS errors in console
- [ ] Character chat responds
- [ ] All features functional

## 🔄 Future Deployments

Just push to main branch:
```bash
git push
```

Railway automatically:
1. Rebuilds frontend
2. Restarts backend
3. Deploys updated version

## 📝 Notes

- **Single deployment** = Frontend + Backend together
- **Same URL** for everything
- **No CORS issues** (same origin)
- **Simple management** (one service)
- **Cost**: Uses Railway compute for static files too

## 🆘 Need Help?

Check Railway logs:
```
Railway Dashboard → Your Service → Deployments → Latest → Logs
```

Look for:
- Build success: "vite build completed"
- Server start: "🚀 Server is running on port XXXX"
- Any errors during startup

---

**Your app is now configured for full-stack Railway deployment! 🚀**

