-- ============================================
-- HANGOUT JOIN ID SYSTEM & MESSAGE ENHANCEMENTS
-- ============================================
-- This migration adds:
-- 1. Global counter for ginger-N room IDs
-- 2. Join ID field to rooms table
-- 3. Message metadata fields (bubble_skin, attachments, reply_to_message)
-- ============================================

-- ============================================
-- 1. CREATE GLOBAL COUNTER TABLE FOR ROOM IDs
-- ============================================
CREATE TABLE IF NOT EXISTS hangout_counter (
  id TEXT PRIMARY KEY DEFAULT 'global',
  next_room_number INTEGER DEFAULT 1
);

-- Initialize counter if not exists
INSERT INTO hangout_counter (id, next_room_number) 
VALUES ('global', 1) 
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. ADD JOIN_ID TO ROOMS TABLE
-- ============================================
-- Add join_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'join_id'
  ) THEN
    ALTER TABLE rooms ADD COLUMN join_id TEXT UNIQUE;
  END IF;
END $$;

-- Create index on join_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_rooms_join_id ON rooms(join_id);

-- ============================================
-- 3. ADD MESSAGE METADATA FIELDS
-- ============================================
-- Add bubble_skin column for message styling
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'room_messages' AND column_name = 'bubble_skin'
  ) THEN
    ALTER TABLE room_messages ADD COLUMN bubble_skin TEXT DEFAULT 'liquid';
  END IF;
END $$;

-- Add attachments column for documents/images
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'room_messages' AND column_name = 'attachments'
  ) THEN
    ALTER TABLE room_messages ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add reply_to_message column for full reply context
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'room_messages' AND column_name = 'reply_to_message'
  ) THEN
    ALTER TABLE room_messages ADD COLUMN reply_to_message JSONB DEFAULT NULL;
  END IF;
END $$;

-- ============================================
-- 4. CREATE FUNCTION TO GET NEXT ROOM NUMBER
-- ============================================
CREATE OR REPLACE FUNCTION get_next_room_number()
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  UPDATE hangout_counter 
  SET next_room_number = next_room_number + 1 
  WHERE id = 'global'
  RETURNING next_room_number - 1 INTO next_num;
  
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================
-- Check that hangout_counter exists
SELECT 'hangout_counter table created' AS status, next_room_number 
FROM hangout_counter WHERE id = 'global';

-- Check that rooms table has join_id
SELECT 'rooms.join_id column added' AS status 
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'rooms' AND column_name = 'join_id'
);

-- Check that room_messages has new columns
SELECT 'room_messages columns added' AS status 
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'room_messages' AND column_name = 'bubble_skin'
)
AND EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'room_messages' AND column_name = 'attachments'
)
AND EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'room_messages' AND column_name = 'reply_to_message'
);

-- ============================================
-- NOTES
-- ============================================
-- 1. All rooms will be named "ginger-N" where N is from the global counter
-- 2. Each room gets a unique join_id (e.g., "ginger-1", "ginger-2")
-- 3. Users join rooms by entering the join_id
-- 4. Messages store sender's bubble_skin for consistent display
-- 5. Attachments array stores document/image URLs
-- 6. reply_to_message stores full context of replied message
-- ============================================

