-- Migration to fix role selection functionality
-- This adds the missing columns that the role-selection.tsx component expects

-- Method 1: Simple ADD COLUMN (will error if columns exist)
-- ALTER TABLE user_profiles 
-- ADD COLUMN company_size TEXT,
-- ADD COLUMN industry TEXT;

-- Method 2: Safe approach using DO block for IF NOT EXISTS
DO $$
BEGIN
    -- Add company_size column to user_profiles if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'company_size'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN company_size TEXT;
    END IF;

    -- Add industry column to user_profiles if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'industry'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN industry TEXT;
    END IF;

    -- Add owner_id column to companies table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE companies ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    END IF;

    -- Add size_range column to companies table if it doesn't exist (role-selection.tsx expects this name)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'size_range'
    ) THEN
        ALTER TABLE companies ADD COLUMN size_range TEXT;
    END IF;
END $$;

-- Add constraints (these will also be safe to re-run)
-- User profiles constraints
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_company_size_check;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_company_size_check 
CHECK (company_size IS NULL OR company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+'));

ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_industry_check;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_industry_check 
CHECK (industry IS NULL OR industry IN ('Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
                    'Retail', 'Construction', 'Consulting', 'Media', 'Government',
                    'Non-profit', 'Agriculture', 'Transportation', 'Energy', 'Other'));

-- Companies table constraints
ALTER TABLE companies 
DROP CONSTRAINT IF EXISTS companies_size_range_check;

ALTER TABLE companies 
ADD CONSTRAINT companies_size_range_check 
CHECK (size_range IS NULL OR size_range IN ('1-10', '11-50', '51-200', '201-1000', '1000+'));

-- Verify the columns were added
SELECT 'user_profiles' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public' 
  AND column_name IN ('company_size', 'industry')
UNION ALL
SELECT 'companies' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
  AND table_schema = 'public' 
  AND column_name IN ('owner_id', 'size_range')
ORDER BY table_name, column_name;