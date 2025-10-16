-- Verification script to check if all required columns exist
-- Run this to verify the role selection fix is complete

-- Check user_profiles table columns
SELECT 'user_profiles' as table_name, 
       column_name, 
       data_type, 
       is_nullable,
       CASE 
         WHEN column_name IN ('company_size', 'industry', 'role', 'role_selected') THEN 'REQUIRED'
         ELSE 'OPTIONAL'
       END as status
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public' 
  AND column_name IN ('company_size', 'industry', 'role', 'role_selected', 'company_name')

UNION ALL

-- Check companies table columns
SELECT 'companies' as table_name, 
       column_name, 
       data_type, 
       is_nullable,
       CASE 
         WHEN column_name IN ('owner_id', 'size_range') THEN 'REQUIRED'
         ELSE 'OPTIONAL'
       END as status
FROM information_schema.columns 
WHERE table_name = 'companies' 
  AND table_schema = 'public' 
  AND column_name IN ('owner_id', 'size_range', 'name', 'industry')

ORDER BY table_name, status DESC, column_name;

-- Check constraints
SELECT 
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN ('user_profiles', 'companies')
  AND constraint_type = 'CHECK'
  AND (constraint_name LIKE '%company_size%' 
       OR constraint_name LIKE '%industry%' 
       OR constraint_name LIKE '%size_range%')
ORDER BY table_name, constraint_name;