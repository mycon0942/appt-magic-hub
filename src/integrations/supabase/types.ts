export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      payment_settings: {
        Row: {
          created_at: string
          credentials_ciphertext: string | null
          credentials_iv: string | null
          infinite_handle: string | null
          method: string
          sync_client_id: string | null
          sync_environment: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credentials_ciphertext?: string | null
          credentials_iv?: string | null
          infinite_handle?: string | null
          method: string
          sync_client_id?: string | null
          sync_environment?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credentials_ciphertext?: string | null
          credentials_iv?: string | null
          infinite_handle?: string | null
          method?: string
          sync_client_id?: string | null
          sync_environment?: string
          updated_at?: string
          user_id?: string
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
