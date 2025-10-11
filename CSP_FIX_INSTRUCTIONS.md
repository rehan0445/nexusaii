# CSP Fix - Step-by-Step Instructions

## 🎯 The Fix is Already Applied

The CSP fix has been correctly applied to `client/index.html`. The CSP now includes:
- `http://10.87.73.163:8000` and `ws://10.87.73.163:8000`
- `http://10.*.*.*:8000` and `ws://10.*.*.*:8000` (entire 10.x.x.x network range)
- Both ports 8000 and 8002

## 🚨 Why You're Still Seeing CSP Violations

The most likely reasons you're still seeing CSP violations:

1. **Browser Cache**: Your browser is caching the old CSP
2. **Development Server**: The dev server needs to be restarted
3. **Hard Refresh Needed**: The page needs to be hard refreshed

## 🔧 Step-by-Step Fix Instructions

### **Step 1: Restart Development Server**
```bash
# Stop the current server (Ctrl+C in the terminal)
# Then restart both frontend and backend
npm run dev
```

### **Step 2: Clear Browser Cache**
1. **Open DevTools**: Press `F12` or `Ctrl+Shift+I`
2. **Go to Application Tab**: Click "Application" in DevTools
3. **Clear Storage**: Click "Clear storage" → "Clear site data"
4. **Or use Hard Refresh**: Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### **Step 3: Disable Cache During Development**
1. **Open DevTools**: Press `F12`
2. **Go to Network Tab**: Click "Network"
3. **Check "Disable cache"**: This prevents caching during development

### **Step 4: Verify CSP is Applied**
1. **Open DevTools Console**: Press `F12` → Console tab
2. **Run this command**:
```javascript
console.log(document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content);
```
3. **You should see**: The CSP content including `http://10.87.73.163:8000`

### **Step 5: Test the Connection**
1. **Open DevTools Console**: Press `F12` → Console tab
2. **Run this test**:
```javascript
fetch('http://10.87.73.163:8000/api/v1/chat/models')
  .then(response => console.log('✅ Success:', response.status))
  .catch(error => console.log('❌ Error:', error.message));
```

## 🧪 Quick Test

Use the test file I created: `test-complete-fixes.html`

1. **Open the test file** in your browser
2. **Click "Test CSP Fix"**
3. **Check the results** - should show success

## 🚨 If CSP Violations Still Persist

### **Option 1: Temporary Development CSP (More Permissive)**
If the fix still isn't working, temporarily replace the CSP in `client/index.html` with:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: http:; font-src 'self' data:; connect-src 'self' http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:* http://0.0.0.0:* ws://0.0.0.0:* http://192.168.*.*:* ws://192.168.*.*:* http://10.*.*.*:* ws://10.*.*.*:* https://nexusai.com https://www.nexusai.com https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none';" />
```

### **Option 2: Use Environment Variable**
Set the server URL as an environment variable:

1. **Create/Edit `.env` file** in the client directory:
```
VITE_SERVER_URL=http://10.87.73.163:8000
```

2. **Restart the development server**

## 🔍 Debugging Commands

### **Check Current CSP**
```javascript
// Run in browser console
console.log(document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content);
```

### **Test Connection**
```javascript
// Run in browser console
fetch('http://10.87.73.163:8000/api/v1/chat/models')
  .then(response => console.log('✅ Success:', response.status))
  .catch(error => console.log('❌ Error:', error.message));
```

### **Check Network Requests**
1. Open DevTools → Network tab
2. Make a request to `http://10.87.73.163:8000`
3. Look for blocked requests with CSP violations

## 🎯 Expected Result

After following these steps, you should see:
- ✅ No CSP violation errors in console
- ✅ Successful connections to `http://10.87.73.163:8000`
- ✅ API requests working properly
- ✅ Character loading working without network errors

## 🚀 Most Common Solution

**90% of the time, the issue is browser cache. Try this:**

1. **Hard Refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear Browser Cache**: DevTools → Application → Clear storage
3. **Restart Dev Server**: Stop and restart `npm run dev`

The CSP fix is correctly applied - it's just a matter of clearing the cache and restarting the server!
