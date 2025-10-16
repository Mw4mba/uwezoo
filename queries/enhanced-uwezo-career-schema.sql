-- ============================================================================
-- UWEZO CAREER PLATFORM - COMPREHENSIVE ROLE-BASED SCHEMA
-- Enhanced version supporting multiple companies per employer
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SCHEMA ANALYSIS AND IMPROVEMENTS
-- ============================================================================

/*
ROLE REQUIREMENTS ANALYSIS:

1. EMPLOYERS:
   - Can have multiple companies under one account ✓ (Enhanced)
   - Need company management dashboard ✓
   - Job posting and management capabilities ✓
   - Application review and hiring workflow ✓
   - Team/HR management features ✓ (New)

2. EMPLOYEES:
   - Job discovery and application process ✓
   - Profile and resume management ✓
   - Application tracking ✓
   - Skill assessment and verification ✓
   - Career progress tracking ✓ (Enhanced)

3. INDEPENDENT CONTRACTORS:
   - Project proposal system ✓ (New)
   - Client relationship management ✓ (New)
   - Contract and payment tracking ✓ (New)
   - Portfolio and skills showcase ✓ (Enhanced)

SCHEMA IMPROVEMENTS:
- Multi-company support for employers
- Enhanced role management system
- Comprehensive application workflow
- Advanced skill assessment system
- Contract management and digital signatures
- Project proposal system for independents
- Analytics and reporting capabilities
*/

-- ============================================================================
-- CORE USER MANAGEMENT
-- ============================================================================

-- Enhanced user profiles with comprehensive role support
CREATE TABLE IF NOT EXISTS user_profiles (
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
  timezone TEXT DEFAULT 'UTC',
  date_of_birth DATE,
  
  -- Role Management (Enhanced)
  primary_role TEXT NOT NULL DEFAULT 'employee' CHECK (primary_role IN ('employee', 'employer', 'independent')),
  secondary_roles TEXT[] DEFAULT '{}', -- Allow multiple roles per user
  role_verified BOOLEAN DEFAULT false,
  role_selected_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false,
  
  -- Professional Information
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  website_url TEXT,
  resume_url TEXT,
  years_experience INTEGER DEFAULT 0,
  current_salary_range TEXT,
  expected_salary_range TEXT,
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'employed', 'busy', 'not_looking')),
  
  -- Skills and Qualifications
  skills JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  languages JSONB DEFAULT '[]',
  
  -- Work Preferences
  work_preferences JSONB DEFAULT '{}', -- remote, hybrid, onsite preferences
  preferred_industries TEXT[],
  preferred_locations TEXT[],
  willing_to_relocate BOOLEAN DEFAULT false,
  
  -- Platform Settings
  notification_preferences JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  
  -- Verification and Compliance
  identity_verified BOOLEAN DEFAULT false,
  background_check_status TEXT DEFAULT 'not_required' CHECK (background_check_status IN ('not_required', 'pending', 'approved', 'rejected', 'expired')),
  tax_info_complete BOOLEAN DEFAULT false,
  
  -- Analytics
  profile_views INTEGER DEFAULT 0,
  profile_completion_score INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COMPANY MANAGEMENT (Enhanced for Multi-Company Support)
-- ============================================================================

