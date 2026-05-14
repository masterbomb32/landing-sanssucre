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
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          published: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          published?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          published?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          signup_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          signup_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          signup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_signup_id_fkey"
            columns: ["signup_id"]
            isOneToOne: true
            referencedRelation: "signups"
            referencedColumns: ["id"]
          },
        ]
      }
      mailing_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: string
          signup_id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          signup_id: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          signup_id?: string
          source?: string
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          channel: string
          created_at: string
          error_message: string | null
          id: string
          provider_message_id: string | null
          signup_id: string
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          signup_id: string
          status: string
        }
        Update: {
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          signup_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_signup_id_fkey"
            columns: ["signup_id"]
            isOneToOne: false
            referencedRelation: "signups"
            referencedColumns: ["id"]
          },
        ]
      }
      page_visits: {
        Row: {
          country: string | null
          created_at: string
          id: string
          path: string
          referrer: string | null
          user_agent: string | null
          visitor_hash: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          user_agent?: string | null
          visitor_hash: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          user_agent?: string | null
          visitor_hash?: string
        }
        Relationships: []
      }
      redemption_audit: {
        Row: {
          action: string
          code: string
          created_at: string
          id: string
          note: string | null
          signup_id: string | null
          station: string | null
        }
        Insert: {
          action: string
          code: string
          created_at?: string
          id?: string
          note?: string | null
          signup_id?: string | null
          station?: string | null
        }
        Update: {
          action?: string
          code?: string
          created_at?: string
          id?: string
          note?: string | null
          signup_id?: string | null
          station?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_signup_id: string
          referrer_signup_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_signup_id: string
          referrer_signup_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_signup_id?: string
          referrer_signup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_signup_id_fkey"
            columns: ["referred_signup_id"]
            isOneToOne: true
            referencedRelation: "signups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_signup_id_fkey"
            columns: ["referrer_signup_id"]
            isOneToOne: false
            referencedRelation: "signups"
            referencedColumns: ["id"]
          },
        ]
      }
      share_events: {
        Row: {
          channel: string
          created_at: string
          id: string
          path: string
          visitor_hash: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          path: string
          visitor_hash: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          path?: string
          visitor_hash?: string
        }
        Relationships: []
      }
      signup_edits: {
        Row: {
          after: Json
          before: Json
          created_at: string
          edited_by: string | null
          id: string
          signup_id: string
        }
        Insert: {
          after: Json
          before: Json
          created_at?: string
          edited_by?: string | null
          id?: string
          signup_id: string
        }
        Update: {
          after?: Json
          before?: Json
          created_at?: string
          edited_by?: string | null
          id?: string
          signup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signup_edits_signup_id_fkey"
            columns: ["signup_id"]
            isOneToOne: false
            referencedRelation: "signups"
            referencedColumns: ["id"]
          },
        ]
      }
      signups: {
        Row: {
          created_at: string
          email: string | null
          id: string
          mobile: string
          name: string
          notes: string | null
          redeemed_at: string | null
          redemption_code: string
          reward_choice: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          mobile: string
          name: string
          notes?: string | null
          redeemed_at?: string | null
          redemption_code: string
          reward_choice: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          mobile?: string
          name?: string
          notes?: string | null
          redeemed_at?: string | null
          redemption_code?: string
          reward_choice?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      staff_push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_seen_at: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_seen_at?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_seen_at?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      staff_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          id: string
          name: string
          photo_url: string | null
          published: boolean
          quote: string
          sort_order: number
          source: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
          published?: boolean
          quote: string
          sort_order?: number
          source?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          published?: boolean
          quote?: string
          sort_order?: number
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_admin_if_first: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      redeem_signup: {
        Args: { p_code: string }
        Returns: {
          created_at: string
          email: string
          id: string
          mobile: string
          name: string
          redeemed_at: string
          redemption_code: string
          reward_choice: string
        }[]
      }
      unredeem_signup: {
        Args: { p_code: string; p_window_seconds?: number }
        Returns: {
          id: string
          redeemed_at: string
          redemption_code: string
        }[]
      }
      update_staff_pin: { Args: { p_pin: string }; Returns: undefined }
      verify_staff_pin: { Args: { p_pin: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin"
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
      app_role: ["admin"],
    },
  },
} as const
