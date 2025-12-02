# Fake Views Implementation - Summary Plan

## 🎯 Objective
Add fake views to characters to improve visual appearance on companion home page and trending page. Characters with 0 views will look more engaging.

## ✅ Approach: ONE-TIME MIGRATION
- Calculate and store `fake_views` in database once
- Display views = `total_views + fake_views` (calculated at query time)
- Values remain constant after migration

---

## 📊 View Count Ranges

| Current Views | Fake Views Range | Display Views Range |
|--------------|------------------|---------------------|
| 0 views | 100 - 1,000 | 100 - 1,000 |
| 1-9 views | 100 - 1,000 | 101 - 1,009 |
| 10-100 views | 1,700 - 5,000 | 1,710 - 5,100 |
| 101-199 views | 1,100 - 2,700 | 1,201 - 2,899 |
| 200+ views | 10,000 - 20,000 | 10,200 - 20,200+ |

---

## 🏗️ Implementation Steps

### Step 1: Database Schema Update
**File**: `server/scripts/migrations/017_add_fake_views_column.sql`

- Add `fake_views INTEGER NOT NULL DEFAULT 0` column to `character_view_counts` table
- Add index for performance
- Add database comment

### Step 2: Populate Fake Views
**File**: `server/scripts/migrations/018_populate_fake_views.js`

- Fetch all characters from `character_view_counts`
- Calculate `fake_views` based on `total_views` using ranges above
- Enforce uniqueness: No more than 5 characters share same `display_views`
- Update database with calculated values

### Step 3: Backend API Update
**File**: `server/controllers/viewsController.js`

**Function**: `getCharacterLeaderboard()`
- Select `fake_views` column
- Calculate `display_views = total_views + fake_views` in SQL query
- Order by `display_views` (not `total_views`)
- Return `display_views` in API response

### Step 4: Frontend Updates

#### 4.1 Views Manager
**File**: `client/src/utils/viewsManager.ts`
- Update `getRankedCharacters()` to use `display_views` from API

#### 4.2 Home Page
**File**: `client/src/pages/AiChat.tsx`
- Line 3118: Display `display_views` instead of `total_views`

#### 4.3 Trending Page
**File**: `client/src/components/CharacterLeaderboard.tsx`
- Use `display_views` for ranking and display

**File**: `client/src/components/CompactLeaderboard.tsx`
- Use `display_views` for display

---

## 📁 Files Summary

### New Files (2)
1. `server/scripts/migrations/017_add_fake_views_column.sql` - Database migration
2. `server/scripts/migrations/018_populate_fake_views.js` - Population script

### Modified Files (5)
1. `server/controllers/viewsController.js` - API updates
2. `client/src/utils/viewsManager.ts` - View fetching
3. `client/src/pages/AiChat.tsx` - Home page display
4. `client/src/components/CharacterLeaderboard.tsx` - Trending page
5. `client/src/components/CompactLeaderboard.tsx` - Compact leaderboard

---

## 🔧 Key Technical Details

### Fake Views Calculation
```javascript
function calculateFakeViews(totalViews) {
  if (totalViews === 0 || (totalViews >= 1 && totalViews <= 9)) {
    return random(100, 1000);
  } else if (totalViews >= 10 && totalViews <= 100) {
    return random(1700, 5000);
  } else if (totalViews >= 101 && totalViews <= 199) {
    return random(1100, 2700);
  } else if (totalViews >= 200) {
    return random(10000, 20000);
  }
}
```

### Uniqueness Enforcement
- Track `display_views` values
- If 5+ characters have same value, adjust `fake_views` by ±1-50
- Ensure max 5 duplicates per `display_views` value

### Database Query Update
```sql
SELECT 
  character_id,
  total_views,
  fake_views,
  (total_views + fake_views) AS display_views,
  unique_views
FROM character_view_counts
ORDER BY display_views DESC
```

---

## 🚀 Deployment Sequence

1. **Run SQL Migration** (Supabase SQL Editor)
   - Execute `017_add_fake_views_column.sql`

2. **Run Population Script**
   ```bash
   node server/scripts/migrations/018_populate_fake_views.js
   ```

3. **Deploy Backend**
   - Deploy updated `viewsController.js`

4. **Deploy Frontend**
   - Deploy updated React components

5. **Verify**
   - Check home page shows enhanced views
   - Check trending page ranks correctly
   - Verify uniqueness (max 5 duplicates)

---

## ✅ Success Criteria

- [x] `fake_views` column added to database
- [x] All characters have `fake_views` populated
- [x] No more than 5 characters share same `display_views`
- [x] Home page displays `display_views`
- [x] Trending page ranks by `display_views`
- [x] API returns `display_views` correctly
- [x] All view counts within expected ranges

---

## ⚠️ Important Notes

- **One-time migration**: Values calculated once and stored permanently
- **Not dynamic**: Fake views don't change on each page load
- **Real views preserved**: `total_views` still tracks actual user views
- **Display only**: `display_views` used for UI presentation
- **Idempotent**: Migration script safe to run multiple times

---

**Estimated Time**: 2-3 hours  
**Priority**: Medium  
**Status**: Ready for Implementation

