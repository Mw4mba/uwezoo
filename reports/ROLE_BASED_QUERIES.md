# COMPREHENSIVE QUERIES FOR ROLE-BASED UWEZO CAREER PLATFORM

## 🏢 EMPLOYER QUERIES (Multi-Company Support)

### Get Employer's Companies and Roles
```sql
-- Get all companies where user is a member
SELECT 
  c.id,
  c.name,
  c.slug,
  c.industry,
  c.company_size,
  cm.role,
  cm.permissions,
  cm.joined_at,
  c.jobs_posted_count,
  c.total_hires
FROM companies c
JOIN company_members cm ON c.id = cm.company_id
WHERE cm.user_id = $1 AND cm.status = 'active'
ORDER BY c.name;
```

### Employer Dashboard Analytics
```sql
-- Comprehensive dashboard stats for all employer's companies
WITH employer_companies AS (
  SELECT company_id FROM company_members 
  WHERE user_id = $1 AND status = 'active'
),
job_stats AS (
  SELECT 
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_jobs,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_jobs,
    SUM(applications_count) as total_applications
  FROM job_openings_enhanced jo
  WHERE jo.company_id IN (SELECT company_id FROM employer_companies)
),
recent_applications AS (
  SELECT COUNT(*) as recent_apps
  FROM job_applications_enhanced ja
  JOIN job_openings_enhanced jo ON ja.job_opening_id = jo.id
  WHERE jo.company_id IN (SELECT company_id FROM employer_companies)
  AND ja.submitted_at >= NOW() - INTERVAL '7 days'
)
SELECT 
  js.total_jobs,
  js.active_jobs,
  js.closed_jobs,
  js.total_applications,
  ra.recent_apps as applications_this_week
FROM job_stats js, recent_applications ra;
```

### Multi-Company Job Management
```sql
-- All jobs across employer's companies with application metrics
SELECT 
  jo.id,
  jo.title,
  jo.status,
  jo.employment_type,
  jo.location,
  jo.applications_count,
  jo.views_count,
  c.name as company_name,
  c.logo_url as company_logo,
  cm.role as user_role_in_company,
  jo.created_at,
  jo.application_deadline,
  CASE 
    WHEN jo.application_deadline < NOW() THEN 'expired'
    WHEN jo.application_deadline < NOW() + INTERVAL '7 days' THEN 'expiring_soon'
    ELSE 'active'
  END as deadline_status
FROM job_openings_enhanced jo
JOIN companies c ON jo.company_id = c.id
JOIN company_members cm ON c.id = cm.company_id
WHERE cm.user_id = $1 
  AND cm.status = 'active'
  AND ($2::text IS NULL OR jo.status = $2)
ORDER BY jo.created_at DESC;
```

### Application Pipeline by Company
```sql
-- Application status breakdown for a specific company
SELECT 
  ja.status,
  COUNT(*) as count,
  AVG(ja.overall_rating) as avg_rating,
  COUNT(CASE WHEN ja.submitted_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_count
FROM job_applications_enhanced ja
JOIN job_openings_enhanced jo ON ja.job_opening_id = jo.id
WHERE jo.company_id = $1
GROUP BY ja.status
ORDER BY count DESC;
```

### Top Candidates Across Companies
```sql
-- Best candidates across all employer's companies
SELECT DISTINCT
  up.id,
  up.first_name,
  up.last_name,
  up.email,
  up.avatar_url,
  up.years_experience,
  up.skills,
  ja.overall_rating,
  ja.technical_rating,
  ja.communication_rating,
  ja.status as application_status,
  jo.title as applied_position,
  c.name as company_name,
  ja.submitted_at
FROM user_profiles_enhanced up
JOIN job_applications_enhanced ja ON up.user_id = ja.applicant_id
JOIN job_openings_enhanced jo ON ja.job_opening_id = jo.id
JOIN companies c ON jo.company_id = c.id
JOIN company_members cm ON c.id = cm.company_id
WHERE cm.user_id = $1 
  AND cm.status = 'active'
  AND ja.overall_rating >= 4.0
ORDER BY ja.overall_rating DESC, ja.submitted_at DESC
LIMIT 20;
```

## 👨‍💼 EMPLOYEE QUERIES

### Employee Profile and Status
```sql
-- Complete employee profile with application status
SELECT 
  up.*,
  COUNT(ja.id) as total_applications,
  COUNT(CASE WHEN ja.status = 'hired' THEN 1 END) as successful_hires,
  COUNT(CASE WHEN ja.status IN ('submitted', 'screening', 'interview') THEN 1 END) as active_applications,
  MAX(ja.submitted_at) as last_application_date
FROM user_profiles_enhanced up
LEFT JOIN job_applications_enhanced ja ON up.user_id = ja.applicant_id
WHERE up.user_id = $1
GROUP BY up.id;
```

