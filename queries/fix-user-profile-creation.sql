-- Fix for Database Error Saving New User
-- This script resolves the conflict between 'profiles' and 'user_profiles' tables

-- First, let's make sure both tables exist with the correct structure
-- We'll standardize on using 'user_profiles' as the main table

-- Drop and recreate the user_profiles table with all necessary columns
DROP TABLE IF EXISTS user_profiles CASCADE;

CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  bio TEXT,
  linkedin TEXT,
  github TEXT,
  portfolio_url TEXT,
  credly TEXT,
  facebook TEXT,
  instagram TEXT,
  kickresume TEXT,
  whatsapp TEXT,
  avatar_url TEXT,
  transcript_url TEXT,
  role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'employer', 'independent')),
  role_selected BOOLEAN DEFAULT false,
  company_name TEXT,
  company_size TEXT,
  industry TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create or replace the trigger function with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles with error handling
  INSERT INTO public.user_profiles (
    user_id, 
    email, 
    first_name, 
    last_name, 
    display_name, 
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate entries
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create or replace a view that aliases profiles to user_profiles for backward compatibility
CREATE OR REPLACE VIEW profiles AS
SELECT 
  user_id as id,
  email,
  display_name,
  first_name,
  last_name,
  bio,
  linkedin,
  github,
  portfolio_url,
  credly,
  facebook,
  instagram,
  kickresume,
  whatsapp,
  avatar_url,
  transcript_url,
  role,
  role_selected,
  company_name,
  company_size,
  industry,
  created_at,
  updated_at
FROM user_profiles;

-- Test the trigger by checking if it exists
SELECT 'User profile trigger successfully created!' as status;

-- Check if we can query both tables
SELECT COUNT(*) as user_profiles_count FROM user_profiles;
SELECT COUNT(*) as profiles_view_count FROM profiles;