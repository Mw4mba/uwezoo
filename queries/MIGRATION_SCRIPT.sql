-- UWEZO CAREER PLATFORM - ROLE-BASED ENHANCEMENT MIGRATION
-- Execute this step-by-step in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: CREATE ENHANCED USER PROFILES WITH MULTI-ROLE SUPPORT
-- ============================================================================

-- Enhanced user profiles supporting multiple roles per user
CREATE TABLE IF NOT EXISTS user_profiles_enhanced (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Basic Information
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  phone TEXT,
  location TEXT,
  
  -- Multi-Role Support (KEY ENHANCEMENT)
  primary_role TEXT NOT NULL DEFAULT 'employee' CHECK (primary_role IN ('employee', 'employer', 'independent')),
  secondary_roles TEXT[] DEFAULT '{}', -- Allow users to have multiple roles
  role_verified BOOLEAN DEFAULT false,
  role_selected_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false,
  
  -- Professional Information
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  resume_url TEXT,
  years_experience INTEGER DEFAULT 0,
  current_salary_range TEXT,
  expected_salary_range TEXT,
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'employed', 'busy', 'not_looking')),
  
  -- Skills and Preferences
  skills JSONB DEFAULT '[]',
  work_preferences JSONB DEFAULT '{}',
  notification_preferences JSONB DEFAULT '{}',
  
  -- Verification
  identity_verified BOOLEAN DEFAULT false,
  profile_completion_score INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: COMPANIES WITH MULTI-COMPANY EMPLOYER SUPPORT
-- ============================================================================

-- Companies table for employer multi-company management
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Company Information
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+', 'startup', 'enterprise')),
  
  -- Contact and Branding
  website TEXT,
  email TEXT,
  headquarters_location TEXT,
  logo_url TEXT,
  
  -- Business Details
  business_type TEXT CHECK (business_type IN ('corporation', 'llc', 'partnership', 'startup', 'nonprofit')),
  
  -- Platform Settings
  is_verified BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'professional', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Analytics
  jobs_posted_count INTEGER DEFAULT 0,
  total_hires INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company members for multi-company employer support (KEY FEATURE)
CREATE TABLE IF NOT EXISTS company_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role and Permissions
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'hr_manager', 'recruiter', 'member')),
  permissions JSONB DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  
  -- Metadata
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, user_id)
);

-- ============================================================================
-- STEP 3: ENHANCED JOB OPENINGS WITH ADVANCED FEATURES
-- ============================================================================

-- Enhanced job openings with comprehensive features
CREATE TABLE IF NOT EXISTS job_openings_enhanced (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Job Information
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT NOT NULL,
  requirements TEXT,
  responsibilities TEXT,
  
  -- Job Details
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship', 'freelance')),
  work_arrangement TEXT DEFAULT 'onsite' CHECK (work_arrangement IN ('remote', 'hybrid', 'onsite')),
  location TEXT,
  seniority_level TEXT CHECK (seniority_level IN ('entry', 'junior', 'mid', 'senior', 'lead', 'director')),
  
  -- Compensation
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  salary_period TEXT DEFAULT 'annually' CHECK (salary_period IN ('hourly', 'monthly', 'annually')),
  
  -- Application Settings
  positions_available INTEGER DEFAULT 1,
  application_deadline TIMESTAMPTZ,
  application_link TEXT UNIQUE,
  
  -- Skills and Requirements
  required_skills JSONB DEFAULT '[]',
  preferred_skills JSONB DEFAULT '[]',
  min_years_experience INTEGER DEFAULT 0,
  
  -- Assessment Configuration
  requires_cover_letter BOOLEAN DEFAULT true,
  requires_assessment BOOLEAN DEFAULT false,
  screening_questions JSONB DEFAULT '[]',
  
  -- Status and Visibility
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
  is_featured BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'internal')),
  
  -- Analytics
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- ============================================================================
-- STEP 4: COMPREHENSIVE JOB APPLICATIONS WITH WORKFLOW TRACKING
-- ============================================================================

