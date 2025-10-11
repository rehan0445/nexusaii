-- ========================================
-- BACKFILL USER PROFILES FOR EXISTING USERS
-- ========================================
-- This script creates profiles for users who registered
-- before the auto-profile trigger was implemented
-- Run this ONCE in Supabase SQL Editor after installing the trigger

-- Create profiles for auth users that don't have profiles yet
DO $$
DECLARE
  user_record RECORD;
  random_suffix TEXT;
  generated_username TEXT;
  attempt_count INTEGER;
  max_attempts INTEGER := 10;
  stats_record_id INTEGER;
  created_count INTEGER := 0;
  user_id_text TEXT;
BEGIN
  -- Loop through all auth users (cast UUID to TEXT for comparison)
  FOR user_record IN 
    SELECT u.id, u.email, u.phone, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN "userProfileData" p ON u.id::text = p.id
    WHERE p.id IS NULL
  LOOP
    -- Cast UUID to TEXT
    user_id_text := user_record.id::text;
    
    -- Reset attempt counter
    attempt_count := 0;
    
    -- Generate a random suffix for username uniqueness
    random_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    generated_username := SPLIT_PART(user_record.email, '@', 1) || '_' || random_suffix;
    
    -- Try to find a unique username
    WHILE attempt_count < max_attempts LOOP
      IF NOT EXISTS (SELECT 1 FROM "userProfileData" WHERE username = generated_username) THEN
        EXIT;
      END IF;
      
      attempt_count := attempt_count + 1;
      random_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
      generated_username := SPLIT_PART(user_record.email, '@', 1) || '_' || random_suffix;
    END LOOP;
    
    -- Create user_stats first if it doesn't exist
    INSERT INTO public.user_stats (user_id, posts, following, followers, numofchar)
    VALUES (user_id_text, 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Get the stats_id
    SELECT id INTO stats_record_id 
    FROM public.user_stats 
    WHERE user_id = user_id_text;
    
    -- Create user profile
    INSERT INTO public."userProfileData" (
      id,
      name,
      username,
      email,
      bio,
      location,
      phno,
      "profileImage",
      "bannerImage",
      "creationDate",
      streak,
      interests,
      stats_id,
      date_of_birth,
      gender
    )
    VALUES (
      user_id_text,
      COALESCE(
        user_record.raw_user_meta_data->>'name', 
        user_record.raw_user_meta_data->>'full_name', 
        SPLIT_PART(user_record.email, '@', 1)
      ),
      generated_username,
      user_record.email,
      '',
      '',
      user_record.phone,
      'https://i.pinimg.com/736x/d9/7b/bb/d97bbb08017ac2309307f0822e63d082.jpg',
      'https://via.placeholder.com/800x200',
      NOW(),
      '0',
      '[]'::jsonb,
      stats_record_id,
      NULL,
      NULL
    );
    
    created_count := created_count + 1;
    
    -- Log progress every 10 users
    IF created_count % 10 = 0 THEN
      RAISE NOTICE 'Created % profiles so far...', created_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Backfill complete! Created % user profiles.', created_count;
END $$;

-- Verify the results
SELECT 
  COUNT(*) as total_auth_users
FROM auth.users;

SELECT 
  COUNT(*) as total_profiles
FROM "userProfileData";

-- Show any remaining users without profiles (should be 0 after backfill)
SELECT 
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN "userProfileData" p ON u.id::text = p.id
WHERE p.id IS NULL;

