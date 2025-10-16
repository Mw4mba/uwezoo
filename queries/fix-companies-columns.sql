-- Fix companies table for role selection functionality
-- Adds missing owner_id and size_range columns

DO $$
BEGIN
    -- Add owner_id column to companies table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE companies ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    END IF;

    -- Add size_range column to companies table if it doesn't exist 
    -- (role-selection.tsx expects this name instead of the existing company_size)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'size_range'
    ) THEN
        ALTER TABLE companies ADD COLUMN size_range TEXT;
    END IF;
END $$;

-- Add constraints for data integrity
ALTER TABLE companies 
DROP CONSTRAINT IF EXISTS companies_size_range_check;

ALTER TABLE companies 
ADD CONSTRAINT companies_size_range_check 
CHECK (size_range IS NULL OR size_range IN ('1-10', '11-50', '51-200', '201-1000', '1000+'));

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
  AND table_schema = 'public' 
  AND column_name IN ('owner_id', 'size_range')
ORDER BY column_name;