-- Enhanced job applications with complete workflow
CREATE TABLE IF NOT EXISTS job_applications_enhanced (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_opening_id UUID REFERENCES job_openings_enhanced(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Application Materials
  resume_url TEXT,
  cover_letter TEXT,
  portfolio_url TEXT,
  
  -- Screening and Assessment
  screening_answers JSONB DEFAULT '{}',
  assessment_score DECIMAL(5,2),
  assessment_completed_at TIMESTAMPTZ,
  
  -- Application Status and Workflow
  status TEXT DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'screening', 'assessment', 'interview', 'reference_check',
    'offer_pending', 'offer_extended', 'hired', 'rejected', 'withdrawn'
  )),
  current_stage TEXT DEFAULT 'initial_review',
  stage_history JSONB DEFAULT '[]',
  
  -- Ratings and Feedback
  overall_rating DECIMAL(3,2),
  technical_rating DECIMAL(3,2),
  communication_rating DECIMAL(3,2),
  recruiter_notes TEXT,
  rejection_reason TEXT,
  
  -- Timeline
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  interview_scheduled_at TIMESTAMPTZ,
  decision_made_at TIMESTAMPTZ,
  
  -- Source Attribution
  application_source TEXT DEFAULT 'direct',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(job_opening_id, applicant_id)
);

-- ============================================================================
-- STEP 5: SKILL ASSESSMENTS SYSTEM
-- ============================================================================

-- Comprehensive skill assessment system
CREATE TABLE IF NOT EXISTS skill_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Assessment Information
  title TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('technical', 'cognitive', 'personality', 'skills')),
  
  -- Configuration
  questions JSONB NOT NULL,
  time_limit_minutes INTEGER,
  passing_score INTEGER DEFAULT 70,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- Skills and Categories
  skills_tested JSONB DEFAULT '[]',
  
  -- Access Control
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  
  -- Analytics
  attempts_count INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment attempts tracking
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES skill_assessments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_application_id UUID REFERENCES job_applications_enhanced(id) ON DELETE SET NULL,
  
  -- Attempt Details
  answers JSONB NOT NULL,
  score DECIMAL(5,2),
  passed BOOLEAN,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_taken_minutes INTEGER,
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 6: INDEPENDENT CONTRACTOR FEATURES
-- ============================================================================

-- Project proposals for independent contractors
CREATE TABLE IF NOT EXISTS project_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Parties
  contractor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  
  -- Project Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  scope_of_work TEXT,
  deliverables JSONB DEFAULT '[]',
  
  -- Timeline and Pricing
  estimated_duration_weeks INTEGER,
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('fixed_price', 'hourly', 'milestone_based')),
  total_cost DECIMAL(10,2),
  hourly_rate DECIMAL(8,2),
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected')),
  
  -- Supporting Materials
  portfolio_items JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client contracts for independent work
