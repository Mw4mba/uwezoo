// Enhanced TypeScript types for Uwezo Career Platform
// Generated from the enhanced database schema

// Specific type definitions to avoid 'any'
export interface WorkPreferences {
  remote_work: boolean
  flexible_hours: boolean
  preferred_locations: string[]
  travel_willingness: 'none' | 'occasional' | 'frequent'
  work_schedule: 'full_time' | 'part_time' | 'flexible'
  industry_preferences: string[]
}

export interface NotificationPreferences {
  email_notifications: boolean
  job_alerts: boolean
  application_updates: boolean
  interview_reminders: boolean
  marketing_emails: boolean
  sms_notifications: boolean
}

export interface CompanyPermissionSet {
  can_create_jobs: boolean
  can_edit_jobs: boolean
  can_delete_jobs: boolean
  can_view_applications: boolean
  can_manage_applications: boolean
  can_invite_members: boolean
  can_manage_company_settings: boolean
  can_view_analytics: boolean
  can_manage_billing: boolean
}

export interface ScreeningQuestion {
  id: string
  question: string
  type: 'text' | 'multiple_choice' | 'yes_no' | 'rating' | 'file_upload'
  required: boolean
  options?: string[]
  max_length?: number
  placeholder?: string
}

export interface ScreeningAnswer {
  question_id: string
  answer: string | string[] | number | boolean
  file_url?: string
}

export interface ApplicationStageHistory {
  stage: string
  timestamp: string
  changed_by: string
  notes?: string
  previous_stage?: string
}

export interface AssessmentQuestion {
  id: string
  question: string
  type: 'multiple_choice' | 'coding' | 'text' | 'true_false'
  points: number
  options?: string[]
  correct_answer?: string | number | boolean
  code_template?: string
  expected_output?: string
  time_limit_seconds?: number
}

export interface AssessmentAnswer {
  question_id: string
  answer: string | number | boolean
  submitted_code?: string
  execution_result?: string
  time_taken_seconds: number
}

export interface ProjectDeliverable {
  id: string
  title: string
  description: string
  due_date?: string
  completed: boolean
  deliverable_type: 'design' | 'code' | 'document' | 'meeting' | 'other'
}

export interface PortfolioItem {
  id: string
  title: string
  description: string
  url?: string
  image_url?: string
  technologies: string[]
  project_type: 'web' | 'mobile' | 'desktop' | 'design' | 'other'
  completion_date?: string
}

export interface Database {
  public: {
    Tables: {
      user_profiles_enhanced: {
        Row: UserProfileEnhanced
        Insert: UserProfileEnhancedInsert
        Update: UserProfileEnhancedUpdate
      }
      companies: {
        Row: Company
        Insert: CompanyInsert
        Update: CompanyUpdate
      }
      company_members: {
        Row: CompanyMember
        Insert: CompanyMemberInsert
        Update: CompanyMemberUpdate
      }
      job_openings_enhanced: {
        Row: JobOpeningEnhanced
        Insert: JobOpeningEnhancedInsert
        Update: JobOpeningEnhancedUpdate
      }
      job_applications_enhanced: {
        Row: JobApplicationEnhanced
        Insert: JobApplicationEnhancedInsert
        Update: JobApplicationEnhancedUpdate
      }
      skill_assessments: {
        Row: SkillAssessment
        Insert: SkillAssessmentInsert
        Update: SkillAssessmentUpdate
      }
      assessment_attempts: {
        Row: AssessmentAttempt
        Insert: AssessmentAttemptInsert
        Update: AssessmentAttemptUpdate
      }
      project_proposals: {
        Row: ProjectProposal
        Insert: ProjectProposalInsert
        Update: ProjectProposalUpdate
      }
      client_contracts: {
        Row: ClientContract
        Insert: ClientContractInsert
        Update: ClientContractUpdate
      }
    }
    Functions: {
      get_user_companies: {
        Args: { user_uuid: string }
        Returns: {
          company_id: string
          company_name: string
          user_role: string
          member_since: string
        }[]
      }
      user_has_company_permission: {
        Args: { 
          user_uuid: string
          company_uuid: string
          required_role: string
        }
        Returns: boolean
      }
    }
  }
}