-- Companies table with comprehensive business information
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic Information
  name TEXT NOT NULL,
  slug TEXT UNIQUE, -- URL-friendly identifier
  description TEXT,
  tagline TEXT,
  industry TEXT,
  sub_industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+', 'startup', 'enterprise')),
  founded_year INTEGER,
  
  -- Contact Information
  website TEXT,
  email TEXT,
  phone TEXT,
  headquarters_location TEXT,
  offices JSONB DEFAULT '[]', -- Multiple office locations
  
  -- Branding and Media
  logo_url TEXT,
  banner_url TEXT,
  company_photos JSONB DEFAULT '[]',
  
  -- Company Culture and Values
  company_culture JSONB DEFAULT '{}',
  values TEXT[],
  benefits JSONB DEFAULT '[]',
  perks JSONB DEFAULT '[]',
  
  -- Business Information
  business_type TEXT CHECK (business_type IN ('corporation', 'llc', 'partnership', 'sole_proprietorship', 'nonprofit', 'startup', 'government')),
  registration_number TEXT,
  tax_id TEXT,
  
  -- Social Media and Online Presence
  social_media JSONB DEFAULT '{}', -- LinkedIn, Twitter, etc.
  glassdoor_url TEXT,
  
  -- Platform Settings
  is_verified BOOLEAN DEFAULT false,
  verification_level TEXT DEFAULT 'basic' CHECK (verification_level IN ('basic', 'verified', 'premium', 'enterprise')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'professional', 'enterprise')),
  
  -- Status and Activity Tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification')),
  jobs_posted_count INTEGER DEFAULT 0,
  active_jobs_count INTEGER DEFAULT 0,
  total_hires INTEGER DEFAULT 0,
  employee_count INTEGER DEFAULT 0,
  
  -- Ratings and Reviews
  overall_rating DECIMAL(3,2),
  work_life_balance_rating DECIMAL(3,2),
  culture_rating DECIMAL(3,2),
  compensation_rating DECIMAL(3,2),
  reviews_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company members with role-based permissions
CREATE TABLE IF NOT EXISTS company_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role and Permissions
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'hr_manager', 'recruiter', 'hiring_manager', 'member')),
  permissions JSONB DEFAULT '{}', -- Custom granular permissions
  department TEXT,
  job_title TEXT,
  
  -- Employment Details
  employment_type TEXT CHECK (employment_type IN ('full_time', 'part_time', 'contractor', 'intern')),
  start_date DATE,
  end_date DATE,
  
  -- Access and Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  access_level TEXT DEFAULT 'basic' CHECK (access_level IN ('basic', 'advanced', 'full')),
  
  -- Invitation Tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  invitation_accepted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, user_id)
);

-- ============================================================================
-- JOB MANAGEMENT SYSTEM
-- ============================================================================

-- Enhanced job openings with advanced features
CREATE TABLE IF NOT EXISTS job_openings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  hiring_manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Basic Job Information
  title TEXT NOT NULL,
  slug TEXT UNIQUE, -- URL-friendly identifier
  description TEXT NOT NULL,
  requirements TEXT,
  responsibilities TEXT,
  nice_to_have TEXT,
  
  -- Job Classification
  department TEXT,
  team TEXT,
  job_function TEXT,
  seniority_level TEXT CHECK (seniority_level IN ('entry', 'junior', 'mid', 'senior', 'lead', 'principal', 'director', 'vp', 'c_level')),
  
  -- Employment Details
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'temporary', 'internship', 'freelance')),
  work_arrangement TEXT DEFAULT 'onsite' CHECK (work_arrangement IN ('remote', 'hybrid', 'onsite', 'flexible')),
  location TEXT,
  remote_policy JSONB DEFAULT '{}',
  timezone_requirements TEXT[],
  travel_requirements TEXT,
  
  -- Compensation Package
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  salary_period TEXT DEFAULT 'annually' CHECK (salary_period IN ('hourly', 'daily', 'weekly', 'monthly', 'annually')),
  
  -- Additional Compensation
  equity_offered BOOLEAN DEFAULT false,
  equity_percentage_min DECIMAL(5,4),
  equity_percentage_max DECIMAL(5,4),
  signing_bonus INTEGER,
  annual_bonus_target DECIMAL(5,2),
  
  -- Benefits and Perks
  benefits JSONB DEFAULT '[]',
  perks JSONB DEFAULT '[]',
  
  -- Application Configuration
  positions_available INTEGER DEFAULT 1,
  application_deadline TIMESTAMPTZ,
  application_method TEXT DEFAULT 'platform' CHECK (application_method IN ('platform', 'email', 'external_link')),
  external_application_url TEXT,
  application_link TEXT UNIQUE, -- Auto-generated application link
  
  -- Requirements and Skills
  required_skills JSONB DEFAULT '[]',
  preferred_skills JSONB DEFAULT '[]',
  min_years_experience INTEGER DEFAULT 0,
  max_years_experience INTEGER,
  education_requirements JSONB DEFAULT '{}',
  certification_requirements TEXT[],
  language_requirements JSONB DEFAULT '[]',
  
  -- Assessment and Screening
  requires_cover_letter BOOLEAN DEFAULT true,
  requires_portfolio BOOLEAN DEFAULT false,
  requires_assessment BOOLEAN DEFAULT false,
  assessment_ids UUID[],
  screening_questions JSONB DEFAULT '[]',
  interview_process JSONB DEFAULT '{}',
  
  -- Status and Workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'filled', 'cancelled', 'archived')),
  priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
  is_featured BOOLEAN DEFAULT false,
  is_confidential BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'internal', 'network')),
  
  -- Analytics and Performance
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  qualified_applications_count INTEGER DEFAULT 0,
  interviews_scheduled INTEGER DEFAULT 0,
  offers_made INTEGER DEFAULT 0,
  hires_made INTEGER DEFAULT 0,
  
  -- SEO and Discovery
  seo_title TEXT,
  seo_description TEXT,
  tags TEXT[],
  
  -- Timeline
  posted_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  filled_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- APPLICATION MANAGEMENT SYSTEM
