-- Test MCP Database Connection
-- Execute this file to test if the Uwezo database is working properly

-- Test 1: Basic SELECT to verify connection
SELECT 1 as test_connection;

-- Test 2: Create a simple test table
CREATE TABLE IF NOT EXISTS test_table (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test 3: Insert test data
INSERT INTO test_table (name) VALUES 
  ('Test Entry 1'),
  ('Test Entry 2');

-- Test 4: Query the test data
SELECT * FROM test_table;

-- Test 5: Check database information
SELECT current_database(), current_user, version();

-- Test 6: List all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Test 7: Check if we can create the ideas table from our schema
CREATE TABLE IF NOT EXISTS ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  author_id UUID REFERENCES auth.users(id),
  category TEXT,
  status TEXT DEFAULT 'draft',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test 8: Insert a test idea
INSERT INTO ideas (title, description, content, category, status) VALUES 
  ('Test Idea', 'A test idea to verify database functionality', 'This is a test idea content.', 'technology', 'published');

-- Test 9: Query the ideas
SELECT * FROM ideas;

-- Cleanup (uncomment to remove test data)
-- DROP TABLE IF EXISTS test_table;
-- DROP TABLE IF EXISTS ideas;

-- Instructions:
-- 1. Copy this content and run it in your Supabase SQL Editor
-- 2. Or use the Supabase CLI: supabase db push (if you have it set up)
-- 3. Or connect directly to your database and execute this script
-- 4. Check the results to see if the MCP server has proper permissions