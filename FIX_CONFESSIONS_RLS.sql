-- ============================================
-- CONFESSION VISIBILITY FIX
-- This ensures all users can read confessions
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON confessions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON confessions;
DROP POLICY IF EXISTS "Enable insert for all users" ON confessions;
DROP POLICY IF EXISTS "Enable read access for all users" ON confession_reactions;
DROP POLICY IF EXISTS "Enable insert for all users" ON confession_reactions;
DROP POLICY IF EXISTS "Enable read access for all users" ON confession_replies;
DROP POLICY IF EXISTS "Enable insert for all users" ON confession_replies;

-- Enable RLS on confessions table
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE confession_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE confession_replies ENABLE ROW LEVEL SECURITY;

-- CONFESSIONS: Allow ALL users (authenticated and anonymous) to read confessions
CREATE POLICY "Enable read access for all users"
ON confessions
FOR SELECT
USING (true);

-- CONFESSIONS: Allow ALL users to create confessions
CREATE POLICY "Enable insert for all users"
ON confessions
FOR INSERT
WITH CHECK (true);

-- CONFESSIONS: Allow users to update their own confessions (for score, reactions, etc.)
CREATE POLICY "Enable update for own confessions"
ON confessions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- CONFESSION REACTIONS: Allow ALL users to read reactions
CREATE POLICY "Enable read access for all users"
ON confession_reactions
FOR SELECT
USING (true);

-- CONFESSION REACTIONS: Allow ALL users to add reactions
CREATE POLICY "Enable insert for all users"
ON confession_reactions
FOR INSERT
WITH CHECK (true);

-- CONFESSION REACTIONS: Allow users to delete their own reactions
CREATE POLICY "Enable delete for own reactions"
ON confession_reactions
FOR DELETE
USING (true);

-- CONFESSION REPLIES: Allow ALL users to read replies
CREATE POLICY "Enable read access for all users"
ON confession_replies
FOR SELECT
USING (true);

-- CONFESSION REPLIES: Allow ALL users to add replies
CREATE POLICY "Enable insert for all users"
ON confession_replies
FOR INSERT
WITH CHECK (true);

-- CONFESSION REPLIES: Allow users to update their own replies
CREATE POLICY "Enable update for own replies"
ON confession_replies
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_confessions_created_at ON confessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_score ON confessions(score DESC);
CREATE INDEX IF NOT EXISTS idx_confession_reactions_confession_id ON confession_reactions(confession_id);
CREATE INDEX IF NOT EXISTS idx_confession_replies_confession_id ON confession_replies(confession_id);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('confessions', 'confession_reactions', 'confession_replies')
ORDER BY tablename, policyname;

SELECT '✅ Confession RLS policies updated successfully!' AS status;

