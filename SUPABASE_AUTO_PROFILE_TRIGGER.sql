-- ========================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ========================================
-- This trigger automatically creates a basic user profile
-- when a new user registers through Supabase Auth
-- Run this in Supabase SQL Editor

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  random_suffix TEXT;
  generated_username TEXT;
  attempt_count INTEGER := 0;
  max_attempts INTEGER := 10;
  stats_record_id INTEGER;
  user_id_text TEXT;
BEGIN
  -- Cast UUID to TEXT for userProfileData table
  user_id_text := NEW.id::text;
  
  -- Validate required fields
  IF user_id_text IS NULL OR NEW.email IS NULL THEN
    -- Log error but don't fail - allow user creation to succeed
    RAISE WARNING 'Missing required fields for user profile creation: user_id=%, email=%', user_id_text, NEW.email;
    RETURN NEW;
  END IF;
  
  -- Generate a random suffix for username uniqueness
  random_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  -- Extract name from email (part before @)
  generated_username := SPLIT_PART(NEW.email, '@', 1) || '_' || random_suffix;
  
  -- Try to find a unique username (in case of collision)
  WHILE attempt_count < max_attempts LOOP
    -- Check if username exists
    IF NOT EXISTS (SELECT 1 FROM "userProfileData" WHERE username = generated_username) THEN
      EXIT; -- Username is unique, exit loop
    END IF;
    
    -- Generate new suffix and try again
    attempt_count := attempt_count + 1;
    random_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    generated_username := SPLIT_PART(NEW.email, '@', 1) || '_' || random_suffix;
  END LOOP;
  
  -- Create user_stats first, or get existing if it already exists
  BEGIN
    INSERT INTO public.user_stats (user_id, posts, following, followers, numofchar)
    VALUES (user_id_text, 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Get the stats_id (will get existing one if conflict occurred, or new one if inserted)
    SELECT id INTO stats_record_id 
    FROM public.user_stats 
    WHERE user_id = user_id_text;
    
    -- Safety check: ensure we have a stats_id
    IF stats_record_id IS NULL THEN
      RAISE WARNING 'Failed to create or retrieve user_stats record for user_id: %', user_id_text;
      RETURN NEW; -- Allow user creation to succeed even if profile creation fails
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user registration
    RAISE WARNING 'Error creating user_stats for user_id %: %', user_id_text, SQLERRM;
    RETURN NEW;
  END;
  
  -- Create basic user profile
  BEGIN
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
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
      generated_username,
      NEW.email,
      '',
      '',
      NEW.phone,
      'https://i.pinimg.com/736x/d9/7b/bb/d97bbb08017ac2309307f0822e63d082.jpg',
      'https://via.placeholder.com/800x200',
      NOW(),
      '0',
      '[]'::jsonb,
      stats_record_id,
      NULL,
      NULL
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE("userProfileData".name, EXCLUDED.name);
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user registration
    RAISE WARNING 'Error creating user profile for user_id %: %', user_id_text, SQLERRM;
    -- Still return NEW to allow user creation to succeed
  END;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Test the trigger (optional - you can run this to verify it works)
-- SELECT * FROM auth.users LIMIT 5;
-- SELECT * FROM "userProfileData" LIMIT 5;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a user profile when a new user signs up through Supabase Auth';