// Core Types
export type UserRole = 'employee' | 'employer' | 'independent'
export type CompanyRole = 'owner' | 'admin' | 'hr_manager' | 'recruiter' | 'member'
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance'
export type WorkArrangement = 'remote' | 'hybrid' | 'onsite'
export type SeniorityLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'director'
export type ApplicationStatus = 
  | 'submitted' 
  | 'screening' 
  | 'assessment' 
  | 'interview' 
  | 'reference_check'
  | 'offer_pending' 
  | 'offer_extended' 
  | 'hired' 
  | 'rejected' 
  | 'withdrawn'

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-1000' | '1000+' | 'startup' | 'enterprise'
export type BusinessType = 'corporation' | 'llc' | 'partnership' | 'startup' | 'nonprofit'
export type SubscriptionTier = 'free' | 'basic' | 'professional' | 'enterprise'
export type AssessmentType = 'technical' | 'cognitive' | 'personality' | 'skills'
export type PricingModel = 'fixed_price' | 'hourly' | 'milestone_based'

// Enhanced User Profile with Multi-Role Support
export interface UserProfileEnhanced {
  id: string
  user_id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  phone: string | null
  location: string | null
  
  // Multi-Role Support
  primary_role: UserRole
  secondary_roles: UserRole[]
  role_verified: boolean
  role_selected_at: string | null
  onboarding_completed: boolean
  
  // Professional Information
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  resume_url: string | null
  years_experience: number
  current_salary_range: string | null
  expected_salary_range: string | null
  availability_status: 'available' | 'employed' | 'busy' | 'not_looking'
  
  // Skills and Preferences
  skills: string[]
  work_preferences: WorkPreferences
  notification_preferences: NotificationPreferences
  
  // Verification
  identity_verified: boolean
  profile_completion_score: number
  
  created_at: string
  updated_at: string
}

export interface UserProfileEnhancedInsert {
  user_id: string
  email?: string
  first_name?: string
  last_name?: string
  display_name?: string
  bio?: string
  avatar_url?: string
  phone?: string
  location?: string
  primary_role?: UserRole
  secondary_roles?: UserRole[]
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  resume_url?: string
  years_experience?: number
  current_salary_range?: string
  expected_salary_range?: string
  availability_status?: 'available' | 'employed' | 'busy' | 'not_looking'
  skills?: string[]
  work_preferences?: WorkPreferences
  notification_preferences?: NotificationPreferences
}

export interface UserProfileEnhancedUpdate {
  email?: string
  first_name?: string
  last_name?: string
  display_name?: string
  bio?: string
  avatar_url?: string
  phone?: string
  location?: string
  primary_role?: UserRole
  secondary_roles?: UserRole[]
  role_verified?: boolean
  role_selected_at?: string
  onboarding_completed?: boolean
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  resume_url?: string
  years_experience?: number
  current_salary_range?: string
  expected_salary_range?: string
  availability_status?: 'available' | 'employed' | 'busy' | 'not_looking'
  skills?: string[]
  work_preferences?: WorkPreferences
  notification_preferences?: NotificationPreferences
  identity_verified?: boolean
  profile_completion_score?: number
  updated_at?: string
}

// Company with Multi-Company Support
export interface Company {
  id: string
  name: string
  slug: string | null
  description: string | null
  industry: string | null
  company_size: CompanySize | null
  website: string | null
  email: string | null
  headquarters_location: string | null
  logo_url: string | null
  business_type: BusinessType | null
  is_verified: boolean
  subscription_tier: SubscriptionTier
  status: 'active' | 'inactive' | 'suspended'
  jobs_posted_count: number
  total_hires: number
  created_at: string
  updated_at: string
}

