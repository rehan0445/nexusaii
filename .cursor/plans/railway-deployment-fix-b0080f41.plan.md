<!-- b0080f41-21fc-4b9d-a120-ecf1accb710d b2807a40-0f0e-45b2-999b-356347b3ce9b -->
# Fix Static Files Not Serving on Railway

## Problem

Frontend builds successfully but visiting `https://nexusaii-production-4702.up.railway.app/` shows JSON:

```json
{"message":"Companion Backend Server","status":"running"...}
```

Instead of the React app homepage.

## Root Cause

There's an API route handler for `/` (root path) that runs BEFORE the static file handler, so Express serves the JSON response instead of checking for static files.

## Solution

Find and relocate the root `/` API endpoint to a different path like `/api/health` or `/health`, so the static file handler can serve `index.html` for the root path.

## Implementation Steps

1. **Find the problematic route** - Search for `app.get('/')` or similar root path handler
2. **Move it to `/health` or `/api/health`** - Relocate the status endpoint
3. **Verify static files work** - Root path should now serve React app
4. **Test health endpoint** - Ensure monitoring still works at new path

## Expected Files to Check

- `server/app.js` - Main app file where routes are registered
- Look for patterns like:
  - `app.get('/', ...)`  
  - `app.use('/', someRouter)`
  - Any router that handles root path

## Expected Result

After fix:

- `https://nexusaii-production-4702.up.railway.app/` → React app ✅
- `https://nexusaii-production-4702.up.railway.app/health` → JSON status ✅
- `https://nexusaii-production-4702.up.railway.app/api/*` → API endpoints ✅

### To-dos

- [ ] Create nixpacks.toml with monorepo build commands
- [ ] Create .dockerignore to exclude node_modules and build artifacts