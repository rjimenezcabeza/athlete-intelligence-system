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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_recommendations: {
        Row: {
          action_taken_at: string | null
          ai_model: string | null
          ai_provider: string | null
          athlete_id: string
          context_data: Json | null
          created_at: string
          id: string
          reasoning: string | null
          recommendation_text: string
          recommendation_type: Database["public"]["Enums"]["ai_recommendation_type"]
          session_id: string | null
          template_exercise_id: string | null
          user_action: Database["public"]["Enums"]["user_action"] | null
          user_notes: string | null
        }
        Insert: {
          action_taken_at?: string | null
          ai_model?: string | null
          ai_provider?: string | null
          athlete_id: string
          context_data?: Json | null
          created_at?: string
          id?: string
          reasoning?: string | null
          recommendation_text: string
          recommendation_type: Database["public"]["Enums"]["ai_recommendation_type"]
          session_id?: string | null
          template_exercise_id?: string | null
          user_action?: Database["public"]["Enums"]["user_action"] | null
          user_notes?: string | null
        }
        Update: {
          action_taken_at?: string | null
          ai_model?: string | null
          ai_provider?: string | null
          athlete_id?: string
          context_data?: Json | null
          created_at?: string
          id?: string
          reasoning?: string | null
          recommendation_text?: string
          recommendation_type?: Database["public"]["Enums"]["ai_recommendation_type"]
          session_id?: string | null
          template_exercise_id?: string | null
          user_action?: Database["public"]["Enums"]["user_action"] | null
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_template_exercise_id_fkey"
            columns: ["template_exercise_id"]
            isOneToOne: false
            referencedRelation: "template_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ar_athlete"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_profiles: {
        Row: {
          avatar_url: string | null
          body_weight_kg: number | null
          created_at: string
          date_of_birth: string | null
          display_name: string
          gender: string | null
          height_cm: number | null
          id: string
          language: string
          primary_goal: string | null
          subscription_expires_at: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          timezone: string
          training_experience_years: number | null
          updated_at: string
          user_id: string
          weight_unit: Database["public"]["Enums"]["weight_unit"]
        }
        Insert: {
          avatar_url?: string | null
          body_weight_kg?: number | null
          created_at?: string
          date_of_birth?: string | null
          display_name: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          language?: string
          primary_goal?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          timezone?: string
          training_experience_years?: number | null
          updated_at?: string
          user_id: string
          weight_unit?: Database["public"]["Enums"]["weight_unit"]
        }
        Update: {
          avatar_url?: string | null
          body_weight_kg?: number | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          language?: string
          primary_goal?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          timezone?: string
          training_experience_years?: number | null
          updated_at?: string
          user_id?: string
          weight_unit?: Database["public"]["Enums"]["weight_unit"]
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string
          created_by: string | null
          cues: string[] | null
          description: string | null
          difficulty_level: number
          equipment: string | null
          exercise_type: string
          id: string
          is_bilateral: boolean
          is_global: boolean
          movement_pattern:
            | Database["public"]["Enums"]["movement_pattern"]
            | null
          muscle_group_primary: string
          muscle_groups_secondary: string[]
          name: string
          slug: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cues?: string[] | null
          description?: string | null
          difficulty_level?: number
          equipment?: string | null
          exercise_type?: string
          id?: string
          is_bilateral?: boolean
          is_global?: boolean
          movement_pattern?:
            | Database["public"]["Enums"]["movement_pattern"]
            | null
          muscle_group_primary: string
          muscle_groups_secondary?: string[]
          name: string
          slug: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cues?: string[] | null
          description?: string | null
          difficulty_level?: number
          equipment?: string | null
          exercise_type?: string
          id?: string
          is_bilateral?: boolean
          is_global?: boolean
          movement_pattern?:
            | Database["public"]["Enums"]["movement_pattern"]
            | null
          muscle_group_primary?: string
          muscle_groups_secondary?: string[]
          name?: string
          slug?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      import_review_items: {
        Row: {
          confidence_score: number | null
          corrected_data: Json | null
          created_at: string
          id: string
          imported_file_id: string
          item_type: Database["public"]["Enums"]["item_type"]
          raw_extracted: Json
          review_status: Database["public"]["Enums"]["review_status"]
          reviewed_at: string | null
        }
        Insert: {
          confidence_score?: number | null
          corrected_data?: Json | null
          created_at?: string
          id?: string
          imported_file_id: string
          item_type: Database["public"]["Enums"]["item_type"]
          raw_extracted: Json
          review_status?: Database["public"]["Enums"]["review_status"]
          reviewed_at?: string | null
        }
        Update: {
          confidence_score?: number | null
          corrected_data?: Json | null
          created_at?: string
          id?: string
          imported_file_id?: string
          item_type?: Database["public"]["Enums"]["item_type"]
          raw_extracted?: Json
          review_status?: Database["public"]["Enums"]["review_status"]
          reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_iri_file"
            columns: ["imported_file_id"]
            isOneToOne: false
            referencedRelation: "imported_files"
            referencedColumns: ["id"]
          },
        ]
      }
      imported_files: {
        Row: {
          approved_at: string | null
          athlete_id: string
          extracted_data: Json | null
          extraction_confidence: number | null
          extraction_notes: string | null
          file_size_bytes: number | null
          file_type: string | null
          id: string
          import_status: Database["public"]["Enums"]["import_status"]
          original_filename: string
          processed_at: string | null
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          approved_at?: string | null
          athlete_id: string
          extracted_data?: Json | null
          extraction_confidence?: number | null
          extraction_notes?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          import_status?: Database["public"]["Enums"]["import_status"]
          original_filename: string
          processed_at?: string | null
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          approved_at?: string | null
          athlete_id?: string
          extracted_data?: Json | null
          extraction_confidence?: number | null
          extraction_notes?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          import_status?: Database["public"]["Enums"]["import_status"]
          original_filename?: string
          processed_at?: string | null
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_if_athlete"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      progression_methods: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          id: string
          is_custom: boolean
          method_type: Database["public"]["Enums"]["progression_method_type"]
          name: string
          natural_language_description: string | null
          slug: string
          structured_rules: Json | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_custom?: boolean
          method_type: Database["public"]["Enums"]["progression_method_type"]
          name: string
          natural_language_description?: string | null
          slug: string
          structured_rules?: Json | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_custom?: boolean
          method_type?: Database["public"]["Enums"]["progression_method_type"]
          name?: string
          natural_language_description?: string | null
          slug?: string
          structured_rules?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      session_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          order_in_session: number
          session_id: string
          template_exercise_id: string | null
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          order_in_session: number
          session_id: string
          template_exercise_id?: string | null
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          order_in_session?: number
          session_id?: string
          template_exercise_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_se_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_template_exercise_id_fkey"
            columns: ["template_exercise_id"]
            isOneToOne: false
            referencedRelation: "template_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      sets: {
        Row: {
          duration_seconds: number | null
          id: string
          is_personal_record: boolean
          logged_at: string
          notes: string | null
          reps_completed: number | null
          rir_actual: number | null
          rpe_actual: number | null
          session_exercise_id: string
          set_number: number
          set_type: Database["public"]["Enums"]["set_type"]
          weight_kg: number | null
        }
        Insert: {
          duration_seconds?: number | null
          id?: string
          is_personal_record?: boolean
          logged_at?: string
          notes?: string | null
          reps_completed?: number | null
          rir_actual?: number | null
          rpe_actual?: number | null
          session_exercise_id: string
          set_number: number
          set_type?: Database["public"]["Enums"]["set_type"]
          weight_kg?: number | null
        }
        Update: {
          duration_seconds?: number | null
          id?: string
          is_personal_record?: boolean
          logged_at?: string
          notes?: string | null
          reps_completed?: number | null
          rir_actual?: number | null
          rpe_actual?: number | null
          session_exercise_id?: string
          set_number?: number
          set_type?: Database["public"]["Enums"]["set_type"]
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_s_session_exercise"
            columns: ["session_exercise_id"]
            isOneToOne: false
            referencedRelation: "session_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      template_exercises: {
        Row: {
          created_at: string
          day_label: string | null
          day_number: number
          exercise_id: string
          id: string
          notes: string | null
          order_in_day: number
          progression_method_id: string | null
          rep_range_max: number | null
          rep_range_min: number | null
          rest_seconds: number | null
          rir_target: number | null
          sets_target: number | null
          template_id: string
          tempo: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_label?: string | null
          day_number: number
          exercise_id: string
          id?: string
          notes?: string | null
          order_in_day: number
          progression_method_id?: string | null
          rep_range_max?: number | null
          rep_range_min?: number | null
          rest_seconds?: number | null
          rir_target?: number | null
          sets_target?: number | null
          template_id: string
          tempo?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_label?: string | null
          day_number?: number
          exercise_id?: string
          id?: string
          notes?: string | null
          order_in_day?: number
          progression_method_id?: string | null
          rep_range_max?: number | null
          rep_range_min?: number | null
          rest_seconds?: number | null
          rir_target?: number | null
          sets_target?: number | null
          template_id?: string
          tempo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_te_template"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "training_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_exercises_progression_method_id_fkey"
            columns: ["progression_method_id"]
            isOneToOne: false
            referencedRelation: "progression_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          athlete_id: string
          body_weight_kg: number | null
          created_at: string
          day_label: string | null
          day_number: number | null
          duration_minutes: number | null
          ended_at: string | null
          id: string
          imported_from_file_id: string | null
          notes: string | null
          performance_rating: number | null
          readiness_score: number | null
          session_date: string
          sleep_quality: number | null
          source: Database["public"]["Enums"]["session_source"]
          started_at: string | null
          stress_level: number | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          body_weight_kg?: number | null
          created_at?: string
          day_label?: string | null
          day_number?: number | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          imported_from_file_id?: string | null
          notes?: string | null
          performance_rating?: number | null
          readiness_score?: number | null
          session_date?: string
          sleep_quality?: number | null
          source?: Database["public"]["Enums"]["session_source"]
          started_at?: string | null
          stress_level?: number | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          body_weight_kg?: number | null
          created_at?: string
          day_label?: string | null
          day_number?: number | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          imported_from_file_id?: string | null
          notes?: string | null
          performance_rating?: number | null
          readiness_score?: number | null
          session_date?: string
          sleep_quality?: number | null
          source?: Database["public"]["Enums"]["session_source"]
          started_at?: string | null
          stress_level?: number | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ts_athlete"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_imported_from_file_id_fkey"
            columns: ["imported_from_file_id"]
            isOneToOne: false
            referencedRelation: "imported_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "training_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      training_templates: {
        Row: {
          athlete_id: string
          created_at: string
          default_progression_method_id: string | null
          description: string | null
          id: string
          imported_from_file_id: string | null
          is_active: boolean
          is_archived: boolean
          mesocycle_weeks: number | null
          name: string
          split_type: string | null
          training_days_per_week: number | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          default_progression_method_id?: string | null
          description?: string | null
          id?: string
          imported_from_file_id?: string | null
          is_active?: boolean
          is_archived?: boolean
          mesocycle_weeks?: number | null
          name: string
          split_type?: string | null
          training_days_per_week?: number | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          default_progression_method_id?: string | null
          description?: string | null
          id?: string
          imported_from_file_id?: string | null
          is_active?: boolean
          is_archived?: boolean
          mesocycle_weeks?: number | null
          name?: string
          split_type?: string | null
          training_days_per_week?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tt_athlete"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_templates_default_progression_method_id_fkey"
            columns: ["default_progression_method_id"]
            isOneToOne: false
            referencedRelation: "progression_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_templates_imported_from_file_id_fkey"
            columns: ["imported_from_file_id"]
            isOneToOne: false
            referencedRelation: "imported_files"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_athlete_id: { Args: never; Returns: string }
    }
    Enums: {
      ai_recommendation_type:
        | "pre_workout"
        | "progression"
        | "deload"
        | "fatigue_warning"
        | "form_alert"
        | "import_review"
        | "custom"
      import_status:
        | "pending"
        | "processing"
        | "review_required"
        | "approved"
        | "rejected"
        | "error"
      item_type: "session" | "exercise" | "set" | "template"
      movement_pattern:
        | "push"
        | "pull"
        | "hinge"
        | "squat"
        | "carry"
        | "isolation"
        | "compound"
      progression_method_type:
        | "double_progression"
        | "double_progression_rir"
        | "top_set_backoff"
        | "rp_hypertrophy"
        | "jordan_peters"
        | "doggcrapp"
        | "custom"
      review_status: "pending" | "approved" | "rejected" | "modified"
      session_source: "manual" | "imported" | "ai_generated"
      set_type:
        | "warmup"
        | "working"
        | "top_set"
        | "backoff"
        | "myorep"
        | "rest_pause"
        | "failure"
      subscription_tier: "free" | "pro" | "coach" | "admin"
      user_action: "accepted" | "rejected" | "modified" | "ignored" | "pending"
      weight_unit: "kg" | "lbs"
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
    Enums: {
      ai_recommendation_type: [
        "pre_workout",
        "progression",
        "deload",
        "fatigue_warning",
        "form_alert",
        "import_review",
        "custom",
      ],
      import_status: [
        "pending",
        "processing",
        "review_required",
        "approved",
        "rejected",
        "error",
      ],
      item_type: ["session", "exercise", "set", "template"],
      movement_pattern: [
        "push",
        "pull",
        "hinge",
        "squat",
        "carry",
        "isolation",
        "compound",
      ],
      progression_method_type: [
        "double_progression",
        "double_progression_rir",
        "top_set_backoff",
        "rp_hypertrophy",
        "jordan_peters",
        "doggcrapp",
        "custom",
      ],
      review_status: ["pending", "approved", "rejected", "modified"],
      session_source: ["manual", "imported", "ai_generated"],
      set_type: [
        "warmup",
        "working",
        "top_set",
        "backoff",
        "myorep",
        "rest_pause",
        "failure",
      ],
      subscription_tier: ["free", "pro", "coach", "admin"],
      user_action: ["accepted", "rejected", "modified", "ignored", "pending"],
      weight_unit: ["kg", "lbs"],
    },
  },
} as const
