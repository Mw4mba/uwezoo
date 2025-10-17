# 🚨 Fix: Database Error Saving New User

## Problem Diagnosed
The error `Database error saving new user` occurs because:

1. **Table Inconsistency**: Your app uses both `profiles` and `user_profiles` tables
2. **Trigger Failure**: The database trigger can't create user profiles properly
3. **Missing Columns**: The trigger expects columns that may not exist
4. **Type Conflicts**: TypeScript types don't match actual database schema

## Immediate Fix Required

### 1. **Execute This SQL in Supabase SQL Editor**

```sql
-- Fix user_profiles table structure
CREATE TABLE IF NOT EXISTS user_profiles (
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

-- Fix the trigger function with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 2. **Test the Fix**

After running the SQL:

1. **Clear browser data** (important!)
2. **Try logging in again**
3. **Check if user profile is created**

### 3. **Verify Fix Worked**

Run this in Supabase SQL Editor:
```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check user_profiles table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles';

-- Test profile creation (after login attempt)
SELECT COUNT(*) FROM user_profiles;
```

## Root Cause Analysis

### **Table Inconsistency Issues:**
- `use-auth.tsx` queries `profiles` table
- `layout.tsx` and other components query `user_profiles` table
- Database trigger inserts into `user_profiles` 
- This mismatch causes conflicts

### **Trigger Problems:**
- Missing error handling in trigger function
- Potential missing columns or wrong data types
- No conflict resolution for duplicate entries

## Expected Result

After applying the fix:
- ✅ Users can log in without database errors
- ✅ User profiles are automatically created
- ✅ No more "Database error saving new user" 
- ✅ Consistent table structure across the app

## If Issue Persists

1. **Check Supabase logs**: Go to Supabase → Logs
2. **Verify RLS policies**: Make sure they're not blocking inserts
3. **Check auth settings**: Verify OAuth is configured correctly
4. **Manual profile creation**: The updated auth hook will try to create profiles manually if trigger fails

## Prevention

- Use consistent table names across the application
- Add proper error handling in database triggers
- Implement fallback profile creation in the application code
- Regular database schema validation

The main issue should be resolved once you run the SQL fix in your Supabase dashboard!