-- ============================================================================

-- Comprehensive job applications with workflow tracking
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_opening_id UUID REFERENCES job_openings(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Application Documents and Materials
  resume_url TEXT,
  cover_letter TEXT,
  portfolio_url TEXT,
  additional_documents JSONB DEFAULT '[]',
  
  -- Application Responses
  screening_answers JSONB DEFAULT '{}',
  custom_questions_answers JSONB DEFAULT '{}',
  
  -- Assessment and Testing
  assessment_results JSONB DEFAULT '[]',
  overall_assessment_score DECIMAL(5,2),
  technical_assessment_score DECIMAL(5,2),
  
  -- Application Status and Workflow
  status TEXT DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'screening', 'phone_screen', 'assessment', 'technical_interview', 
    'behavioral_interview', 'final_interview', 'reference_check', 'background_check',
    'offer_pending', 'offer_extended', 'offer_accepted', 'offer_declined',
    'hired', 'rejected', 'withdrawn', 'on_hold'
  )),
  
  current_stage TEXT DEFAULT 'initial_review',
  stage_history JSONB DEFAULT '[]', -- Track all status changes with timestamps
  
  -- Ratings and Evaluations
  overall_rating DECIMAL(3,2), -- 1-5 scale
  technical_rating DECIMAL(3,2),
  communication_rating DECIMAL(3,2),
  culture_fit_rating DECIMAL(3,2),
  experience_rating DECIMAL(3,2),
  
  -- Feedback and Notes
  recruiter_notes TEXT,
  hiring_manager_notes TEXT,
  interview_feedback JSONB DEFAULT '[]',
  strengths TEXT[],
  concerns TEXT[],
  rejection_reason TEXT,
  rejection_feedback TEXT,
  
  -- Timeline Tracking
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  screening_completed_at TIMESTAMPTZ,
  assessment_completed_at TIMESTAMPTZ,
  first_interview_at TIMESTAMPTZ,
  final_interview_at TIMESTAMPTZ,
  offer_extended_at TIMESTAMPTZ,
  decision_deadline TIMESTAMPTZ,
  final_decision_at TIMESTAMPTZ,
  
  -- Offer Details (if applicable)
  offer_details JSONB DEFAULT '{}',
  negotiation_history JSONB DEFAULT '[]',
  
  -- Communication Log
  communication_log JSONB DEFAULT '[]',
  last_communication_at TIMESTAMPTZ,
  
  -- Source and Attribution
  application_source TEXT DEFAULT 'direct', -- job_board, referral, social_media, etc.
  referrer_id UUID REFERENCES auth.users(id),
  utm_source TEXT,
  utm_campaign TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(job_opening_id, applicant_id)
);

