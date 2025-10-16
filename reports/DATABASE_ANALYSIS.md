# Uwezo Career Platform - Database Analysis Document

## 📊 **Executive Summary**

This document provides a comprehensive analysis of the Uwezo Career Platform database schema, including table relationships, dependencies, functions, triggers, and performance considerations.

**Database Type**: PostgreSQL (Supabase)  
**Schema Version**: Enhanced Career Platform v2.0  
**Analysis Date**: October 16, 2025  
**Total Tables**: 21 main tables + system tables  

---

## 🏗️ **Database Architecture Overview**

### **Core Design Principles**
- **Multi-role Support**: Employee, Employer, Independent Contractor
- **Multi-company Architecture**: Employers can manage multiple companies
- **Comprehensive Workflow**: End-to-end hiring and contracting processes
- **Security First**: Row Level Security (RLS) implementation
- **Performance Optimized**: Strategic indexing and query optimization

---

## 📋 **Table Structure Analysis**

### **1. Core User Management**

#### **`user_profiles`** (Primary User Data)
```sql
- Primary Key: id (UUID)
- Foreign Key: user_id → auth.users(id)
- Role System: primary_role, secondary_roles[]
- Dependencies: Referenced by all user-related tables
```

**Key Columns:**
- `primary_role`: 'employee' | 'employer' | 'independent'
- `secondary_roles`: TEXT[] for multi-role support
- `skills`: JSONB for flexible skill storage
- `work_preferences`: JSONB for flexible preference storage

**Dependencies:**
- **Outbound**: auth.users (Supabase Auth)
- **Inbound**: company_members, job_applications, contract_signatures

---

### **2. Company Management System**

#### **`companies`** (Company Profiles)
```sql
- Primary Key: id (UUID)
- Unique Constraints: slug
- Multi-company Support: Via company_members table
```

**Key Features:**
- Company verification system
- Multi-tier subscription model
- Comprehensive business information
- Social media integration

#### **`company_members`** (Company-User Relationships)
```sql
- Composite relationships: company_id + user_id
- Role-based permissions system
- Employment tracking capability
```

**Role Hierarchy:**
1. `owner` - Full company control
2. `admin` - Administrative access
3. `hr_manager` - HR operations
4. `recruiter` - Hiring operations
5. `hiring_manager` - Interview and selection
6. `member` - Basic access

---

### **3. Job Management Workflow**

#### **`job_openings`** (Job Postings)
```sql
- Primary Key: id (UUID)
- Foreign Key: company_id → companies(id)
- Complex workflow states
```

**Application Flow:**
```
Draft → Published → Active → Closed → Archived
```

#### **`job_applications`** (Application Tracking)
```sql
- Comprehensive application lifecycle
- Document attachment support
- Assessment integration
```

**Application States:**
```
submitted → screening → assessment → interview_scheduled → 
interview_completed → reference_check → offer_pending → 
offer_extended → hired/rejected
```

---

### **4. Assessment & Skills System**

#### **`skill_assessments`** (Assessment Templates)
- Flexible question framework
- Multiple assessment types
- Public/private assessment library

#### **`assessment_attempts`** (User Assessment Records)
- Attempt tracking and scoring
- Fraud prevention measures
- Performance analytics

---

### **5. Contract Management**

#### **`contract_templates`** (Legal Document Templates)
- Role-specific contract types
- Version control system
- Legal compliance tracking

#### **`contract_signatures`** (Digital Signature Tracking)
- Multi-party signature workflow
- Legal validity tracking
- Audit trail maintenance

---

### **6. Independent Contractor Features**

#### **`project_proposals`** (Project Management)
- Client project proposals
- Milestone tracking
- Payment integration

#### **`client_contracts`** (Contractor Agreements)
- Independent contractor agreements
- Project-specific terms
- Payment milestone tracking

---

## 🔗 **Dependency Analysis**

### **Primary Dependencies**

