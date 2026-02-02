-- ========================================
-- MINIMAL FIX: Email Hash Trigger Function
-- ========================================
-- This ONLY updates the function to be non-blocking
-- The trigger already exists, so we don't touch it
-- Run this in Supabase SQL Editor

-- Update the function to handle errors gracefully
CREATE OR REPLACE FUNCTION ensure_user_email_hash()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
    computed_hash TEXT;
BEGIN
    user_email := NEW.email;
    
    IF user_email IS NULL OR trim(user_email) = '' THEN
        RETURN NEW;
    END IF;
    
    BEGIN
        computed_hash := compute_email_hash(user_email);
        
        INSERT INTO user_email_hashes (user_id, email_hash, updated_at)
        VALUES (NEW.id, computed_hash, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            email_hash = EXCLUDED.email_hash,
            updated_at = NOW();
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to create email hash for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
    END;
    
    RETURN NEW;
END;
$$;

-- Done! The function is now non-blocking.