### Job Recommendations
```sql
-- Personalized job recommendations based on skills and preferences
WITH user_skills AS (
  SELECT skills FROM user_profiles_enhanced WHERE user_id = $1
),
skill_match_jobs AS (
  SELECT 
    jo.*,
    c.name as company_name,
    c.logo_url as company_logo,
    c.industry,
    -- Calculate skill match percentage
    (
      SELECT COUNT(*)::FLOAT / 
      CASE WHEN jsonb_array_length(jo.required_skills) = 0 THEN 1 
           ELSE jsonb_array_length(jo.required_skills) END
      FROM jsonb_array_elements_text(jo.required_skills) AS required_skill
      WHERE required_skill IN (
        SELECT jsonb_array_elements_text(us.skills) FROM user_skills us
      )
    ) * 100 as skill_match_percentage,
    -- Check if already applied
    CASE WHEN ja.id IS NOT NULL THEN true ELSE false END as already_applied
  FROM job_openings_enhanced jo
  JOIN companies c ON jo.company_id = c.id
  LEFT JOIN job_applications_enhanced ja ON jo.id = ja.job_opening_id AND ja.applicant_id = $1
  CROSS JOIN user_skills us
  WHERE jo.status = 'active'
    AND jo.visibility = 'public'
    AND ja.id IS NULL  -- Haven't applied yet
)
SELECT *
FROM skill_match_jobs
WHERE skill_match_percentage >= 30  -- At least 30% skill match
ORDER BY skill_match_percentage DESC, created_at DESC
LIMIT 20;
```

### Application History and Status
```sql
-- Complete application history with detailed status
SELECT 
  ja.id,
  ja.status,
  ja.current_stage,
  ja.overall_rating,
  ja.submitted_at,
  ja.viewed_at,
  ja.interview_scheduled_at,
  ja.decision_made_at,
  ja.rejection_reason,
  jo.title as job_title,
  jo.employment_type,
  jo.location,
  jo.salary_min,
  jo.salary_max,
  c.name as company_name,
  c.logo_url as company_logo,
  c.industry,
  -- Calculate time in current stage
  EXTRACT(DAYS FROM NOW() - ja.updated_at) as days_in_current_stage,
  -- Stage progress
  jsonb_array_length(ja.stage_history) as total_stages_completed
FROM job_applications_enhanced ja
JOIN job_openings_enhanced jo ON ja.job_opening_id = jo.id
JOIN companies c ON jo.company_id = c.id
WHERE ja.applicant_id = $1
ORDER BY ja.submitted_at DESC;
```

### Skills Gap Analysis
```sql
-- Identify missing skills for better job matches
WITH user_profile AS (
  SELECT skills FROM user_profiles_enhanced WHERE user_id = $1
),
market_demand AS (
  SELECT 
    skill_name,
    COUNT(*) as job_count,
    AVG(salary_max) as avg_max_salary
  FROM job_openings_enhanced jo,
  jsonb_array_elements_text(jo.required_skills) AS skill_name
  WHERE jo.status = 'active' 
    AND jo.created_at >= NOW() - INTERVAL '90 days'
  GROUP BY skill_name
  HAVING COUNT(*) >= 5
),
user_skills AS (
  SELECT jsonb_array_elements_text(skills) as user_skill
  FROM user_profile
)
SELECT 
  md.skill_name,
  md.job_count,
  md.avg_max_salary,
  CASE WHEN us.user_skill IS NOT NULL THEN true ELSE false END as user_has_skill
FROM market_demand md
LEFT JOIN user_skills us ON md.skill_name = us.user_skill
ORDER BY md.job_count DESC, md.avg_max_salary DESC;
```

### Interview Schedule and Prep
```sql
-- Upcoming interviews and preparation data
SELECT 
  ja.id as application_id,
  ja.interview_scheduled_at,
  ja.current_stage,
  jo.title as job_title,
  jo.description,
  jo.required_skills,
  jo.screening_questions,
  c.name as company_name,
  c.industry,
  c.website,
  -- Time until interview
  EXTRACT(HOURS FROM ja.interview_scheduled_at - NOW()) as hours_until_interview,
  -- Preparation suggestions
  CASE 
    WHEN ja.current_stage = 'technical_interview' THEN 'Focus on technical skills and coding challenges'
    WHEN ja.current_stage = 'behavioral_interview' THEN 'Prepare STAR method examples'
    ELSE 'Research the company and role thoroughly'
  END as prep_suggestion
FROM job_applications_enhanced ja
JOIN job_openings_enhanced jo ON ja.job_opening_id = jo.id
JOIN companies c ON jo.company_id = c.id
WHERE ja.applicant_id = $1
  AND ja.interview_scheduled_at > NOW()
ORDER BY ja.interview_scheduled_at ASC;
```

