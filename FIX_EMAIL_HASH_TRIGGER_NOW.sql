-- ========================================
-- FIX: Email Hash Trigger - Run This Now
-- ========================================
-- Copy and paste this ENTIRE block into Supabase SQL Editor
-- URL: https://app.supabase.com/project/dswuotsdaltsomyqqykn/sql

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

-- Verify it worked (should return 1 row)
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_name = 'ensure_user_email_hash'
AND routine_schema = 'public';




