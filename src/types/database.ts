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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          target_id: string
          target_table: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          target_id: string
          target_table: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          target_id?: string
          target_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "probation_expiry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_preferences: {
        Row: {
          application_id: string
          created_at: string
          id: string
          slot_id: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          slot_id: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          slot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_preferences_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "join_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_preferences_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "interview_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "probation_expiry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_slots: {
        Row: {
          capacity: number
          created_at: string
          created_by: string | null
          id: string
          slot_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          created_by?: string | null
          id?: string
          slot_at: string
        }
        Update: {
          capacity?: number
          created_at?: string
          created_by?: string | null
          id?: string
          slot_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_slots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "probation_expiry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_slots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      join_applications: {
        Row: {
          admin_note: string | null
          confirmed_slot_id: string | null
          created_at: string
          id: string
          interview_result: Database["public"]["Enums"]["interview_result"]
          motivation: string | null
          self_intro: string | null
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          confirmed_slot_id?: string | null
          created_at?: string
          id?: string
          interview_result?: Database["public"]["Enums"]["interview_result"]
          motivation?: string | null
          self_intro?: string | null
          user_id: string
        }
        Update: {
          admin_note?: string | null
          confirmed_slot_id?: string | null
          created_at?: string
          id?: string
          interview_result?: Database["public"]["Enums"]["interview_result"]
          motivation?: string | null
          self_intro?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_applications_confirmed_slot_id_fkey"
            columns: ["confirmed_slot_id"]
            isOneToOne: false
            referencedRelation: "interview_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "probation_expiry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      member_warnings: {
        Row: {
          created_at: string
          id: string
          issued_by: string | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issued_by?: string | null
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issued_by?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_warnings_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      member_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["member_status"] | null
          id: string
          reason: string | null
          to_status: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["member_status"] | null
          id?: string
          reason?: string | null
          to_status: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["member_status"] | null
          id?: string
          reason?: string | null
          to_status?: Database["public"]["Enums"]["member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "probation_expiry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "probation_expiry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_periods: {
        Row: {
          close_at: string
          created_at: string
          created_by: string | null
          id: string
          is_open: boolean
          open_at: string
        }
        Insert: {
          close_at: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_open?: boolean
          open_at: string
        }
        Update: {
          close_at?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_open?: boolean
          open_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "probation_expiry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          session_in_team: string[] | null
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          session_in_team?: string[] | null
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          session_in_team?: string[] | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "probation_expiry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          current_song: string | null
          description: string | null
          id: string
          is_active: boolean
          leader_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_song?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          leader_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_song?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          leader_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "probation_expiry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          activated_at: string | null
          created_at: string
          department: string | null
          generation: number | null
          genre_preference: string[] | null
          id: string
          is_whitelist: boolean
          kakao_id: string
          last_active_at: string | null
          linked_auth_id: string | null
          name: string
          nickname: string | null
          phone: string | null
          privacy_agreed_at: string | null
          privacy_settings: Json
          probation_started_at: string | null
          profile_image_url: string | null
          role: Database["public"]["Enums"]["member_role"]
          school_year: number | null
          session: string[] | null
          status: Database["public"]["Enums"]["member_status"]
          student_id: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          department?: string | null
          generation?: number | null
          genre_preference?: string[] | null
          id?: string
          is_whitelist?: boolean
          kakao_id: string
          last_active_at?: string | null
          linked_auth_id?: string | null
          name: string
          nickname?: string | null
          phone?: string | null
          privacy_agreed_at?: string | null
          privacy_settings?: Json
          probation_started_at?: string | null
          profile_image_url?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          school_year?: number | null
          session?: string[] | null
          status?: Database["public"]["Enums"]["member_status"]
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          department?: string | null
          generation?: number | null
          genre_preference?: string[] | null
          id?: string
          is_whitelist?: boolean
          kakao_id?: string
          last_active_at?: string | null
          linked_auth_id?: string | null
          name?: string
          nickname?: string | null
          phone?: string | null
          privacy_agreed_at?: string | null
          privacy_settings?: Json
          probation_started_at?: string | null
          profile_image_url?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          school_year?: number | null
          session?: string[] | null
          status?: Database["public"]["Enums"]["member_status"]
          student_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      probation_expiry: {
        Row: {
          expires_at: string | null
          generation: number | null
          id: string | null
          name: string | null
          probation_started_at: string | null
          remaining_days: number | null
          session: string[] | null
        }
        Insert: {
          expires_at?: never
          generation?: number | null
          id?: string | null
          name?: string | null
          probation_started_at?: string | null
          remaining_days?: never
          session?: string[] | null
        }
        Update: {
          expires_at?: never
          generation?: number | null
          id?: string | null
          name?: string | null
          probation_started_at?: string | null
          remaining_days?: never
          session?: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["member_role"]
      }
      get_my_status: {
        Args: never
        Returns: Database["public"]["Enums"]["member_status"]
      }
      get_my_user_id: { Args: never; Returns: string }
      transition_member_status: {
        Args: {
          p_changed_by?: string
          p_reason?: string
          p_to_status: Database["public"]["Enums"]["member_status"]
          p_user_id: string
        }
        Returns: Json
      }
      validate_status_transition: {
        Args: {
          from_status: Database["public"]["Enums"]["member_status"]
          to_status: Database["public"]["Enums"]["member_status"]
        }
        Returns: boolean
      }
    }
    Enums: {
      interview_result: "PENDING" | "PASS" | "FAIL"
      member_role:
        | "SUPER_ADMIN"
        | "ADMIN"
        | "TEAM_LEADER"
        | "MEMBER"
        | "PROBATION_MEMBER"
      member_status:
        | "PENDING"
        | "INTERVIEWING"
        | "PROBATION"
        | "ACTIVE"
        | "INACTIVE"
        | "WITHDRAWN"
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
      interview_result: ["PENDING", "PASS", "FAIL"],
      member_role: [
        "SUPER_ADMIN",
        "ADMIN",
        "TEAM_LEADER",
        "MEMBER",
        "PROBATION_MEMBER",
      ],
      member_status: [
        "PENDING",
        "INTERVIEWING",
        "PROBATION",
        "ACTIVE",
        "INACTIVE",
        "WITHDRAWN",
      ],
    },
  },
} as const
