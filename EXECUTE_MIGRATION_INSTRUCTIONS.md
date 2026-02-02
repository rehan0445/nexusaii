# Execute Fake Views Migration - Instructions

## ⚠️ Important: DDL Statements Must Run in Supabase SQL Editor

DDL statements (ALTER TABLE, CREATE INDEX, CREATE VIEW) cannot be executed via the Supabase JavaScript client. They must be run directly in the Supabase SQL Editor.

---

## 🚀 Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

1. Go to: **https://app.supabase.com**
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Copy and Paste SQL

Copy the **ENTIRE** contents of this file:
```
server/scripts/migrations/017_add_fake_views_column.sql
```

Or copy this SQL directly:

```sql
-- Migration 017: Add fake_views column to character_view_counts table
-- This migration adds a column to store fake views for display purposes
-- Display views = total_views + fake_views

-- Add fake_views column to character_view_counts table
ALTER TABLE character_view_counts 
ADD COLUMN IF NOT EXISTS fake_views INTEGER NOT NULL DEFAULT 0;

-- Add index for performance (if needed for queries)
CREATE INDEX IF NOT EXISTS idx_character_view_counts_fake_views 
ON character_view_counts(fake_views);

-- Add comment for documentation
COMMENT ON COLUMN character_view_counts.fake_views IS 'Fake views added for display purposes. Display views = total_views + fake_views. Values are set once via migration and remain constant.';

-- Create a view for easier querying (optional but helpful)
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

-- Add comment to view
COMMENT ON VIEW character_display_views IS 'View that calculates display_views = total_views + fake_views for easier querying';
```

### Step 3: Execute

1. Paste the SQL into the SQL Editor
2. Click **RUN** (or press Ctrl+Enter)
3. Wait for execution to complete
4. You should see: ✅ **Success** message

### Step 4: Verify

Run this verification query in the SQL Editor:

```sql
-- Verify column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'character_view_counts' 
  AND column_name = 'fake_views';
```

You should see:
- `column_name`: `fake_views`
- `data_type`: `integer`
- `column_default`: `0`

### Step 5: Run Population Script

After the SQL migration is complete, run the population script:

```bash
cd server
node scripts/migrations/018_populate_fake_views.js
```

This will populate fake_views for all characters based on their current total_views.

---

## ✅ Success Indicators

After running the SQL, you should see:
- ✅ No errors in SQL Editor
- ✅ Success message displayed
- ✅ Verification query returns the `fake_views` column
- ✅ Population script runs without errors

---

## 🆘 Troubleshooting

### Error: "column already exists"
- This is OK! The `IF NOT EXISTS` clause prevents errors
- You can proceed to Step 5 (population script)

### Error: "permission denied"
- Make sure you're logged in as a project admin
- Check that you have the correct project selected

### Error: "relation does not exist"
- Verify the table `character_view_counts` exists
- Check that you're in the correct database/schema

---

**Next Step**: After SQL migration completes, run the population script!