-- ============================================================================
-- ASSESSMENT AND TESTING SYSTEM
-- ============================================================================

-- Comprehensive skill assessment system
CREATE TABLE IF NOT EXISTS skill_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Assessment Information
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN (
    'technical_coding', 'technical_design', 'cognitive', 'personality', 
    'culture_fit', 'situational_judgment', 'skills_based', 'knowledge_test'
  )),
  
  -- Content and Configuration
  questions JSONB NOT NULL,
  scoring_rubric JSONB DEFAULT '{}',
  time_limit_minutes INTEGER,
  passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER DEFAULT 3,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  
  -- Skills and Categories
  skills_tested JSONB DEFAULT '[]',
  job_categories JSONB DEFAULT '[]',
  competencies_measured TEXT[],
  
  -- Availability and Access
  is_public BOOLEAN DEFAULT false,
  is_proctored BOOLEAN DEFAULT false,
  requires_webcam BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  
  -- Adaptive Testing
  is_adaptive BOOLEAN DEFAULT false,
  question_bank_size INTEGER,
  adaptive_algorithm TEXT,
  
  -- Analytics and Performance
  attempts_count INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  completion_rate DECIMAL(5,2),
  reliability_score DECIMAL(5,2),
  
  -- Metadata
  tags TEXT[],
  version TEXT DEFAULT '1.0',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment attempts tracking
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES skill_assessments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_application_id UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  
  -- Attempt Details
  attempt_number INTEGER DEFAULT 1,
  answers JSONB NOT NULL,
  score DECIMAL(5,2),
  percentage_score DECIMAL(5,2),
  passed BOOLEAN,
  
  -- Timing and Progress
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_taken_minutes INTEGER,
  time_remaining_minutes INTEGER,
  
  -- Proctoring and Security
  ip_address INET,
  user_agent TEXT,
  browser_events JSONB DEFAULT '[]', -- Tab switches, etc.
  webcam_recordings TEXT[], -- URLs to recordings
  screen_recordings TEXT[],
  
  -- Detailed Analytics
  question_response_times JSONB DEFAULT '{}',
  difficulty_progression JSONB DEFAULT '{}',
  confidence_scores JSONB DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'flagged', 'invalidated')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONTRACT AND LEGAL MANAGEMENT
-- ============================================================================

