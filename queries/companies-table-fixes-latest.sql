-- Recent fixes for role selection functionality - Companies Table Only
-- This file contains only the companies table fixes since user_profiles has already been updated

-- Add missing columns to companies table for role selection functionality
DO $$
BEGIN
    -- Add owner_id column to companies table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE companies ADD COLUMN owner_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added owner_id column to companies table';
    ELSE
        RAISE NOTICE 'owner_id column already exists in companies table';
    END IF;

    -- Add size_range column to companies table if it doesn't exist 
    -- (role-selection.tsx expects this name instead of the existing company_size)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'size_range'
    ) THEN
        ALTER TABLE companies ADD COLUMN size_range TEXT;
        RAISE NOTICE 'Added size_range column to companies table';
    ELSE
        RAISE NOTICE 'size_range column already exists in companies table';
    END IF;
END $$;

-- Add constraints for data integrity
ALTER TABLE companies 
DROP CONSTRAINT IF EXISTS companies_size_range_check;

ALTER TABLE companies 
ADD CONSTRAINT companies_size_range_check 
CHECK (size_range IS NULL OR size_range IN ('1-10', '11-50', '51-200', '201-1000', '1000+'));

-- Create index on owner_id for better performance
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);

-- Verify the changes
SELECT 
    'companies' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    CASE 
        WHEN column_name IN ('owner_id', 'size_range') THEN 'NEWLY ADDED'
        ELSE 'EXISTING'
    END as status
FROM information_schema.columns 
WHERE table_name = 'companies' 
  AND table_schema = 'public' 
  AND column_name IN ('owner_id', 'size_range', 'name', 'industry', 'company_size')
ORDER BY status DESC, column_name;

-- Verify constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'companies'
  AND constraint_type = 'CHECK'
  AND constraint_name LIKE '%size_range%';

-- Summary message
SELECT 'Companies table is now ready for role selection functionality!' as status;