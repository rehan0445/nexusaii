# Fake Views Implementation Plan - Companion Feature

## 📋 Overview

**Objective**: Add fake views to characters to improve the visual appearance of the companion home page and trending page, making characters with 0 views look more engaging.

**Approach**: Add a `fake_views` column to the database and calculate `display_views = total_views + fake_views` for all character displays.

---

## 🎯 Requirements Summary

### View Count Ranges
- **0 views** → Random 100-1000
- **1-9 views** → Random 100-1000
- **10-100 views** → Random 1700-5000
- **101-199 views** → Random 1100-2700
- **200+ views** → Random 10,000-20,000

### Constraints
- No more than 5 characters should have the same view count
- Fake views should be included in trending calculations
- Both home page and trending page must be updated

---

## 🏗️ Architecture

### Database Changes
1. **Add `fake_views` column** to `character_view_counts` table
   - Type: `INTEGER NOT NULL DEFAULT 0`
   - Indexed for performance

### Backend Changes
1. **Migration Script**: One-time script to populate `fake_views` based on current `total_views`
2. **API Update**: Modify `/api/v1/views/leaderboard` to return `display_views = total_views + fake_views`
3. **Uniqueness Logic**: Ensure no more than 5 characters share the same `display_views`

### Frontend Changes
1. **Home Page** (`AiChat.tsx`): Update to display `display_views` instead of `total_views`
2. **Trending Page** (`CharacterLeaderboard.tsx`): Update to use `display_views` for ranking

---

## 📝 Implementation Steps

### Phase 1: Database Schema Update

#### Step 1.1: Add `fake_views` Column
**File**: New migration file `server/scripts/migrations/017_add_fake_views_column.sql`

```sql
-- Add fake_views column to character_view_counts table
ALTER TABLE character_view_counts 
ADD COLUMN IF NOT EXISTS fake_views INTEGER NOT NULL DEFAULT 0;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_character_view_counts_fake_views 
ON character_view_counts(fake_views);

-- Add comment
COMMENT ON COLUMN character_view_counts.fake_views IS 'Fake views added for display purposes. Display views = total_views + fake_views';
```

#### Step 1.2: Create View for Display Views (Optional - for easier queries)
```sql
-- Create a view that calculates display_views
CREATE OR REPLACE VIEW character_display_views AS
SELECT 
  character_id,
  total_views,
  fake_views,
  (total_views + fake_views) AS display_views,
  unique_views,
  last_viewed_at,
  updated_at
FROM character_view_counts;
```

---

### Phase 2: Migration Script

#### Step 2.1: Create Migration Script
**File**: `server/scripts/migrations/018_populate_fake_views.js`

**Logic**:
1. Fetch all characters from `character_view_counts`
2. For each character, determine fake_views based on `total_views`:
   - 0 views → Random 100-1000
   - 1-9 views → Random 100-1000
   - 10-100 views → Random 1700-5000
   - 101-199 views → Random 1100-2700
   - 200+ views → Random 10,000-20,000
3. Ensure uniqueness: Track `display_views` values and ensure no more than 5 characters have the same value
4. Update database with calculated `fake_views`

**Uniqueness Algorithm**:
- Maintain a map of `display_views` → count of characters
- If a `display_views` value already has 5 characters, adjust the fake_views slightly (±1-50) until unique or under limit

---

### Phase 3: Backend API Updates

#### Step 3.1: Update Leaderboard Endpoint
**File**: `server/controllers/viewsController.js`

**Changes**:
- Modify `getCharacterLeaderboard()` to:
  1. Select `fake_views` column
  2. Calculate `display_views = total_views + fake_views`
  3. Order by `display_views` instead of `total_views`
  4. Return `display_views` in response

**Updated Query**:
```javascript
.select(`
  character_id,
  total_views,
  fake_views,
  (total_views + fake_views) as display_views,
  unique_views,
  last_viewed_at
`)
.order('display_views', { ascending: false })
```

#### Step 3.2: Update View Stats Endpoint
**File**: `server/controllers/viewsController.js`

**Changes**:
- Modify `getCharacterViewStats()` to include `fake_views` and `display_views` in response

---

### Phase 4: Frontend Updates

#### Step 4.1: Update Views Manager
**File**: `client/src/utils/viewsManager.ts`

**Changes**:
- Update `getRankedCharacters()` to use `display_views` from API response instead of `total_views`
- Update `RankedCharacter` interface to include `display_views` (optional, for clarity)

#### Step 4.2: Update Home Page
**File**: `client/src/pages/AiChat.tsx`

**Changes**:
- Line 3118: Update view count display to use `display_views` from `views[slug]`
- Ensure `useCharacterViews` hook properly fetches and sets `display_views`

#### Step 4.3: Update Trending Page
**File**: `client/src/components/CharacterLeaderboard.tsx`

**Changes**:
- Line 46: Update to use `display_views` instead of `views` from ranked characters
- Ensure ranking is based on `display_views`

**File**: `client/src/components/CompactLeaderboard.tsx`

