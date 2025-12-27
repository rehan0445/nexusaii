-- ========================================
-- FIX: Email Hash Trigger - Make it Non-Blocking
-- ========================================
-- This migration fixes the trigger to prevent signup failures
-- The trigger will now log errors but not fail the user registration

-- Step 1: Update the trigger function to be more resilient
CREATE OR REPLACE FUNCTION ensure_user_email_hash()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    computed_hash TEXT;
BEGIN
    -- Get email from auth.users (NEW represents the inserted/updated row)
    user_email := NEW.email;
    
    -- Skip if email is NULL or empty
    IF user_email IS NULL OR trim(user_email) = '' THEN
        RETURN NEW;
    END IF;
    
    -- Wrap in exception handler to prevent signup failure
    BEGIN
        -- Compute hash
        computed_hash := compute_email_hash(user_email);
        
        -- Insert or update the hash in user_email_hashes table
        -- Use SECURITY DEFINER context to bypass RLS
        INSERT INTO user_email_hashes (user_id, email_hash, updated_at)
        VALUES (NEW.id, computed_hash, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            email_hash = EXCLUDED.email_hash,
            updated_at = NOW();
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the user registration
        -- This ensures signup/login always succeeds even if hash tracking fails
        RAISE WARNING 'Failed to create email hash for user %: %', NEW.id, SQLERRM;
        -- Return NEW to allow the transaction to continue
        RETURN NEW;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Ensure the trigger function has proper permissions
-- Grant execute to authenticated role (though SECURITY DEFINER should handle this)
GRANT EXECUTE ON FUNCTION ensure_user_email_hash() TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_email_hash() TO anon;

-- Step 3: Update RLS policy to allow trigger function to insert
-- The trigger runs with SECURITY DEFINER, but we need to ensure it can bypass RLS
-- Drop and recreate the service role policy to ensure it works
DROP POLICY IF EXISTS "Service role can read all email_hashes" ON user_email_hashes;
CREATE POLICY "Service role can read all email_hashes" ON user_email_hashes
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Step 4: Add a policy that allows the trigger function to insert
-- Since the function runs with SECURITY DEFINER, it should bypass RLS
-- But we'll add an explicit policy just to be safe
DROP POLICY IF EXISTS "Trigger function can insert email_hashes" ON user_email_hashes;
-- Note: SECURITY DEFINER functions should bypass RLS, but if needed, we can add:
-- CREATE POLICY "Trigger function can insert email_hashes" ON user_email_hashes
--     FOR INSERT
--     WITH CHECK (true); -- This would allow any insert, but SECURITY DEFINER should handle it

-- Step 5: Verify the trigger is working
-- This query should return the trigger
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_ensure_user_email_hash';

-- ========================================
-- Migration Complete
-- ========================================
-- The trigger will now:
-- 1. Never fail user registration (errors are logged as warnings)
-- 2. Have proper permissions to insert into user_email_hashes
-- 3. Continue working even if hash insertion temporarily fails


