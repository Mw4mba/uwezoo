-- Fix user_profiles table for role selection functionality
-- Adds missing company_size and industry columns

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
END $$;

-- Add constraints for data integrity
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

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public' 
  AND column_name IN ('company_size', 'industry')
ORDER BY column_name;