export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string | null
          email: string | null
          first_name: string | null
          last_name: string | null
          role: string | null
          primary_role: string
          role_selected: boolean | null
          company_name: string | null
          company_size: string | null
          industry: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          role?: string | null
          primary_role?: string
          role_selected?: boolean | null
          company_name?: string | null
          company_size?: string | null
          industry?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          role?: string | null
          primary_role?: string
          role_selected?: boolean | null
          company_name?: string | null
          company_size?: string | null
          industry?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          name: string
          slug: string | null
          industry: string | null
          size_range: string | null
          owner_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          industry?: string | null
          size_range?: string | null
          owner_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          industry?: string | null
          size_range?: string | null
          owner_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
