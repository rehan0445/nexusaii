# Active References to Legacy Confession Tables

## ⚠️ CRITICAL: These will break if tables are dropped

### 1. `server/routes/confessions.js`

#### `fetchConfessionFromSupabase()` function (Line ~467)
- **Location**: Line 467
- **Reference**: `.from('confessions_mit_adt')`
- **Impact**: GET single confession endpoint will fail
- **Fix**: Change to `.from('confessions')`

#### Vote endpoint (Line ~1346, ~1396)
- **Location**: Lines 1346, 1396
- **Reference**: `.from('confessions_mit_adt')`
- **Also uses**: `upvotes`, `downvotes` columns (don't exist in new table!)
- **Impact**: POST /:id/vote endpoint will fail
- **Fix**: Change to `.from('confessions')` and update to use `score` field instead

#### Comment endpoint (Line ~1832, ~1848)
- **Location**: Lines 1832, 1848
- **Reference**: `.from('confessions_mit_adt')`
- **Also uses**: `comment_count` column (maps to `replies_count` in new table)
- **Impact**: POST /:id/reply endpoint will fail
- **Fix**: Change to `.from('confessions')` and use `replies_count`

#### Delete endpoint (Line ~2094)
- **Location**: Line 2094
- **Reference**: `.from('confessions_mit_adt')`
- **Impact**: DELETE /:id endpoint will fail
- **Fix**: Change to `.from('confessions')`

---

## ⚠️ FALLBACK REFERENCES: These are for aggregation/fallback

### 2. `server/routes/confessions.js`

#### `getAllConfessionTables()` function (Line ~599-603)
- **Location**: Lines 599-603
- **Reference**: Array includes all legacy table names
- **Impact**: Used by GET / endpoint for aggregation fallback
- **Fix**: Remove legacy tables from array, keep only `'confessions'`

### 3. `server/controllers/engagementController.js`

#### `getConfessionsFallback()` function (Line ~31-35)
- **Location**: Lines 31-35
- **Reference**: Array includes all legacy table names
- **Impact**: Fallback queries for trending/fresh/top endpoints
- **Fix**: Remove legacy tables from array, keep only `'confessions'`

---

## ✅ SAFE TO IGNORE: Historical/Migration files

- `server/scripts/migrations/*.sql` - Historical migration files
- `*.md` documentation files - Historical references
- `migration_confessions_mit_adt_to_confessions.sql` - Migration script (already used)

---

## Summary

**Critical fixes needed:**
1. Update `fetchConfessionFromSupabase()` to use `confessions` table
2. Update vote endpoint to use `confessions` table and `score` field
3. Update comment endpoint to use `confessions` table and `replies_count` field
4. Update delete endpoint to use `confessions` table

**Fallback cleanup:**
5. Remove legacy tables from `getAllConfessionTables()` array
6. Remove legacy tables from `getConfessionsFallback()` array

**Note**: The RPC functions (`get_trending_confessions`, etc.) in SQL already query the new `confessions` table, but they also UNION ALL from legacy tables. These will need to be updated in Supabase SQL Editor separately if you want to remove those references.