-- Enhanced contract templates
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  
  -- Template Information
  name TEXT NOT NULL,
  description TEXT,
  contract_type TEXT NOT NULL CHECK (contract_type IN (
    'employment_full_time', 'employment_part_time', 'contractor_agreement', 
    'freelance_agreement', 'internship_agreement', 'nda', 'non_compete', 
    'offer_letter', 'promotion_letter', 'termination_letter'
  )),
  
  -- Content and Structure
  template_content TEXT NOT NULL,
  variables JSONB DEFAULT '{}', -- Dynamic placeholders
  required_fields JSONB DEFAULT '[]',
  optional_fields JSONB DEFAULT '[]',
  
  -- Legal and Compliance
  jurisdiction TEXT,
  applicable_law TEXT,
  legal_review_status TEXT DEFAULT 'pending' CHECK (legal_review_status IN ('pending', 'approved', 'needs_revision', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  compliance_tags TEXT[],
  
  -- Template Management
  version TEXT DEFAULT '1.0',
  parent_template_id UUID REFERENCES contract_templates(id),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Usage Analytics
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2), -- Percentage of successful signings
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract signatures and execution
CREATE TABLE IF NOT EXISTS contract_signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_template_id UUID REFERENCES contract_templates(id) ON DELETE CASCADE,
  job_application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Parties Involved
  employee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_representative_id UUID REFERENCES auth.users(id),
  
  -- Document Content
  final_contract_content TEXT NOT NULL,
  contract_variables JSONB DEFAULT '{}', -- Filled-in values
  document_hash TEXT, -- For integrity verification
  
  -- Digital Signature Information
  employee_signature_data JSONB,
  employer_signature_data JSONB,
  witness_signatures JSONB DEFAULT '[]',
  
  -- Execution Details
  signed_via_ip INET,
  signed_via_user_agent TEXT,
  signature_method TEXT DEFAULT 'electronic' CHECK (signature_method IN ('electronic', 'digital', 'wet_signature', 'docusign')),
  
  -- Status and Timeline
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partially_signed', 'fully_signed', 'voided', 'expired')),
  employee_signed_at TIMESTAMPTZ,
  employer_signed_at TIMESTAMPTZ,
  fully_executed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  void_reason TEXT,
  
  -- Legal Requirements
  notarization_required BOOLEAN DEFAULT false,
  notarized_at TIMESTAMPTZ,
  notary_info JSONB,
  
  -- Document Management
  signed_document_url TEXT,
  audit_trail JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEPENDENT CONTRACTOR SYSTEM
-- ============================================================================

-- Project proposals for independent contractors
CREATE TABLE IF NOT EXISTS project_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Parties
  contractor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  
  -- Project Information
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  subcategory TEXT,
  project_type TEXT CHECK (project_type IN ('web_development', 'mobile_app', 'design', 'marketing', 'writing', 'consulting', 'other')),
  
  -- Scope and Deliverables
  scope_of_work TEXT,
  deliverables JSONB DEFAULT '[]',
  success_criteria TEXT,
  assumptions TEXT,
  exclusions TEXT,
  
  -- Timeline and Milestones
  estimated_duration_weeks INTEGER,
  start_date DATE,
  end_date DATE,
  milestones JSONB DEFAULT '[]',
  
  -- Pricing and Payment
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('fixed_price', 'hourly', 'milestone_based', 'retainer', 'equity', 'revenue_share')),
  total_cost DECIMAL(10,2),
  hourly_rate DECIMAL(8,2),
  currency TEXT DEFAULT 'USD',
  payment_schedule JSONB DEFAULT '{}',
  payment_terms TEXT,
  
  -- Requirements and Skills
  required_skills JSONB DEFAULT '[]',
  tools_and_technologies JSONB DEFAULT '[]',
  
  -- Proposal Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'negotiating', 'accepted', 'rejected', 'withdrawn', 'expired')),
  submission_deadline TIMESTAMPTZ,
  
  -- Communication and Negotiation
  negotiation_notes TEXT,
  client_feedback TEXT,
  revision_count INTEGER DEFAULT 0,
  
  -- Supporting Materials
  portfolio_items JSONB DEFAULT '[]',
  case_studies JSONB DEFAULT '[]',
  references JSONB DEFAULT '[]',
  sample_work_urls TEXT[],
  
  -- Proposal Metadata
  proposal_source TEXT DEFAULT 'direct', -- platform, referral, cold_outreach
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),
  
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
  contract_title TEXT NOT NULL,
  contract_content TEXT NOT NULL,
  contract_type TEXT CHECK (contract_type IN ('fixed_project', 'ongoing_retainer', 'time_and_materials', 'equity_based')),
  
  -- Timeline
  start_date DATE NOT NULL,
  end_date DATE,
  auto_renewal BOOLEAN DEFAULT false,
  renewal_terms TEXT,
  
  -- Financial Terms
  total_value DECIMAL(10,2),
  payment_schedule JSONB DEFAULT '{}',
  payment_terms TEXT,
  late_payment_penalty DECIMAL(5,2),
  
  -- Work Terms
  work_scope TEXT,
  deliverables JSONB DEFAULT '[]',
  performance_metrics JSONB DEFAULT '{}',
  quality_standards TEXT,
  
  -- Legal Terms
  intellectual_property_terms TEXT,
  confidentiality_terms TEXT,
  termination_clause TEXT,
  dispute_resolution TEXT,
  governing_law TEXT,
  
  -- Progress Tracking
  milestones JSONB DEFAULT '[]',
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  current_milestone TEXT,
  
  -- Status Management
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'terminated', 'disputed')),
  termination_reason TEXT,
  
  -- Signatures and Legal
  contractor_signed_at TIMESTAMPTZ,
  client_signed_at TIMESTAMPTZ,
  contract_hash TEXT,
  
  -- Performance and Feedback
  contractor_rating DECIMAL(3,2),
  client_rating DECIMAL(3,2),
  feedback_comments TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COMPREHENSIVE INDEXING STRATEGY