export interface CompanyInsert {
  name: string
  slug?: string
  description?: string
  industry?: string
  company_size?: CompanySize
  website?: string
  email?: string
  headquarters_location?: string
  logo_url?: string
  business_type?: BusinessType
}

export interface CompanyUpdate {
  name?: string
  slug?: string
  description?: string
  industry?: string
  company_size?: CompanySize
  website?: string
  email?: string
  headquarters_location?: string
  logo_url?: string
  business_type?: BusinessType
  is_verified?: boolean
  subscription_tier?: SubscriptionTier
  status?: 'active' | 'inactive' | 'suspended'
  jobs_posted_count?: number
  total_hires?: number
  updated_at?: string
}

// Company Member for Multi-Company Employer Support
export interface CompanyMember {
  id: string
  company_id: string
  user_id: string
  role: CompanyRole
  permissions: CompanyPermissionSet
  status: 'active' | 'inactive' | 'pending'
  joined_at: string
  created_at: string
}

export interface CompanyMemberInsert {
  company_id: string
  user_id: string
  role?: CompanyRole
  permissions?: CompanyPermissionSet
  status?: 'active' | 'inactive' | 'pending'
}

export interface CompanyMemberUpdate {
  role?: CompanyRole
  permissions?: CompanyPermissionSet
  status?: 'active' | 'inactive' | 'pending'
}