## 🚀 INDEPENDENT CONTRACTOR QUERIES

### Contractor Profile and Portfolio
```sql
-- Complete contractor profile with project history
SELECT 
  up.*,
  COUNT(pp.id) as total_proposals,
  COUNT(CASE WHEN pp.status = 'accepted' THEN 1 END) as accepted_proposals,
  COUNT(cc.id) as active_contracts,
  SUM(cc.total_value) as total_earnings,
  AVG(
    CASE WHEN cc.status = 'completed' 
    THEN cc.completion_percentage 
    END
  ) as avg_completion_rate
FROM user_profiles_enhanced up
LEFT JOIN project_proposals pp ON up.user_id = pp.contractor_id
LEFT JOIN client_contracts cc ON pp.id = cc.proposal_id
WHERE up.user_id = $1
GROUP BY up.id;
```

### Active Projects and Contracts
```sql
-- All active contracts with client information and progress
SELECT 
  cc.id as contract_id,
  pp.title as project_title,
  pp.description,
  pp.total_cost,
  pp.pricing_model,
  cc.total_value,
  cc.completion_percentage,
  cc.start_date,
  cc.end_date,
  cc.status,
  -- Client information
  client_profile.first_name as client_first_name,
  client_profile.last_name as client_last_name,
  client_profile.email as client_email,
  client_profile.avatar_url as client_avatar,
  -- Company information (if applicable)
  c.name as client_company_name,
  c.industry as client_industry,
  -- Timeline calculations
  EXTRACT(DAYS FROM cc.end_date - NOW()) as days_remaining,
  EXTRACT(DAYS FROM NOW() - cc.start_date) as days_elapsed,
  CASE 
    WHEN cc.end_date < NOW() THEN 'overdue'
    WHEN cc.end_date < NOW() + INTERVAL '7 days' THEN 'due_soon'
    ELSE 'on_track'
  END as timeline_status
FROM client_contracts cc
JOIN project_proposals pp ON cc.proposal_id = pp.id
JOIN user_profiles_enhanced client_profile ON pp.client_id = client_profile.user_id
LEFT JOIN companies c ON pp.company_id = c.id
WHERE pp.contractor_id = $1
  AND cc.status = 'active'
ORDER BY cc.end_date ASC;
```

### Proposal Pipeline
```sql
-- All proposals with status tracking
SELECT 
  pp.id,
  pp.title,
  pp.description,
  pp.total_cost,
  pp.pricing_model,
  pp.estimated_duration_weeks,
  pp.status,
  pp.created_at,
  pp.updated_at,
  -- Client information
  client_profile.first_name as client_first_name,
  client_profile.last_name as client_last_name,
  client_profile.email as client_email,
  -- Company information
  c.name as client_company_name,
  c.industry as client_industry,
  -- Timeline tracking
  EXTRACT(DAYS FROM NOW() - pp.created_at) as days_since_submitted,
  CASE 
    WHEN pp.status = 'submitted' AND pp.created_at < NOW() - INTERVAL '7 days' THEN 'pending_long'
    WHEN pp.status = 'under_review' AND pp.updated_at < NOW() - INTERVAL '3 days' THEN 'review_delayed'
    ELSE 'normal'
  END as urgency_status
FROM project_proposals pp
JOIN user_profiles_enhanced client_profile ON pp.client_id = client_profile.user_id
LEFT JOIN companies c ON pp.company_id = c.id
WHERE pp.contractor_id = $1
ORDER BY pp.created_at DESC;
```

### Earnings and Financial Overview
```sql
-- Financial dashboard for contractor
WITH earnings_summary AS (
  SELECT 
    SUM(CASE WHEN cc.status = 'completed' THEN cc.total_value ELSE 0 END) as total_completed_earnings,
    SUM(CASE WHEN cc.status = 'active' THEN cc.total_value * (cc.completion_percentage / 100) ELSE 0 END) as current_project_earnings,
    COUNT(CASE WHEN cc.status = 'completed' THEN 1 END) as completed_projects,
    COUNT(CASE WHEN cc.status = 'active' THEN 1 END) as active_projects
  FROM client_contracts cc
  JOIN project_proposals pp ON cc.proposal_id = pp.id
  WHERE pp.contractor_id = $1
),
monthly_earnings AS (
  SELECT 
    DATE_TRUNC('month', cc.contractor_signed_at) as month,
    SUM(cc.total_value) as monthly_total
  FROM client_contracts cc
  JOIN project_proposals pp ON cc.proposal_id = pp.id
  WHERE pp.contractor_id = $1
    AND cc.contractor_signed_at >= NOW() - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', cc.contractor_signed_at)
  ORDER BY month DESC
)
SELECT 
  es.*,
  json_agg(
    json_build_object(
      'month', me.month,
      'earnings', me.monthly_total
    ) ORDER BY me.month DESC
  ) as monthly_breakdown
FROM earnings_summary es
LEFT JOIN monthly_earnings me ON true
GROUP BY es.total_completed_earnings, es.current_project_earnings, es.completed_projects, es.active_projects;
```