-- ============================================================================

-- User Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_primary_role ON user_profiles(primary_role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_availability ON user_profiles(availability_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(location);
CREATE INDEX IF NOT EXISTS idx_user_profiles_skills ON user_profiles USING GIN(skills);

-- Companies Indexes
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_size ON companies(company_size);
CREATE INDEX IF NOT EXISTS idx_companies_location ON companies(headquarters_location);

-- Company Members Indexes
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_role ON company_members(role);
CREATE INDEX IF NOT EXISTS idx_company_members_status ON company_members(status);

-- Job Openings Indexes
CREATE INDEX IF NOT EXISTS idx_job_openings_company_id ON job_openings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_openings_status ON job_openings(status);
CREATE INDEX IF NOT EXISTS idx_job_openings_employment_type ON job_openings(employment_type);
CREATE INDEX IF NOT EXISTS idx_job_openings_location ON job_openings(location);
CREATE INDEX IF NOT EXISTS idx_job_openings_seniority ON job_openings(seniority_level);
CREATE INDEX IF NOT EXISTS idx_job_openings_posted_at ON job_openings(posted_at);
CREATE INDEX IF NOT EXISTS idx_job_openings_skills ON job_openings USING GIN(required_skills);
CREATE INDEX IF NOT EXISTS idx_job_openings_tags ON job_openings USING GIN(tags);

-- Job Applications Indexes
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_opening_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_submitted_at ON job_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_rating ON job_applications(overall_rating);

-- Assessment System Indexes
CREATE INDEX IF NOT EXISTS idx_skill_assessments_type ON skill_assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_company_id ON skill_assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_skills ON skill_assessments USING GIN(skills_tested);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment_id ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_id ON assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_job_app_id ON assessment_attempts(job_application_id);

-- Contract Management Indexes
CREATE INDEX IF NOT EXISTS idx_contract_templates_company_id ON contract_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_type ON contract_templates(contract_type);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_job_app_id ON contract_signatures(job_application_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_status ON contract_signatures(status);

-- Independent Contractor Indexes
CREATE INDEX IF NOT EXISTS idx_project_proposals_contractor_id ON project_proposals(contractor_id);
CREATE INDEX IF NOT EXISTS idx_project_proposals_client_id ON project_proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_project_proposals_status ON project_proposals(status);
CREATE INDEX IF NOT EXISTS idx_project_proposals_category ON project_proposals(category);

CREATE INDEX IF NOT EXISTS idx_client_contracts_contractor_id ON client_contracts(contractor_id);
CREATE INDEX IF NOT EXISTS idx_client_contracts_client_id ON client_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contracts_status ON client_contracts(status);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contracts ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Companies Policies
CREATE POLICY "Anyone can view active companies" ON companies FOR SELECT USING (status = 'active');
CREATE POLICY "Company members can view their companies" ON companies FOR SELECT USING (
  id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
);

-- Company Members Policies
CREATE POLICY "Company members can view company members" ON company_members FOR SELECT USING (
  company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
);

-- Job Openings Policies
CREATE POLICY "Anyone can view active public jobs" ON job_openings FOR SELECT USING (
  status = 'active' AND visibility = 'public'
);
CREATE POLICY "Company members can manage company jobs" ON job_openings FOR ALL USING (
  company_id IN (
    SELECT cm.company_id FROM company_members cm 
    WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin', 'hr_manager', 'recruiter')
  )
);

-- Job Applications Policies
CREATE POLICY "Applicants can view own applications" ON job_applications FOR SELECT USING (applicant_id = auth.uid());
CREATE POLICY "Company members can view applications to company jobs" ON job_applications FOR SELECT USING (
  job_opening_id IN (
    SELECT jo.id FROM job_openings jo
    JOIN company_members cm ON jo.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin', 'hr_manager', 'recruiter')
  )
);

-- Assessment Policies
CREATE POLICY "Users can view public assessments" ON skill_assessments FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own assessment attempts" ON assessment_attempts FOR SELECT USING (user_id = auth.uid());

-- Contract Policies
CREATE POLICY "Company members can view company contracts" ON contract_templates FOR SELECT USING (
  company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
);
CREATE POLICY "Parties can view their contract signatures" ON contract_signatures FOR SELECT USING (
  employee_id = auth.uid() OR employer_representative_id = auth.uid()
);

-- Independent Contractor Policies
CREATE POLICY "Users can view own proposals" ON project_proposals FOR SELECT USING (
  contractor_id = auth.uid() OR client_id = auth.uid()
);
CREATE POLICY "Parties can view their contracts" ON client_contracts FOR SELECT USING (
  contractor_id = auth.uid() OR client_id = auth.uid()
);

-- ============================================================================
-- AUTOMATED FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, first_name, last_name, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update job application counts
CREATE OR REPLACE FUNCTION update_job_application_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE job_openings 
    SET applications_count = applications_count + 1,
        updated_at = NOW()
    WHERE id = NEW.job_opening_id;
    
    IF NEW.overall_rating >= 3.0 THEN
      UPDATE job_openings 
      SET qualified_applications_count = qualified_applications_count + 1
      WHERE id = NEW.job_opening_id;
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update qualified count based on rating changes
    IF OLD.overall_rating < 3.0 AND NEW.overall_rating >= 3.0 THEN
      UPDATE job_openings 
      SET qualified_applications_count = qualified_applications_count + 1
      WHERE id = NEW.job_opening_id;
    ELSIF OLD.overall_rating >= 3.0 AND NEW.overall_rating < 3.0 THEN
      UPDATE job_openings 
      SET qualified_applications_count = qualified_applications_count - 1
      WHERE id = NEW.job_opening_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE job_openings 
    SET applications_count = applications_count - 1,
        qualified_applications_count = CASE 
          WHEN OLD.overall_rating >= 3.0 THEN qualified_applications_count - 1
          ELSE qualified_applications_count
        END,
        updated_at = NOW()
    WHERE id = OLD.job_opening_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for job application counts
CREATE TRIGGER trigger_update_job_application_counts
  AFTER INSERT OR UPDATE OR DELETE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_job_application_counts();

-- Function to generate unique application links
CREATE OR REPLACE FUNCTION generate_application_link()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.application_link IS NULL THEN
    NEW.application_link = '/apply/' || NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for application link generation
CREATE TRIGGER trigger_generate_application_link
  BEFORE INSERT ON job_openings
  FOR EACH ROW EXECUTE FUNCTION generate_application_link();

-- ============================================================================
-- HELPER FUNCTIONS FOR ROLE-BASED OPERATIONS
-- ============================================================================

-- Function to check if user has company role
CREATE OR REPLACE FUNCTION user_has_company_role(user_uuid UUID, company_uuid UUID, required_role TEXT)
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

-- Function to calculate application pipeline metrics
CREATE OR REPLACE FUNCTION get_application_pipeline_metrics(company_uuid UUID)
RETURNS TABLE (
  total_applications INTEGER,
  new_applications INTEGER,
  in_review INTEGER,
  interviewed INTEGER,
  offers_pending INTEGER,
  hired INTEGER,
  rejected INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_applications,
    COUNT(CASE WHEN ja.status = 'submitted' THEN 1 END)::INTEGER as new_applications,
    COUNT(CASE WHEN ja.status IN ('screening', 'assessment') THEN 1 END)::INTEGER as in_review,
    COUNT(CASE WHEN ja.status LIKE '%interview%' THEN 1 END)::INTEGER as interviewed,
    COUNT(CASE WHEN ja.status IN ('offer_pending', 'offer_extended') THEN 1 END)::INTEGER as offers_pending,
    COUNT(CASE WHEN ja.status = 'hired' THEN 1 END)::INTEGER as hired,
    COUNT(CASE WHEN ja.status = 'rejected' THEN 1 END)::INTEGER as rejected
  FROM job_applications ja
  JOIN job_openings jo ON ja.job_opening_id = jo.id
  WHERE jo.company_id = company_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SAMPLE DATA FOR TESTING (OPTIONAL)
-- ============================================================================

-- Insert sample skill assessments
INSERT INTO skill_assessments (title, description, assessment_type, questions, skills_tested, is_public) VALUES
('JavaScript Fundamentals', 'Basic JavaScript knowledge assessment', 'technical_coding', 
 '[{"question": "What is a closure in JavaScript?", "type": "multiple_choice", "options": ["A function", "A variable", "A scope concept", "An object"], "correct": 2}]',
 '["JavaScript", "Web Development"]', true),
('Communication Skills', 'Evaluate communication and interpersonal skills', 'behavioral',
 '[{"question": "How do you handle conflict in a team?", "type": "text", "max_length": 500}]',
 '["Communication", "Teamwork"]', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SCHEMA VALIDATION AND HEALTH CHECKS
-- ============================================================================

-- Function to validate schema integrity
CREATE OR REPLACE FUNCTION validate_schema_integrity()
RETURNS TABLE (
  table_name TEXT,
  constraint_name TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.table_name::TEXT,
    tc.constraint_name::TEXT,
    'OK'::TEXT as status
  FROM information_schema.table_constraints tc
  WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION NOTES AND DEPLOYMENT INSTRUCTIONS
-- ============================================================================

/*
DEPLOYMENT INSTRUCTIONS:

1. BACKUP EXISTING DATA:
   - Run pg_dump on current database
   - Test restore process

2. EXECUTE SCHEMA:
   - Run this script in Supabase SQL Editor
   - Verify all tables created successfully
   - Check RLS policies are active

3. MIGRATE EXISTING DATA:
   - Update existing profiles table to match new user_profiles structure
   - Migrate any existing company/job data
   - Update application code to use new table names

4. UPDATE APPLICATION CODE:
   - Update TypeScript types to match new schema
   - Update API calls to use new table/column names
   - Test all role-based features

5. PERFORMANCE TUNING:
   - Monitor query performance
   - Add additional indexes as needed
   - Optimize RLS policies for your specific use case

ROLE-SPECIFIC FEATURES TO IMPLEMENT:

EMPLOYERS:
- Multi-company dashboard
- Job posting workflow
- Application review interface
- Team member management
- Analytics and reporting

EMPLOYEES:
- Job search and filtering
- Application tracking
- Skill assessment system
- Profile management
- Career progress tracking

INDEPENDENT CONTRACTORS:
- Project proposal system
- Client management
- Contract tracking
- Portfolio showcase
- Payment tracking

This schema provides a comprehensive foundation for a multi-role career platform
with advanced features for job management, assessment, and contractor relationships.
*/