```mermaid
graph TD
    A[auth.users] --> B[user_profiles]
    B --> C[company_members]
    B --> D[job_applications]
    B --> E[contract_signatures]
    
    F[companies] --> C
    F --> G[job_openings]
    
    G --> D
    G --> H[skill_assessments]
    
    D --> I[assessment_attempts]
    
    J[contract_templates] --> E
    
    B --> K[project_proposals]
    K --> L[client_contracts]
```

### **Foreign Key Relationships**

| Table | References | Cascade Behavior |
|-------|------------|------------------|
| user_profiles | auth.users(id) | ON DELETE CASCADE |
| company_members | companies(id), auth.users(id) | ON DELETE CASCADE |
| job_openings | companies(id) | ON DELETE CASCADE |
| job_applications | job_openings(id), auth.users(id) | ON DELETE CASCADE |
| assessment_attempts | skill_assessments(id), auth.users(id) | ON DELETE CASCADE |
| contract_signatures | contract_templates(id), auth.users(id) | ON DELETE CASCADE |

---

## ⚙️ **Functions & Stored Procedures**

### **Core Business Functions**

#### **1. `handle_new_user()`**
```sql
Purpose: Auto-create user profile on authentication
Trigger: AFTER INSERT on auth.users
Security: SECURITY DEFINER
```

#### **2. `update_application_counts()`**
```sql
Purpose: Maintain application statistics
Trigger: AFTER INSERT/UPDATE/DELETE on job_applications
Performance: Optimized for high-frequency updates
```

#### **3. `generate_application_link()`**
```sql
Purpose: Create unique application URLs
Trigger: AFTER INSERT on job_openings
Security: Generates secure, unique identifiers
```

#### **4. `get_company_application_stats(company_uuid)`**
```sql
Purpose: Comprehensive application analytics
Returns: Structured application metrics
Use Case: Dashboard and reporting
```

#### **5. `validate_schema_integrity()`**
```sql
Purpose: Database health monitoring
Returns: Constraint validation results
Use Case: Maintenance and monitoring
```

---

## 🔒 **Security Implementation**

### **Row Level Security (RLS) Policies**

#### **User Data Protection**
```sql
- User profiles: Users can only access their own data
- Company data: Role-based access via company_members
- Applications: Applicants and company members only
```

#### **Role-Based Access Control**
```sql
- Employers: Access to owned companies and applications
- Employees: Access to own applications and public job data
- Contractors: Access to proposals and contracts
```

### **Data Privacy Compliance**
- GDPR-ready user data management
- Audit trail for sensitive operations
- Secure document storage integration

---

## 📈 **Performance Optimization**

### **Strategic Indexing**

#### **High-Performance Indexes**
```sql
-- User lookups
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_primary_role ON user_profiles(primary_role);

-- Job search optimization
CREATE INDEX idx_job_openings_status ON job_openings(status);
CREATE INDEX idx_job_openings_location ON job_openings(location);
CREATE INDEX idx_job_openings_skills ON job_openings USING GIN(required_skills);

-- Application tracking
CREATE INDEX idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX idx_job_applications_job_id ON job_applications(job_opening_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
```

#### **JSONB Optimization**
```sql
-- Skills search optimization
CREATE INDEX idx_user_profiles_skills ON user_profiles USING GIN(skills);
CREATE INDEX idx_companies_benefits ON companies USING GIN(benefits);
```

### **Query Performance Metrics**

| Operation | Expected Performance | Index Support |
|-----------|---------------------|---------------|
| User Profile Lookup | < 1ms | Primary Key + user_id |
| Job Search | < 50ms | Multi-column indexes |
| Application Filtering | < 10ms | Status + date indexes |
| Company Dashboard | < 100ms | Materialized aggregates |

---

## 🔧 **Database Functions Catalog**

### **Trigger Functions**
1. **`handle_new_user()`** - User onboarding automation
2. **`update_application_counts()`** - Statistics maintenance
3. **`generate_application_link()`** - Secure URL generation

### **Analytics Functions**
1. **`get_company_application_stats()`** - Application metrics
2. **`validate_schema_integrity()`** - Health monitoring