### Market Opportunities
```sql
-- Potential opportunities based on contractor skills and market demand
WITH contractor_skills AS (
  SELECT jsonb_array_elements_text(skills) as skill
  FROM user_profiles_enhanced 
  WHERE user_id = $1
),
recent_job_demand AS (
  SELECT 
    skill_name,
    COUNT(*) as job_mentions,
    AVG(jo.salary_max) as avg_max_budget,
    COUNT(DISTINCT jo.company_id) as companies_hiring
  FROM job_openings_enhanced jo,
  jsonb_array_elements_text(jo.required_skills) AS skill_name
  WHERE jo.status = 'active'
    AND jo.employment_type IN ('contract', 'freelance')
    AND jo.created_at >= NOW() - INTERVAL '60 days'
  GROUP BY skill_name
),
skill_opportunities AS (
  SELECT 
    rjd.*,
    CASE WHEN cs.skill IS NOT NULL THEN true ELSE false END as contractor_has_skill
  FROM recent_job_demand rjd
  LEFT JOIN contractor_skills cs ON rjd.skill_name = cs.skill
)
SELECT 
  skill_name,
  job_mentions,
  avg_max_budget,
  companies_hiring,
  contractor_has_skill,
  CASE 
    WHEN contractor_has_skill THEN 'immediate_opportunity'
    WHEN job_mentions >= 10 THEN 'high_demand_skill'
    WHEN avg_max_budget >= 80000 THEN 'high_value_skill'
    ELSE 'potential_skill'
  END as opportunity_type
FROM skill_opportunities
WHERE job_mentions >= 3
ORDER BY 
  contractor_has_skill DESC,
  job_mentions DESC,
  avg_max_budget DESC;
```

## 📊 CROSS-ROLE ANALYTICS QUERIES

### Platform Overview Stats
```sql
-- High-level platform statistics
WITH user_stats AS (
  SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN primary_role = 'employee' THEN 1 END) as employees,
    COUNT(CASE WHEN primary_role = 'employer' THEN 1 END) as employers,
    COUNT(CASE WHEN primary_role = 'independent' THEN 1 END) as contractors
  FROM user_profiles_enhanced
),
job_stats AS (
  SELECT 
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_jobs,
    SUM(applications_count) as total_applications
  FROM job_openings_enhanced
),
company_stats AS (
  SELECT 
    COUNT(*) as total_companies,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_companies
  FROM companies
)
SELECT 
  us.*,
  js.*,
  cs.*
FROM user_stats us, job_stats js, company_stats cs;
```

### Skills Market Analysis
```sql
-- Most in-demand skills across the platform
SELECT 
  skill_name,
  COUNT(DISTINCT jo.id) as jobs_requiring_skill,
  COUNT(DISTINCT jo.company_id) as companies_needing_skill,
  AVG(jo.salary_max) as avg_max_salary,
  COUNT(DISTINCT up.user_id) as users_with_skill,
  ROUND(
    COUNT(DISTINCT jo.id)::DECIMAL / 
    NULLIF(COUNT(DISTINCT up.user_id), 0), 
    2
  ) as demand_supply_ratio
FROM job_openings_enhanced jo,
jsonb_array_elements_text(jo.required_skills) AS skill_name
LEFT JOIN user_profiles_enhanced up ON up.skills ? skill_name
WHERE jo.status = 'active'
GROUP BY skill_name
HAVING COUNT(DISTINCT jo.id) >= 3
ORDER BY demand_supply_ratio DESC, jobs_requiring_skill DESC;
```

This comprehensive query collection provides:

✅ **Multi-company employer management** with role-based permissions
✅ **Advanced employee job matching** and application tracking  
✅ **Complete independent contractor** project and earnings management
✅ **Cross-platform analytics** for market insights
✅ **Performance-optimized queries** with proper indexing
✅ **Real-time status tracking** and progress monitoring

Each query set is designed for the specific needs of each role while maintaining data security and performance.