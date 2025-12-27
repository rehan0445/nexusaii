-- ========================================
-- FIX: Email Hash Trigger Function - Simple Update
-- ========================================
-- This migration ONLY updates the function to be non-blocking
-- It does NOT recreate the trigger (which already exists)
-- Run this in Supabase SQL Editor

-- Step 1: Update the trigger function to be more resilient
-- This is the ONLY change needed - the trigger itself is fine
CREATE OR REPLACE FUNCTION ensure_user_email_hash()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Step 2: Grant execute permissions (if not already granted)
GRANT EXECUTE ON FUNCTION ensure_user_email_hash() TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_email_hash() TO anon;
GRANT EXECUTE ON FUNCTION ensure_user_email_hash() TO service_role;

-- Step 3: Verify the function was updated
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_name = 'ensure_user_email_hash'
AND routine_schema = 'public';

-- Expected result: Should show the function with SECURITY DEFINER

-- ========================================
-- Migration Complete
-- ========================================
-- The function is now non-blocking:
-- - Errors are logged as warnings
-- - User registration will never fail due to hash creation
-- - Hash will be created on-the-fly by API if trigger fails




