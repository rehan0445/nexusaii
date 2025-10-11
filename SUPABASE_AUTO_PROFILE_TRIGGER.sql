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
  
  -- Create user_stats first
  INSERT INTO public.user_stats (user_id, posts, following, followers, numofchar)
  VALUES (user_id_text, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get the stats_id
  SELECT id INTO stats_record_id 
  FROM public.user_stats 
  WHERE user_id = user_id_text;
  
  -- Create basic user profile
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