// Enhanced Job Opening
export interface JobOpeningEnhanced {
  id: string
  company_id: string
  created_by: string | null
  title: string
  slug: string | null
  description: string
  requirements: string | null
  responsibilities: string | null
  employment_type: EmploymentType
  work_arrangement: WorkArrangement
  location: string | null
  seniority_level: SeniorityLevel | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  salary_period: 'hourly' | 'monthly' | 'annually'
  positions_available: number
  application_deadline: string | null
  application_link: string | null
  required_skills: string[]
  preferred_skills: string[]
  min_years_experience: number
  requires_cover_letter: boolean
  requires_assessment: boolean
  screening_questions: ScreeningQuestion[]
  status: 'draft' | 'active' | 'paused' | 'closed'
  is_featured: boolean
  visibility: 'public' | 'private' | 'internal'
  views_count: number
  applications_count: number
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface JobOpeningEnhancedInsert {
  company_id: string
  created_by?: string
  title: string
  slug?: string
  description: string
  requirements?: string
  responsibilities?: string
  employment_type: EmploymentType
  work_arrangement?: WorkArrangement
  location?: string
  seniority_level?: SeniorityLevel
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_period?: 'hourly' | 'monthly' | 'annually'
  positions_available?: number
  application_deadline?: string
  application_link?: string
  required_skills?: string[]
  preferred_skills?: string[]
  min_years_experience?: number
  requires_cover_letter?: boolean
  requires_assessment?: boolean
  screening_questions?: ScreeningQuestion[]
  status?: 'draft' | 'active' | 'paused' | 'closed'
  is_featured?: boolean
  visibility?: 'public' | 'private' | 'internal'
}

export interface JobOpeningEnhancedUpdate {
  title?: string
  slug?: string
  description?: string
  requirements?: string
  responsibilities?: string
  employment_type?: EmploymentType
  work_arrangement?: WorkArrangement
  location?: string
  seniority_level?: SeniorityLevel
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_period?: 'hourly' | 'monthly' | 'annually'
  positions_available?: number
  application_deadline?: string
  application_link?: string
  required_skills?: string[]
  preferred_skills?: string[]
  min_years_experience?: number
  requires_cover_letter?: boolean
  requires_assessment?: boolean
  screening_questions?: ScreeningQuestion[]
  status?: 'draft' | 'active' | 'paused' | 'closed'
  is_featured?: boolean
  visibility?: 'public' | 'private' | 'internal'
  views_count?: number
  applications_count?: number
  updated_at?: string
  published_at?: string
}

// Enhanced Job Application with Complete Workflow
export interface JobApplicationEnhanced {
  id: string
  job_opening_id: string
  applicant_id: string
  resume_url: string | null
  cover_letter: string | null
  portfolio_url: string | null
  screening_answers: ScreeningAnswer[]
  assessment_score: number | null
  assessment_completed_at: string | null
  status: ApplicationStatus
  current_stage: string
  stage_history: ApplicationStageHistory[]
  overall_rating: number | null
  technical_rating: number | null
  communication_rating: number | null
  recruiter_notes: string | null
  rejection_reason: string | null
  submitted_at: string
  viewed_at: string | null
  interview_scheduled_at: string | null
  decision_made_at: string | null
  application_source: string
  created_at: string
  updated_at: string
}

export interface JobApplicationEnhancedInsert {
  job_opening_id: string
  applicant_id: string
  resume_url?: string
  cover_letter?: string
  portfolio_url?: string
  screening_answers?: ScreeningAnswer[]
  application_source?: string
}

export interface JobApplicationEnhancedUpdate {
  resume_url?: string
  cover_letter?: string
  portfolio_url?: string
  screening_answers?: ScreeningAnswer[]
  assessment_score?: number
  assessment_completed_at?: string
  status?: ApplicationStatus
  current_stage?: string
  stage_history?: ApplicationStageHistory[]
  overall_rating?: number
  technical_rating?: number
  communication_rating?: number
  recruiter_notes?: string
  rejection_reason?: string
  viewed_at?: string
  interview_scheduled_at?: string
  decision_made_at?: string
  updated_at?: string
}

// Skill Assessment System
export interface SkillAssessment {
  id: string
  title: string
  description: string | null
  assessment_type: AssessmentType
  questions: AssessmentQuestion[]
  time_limit_minutes: number | null
  passing_score: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
  skills_tested: string[]
  is_public: boolean
  created_by: string | null
  company_id: string | null
  attempts_count: number
  average_score: number | null
  created_at: string
  updated_at: string
}

export interface SkillAssessmentInsert {
  title: string
  description?: string
  assessment_type: AssessmentType
  questions: AssessmentQuestion[]
  time_limit_minutes?: number
  passing_score?: number
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
  skills_tested?: string[]
  is_public?: boolean
  created_by?: string
  company_id?: string
}

export interface SkillAssessmentUpdate {
  title?: string
  description?: string
  questions?: AssessmentQuestion[]
  time_limit_minutes?: number
  passing_score?: number
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
  skills_tested?: string[]
  is_public?: boolean
  attempts_count?: number
  average_score?: number
  updated_at?: string
}

// Assessment Attempts
export interface AssessmentAttempt {
  id: string
  assessment_id: string
  user_id: string
  job_application_id: string | null
  answers: AssessmentAnswer[]
  score: number | null
  passed: boolean | null
  started_at: string
  completed_at: string | null
  time_taken_minutes: number | null
  status: 'in_progress' | 'completed' | 'abandoned'
  created_at: string
}

export interface AssessmentAttemptInsert {
  assessment_id: string
  user_id: string
  job_application_id?: string
  answers: AssessmentAnswer[]
  score?: number
  passed?: boolean
  completed_at?: string
  time_taken_minutes?: number
  status?: 'in_progress' | 'completed' | 'abandoned'
}

export interface AssessmentAttemptUpdate {
  answers?: AssessmentAnswer[]
  score?: number
  passed?: boolean
  completed_at?: string
  time_taken_minutes?: number
  status?: 'in_progress' | 'completed' | 'abandoned'
}

// Independent Contractor Features
export interface ProjectProposal {
  id: string
  contractor_id: string
  client_id: string
  company_id: string | null
  title: string
  description: string
  scope_of_work: string | null
  deliverables: ProjectDeliverable[]
  estimated_duration_weeks: number | null
  pricing_model: PricingModel
  total_cost: number | null
  hourly_rate: number | null
  currency: string
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected'
  portfolio_items: PortfolioItem[]
  created_at: string
  updated_at: string
}

export interface ProjectProposalInsert {
  contractor_id: string
  client_id: string
  company_id?: string
  title: string
  description: string
  scope_of_work?: string
  deliverables?: ProjectDeliverable[]
  estimated_duration_weeks?: number
  pricing_model: PricingModel
  total_cost?: number
  hourly_rate?: number
  currency?: string
  status?: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected'
  portfolio_items?: PortfolioItem[]
}

export interface ProjectProposalUpdate {
  title?: string
  description?: string
  scope_of_work?: string
  deliverables?: ProjectDeliverable[]
  estimated_duration_weeks?: number
  pricing_model?: PricingModel
  total_cost?: number
  hourly_rate?: number
  currency?: string
  status?: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected'
  portfolio_items?: PortfolioItem[]
  updated_at?: string
}

export interface ClientContract {
  id: string
  proposal_id: string
  contractor_id: string
  client_id: string
  contract_content: string
  start_date: string | null
  end_date: string | null
  total_value: number | null
  status: 'active' | 'completed' | 'terminated'
  completion_percentage: number
  contractor_signed_at: string | null
  client_signed_at: string | null
  created_at: string
  updated_at: string
}

export interface ClientContractInsert {
  proposal_id: string
  contractor_id: string
  client_id: string
  contract_content: string
  start_date?: string
  end_date?: string
  total_value?: number
  status?: 'active' | 'completed' | 'terminated'
  completion_percentage?: number
  contractor_signed_at?: string
  client_signed_at?: string
}

export interface ClientContractUpdate {
  contract_content?: string
  start_date?: string
  end_date?: string
  total_value?: number
  status?: 'active' | 'completed' | 'terminated'
  completion_percentage?: number
  contractor_signed_at?: string
  client_signed_at?: string
  updated_at?: string
}

// Compound Types for UI Components
export interface JobWithCompany extends JobOpeningEnhanced {
  company: Company
}

export interface ApplicationWithJobAndCompany extends JobApplicationEnhanced {
  job_opening: JobOpeningEnhanced
  company: Company
}

export interface UserWithProfile extends UserProfileEnhanced {
  companies?: CompanyMember[]
  active_applications?: ApplicationWithJobAndCompany[]
  proposals?: ProjectProposal[]
  contracts?: ClientContract[]
}

export interface CompanyWithMembers extends Company {
  members: (CompanyMember & { user_profile: UserProfileEnhanced })[]
  job_openings?: JobOpeningEnhanced[]
}

export interface ProposalWithClientAndCompany extends ProjectProposal {
  client_profile: UserProfileEnhanced
  company?: Company
  contract?: ClientContract
}

// Dashboard Analytics Types
export interface EmployerDashboardStats {
  total_jobs: number
  active_jobs: number
  closed_jobs: number
  total_applications: number
  applications_this_week: number
}

export interface EmployeeDashboardStats {
  total_applications: number
  successful_hires: number
  active_applications: number
  last_application_date: string | null
}

export interface ContractorDashboardStats {
  total_proposals: number
  accepted_proposals: number
  active_contracts: number
  total_earnings: number
  avg_completion_rate: number
}

// Search and Filter Types
export interface JobSearchFilters {
  employment_type?: EmploymentType[]
  work_arrangement?: WorkArrangement[]
  location?: string
  salary_min?: number
  salary_max?: number
  skills?: string[]
  seniority_level?: SeniorityLevel[]
  company_size?: CompanySize[]
  posted_within_days?: number
}

export interface UserSearchFilters {
  role?: UserRole[]
  skills?: string[]
  years_experience_min?: number
  years_experience_max?: number
  location?: string
  availability_status?: string[]
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
  error: string | null
  success: boolean
}

// Role-Based Permission Types
export interface RolePermissions {
  can_create_jobs: boolean
  can_edit_jobs: boolean
  can_view_applications: boolean
  can_manage_company: boolean
  can_invite_members: boolean
  can_view_analytics: boolean
}

export interface CompanyPermissions {
  [companyId: string]: {
    role: CompanyRole
    permissions: RolePermissions
  }
}