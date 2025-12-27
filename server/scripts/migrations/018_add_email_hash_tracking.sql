-- ========================================
-- GA4 User-ID Tracking with Hashed Email
-- ========================================
-- This migration adds email_hash tracking for Google Analytics
-- Uses SHA-256 hashing to protect PII (email addresses)

-- Step 1: Create a table to store email hashes
-- We use a separate table because we cannot directly modify auth.users
CREATE TABLE IF NOT EXISTS user_email_hashes (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_email_hashes_email_hash ON user_email_hashes(email_hash);
CREATE INDEX IF NOT EXISTS idx_user_email_hashes_user_id ON user_email_hashes(user_id);

-- Step 3: Create function to compute SHA-256 hash of email
-- This function normalizes the email (lowercase + trim) before hashing
CREATE OR REPLACE FUNCTION compute_email_hash(email_address TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Normalize email: lowercase and trim whitespace
    -- Then compute SHA-256 hash
    RETURN encode(digest(lower(trim(email_address)), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 4: Create function to ensure email_hash exists for a user
CREATE OR REPLACE FUNCTION ensure_user_email_hash()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    computed_hash TEXT;
BEGIN
    -- Get email from auth.users (NEW represents the inserted/updated row)
    -- For INSERT: NEW.email contains the email
    -- For UPDATE: NEW.email contains the updated email
    user_email := NEW.email;
    
    -- Skip if email is NULL or empty
    IF user_email IS NULL OR trim(user_email) = '' THEN
        RETURN NEW;
    END IF;
    
    -- Compute hash
    computed_hash := compute_email_hash(user_email);
    
    -- Insert or update the hash in user_email_hashes table
    INSERT INTO user_email_hashes (user_id, email_hash, updated_at)
    VALUES (NEW.id, computed_hash, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        email_hash = EXCLUDED.email_hash,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger on auth.users to automatically compute hash
-- This trigger fires AFTER INSERT or UPDATE on auth.users
DROP TRIGGER IF EXISTS trigger_ensure_user_email_hash ON auth.users;
CREATE TRIGGER trigger_ensure_user_email_hash
    AFTER INSERT OR UPDATE OF email ON auth.users
    FOR EACH ROW
    WHEN (NEW.email IS NOT NULL AND trim(NEW.email) != '')
    EXECUTE FUNCTION ensure_user_email_hash();

-- Step 6: Backfill existing users
-- This will compute hashes for all existing users in auth.users
DO $$
DECLARE
    user_record RECORD;
    computed_hash TEXT;
BEGIN
    FOR user_record IN 
        SELECT id, email FROM auth.users WHERE email IS NOT NULL AND trim(email) != ''
    LOOP
        computed_hash := compute_email_hash(user_record.email);
        
        INSERT INTO user_email_hashes (user_id, email_hash, created_at, updated_at)
        VALUES (user_record.id, computed_hash, NOW(), NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            email_hash = EXCLUDED.email_hash,
            updated_at = NOW();
    END LOOP;
END $$;

-- Step 7: Create RLS policies for user_email_hashes table
-- Users can only read their own email_hash
ALTER TABLE user_email_hashes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own email_hash
DROP POLICY IF EXISTS "Users can read their own email_hash" ON user_email_hashes;
CREATE POLICY "Users can read their own email_hash" ON user_email_hashes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Service role can read all (for API endpoints)
DROP POLICY IF EXISTS "Service role can read all email_hashes" ON user_email_hashes;
CREATE POLICY "Service role can read all email_hashes" ON user_email_hashes
    FOR ALL
    USING (auth.role() = 'service_role');

-- Step 8: Create a helper function to get email_hash for current user
-- This function can be called from RLS-enabled queries
CREATE OR REPLACE FUNCTION get_current_user_email_hash()
RETURNS TEXT AS $$
DECLARE
    user_hash TEXT;
BEGIN
    SELECT email_hash INTO user_hash
    FROM user_email_hashes
    WHERE user_id = auth.uid();
    
    RETURN user_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_current_user_email_hash() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_email_hash() TO anon;

-- ========================================
-- Migration Complete
-- ========================================
-- The system will now:
-- 1. Automatically compute email_hash when users sign up
-- 2. Automatically update email_hash when users change their email
-- 3. Store hashes in user_email_hashes table
-- 4. Allow users to read their own hash via RLS policies
-- 5. Allow service role to read any hash (for API endpoints)


