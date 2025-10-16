-- Uwezo Career Journey Platform Database Schema
-- Execute this in your Supabase SQL Editor to create all necessary tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users for profile information)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
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

-- User profiles table (alternative naming for profile page component)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
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

-- Companies table (for employers)
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  size_range TEXT CHECK (size_range IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  website TEXT,
  logo_url TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job openings table (created by employers)
CREATE TABLE IF NOT EXISTS job_openings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  location TEXT,
  employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
  salary_range TEXT,
  positions_available INTEGER DEFAULT 1,
  application_deadline TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  application_link TEXT, -- One-time application link
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job applications table (employee submissions)
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_opening_id UUID REFERENCES job_openings(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_url TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  aptitude_score DECIMAL(5,2),
  notes TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(job_opening_id, applicant_id)
);

-- Role criteria table (for job requirements and assessments)
CREATE TABLE IF NOT EXISTS role_criteria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_opening_id UUID REFERENCES job_openings(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  is_required BOOLEAN DEFAULT true,
  weight DECIMAL(3,2) DEFAULT 1.0, -- For scoring
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract templates table (for different engagement types)
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  engagement_type TEXT NOT NULL,
  contract_content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table (onboarding and progress tasks)
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('nda', 'contract', 'cv_analysis', 'document_upload', 'quiz', 'video_intro', 'general')),
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User tasks (tracks individual user progress on tasks)
CREATE TABLE IF NOT EXISTS user_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  metadata JSONB, -- Store task-specific data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- Documents table (uploaded files, contracts, NDAs, CVs)
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  document_type TEXT CHECK (document_type IN ('cv', 'nda', 'contract', 'general')),
  is_signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  analysis_result JSONB, -- Store AI analysis results
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  quiz_type TEXT DEFAULT 'aptitude' CHECK (quiz_type IN ('aptitude', 'personality', 'skills')),
  questions JSONB NOT NULL, -- Store quiz questions and options
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  answers JSONB NOT NULL, -- Store user answers
  score INTEGER,
  passed BOOLEAN,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_taken_minutes INTEGER
);

-- Chat messages table (for AI assistant and buddy chat)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_type TEXT DEFAULT 'ai_assistant' CHECK (chat_type IN ('ai_assistant', 'buddy_chat', 'onboarding')),
  message TEXT NOT NULL,
  is_from_user BOOLEAN NOT NULL,
  metadata JSONB, -- Store additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video introductions table
CREATE TABLE IF NOT EXISTS video_introductions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  duration_seconds INTEGER,
  file_size INTEGER,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'approved', 'rejected')),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress tracking table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  current_stage TEXT DEFAULT 'onboarding',
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_task_id ON user_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON chat_messages(chat_type);
CREATE INDEX IF NOT EXISTS idx_video_introductions_user_id ON video_introductions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_introductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can view all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Tasks: Everyone can view tasks (they're global)
CREATE POLICY "Tasks are viewable by everyone" ON tasks
  FOR SELECT USING (true);

-- User tasks: Users can only see and manage their own
CREATE POLICY "Users can manage their own tasks" ON user_tasks
  FOR ALL USING (auth.uid() = user_id);

-- Documents: Users can only see and manage their own
CREATE POLICY "Users can manage their own documents" ON documents
  FOR ALL USING (auth.uid() = user_id);

-- Quizzes: Everyone can view active quizzes
CREATE POLICY "Active quizzes are viewable by everyone" ON quizzes
  FOR SELECT USING (is_active = true);

-- Quiz attempts: Users can only see and manage their own
CREATE POLICY "Users can manage their own quiz attempts" ON quiz_attempts
  FOR ALL USING (auth.uid() = user_id);

-- Chat messages: Users can only see and manage their own
CREATE POLICY "Users can manage their own chat messages" ON chat_messages
  FOR ALL USING (auth.uid() = user_id);

-- Video introductions: Users can only see and manage their own
CREATE POLICY "Users can manage their own video introductions" ON video_introductions
  FOR ALL USING (auth.uid() = user_id);

-- User progress: Users can only see and manage their own
CREATE POLICY "Users can manage their own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

-- Insert default tasks
INSERT INTO tasks (id, title, description, task_type, order_index) VALUES
  (1, 'Sign NDA', 'Review and sign the Non-Disclosure Agreement', 'nda', 1),
  (2, 'Sign Contract', 'Review and sign your employment contract', 'contract', 2),
  (3, 'Upload CV', 'Upload your curriculum vitae for analysis', 'cv_analysis', 3),
  (4, 'Complete Profile', 'Fill out your complete profile information', 'general', 4),
  (5, 'Take Aptitude Quiz', 'Complete the aptitude assessment quiz', 'quiz', 5),
  (6, 'Record Video Introduction', 'Record a short video introduction about yourself', 'video_intro', 6)
ON CONFLICT (id) DO NOTHING;

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, first_name, last_name, photo_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Initialize user progress
  INSERT INTO public.user_progress (user_id, total_tasks, completed_tasks, progress_percentage)
  VALUES (NEW.id, (SELECT COUNT(*) FROM tasks WHERE is_required = true), 0, 0.00);
  
  -- Create user task entries for all required tasks
  INSERT INTO public.user_tasks (user_id, task_id, completed)
  SELECT NEW.id, id, false
  FROM tasks 
  WHERE is_required = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update progress when tasks are completed
CREATE OR REPLACE FUNCTION update_user_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_tasks_count INTEGER;
  completed_tasks_count INTEGER;
  progress_percent DECIMAL(5,2);
BEGIN
  -- Get task counts
  SELECT COUNT(*) INTO total_tasks_count
  FROM user_tasks ut
  JOIN tasks t ON ut.task_id = t.id
  WHERE ut.user_id = NEW.user_id AND t.is_required = true;
  
  SELECT COUNT(*) INTO completed_tasks_count
  FROM user_tasks ut
  JOIN tasks t ON ut.task_id = t.id
  WHERE ut.user_id = NEW.user_id AND t.is_required = true AND ut.completed = true;
  
  -- Calculate progress percentage
  progress_percent := CASE 
    WHEN total_tasks_count = 0 THEN 0 
    ELSE ROUND((completed_tasks_count::DECIMAL / total_tasks_count::DECIMAL) * 100, 2)
  END;
  
  -- Update user progress
  UPDATE user_progress 
  SET 
    total_tasks = total_tasks_count,
    completed_tasks = completed_tasks_count,
    progress_percentage = progress_percent,
    last_activity_at = NOW(),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for progress updates
DROP TRIGGER IF EXISTS trigger_update_user_progress ON user_tasks;
CREATE TRIGGER trigger_update_user_progress
  AFTER INSERT OR UPDATE ON user_tasks
  FOR EACH ROW EXECUTE FUNCTION update_user_progress();

-- Function to get user progress
CREATE OR REPLACE FUNCTION get_user_progress(user_uuid UUID)
RETURNS TABLE (
  total_tasks INTEGER,
  completed_tasks INTEGER,
  progress_percentage DECIMAL(5,2),
  current_stage TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.total_tasks,
    up.completed_tasks,
    up.progress_percentage,
    up.current_stage
  FROM user_progress up
  WHERE up.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;