CREATE TABLE IF NOT EXISTS client_contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES project_proposals(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contract Details
  contract_content TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  total_value DECIMAL(10,2),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Signatures
  contractor_signed_at TIMESTAMPTZ,
  client_signed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 7: INDEXES FOR PERFORMANCE
-- ============================================================================

-- User Profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_enhanced_user_id ON user_profiles_enhanced(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_enhanced_role ON user_profiles_enhanced(primary_role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_enhanced_skills ON user_profiles_enhanced USING GIN(skills);

-- Companies
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- Company Members
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_role ON company_members(role);

-- Job Openings
CREATE INDEX IF NOT EXISTS idx_job_openings_enhanced_company_id ON job_openings_enhanced(company_id);
CREATE INDEX IF NOT EXISTS idx_job_openings_enhanced_status ON job_openings_enhanced(status);
CREATE INDEX IF NOT EXISTS idx_job_openings_enhanced_location ON job_openings_enhanced(location);
CREATE INDEX IF NOT EXISTS idx_job_openings_enhanced_skills ON job_openings_enhanced USING GIN(required_skills);

-- Job Applications
CREATE INDEX IF NOT EXISTS idx_job_applications_enhanced_job_id ON job_applications_enhanced(job_opening_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_enhanced_applicant_id ON job_applications_enhanced(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_enhanced_status ON job_applications_enhanced(status);

-- Assessments
CREATE INDEX IF NOT EXISTS idx_skill_assessments_type ON skill_assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_id ON assessment_attempts(user_id);

-- Independent Contractor
CREATE INDEX IF NOT EXISTS idx_project_proposals_contractor_id ON project_proposals(contractor_id);
CREATE INDEX IF NOT EXISTS idx_project_proposals_client_id ON project_proposals(client_id);

-- ============================================================================
-- STEP 8: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_openings_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contracts ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view all profiles" ON user_profiles_enhanced FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles_enhanced FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles_enhanced FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Companies Policies
CREATE POLICY "Anyone can view active companies" ON companies FOR SELECT USING (status = 'active');
CREATE POLICY "Company members can view their companies" ON companies FOR SELECT USING (
  id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
);

-- Job Openings Policies
CREATE POLICY "Anyone can view active public jobs" ON job_openings_enhanced FOR SELECT USING (
  status = 'active' AND visibility = 'public'
);
CREATE POLICY "Company members can manage company jobs" ON job_openings_enhanced FOR ALL USING (
  company_id IN (
    SELECT cm.company_id FROM company_members cm 
    WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin', 'hr_manager', 'recruiter')
  )
);

-- Job Applications Policies
CREATE POLICY "Applicants can view own applications" ON job_applications_enhanced FOR SELECT USING (applicant_id = auth.uid());
CREATE POLICY "Company members can view applications" ON job_applications_enhanced FOR SELECT USING (
  job_opening_id IN (
    SELECT jo.id FROM job_openings_enhanced jo
    JOIN company_members cm ON jo.company_id = cm.company_id
    WHERE cm.user_id = auth.uid()
  )
);

-- Assessment Policies
CREATE POLICY "Users can view public assessments" ON skill_assessments FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own attempts" ON assessment_attempts FOR SELECT USING (user_id = auth.uid());

-- Independent Contractor Policies
CREATE POLICY "Users can view own proposals" ON project_proposals FOR SELECT USING (
  contractor_id = auth.uid() OR client_id = auth.uid()
);
CREATE POLICY "Parties can view their contracts" ON client_contracts FOR SELECT USING (
  contractor_id = auth.uid() OR client_id = auth.uid()
);

-- ============================================================================
-- STEP 9: UTILITY FUNCTIONS
-- ============================================================================

-- Function to get user's companies
CREATE OR REPLACE FUNCTION get_user_companies(user_uuid UUID)
RETURNS TABLE (
  company_id UUID,
  company_name TEXT,
  user_role TEXT,
  member_since TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    cm.role,
    cm.created_at
  FROM companies c
  JOIN company_members cm ON c.id = cm.company_id
  WHERE cm.user_id = user_uuid AND cm.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check company permissions
CREATE OR REPLACE FUNCTION user_has_company_permission(user_uuid UUID, company_uuid UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM company_members 
    WHERE user_id = user_uuid 
    AND company_id = company_uuid 
    AND role = required_role 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update job application counts
CREATE OR REPLACE FUNCTION update_job_application_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE job_openings_enhanced 
    SET applications_count = applications_count + 1
    WHERE id = NEW.job_opening_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE job_openings_enhanced 
    SET applications_count = applications_count - 1
    WHERE id = OLD.job_opening_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for application counts
CREATE TRIGGER trigger_update_application_counts
  AFTER INSERT OR DELETE ON job_applications_enhanced
  FOR EACH ROW EXECUTE FUNCTION update_job_application_counts();

-- ============================================================================
-- STEP 10: SAMPLE DATA (OPTIONAL)
-- ============================================================================

-- Insert sample skill assessments
INSERT INTO skill_assessments (title, description, assessment_type, questions, skills_tested, is_public) VALUES
('JavaScript Fundamentals', 'Basic JavaScript knowledge test', 'technical', 
 '[{"question": "What is a closure?", "type": "multiple_choice", "options": ["Function", "Variable", "Scope concept", "Object"], "correct": 2}]',
 '["JavaScript", "Programming"]', true),
('Communication Skills', 'Evaluate communication abilities', 'personality',
 '[{"question": "How do you handle team conflicts?", "type": "text", "max_length": 500}]',
 '["Communication", "Leadership"]', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================

/*
NEXT STEPS:

1. **Data Migration**: If you have existing data, run migration scripts to move data to new tables
2. **Update TypeScript Types**: Generate new types from this enhanced schema
3. **Update Application Code**: 
   - Update API calls to use new table names
   - Implement multi-company features for employers
   - Add independent contractor workflows
4. **Deploy Dashboard Updates**: 
   - Employer multi-company dashboard
   - Enhanced employee application tracking
   - Independent contractor project management
5. **Test Role-Based Features**: Verify all three roles work correctly

This enhanced schema provides:
✅ Multi-company support for employers
✅ Comprehensive application workflow
✅ Advanced skill assessment system
✅ Independent contractor features
✅ Analytics and reporting capabilities
✅ Scalable role-based architecture
*/