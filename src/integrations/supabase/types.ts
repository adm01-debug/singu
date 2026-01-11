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
      client_values: {
        Row: {
          category: string
          contact_id: string
          created_at: string
          detected_phrases: string[] | null
          frequency: number | null
          id: string
          importance: number | null
          last_mentioned: string | null
          updated_at: string
          user_id: string
          value_name: string
        }
        Insert: {
          category: string
          contact_id: string
          created_at?: string
          detected_phrases?: string[] | null
          frequency?: number | null
          id?: string
          importance?: number | null
          last_mentioned?: string | null
          updated_at?: string
          user_id: string
          value_name: string
        }
        Update: {
          category?: string
          contact_id?: string
          created_at?: string
          detected_phrases?: string[] | null
          frequency?: number | null
          id?: string
          importance?: number | null
          last_mentioned?: string | null
          updated_at?: string
          user_id?: string
          value_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_values_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      cognitive_bias_history: {
        Row: {
          analyzed_at: string
          category_distribution: Json | null
          contact_id: string
          created_at: string
          detected_biases: Json
          dominant_biases: string[] | null
          id: string
          interaction_id: string | null
          profile_summary: string | null
          resistances: string[] | null
          sales_strategies: Json | null
          user_id: string
          vulnerabilities: string[] | null
        }
        Insert: {
          analyzed_at?: string
          category_distribution?: Json | null
          contact_id: string
          created_at?: string
          detected_biases: Json
          dominant_biases?: string[] | null
          id?: string
          interaction_id?: string | null
          profile_summary?: string | null
          resistances?: string[] | null
          sales_strategies?: Json | null
          user_id: string
          vulnerabilities?: string[] | null
        }
        Update: {
          analyzed_at?: string
          category_distribution?: Json | null
          contact_id?: string
          created_at?: string
          detected_biases?: Json
          dominant_biases?: string[] | null
          id?: string
          interaction_id?: string | null
          profile_summary?: string | null
          resistances?: string[] | null
          sales_strategies?: Json | null
          user_id?: string
          vulnerabilities?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "cognitive_bias_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cognitive_bias_history_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_preferences: {
        Row: {
          avoid_days: string[] | null
          contact_frequency: string | null
          contact_id: string
          created_at: string
          id: string
          notes: string | null
          preferred_channel: string
          preferred_days: string[] | null
          preferred_time_end: string | null
          preferred_time_start: string | null
          response_rate_by_channel: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avoid_days?: string[] | null
          contact_frequency?: string | null
          contact_id: string
          created_at?: string
          id?: string
          notes?: string | null
          preferred_channel?: string
          preferred_days?: string[] | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          response_rate_by_channel?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avoid_days?: string[] | null
          contact_frequency?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          preferred_channel?: string
          preferred_days?: string[] | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          response_rate_by_channel?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_preferences_contact_id_fkey"
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
      compatibility_alerts: {
        Row: {
          alert_type: string
          compatibility_score: number
          contact_id: string | null
          created_at: string
          description: string | null
          dismissed: boolean | null
          expires_at: string | null
          id: string
          threshold: number
          title: string
          user_id: string
        }
        Insert: {
          alert_type?: string
          compatibility_score: number
          contact_id?: string | null
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          threshold: number
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          compatibility_score?: number
          contact_id?: string | null
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          threshold?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compatibility_alerts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      compatibility_settings: {
        Row: {
          alert_only_important: boolean | null
          alert_threshold: number
          created_at: string
          email_notifications: boolean | null
          id: string
          important_min_relationship_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_only_important?: boolean | null
          alert_threshold?: number
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          important_min_relationship_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_only_important?: boolean | null
          alert_threshold?: number
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          important_min_relationship_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_time_analysis: {
        Row: {
          avg_response_time_minutes: number | null
          contact_id: string
          day_of_week: number
          hour_of_day: number
          id: string
          last_updated: string
          success_count: number | null
          total_attempts: number | null
          user_id: string
        }
        Insert: {
          avg_response_time_minutes?: number | null
          contact_id: string
          day_of_week: number
          hour_of_day: number
          id?: string
          last_updated?: string
          success_count?: number | null
          total_attempts?: number | null
          user_id: string
        }
        Update: {
          avg_response_time_minutes?: number | null
          contact_id?: string
          day_of_week?: number
          hour_of_day?: number
          id?: string
          last_updated?: string
          success_count?: number | null
          total_attempts?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_time_analysis_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
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
      decision_criteria: {
        Row: {
          contact_id: string
          created_at: string
          criteria_type: string
          detected_from: string | null
          how_to_address: string | null
          id: string
          name: string
          priority: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          criteria_type: string
          detected_from?: string | null
          how_to_address?: string | null
          id?: string
          name: string
          priority?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          criteria_type?: string
          detected_from?: string | null
          how_to_address?: string | null
          id?: string
          name?: string
          priority?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_criteria_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      emotional_anchors: {
        Row: {
          anchor_type: string
          contact_id: string
          context: string | null
          created_at: string
          detected_at: string
          emotional_state: string
          id: string
          strength: number | null
          trigger_word: string
          user_id: string
        }
        Insert: {
          anchor_type: string
          contact_id: string
          context?: string | null
          created_at?: string
          detected_at?: string
          emotional_state: string
          id?: string
          strength?: number | null
          trigger_word: string
          user_id: string
        }
        Update: {
          anchor_type?: string
          contact_id?: string
          context?: string | null
          created_at?: string
          detected_at?: string
          emotional_state?: string
          id?: string
          strength?: number | null
          trigger_word?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotional_anchors_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      emotional_states_history: {
        Row: {
          confidence: number | null
          contact_id: string
          context: string | null
          created_at: string
          emotional_state: string
          id: string
          interaction_id: string | null
          trigger: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          contact_id: string
          context?: string | null
          created_at?: string
          emotional_state: string
          id?: string
          interaction_id?: string | null
          trigger?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          contact_id?: string
          context?: string | null
          created_at?: string
          emotional_state?: string
          id?: string
          interaction_id?: string | null
          trigger?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotional_states_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emotional_states_history_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      eq_analysis_history: {
        Row: {
          analyzed_at: string
          areas_for_growth: string[] | null
          communication_style: Json | null
          confidence: number | null
          contact_id: string
          created_at: string
          id: string
          indicators: Json | null
          interaction_id: string | null
          overall_level: string
          overall_score: number
          pillar_scores: Json
          profile_summary: string | null
          sales_implications: Json | null
          strengths: string[] | null
          user_id: string
        }
        Insert: {
          analyzed_at?: string
          areas_for_growth?: string[] | null
          communication_style?: Json | null
          confidence?: number | null
          contact_id: string
          created_at?: string
          id?: string
          indicators?: Json | null
          interaction_id?: string | null
          overall_level: string
          overall_score: number
          pillar_scores: Json
          profile_summary?: string | null
          sales_implications?: Json | null
          strengths?: string[] | null
          user_id: string
        }
        Update: {
          analyzed_at?: string
          areas_for_growth?: string[] | null
          communication_style?: Json | null
          confidence?: number | null
          contact_id?: string
          created_at?: string
          id?: string
          indicators?: Json | null
          interaction_id?: string | null
          overall_level?: string
          overall_score?: number
          pillar_scores?: Json
          profile_summary?: string | null
          sales_implications?: Json | null
          strengths?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eq_analysis_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eq_analysis_history_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
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
      health_alert_settings: {
        Row: {
          check_frequency_hours: number | null
          created_at: string
          critical_threshold: number | null
          email_address: string | null
          email_notifications: boolean | null
          id: string
          notify_on_critical: boolean | null
          notify_on_warning: boolean | null
          push_notifications: boolean | null
          updated_at: string
          user_id: string
          warning_threshold: number | null
        }
        Insert: {
          check_frequency_hours?: number | null
          created_at?: string
          critical_threshold?: number | null
          email_address?: string | null
          email_notifications?: boolean | null
          id?: string
          notify_on_critical?: boolean | null
          notify_on_warning?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string
          user_id: string
          warning_threshold?: number | null
        }
        Update: {
          check_frequency_hours?: number | null
          created_at?: string
          critical_threshold?: number | null
          email_address?: string | null
          email_notifications?: boolean | null
          id?: string
          notify_on_critical?: boolean | null
          notify_on_warning?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string
          user_id?: string
          warning_threshold?: number | null
        }
        Relationships: []
      }
      health_alerts: {
        Row: {
          alert_type: string
          contact_id: string
          created_at: string
          description: string | null
          dismissed: boolean | null
          factors: Json | null
          health_score: number
          id: string
          notified_via: string[] | null
          previous_score: number | null
          title: string
          user_id: string
        }
        Insert: {
          alert_type?: string
          contact_id: string
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          factors?: Json | null
          health_score: number
          id?: string
          notified_via?: string[] | null
          previous_score?: number | null
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          contact_id?: string
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          factors?: Json | null
          health_score?: number
          id?: string
          notified_via?: string[] | null
          previous_score?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_alerts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      hidden_objections: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          indicator: string
          interaction_id: string | null
          objection_type: string
          possible_real_objection: string | null
          probability: number | null
          resolution_templates: string[] | null
          resolved: boolean | null
          resolved_at: string | null
          severity: string
          suggested_probe: string | null
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          indicator: string
          interaction_id?: string | null
          objection_type: string
          possible_real_objection?: string | null
          probability?: number | null
          resolution_templates?: string[] | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity: string
          suggested_probe?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          indicator?: string
          interaction_id?: string | null
          objection_type?: string
          possible_real_objection?: string | null
          probability?: number | null
          resolution_templates?: string[] | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
          suggested_probe?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hidden_objections_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hidden_objections_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
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
      life_events: {
        Row: {
          contact_id: string
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          last_reminded_at: string | null
          recurring: boolean | null
          reminder_days_before: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          description?: string | null
          event_date: string
          event_type: string
          id?: string
          last_reminded_at?: string | null
          recurring?: boolean | null
          reminder_days_before?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          last_reminded_at?: string | null
          recurring?: boolean | null
          reminder_days_before?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_events_contact_id_fkey"
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
      offer_suggestions: {
        Row: {
          confidence_score: number | null
          contact_id: string
          created_at: string
          expires_at: string | null
          id: string
          offer_category: string | null
          offer_name: string
          presented_at: string | null
          reason: string
          result: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          contact_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          offer_category?: string | null
          offer_name: string
          presented_at?: string | null
          reason: string
          result?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          contact_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          offer_category?: string | null
          offer_name?: string
          presented_at?: string | null
          reason?: string
          result?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_suggestions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
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
      purchase_history: {
        Row: {
          amount: number | null
          contact_id: string
          created_at: string
          cycle_months: number | null
          id: string
          notes: string | null
          product_category: string | null
          product_name: string
          purchase_date: string
          renewal_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          contact_id: string
          created_at?: string
          cycle_months?: number | null
          id?: string
          notes?: string | null
          product_category?: string | null
          product_name: string
          purchase_date?: string
          renewal_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          contact_id?: string
          created_at?: string
          cycle_months?: number | null
          id?: string
          notes?: string | null
          product_category?: string | null
          product_name?: string
          purchase_date?: string
          renewal_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
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
      stakeholder_alerts: {
        Row: {
          alert_type: string
          company_id: string | null
          contact_id: string | null
          created_at: string
          current_value: Json | null
          description: string | null
          dismissed: boolean | null
          dismissed_at: string | null
          id: string
          previous_value: Json | null
          recommended_action: string | null
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          alert_type: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          current_value?: Json | null
          description?: string | null
          dismissed?: boolean | null
          dismissed_at?: string | null
          id?: string
          previous_value?: Json | null
          recommended_action?: string | null
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          current_value?: Json | null
          description?: string | null
          dismissed?: boolean | null
          dismissed_at?: string | null
          id?: string
          previous_value?: Json | null
          recommended_action?: string | null
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stakeholder_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholder_alerts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
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
      weekly_report_settings: {
        Row: {
          created_at: string
          email_address: string | null
          enabled: boolean | null
          id: string
          include_at_risk_clients: boolean | null
          include_health_alerts: boolean | null
          include_performance_metrics: boolean | null
          include_portfolio_summary: boolean | null
          include_recommendations: boolean | null
          include_upcoming_dates: boolean | null
          last_sent_at: string | null
          send_day: string | null
          send_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_address?: string | null
          enabled?: boolean | null
          id?: string
          include_at_risk_clients?: boolean | null
          include_health_alerts?: boolean | null
          include_performance_metrics?: boolean | null
          include_portfolio_summary?: boolean | null
          include_recommendations?: boolean | null
          include_upcoming_dates?: boolean | null
          last_sent_at?: string | null
          send_day?: string | null
          send_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_address?: string | null
          enabled?: boolean | null
          id?: string
          include_at_risk_clients?: boolean | null
          include_health_alerts?: boolean | null
          include_performance_metrics?: boolean | null
          include_portfolio_summary?: boolean | null
          include_recommendations?: boolean | null
          include_upcoming_dates?: boolean | null
          last_sent_at?: string | null
          send_day?: string | null
          send_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          created_at: string
          id: string
          report_data: Json
          sent_via: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          report_data: Json
          sent_via?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          report_data?: Json
          sent_via?: string[] | null
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