**Changes**:
- Line 40: Update to use `display_views` instead of `views`

---

## 🔧 Technical Details

### Fake Views Calculation Function

```javascript
function calculateFakeViews(totalViews) {
  if (totalViews === 0 || (totalViews >= 1 && totalViews <= 9)) {
    return Math.floor(Math.random() * (1000 - 100 + 1)) + 100; // 100-1000
  } else if (totalViews >= 10 && totalViews <= 100) {
    return Math.floor(Math.random() * (5000 - 1700 + 1)) + 1700; // 1700-5000
  } else if (totalViews >= 101 && totalViews <= 199) {
    return Math.floor(Math.random() * (2700 - 1100 + 1)) + 1100; // 1100-2700
  } else if (totalViews >= 200) {
    return Math.floor(Math.random() * (20000 - 10000 + 1)) + 10000; // 10000-20000
  }
  return 0; // Fallback
}
```

### Uniqueness Enforcement

```javascript
function ensureUniqueness(characters, maxDuplicates = 5) {
  const displayViewsCount = new Map();
  
  characters.forEach(char => {
    const displayViews = char.total_views + char.fake_views;
    const count = displayViewsCount.get(displayViews) || 0;
    
    if (count >= maxDuplicates) {
      // Adjust fake_views to make it unique
      const adjustment = Math.floor(Math.random() * 50) + 1; // 1-50
      char.fake_views += adjustment;
    }
    
    const newDisplayViews = char.total_views + char.fake_views;
    displayViewsCount.set(newDisplayViews, (displayViewsCount.get(newDisplayViews) || 0) + 1);
  });
  
  return characters;
}
```

---

## 📊 Database Schema

### Updated Table Structure

```sql
character_view_counts (
  character_id VARCHAR(255) PRIMARY KEY,
  total_views INTEGER NOT NULL DEFAULT 0,
  fake_views INTEGER NOT NULL DEFAULT 0,  -- NEW COLUMN
  unique_views INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

---

## 🧪 Testing Strategy

### Unit Tests
1. Test fake views calculation function with various input ranges
2. Test uniqueness enforcement algorithm
3. Test API endpoint returns correct `display_views`

### Integration Tests
1. Verify migration script runs successfully
2. Verify API returns `display_views` correctly
3. Verify frontend displays `display_views` correctly

### Manual Testing
1. Check home page shows enhanced view counts
2. Check trending page ranks by `display_views`
3. Verify no more than 5 characters have same view count
4. Verify view counts fall within expected ranges

---

## 📁 Files to Modify

### New Files
1. `server/scripts/migrations/017_add_fake_views_column.sql`
2. `server/scripts/migrations/018_populate_fake_views.js`

### Modified Files
1. `server/controllers/viewsController.js` - Update API responses
2. `client/src/utils/viewsManager.ts` - Update to use display_views
3. `client/src/pages/AiChat.tsx` - Update view display
4. `client/src/components/CharacterLeaderboard.tsx` - Update trending page
5. `client/src/components/CompactLeaderboard.tsx` - Update compact leaderboard

---

## 🚀 Deployment Steps

1. **Run Database Migration**:
   ```bash
   # Execute SQL migration in Supabase
   psql < server/scripts/migrations/017_add_fake_views_column.sql
   ```

2. **Run Population Script**:
   ```bash
   node server/scripts/migrations/018_populate_fake_views.js
   ```

3. **Deploy Backend Changes**:
   - Deploy updated `viewsController.js`
   - Verify API endpoints return `display_views`

4. **Deploy Frontend Changes**:
   - Deploy updated React components
   - Verify home page and trending page display correctly

5. **Verify**:
   - Check home page shows enhanced view counts
   - Check trending page ranks correctly
   - Verify uniqueness constraint (max 5 duplicates)

---

## ⚠️ Risks & Considerations

1. **Performance**: Adding `fake_views` calculation to queries may have minimal impact
2. **Data Integrity**: `fake_views` should never be modified by user actions, only by migration
3. **Backward Compatibility**: Ensure existing code that uses `total_views` still works
4. **Uniqueness**: May need to run uniqueness check periodically if new characters are added

---

## 📝 Notes

- **IMPORTANT**: Using **ONE-TIME MIGRATION** approach (NOT dynamic calculation)
- Fake views are **one-time** populated values, stored in database, not dynamically calculated
- Real views (`total_views`) continue to track actual user views
- Display views are used for **presentation only**, real views are still tracked separately
- Migration script should be idempotent (safe to run multiple times)
- Once populated, `fake_views` values remain constant unless manually updated

---

## ✅ Success Criteria

1. ✅ `fake_views` column added to database
2. ✅ All characters have fake_views populated based on their total_views
3. ✅ No more than 5 characters share the same display_views
4. ✅ Home page displays enhanced view counts
5. ✅ Trending page ranks by display_views
6. ✅ API returns display_views correctly
7. ✅ All view counts fall within expected ranges

---

**Estimated Time**: 2-3 hours
**Priority**: Medium
**Dependencies**: Supabase access, database migration permissions