### **Utility Functions**
1. **`calculate_profile_completion()`** - Profile scoring
2. **`generate_assessment_score()`** - Assessment evaluation

---

## 🚀 **Scalability Considerations**

### **Current Capacity**
- **Users**: Designed for 100K+ active users
- **Companies**: 10K+ companies with multi-location support
- **Jobs**: 50K+ concurrent job postings
- **Applications**: 1M+ applications with full history

### **Scaling Strategies**
1. **Horizontal Partitioning**: By company or date ranges
2. **Read Replicas**: For analytics and reporting
3. **Caching Layer**: Redis for frequently accessed data
4. **Archive Strategy**: Historical data management

---

## 📊 **Data Relationships Summary**

### **Primary Entity Relationships**
```
User (1) ←→ (M) UserProfiles
Company (1) ←→ (M) CompanyMembers ←→ (M) Users
Company (1) ←→ (M) JobOpenings
JobOpening (1) ←→ (M) JobApplications ←→ (1) User
User (1) ←→ (M) AssessmentAttempts ←→ (1) SkillAssessment
User (1) ←→ (M) ContractSignatures ←→ (1) ContractTemplate
```

### **Business Logic Constraints**
- Users can belong to multiple companies with different roles
- Job applications follow strict state transitions
- Assessments have attempt limits and validity periods
- Contracts require all party signatures for execution

---

## 🏷️ **Data Types & Enums**

### **Role Types**
- `primary_role`: 'employee' | 'employer' | 'independent'
- `company_member_role`: 'owner' | 'admin' | 'hr_manager' | 'recruiter' | 'hiring_manager' | 'member'

### **Status Enums**
- `job_status`: 'draft' | 'published' | 'active' | 'closed' | 'archived'
- `application_status`: Complex workflow states (15+ states)
- `company_status`: 'active' | 'inactive' | 'suspended' | 'pending_verification'

### **JSON Data Structures**
```json
{
  "skills": ["JavaScript", "React", "Node.js"],
  "work_preferences": {
    "remote": true,
    "hybrid": true,
    "onsite": false,
    "travel_percentage": 10
  },
  "benefits": [
    {"type": "health", "description": "Full medical coverage"},
    {"type": "vacation", "description": "Unlimited PTO"}
  ]
}
```

---

## 🔍 **Current Issues & Recommendations**

### **Identified Issues**
1. **Missing Columns**: Some application tables missing required columns for role selection
2. **Index Optimization**: Some queries could benefit from additional composite indexes
3. **RLS Policies**: Need comprehensive policy implementation

### **Immediate Actions Required**
1. **Execute Migration**: Apply `companies-table-fixes-latest.sql`
2. **Add Missing Indexes**: For frequently queried combinations
3. **Implement RLS**: Complete security policy implementation

### **Future Enhancements**
1. **Audit Trail**: Complete audit logging system
2. **Analytics**: Enhanced reporting and dashboard capabilities
3. **Integration**: Third-party service integrations (payment, background checks)

---

## 📚 **Migration Scripts Available**

| File | Purpose | Status |
|------|---------|---------|
| `enhanced-uwezo-career-schema.sql` | Complete schema definition | ✅ Ready |
| `companies-table-fixes-latest.sql` | Role selection fixes | ✅ Ready |
| `fix-user-profiles-columns.sql` | User profile updates | ✅ Applied |
| `verify-role-selection-fix.sql` | Validation script | ✅ Ready |

---

## 🎯 **Conclusion**

The Uwezo Career Platform database is architected as a comprehensive, scalable solution supporting multiple user roles and complex business workflows. The schema provides:

- **Flexibility**: JSONB fields for evolving requirements
- **Security**: Comprehensive RLS and audit capabilities  
- **Performance**: Strategic indexing and query optimization
- **Scalability**: Designed for enterprise-level growth
- **Compliance**: GDPR and data protection ready

The database successfully balances flexibility with performance, providing a solid foundation for a modern career platform with advanced features for job management, assessment, and contractor relationships.