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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          description: string | null
          entity_id: string
          entity_name: string | null
          entity_type: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_id: string
          entity_name?: string | null
          entity_type: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          action_url: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          dismissed: boolean | null
          expires_at: string | null
          id: string
          priority: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          priority?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          priority?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          annual_revenue: string | null
          challenges: string[] | null
          city: string | null
          competitors: string[] | null
          created_at: string
          email: string | null
          employee_count: string | null
          financial_health: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          annual_revenue?: string | null
          challenges?: string[] | null
          city?: string | null
          competitors?: string[] | null
          created_at?: string
          email?: string | null
          employee_count?: string | null
          financial_health?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          annual_revenue?: string | null
          challenges?: string[] | null
          city?: string | null
          competitors?: string[] | null
          created_at?: string
          email?: string | null
          employee_count?: string | null
          financial_health?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          avatar_url: string | null
          behavior: Json | null
          birthday: string | null
          company_id: string | null
          created_at: string
          email: string | null
          family_info: string | null
          first_name: string
          hobbies: string[] | null
          id: string
          instagram: string | null
          interests: string[] | null
          last_name: string
          life_events: Json | null
          linkedin: string | null
          notes: string | null
          personal_notes: string | null
          phone: string | null
          relationship_score: number | null
          relationship_stage: string | null
          role: string | null
          role_title: string | null
          sentiment: string | null
          tags: string[] | null
          twitter: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          behavior?: Json | null
          birthday?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          family_info?: string | null
          first_name: string
          hobbies?: string[] | null
          id?: string
          instagram?: string | null
          interests?: string[] | null
          last_name: string
          life_events?: Json | null
          linkedin?: string | null
          notes?: string | null
          personal_notes?: string | null
          phone?: string | null
          relationship_score?: number | null
          relationship_stage?: string | null
          role?: string | null
          role_title?: string | null
          sentiment?: string | null
          tags?: string[] | null
          twitter?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          behavior?: Json | null
          birthday?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          family_info?: string | null
          first_name?: string
          hobbies?: string[] | null
          id?: string
          instagram?: string | null
          interests?: string[] | null
          last_name?: string
          life_events?: Json | null
          linkedin?: string | null
          notes?: string | null
          personal_notes?: string | null
          phone?: string | null
          relationship_score?: number | null
          relationship_stage?: string | null
          role?: string | null
          role_title?: string | null
          sentiment?: string | null
          tags?: string[] | null
          twitter?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_templates: {
        Row: {
          created_at: string
          id: string
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          template_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          template_id?: string
          user_id?: string
        }
        Relationships: []
      }
      insights: {
        Row: {
          action_suggestion: string | null
          actionable: boolean | null
          category: string
          confidence: number | null
          contact_id: string
          created_at: string
          description: string | null
          dismissed: boolean | null
          expires_at: string | null
          id: string
          source: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_suggestion?: string | null
          actionable?: boolean | null
          category: string
          confidence?: number | null
          contact_id: string
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          source?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_suggestion?: string | null
          actionable?: boolean | null
          category?: string
          confidence?: number | null
          contact_id?: string
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          source?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          attachments: string[] | null
          audio_url: string | null
          company_id: string | null
          contact_id: string
          content: string | null
          created_at: string
          duration: number | null
          emotion_analysis: Json | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          initiated_by: string | null
          key_insights: string[] | null
          response_time: number | null
          sentiment: string | null
          tags: string[] | null
          title: string
          transcription: string | null
          type: string
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          audio_url?: string | null
          company_id?: string | null
          contact_id: string
          content?: string | null
          created_at?: string
          duration?: number | null
          emotion_analysis?: Json | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          initiated_by?: string | null
          key_insights?: string[] | null
          response_time?: number | null
          sentiment?: string | null
          tags?: string[] | null
          title: string
          transcription?: string | null
          type: string
          user_id: string
        }
        Update: {
          attachments?: string[] | null
          audio_url?: string | null
          company_id?: string | null
          contact_id?: string
          content?: string | null
          created_at?: string
          duration?: number | null
          emotion_analysis?: Json | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          initiated_by?: string | null
          key_insights?: string[] | null
          response_time?: number | null
          sentiment?: string | null
          tags?: string[] | null
          title?: string
          transcription?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      metaprogram_analysis: {
        Row: {
          analyzed_text: string | null
          away_from_score: number | null
          away_from_words: string[] | null
          contact_id: string
          created_at: string
          external_score: number | null
          external_words: string[] | null
          id: string
          interaction_id: string | null
          internal_score: number | null
          internal_words: string[] | null
          options_score: number | null
          options_words: string[] | null
          procedures_score: number | null
          procedures_words: string[] | null
          toward_score: number | null
          toward_words: string[] | null
          user_id: string
        }
        Insert: {
          analyzed_text?: string | null
          away_from_score?: number | null
          away_from_words?: string[] | null
          contact_id: string
          created_at?: string
          external_score?: number | null
          external_words?: string[] | null
          id?: string
          interaction_id?: string | null
          internal_score?: number | null
          internal_words?: string[] | null
          options_score?: number | null
          options_words?: string[] | null
          procedures_score?: number | null
          procedures_words?: string[] | null
          toward_score?: number | null
          toward_words?: string[] | null
          user_id: string
        }
        Update: {
          analyzed_text?: string | null
          away_from_score?: number | null
          away_from_words?: string[] | null
          contact_id?: string
          created_at?: string
          external_score?: number | null
          external_words?: string[] | null
          id?: string
          interaction_id?: string | null
          internal_score?: number | null
          internal_words?: string[] | null
          options_score?: number | null
          options_words?: string[] | null
          procedures_score?: number | null
          procedures_words?: string[] | null
          toward_score?: number | null
          toward_words?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          nlp_profile: Json | null
          phone: string | null
          preferences: Json | null
          role_title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          nlp_profile?: Json | null
          phone?: string | null
          preferences?: Json | null
          role_title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          nlp_profile?: Json | null
          phone?: string | null
          preferences?: Json | null
          role_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trigger_usage_history: {
        Row: {
          channel: string | null
          contact_id: string
          context: string | null
          created_at: string
          effectiveness_rating: number | null
          id: string
          notes: string | null
          result: string | null
          scenario: string | null
          template_id: string | null
          template_title: string | null
          trigger_type: string
          used_at: string
          user_id: string
        }
        Insert: {
          channel?: string | null
          contact_id: string
          context?: string | null
          created_at?: string
          effectiveness_rating?: number | null
          id?: string
          notes?: string | null
          result?: string | null
          scenario?: string | null
          template_id?: string | null
          template_title?: string | null
          trigger_type: string
          used_at?: string
          user_id: string
        }
        Update: {
          channel?: string | null
          contact_id?: string
          context?: string | null
          created_at?: string
          effectiveness_rating?: number | null
          id?: string
          notes?: string | null
          result?: string | null
          scenario?: string | null
          template_id?: string | null
          template_title?: string | null
          trigger_type?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vak_analysis_history: {
        Row: {
          analyzed_text: string | null
          auditory_score: number | null
          auditory_words: string[] | null
          contact_id: string
          created_at: string
          digital_score: number | null
          digital_words: string[] | null
          id: string
          interaction_id: string | null
          kinesthetic_score: number | null
          kinesthetic_words: string[] | null
          user_id: string
          visual_score: number | null
          visual_words: string[] | null
        }
        Insert: {
          analyzed_text?: string | null
          auditory_score?: number | null
          auditory_words?: string[] | null
          contact_id: string
          created_at?: string
          digital_score?: number | null
          digital_words?: string[] | null
          id?: string
          interaction_id?: string | null
          kinesthetic_score?: number | null
          kinesthetic_words?: string[] | null
          user_id: string
          visual_score?: number | null
          visual_words?: string[] | null
        }
        Update: {
          analyzed_text?: string | null
          auditory_score?: number | null
          auditory_words?: string[] | null
          contact_id?: string
          created_at?: string
          digital_score?: number | null
          digital_words?: string[] | null
          id?: string
          interaction_id?: string | null
          kinesthetic_score?: number | null
          kinesthetic_words?: string[] | null
          user_id?: string
          visual_score?: number | null
          visual_words?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "vak_analysis_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vak_analysis_history_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
