export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// User task metadata interface
export interface UserTaskMetadata {
  notes?: string
  attachments?: string[]
  submission_data?: Record<string, unknown>
  [key: string]: unknown
}

// Document analysis result interface
export interface DocumentAnalysisResult {
  extracted_text?: string
  document_type_detected?: string
  confidence_score?: number
  validation_errors?: string[]
  [key: string]: unknown
}

// Quiz question interface
export interface QuizQuestion {
  id: string
  question: string
  type: 'multiple_choice' | 'text' | 'boolean'
  options?: string[]
  correct_answer?: string | boolean
  points?: number
}

// Quiz answers interface
export interface QuizAnswers {
  [questionId: string]: string | boolean | number
}

// Chat message metadata interface
export interface ChatMessageMetadata {
  source?: string
  context?: string
  confidence?: number
  attachments?: string[]
  [key: string]: unknown
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          first_name: string | null
          last_name: string | null
          photo_url: string | null
          bio: string | null
          linkedin: string | null
          github: string | null
          portfolio_url: string | null
          credly: string | null
          facebook: string | null
          instagram: string | null
          kickresume: string | null
          whatsapp: string | null
          avatar_url: string | null
          transcript_url: string | null
          role: string
          role_selected: boolean
          company_name: string | null
          company_size: string | null
          industry: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          first_name?: string | null
          last_name?: string | null
          photo_url?: string | null
          bio?: string | null
          linkedin?: string | null
          github?: string | null
          portfolio_url?: string | null
          credly?: string | null
          facebook?: string | null
          instagram?: string | null
          kickresume?: string | null
          whatsapp?: string | null
          avatar_url?: string | null
          transcript_url?: string | null
          role?: string
          role_selected?: boolean
          company_name?: string | null
          company_size?: string | null
          industry?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          first_name?: string | null
          last_name?: string | null
          photo_url?: string | null
          bio?: string | null
          linkedin?: string | null
          github?: string | null
          portfolio_url?: string | null
          credly?: string | null
          facebook?: string | null
          instagram?: string | null
          kickresume?: string | null
          whatsapp?: string | null
          avatar_url?: string | null
          transcript_url?: string | null
          role?: string
          role_selected?: boolean
          company_name?: string | null
          company_size?: string | null
          industry?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: number
          title: string
          description: string | null
          task_type: string
          is_required: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: number
          title: string
          description?: string | null
          task_type: string
          is_required?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: number
          title?: string
          description?: string | null
          task_type?: string
          is_required?: boolean
          order_index?: number
          created_at?: string
        }
      }
      user_tasks: {
        Row: {
          id: string
          user_id: string
          task_id: number
          completed: boolean
          completed_at: string | null
          metadata: UserTaskMetadata | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id: number
          completed?: boolean
          completed_at?: string | null
          metadata?: UserTaskMetadata | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: number
          completed?: boolean
          completed_at?: string | null
          metadata?: UserTaskMetadata | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          user_id: string
          filename: string
          original_filename: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          document_type: string | null
          is_signed: boolean
          signed_at: string | null
          analysis_result: DocumentAnalysisResult | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          original_filename: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          document_type?: string | null
          is_signed?: boolean
          signed_at?: string | null
          analysis_result?: DocumentAnalysisResult | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          original_filename?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          document_type?: string | null
          is_signed?: boolean
          signed_at?: string | null
          analysis_result?: DocumentAnalysisResult | null
          created_at?: string
          updated_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          title: string
          description: string | null
          quiz_type: string
          questions: QuizQuestion[]
          passing_score: number
          time_limit_minutes: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          quiz_type?: string
          questions: QuizQuestion[]
          passing_score?: number
          time_limit_minutes?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          quiz_type?: string
          questions?: QuizQuestion[]
          passing_score?: number
          time_limit_minutes?: number | null
          is_active?: boolean
          created_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          quiz_id: string
          answers: QuizAnswers
          score: number | null
          passed: boolean | null
          started_at: string
          completed_at: string | null
          time_taken_minutes: number | null
        }
        Insert: {
          id?: string
          user_id: string
          quiz_id: string
          answers: QuizAnswers
          score?: number | null
          passed?: boolean | null
          started_at?: string
          completed_at?: string | null
          time_taken_minutes?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          quiz_id?: string
          answers?: QuizAnswers
          score?: number | null
          passed?: boolean | null
          started_at?: string
          completed_at?: string | null
          time_taken_minutes?: number | null
        }
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          chat_type: string
          message: string
          is_from_user: boolean
          metadata: ChatMessageMetadata | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          chat_type?: string
          message: string
          is_from_user: boolean
          metadata?: ChatMessageMetadata | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          chat_type?: string
          message?: string
          is_from_user?: boolean
          metadata?: ChatMessageMetadata | null
          created_at?: string
        }
      }
      video_introductions: {
        Row: {
          id: string
          user_id: string
          filename: string
          file_path: string
          duration_seconds: number | null
          file_size: number | null
          status: string
          feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          file_path: string
          duration_seconds?: number | null
          file_size?: number | null
          status?: string
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          file_path?: string
          duration_seconds?: number | null
          file_size?: number | null
          status?: string
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          total_tasks: number
          completed_tasks: number
          progress_percentage: number
          current_stage: string | null
          last_activity_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_tasks?: number
          completed_tasks?: number
          progress_percentage?: number
          current_stage?: string | null
          last_activity_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_tasks?: number
          completed_tasks?: number
          progress_percentage?: number
          current_stage?: string | null
          last_activity_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          bio: string | null
          linkedin: string | null
          github: string | null
          portfolio_url: string | null
          credly: string | null
          facebook: string | null
          instagram: string | null
          kickresume: string | null
          whatsapp: string | null
          avatar_url: string | null
          transcript_url: string | null
          role: string
          role_selected: boolean
          company_name: string | null
          company_size: string | null
          industry: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          last_name?: string | null
          bio?: string | null
          linkedin?: string | null
          github?: string | null
          portfolio_url?: string | null
          credly?: string | null
          facebook?: string | null
          instagram?: string | null
          kickresume?: string | null
          whatsapp?: string | null
          avatar_url?: string | null
          transcript_url?: string | null
          role?: string
          role_selected?: boolean
          company_name?: string | null
          company_size?: string | null
          industry?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          bio?: string | null
          linkedin?: string | null
          github?: string | null
          portfolio_url?: string | null
          credly?: string | null
          facebook?: string | null
          instagram?: string | null
          kickresume?: string | null
          whatsapp?: string | null
          avatar_url?: string | null
          transcript_url?: string | null
          role?: string
          role_selected?: boolean
          company_name?: string | null
          company_size?: string | null
          industry?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          description: string | null
          industry: string | null
          size_range: string | null
          website: string | null
          logo_url: string | null
          owner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          industry?: string | null
          size_range?: string | null
          website?: string | null
          logo_url?: string | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          industry?: string | null
          size_range?: string | null
          website?: string | null
          logo_url?: string | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_openings: {
        Row: {
          id: string
          company_id: string | null
          employer_id: string | null
          title: string
          description: string | null
          requirements: string | null
          location: string | null
          employment_type: string | null
          salary_range: string | null
          positions_available: number
          application_deadline: string | null
          is_active: boolean
          application_link: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          employer_id?: string | null
          title: string
          description?: string | null
          requirements?: string | null
          location?: string | null
          employment_type?: string | null
          salary_range?: string | null
          positions_available?: number
          application_deadline?: string | null
          is_active?: boolean
          application_link?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          employer_id?: string | null
          title?: string
          description?: string | null
          requirements?: string | null
          location?: string | null
          employment_type?: string | null
          salary_range?: string | null
          positions_available?: number
          application_deadline?: string | null
          is_active?: boolean
          application_link?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_applications: {
        Row: {
          id: string
          job_opening_id: string | null
          applicant_id: string | null
          cv_url: string | null
          cover_letter: string | null
          aptitude_score: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_opening_id?: string | null
          applicant_id?: string | null
          cv_url?: string | null
          cover_letter?: string | null
          aptitude_score?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_opening_id?: string | null
          applicant_id?: string | null
          cv_url?: string | null
          cover_letter?: string | null
          aptitude_score?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_progress: {
        Args: {
          user_uuid: string
        }
        Returns: {
          total_tasks: number
          completed_tasks: number
          progress_percentage: number
          current_stage: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type UserTask = Database['public']['Tables']['user_tasks']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type Quiz = Database['public']['Tables']['quizzes']['Row']
export type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type VideoIntroduction = Database['public']['Tables']['video_introductions']['Row']
export type UserProgress = Database['public']['Tables']['user_progress']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type JobOpening = Database['public']['Tables']['job_openings']['Row']
export type JobApplication = Database['public']['Tables']['job_applications']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type UserTaskInsert = Database['public']['Tables']['user_tasks']['Insert']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type QuizInsert = Database['public']['Tables']['quizzes']['Insert']
export type QuizAttemptInsert = Database['public']['Tables']['quiz_attempts']['Insert']
export type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert']
export type VideoIntroductionInsert = Database['public']['Tables']['video_introductions']['Insert']
export type UserProgressInsert = Database['public']['Tables']['user_progress']['Insert']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type JobOpeningInsert = Database['public']['Tables']['job_openings']['Insert']
export type JobApplicationInsert = Database['public']['Tables']['job_applications']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']
export type UserTaskUpdate = Database['public']['Tables']['user_tasks']['Update']
export type DocumentUpdate = Database['public']['Tables']['documents']['Update']
export type QuizUpdate = Database['public']['Tables']['quizzes']['Update']
export type QuizAttemptUpdate = Database['public']['Tables']['quiz_attempts']['Update']
export type ChatMessageUpdate = Database['public']['Tables']['chat_messages']['Update']
export type VideoIntroductionUpdate = Database['public']['Tables']['video_introductions']['Update']
export type UserProgressUpdate = Database['public']['Tables']['user_progress']['Update']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']
export type JobOpeningUpdate = Database['public']['Tables']['job_openings']['Update']
export type JobApplicationUpdate = Database['public']['Tables']['job_applications']['Update']

// Extended types with relationships
export type TaskWithProgress = Task & {
  user_task?: UserTask
  completed?: boolean
}

export type ProfileWithProgress = Profile & {
  progress?: UserProgress
}

export type QuizWithAttempts = Quiz & {
  user_attempts?: QuizAttempt[]
  best_score?: number
  has_passed?: boolean
}

export type DocumentWithAnalysis = Document & {
  is_processed?: boolean
  has_issues?: boolean
}