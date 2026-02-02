-- ============================================
-- CONFESSION COMMENTS RLS POLICIES FIX
-- This enables RLS and creates policies for per-campus comment tables
-- ============================================

-- ============================================
-- COMMENTS TABLES (Root-level comments)
-- ============================================

-- MIT ADT
ALTER TABLE comments_mit_adt ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_mit_adt_read_all" ON comments_mit_adt;
CREATE POLICY "comments_mit_adt_read_all"
ON comments_mit_adt
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "comments_mit_adt_insert_all" ON comments_mit_adt;
CREATE POLICY "comments_mit_adt_insert_all"
ON comments_mit_adt
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "comments_mit_adt_update_all" ON comments_mit_adt;
CREATE POLICY "comments_mit_adt_update_all"
ON comments_mit_adt
FOR UPDATE
USING (true)
WITH CHECK (true);

-- MIT WPU
ALTER TABLE comments_mit_wpu ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_mit_wpu_read_all" ON comments_mit_wpu;
CREATE POLICY "comments_mit_wpu_read_all"
ON comments_mit_wpu
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "comments_mit_wpu_insert_all" ON comments_mit_wpu;
CREATE POLICY "comments_mit_wpu_insert_all"
ON comments_mit_wpu
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "comments_mit_wpu_update_all" ON comments_mit_wpu;
CREATE POLICY "comments_mit_wpu_update_all"
ON comments_mit_wpu
FOR UPDATE
USING (true)
WITH CHECK (true);

-- IICT
ALTER TABLE comments_iict ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_iict_read_all" ON comments_iict;
CREATE POLICY "comments_iict_read_all"
ON comments_iict
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "comments_iict_insert_all" ON comments_iict;
CREATE POLICY "comments_iict_insert_all"
ON comments_iict
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "comments_iict_update_all" ON comments_iict;
CREATE POLICY "comments_iict_update_all"
ON comments_iict
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Parul University
ALTER TABLE comments_parul_university ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_parul_university_read_all" ON comments_parul_university;
CREATE POLICY "comments_parul_university_read_all"
ON comments_parul_university
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "comments_parul_university_insert_all" ON comments_parul_university;
CREATE POLICY "comments_parul_university_insert_all"
ON comments_parul_university
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "comments_parul_university_update_all" ON comments_parul_university;
CREATE POLICY "comments_parul_university_update_all"
ON comments_parul_university
FOR UPDATE
USING (true)
WITH CHECK (true);

-- VIT Vellore
ALTER TABLE comments_vit_vellore ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_vit_vellore_read_all" ON comments_vit_vellore;
CREATE POLICY "comments_vit_vellore_read_all"
ON comments_vit_vellore
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "comments_vit_vellore_insert_all" ON comments_vit_vellore;
CREATE POLICY "comments_vit_vellore_insert_all"
ON comments_vit_vellore
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "comments_vit_vellore_update_all" ON comments_vit_vellore;
CREATE POLICY "comments_vit_vellore_update_all"
ON comments_vit_vellore
FOR UPDATE
USING (true)
WITH CHECK (true);

-- ============================================
-- SUB_COMMENTS TABLES (Nested replies)
-- ============================================

-- MIT ADT
ALTER TABLE sub_comments_mit_adt ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sub_comments_mit_adt_read_all" ON sub_comments_mit_adt;
CREATE POLICY "sub_comments_mit_adt_read_all"
ON sub_comments_mit_adt
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "sub_comments_mit_adt_insert_all" ON sub_comments_mit_adt;
CREATE POLICY "sub_comments_mit_adt_insert_all"
ON sub_comments_mit_adt
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "sub_comments_mit_adt_update_all" ON sub_comments_mit_adt;
CREATE POLICY "sub_comments_mit_adt_update_all"
ON sub_comments_mit_adt
FOR UPDATE
USING (true)
WITH CHECK (true);

-- MIT WPU
ALTER TABLE sub_comments_mit_wpu ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sub_comments_mit_wpu_read_all" ON sub_comments_mit_wpu;
CREATE POLICY "sub_comments_mit_wpu_read_all"
ON sub_comments_mit_wpu
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "sub_comments_mit_wpu_insert_all" ON sub_comments_mit_wpu;
CREATE POLICY "sub_comments_mit_wpu_insert_all"
ON sub_comments_mit_wpu
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "sub_comments_mit_wpu_update_all" ON sub_comments_mit_wpu;
CREATE POLICY "sub_comments_mit_wpu_update_all"
ON sub_comments_mit_wpu
FOR UPDATE
USING (true)
WITH CHECK (true);

-- IICT
ALTER TABLE sub_comments_iict ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sub_comments_iict_read_all" ON sub_comments_iict;
CREATE POLICY "sub_comments_iict_read_all"
ON sub_comments_iict
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "sub_comments_iict_insert_all" ON sub_comments_iict;
CREATE POLICY "sub_comments_iict_insert_all"
ON sub_comments_iict
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "sub_comments_iict_update_all" ON sub_comments_iict;
CREATE POLICY "sub_comments_iict_update_all"
ON sub_comments_iict
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Parul University
ALTER TABLE sub_comments_parul_university ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sub_comments_parul_university_read_all" ON sub_comments_parul_university;
CREATE POLICY "sub_comments_parul_university_read_all"
ON sub_comments_parul_university
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "sub_comments_parul_university_insert_all" ON sub_comments_parul_university;
CREATE POLICY "sub_comments_parul_university_insert_all"
ON sub_comments_parul_university
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "sub_comments_parul_university_update_all" ON sub_comments_parul_university;
CREATE POLICY "sub_comments_parul_university_update_all"
ON sub_comments_parul_university
FOR UPDATE
USING (true)
WITH CHECK (true);

-- VIT Vellore
ALTER TABLE sub_comments_vit_vellore ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sub_comments_vit_vellore_read_all" ON sub_comments_vit_vellore;
CREATE POLICY "sub_comments_vit_vellore_read_all"
ON sub_comments_vit_vellore
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "sub_comments_vit_vellore_insert_all" ON sub_comments_vit_vellore;
CREATE POLICY "sub_comments_vit_vellore_insert_all"
ON sub_comments_vit_vellore
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "sub_comments_vit_vellore_update_all" ON sub_comments_vit_vellore;
CREATE POLICY "sub_comments_vit_vellore_update_all"
ON sub_comments_vit_vellore
FOR UPDATE
USING (true)
WITH CHECK (true);

-- ============================================
-- Verify Policies
-- ============================================

SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename LIKE 'comments_%' OR tablename LIKE 'sub_comments_%'
ORDER BY tablename, policyname;

SELECT '✅ Confession comments RLS policies applied successfully!' AS status;
