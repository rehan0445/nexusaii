-- ============================================
-- Drop Legacy Confession Tables
-- ============================================
-- This script drops the 5 legacy confession tables
-- after data has been migrated to the unified 'confessions' table.
--
-- Tables to drop:
--  1. confessions_mit_adt
--  2. confessions_mit_wpu
--  3. confessions_iict
--  4. confessions_parul_university
--  5. confessions_vit_vellore
--
-- ⚠️ WARNING: This is a destructive operation!
-- Ensure all data has been migrated and code references updated before running.
-- ============================================

-- Drop tables in order (CASCADE to handle any dependent objects)
DROP TABLE IF EXISTS confessions_iict CASCADE;
DROP TABLE IF EXISTS confessions_parul_university CASCADE;
DROP TABLE IF EXISTS confessions_vit_vellore CASCADE;
DROP TABLE IF EXISTS confessions_mit_wpu CASCADE;
DROP TABLE IF EXISTS confessions_mit_adt CASCADE;

-- Verify tables are dropped
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('confessions_iict', 'confessions_parul_university', 'confessions_vit_vellore', 'confessions_mit_wpu', 'confessions_mit_adt') 
    THEN '❌ STILL EXISTS - Drop failed!' 
    ELSE '✅ Dropped successfully' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('confessions_iict', 'confessions_parul_university', 'confessions_vit_vellore', 'confessions_mit_wpu', 'confessions_mit_adt')
UNION ALL
SELECT 
  'confessions' as table_name,
  '✅ Main table exists' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'confessions'
);

