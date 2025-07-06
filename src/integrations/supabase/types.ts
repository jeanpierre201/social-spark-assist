export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          last_activity: string | null
          session_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          last_activity?: string | null
          session_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          last_activity?: string | null
          session_token?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_data: {
        Row: {
          created_at: string
          date_recorded: string
          id: string
          metric_type: string
          metric_value: number
          platform: string
          post_id: string | null
          time_period: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_recorded?: string
          id?: string
          metric_type: string
          metric_value?: number
          platform: string
          post_id?: string | null
          time_period?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_recorded?: string
          id?: string
          metric_type?: string
          metric_value?: number
          platform?: string
          post_id?: string | null
          time_period?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audience_demographics: {
        Row: {
          age_group: string
          created_at: string
          date_recorded: string
          gender: string
          id: string
          location: string
          percentage: number
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group: string
          created_at?: string
          date_recorded?: string
          gender: string
          id?: string
          location: string
          percentage?: number
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string
          created_at?: string
          date_recorded?: string
          gender?: string
          id?: string
          location?: string
          percentage?: number
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_invitations: {
        Row: {
          accepted_at: string | null
          campaign_id: string
          email: string
          expires_at: string
          id: string
          invited_at: string
          invited_by: string
          role: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          campaign_id: string
          email: string
          expires_at?: string
          id?: string
          invited_at?: string
          invited_by: string
          role?: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          campaign_id?: string
          email?: string
          expires_at?: string
          id?: string
          invited_at?: string
          invited_by?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_invitations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_members: {
        Row: {
          campaign_id: string
          id: string
          invited_by: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          id?: string
          invited_by: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          id?: string
          invited_by?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      competitor_analysis: {
        Row: {
          avg_comments: number | null
          avg_likes: number | null
          competitor_handle: string
          competitor_name: string
          created_at: string
          engagement_rate: number | null
          followers_count: number | null
          id: string
          last_analyzed: string | null
          platform: string
          posts_per_week: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_comments?: number | null
          avg_likes?: number | null
          competitor_handle: string
          competitor_name: string
          created_at?: string
          engagement_rate?: number | null
          followers_count?: number | null
          id?: string
          last_analyzed?: string | null
          platform: string
          posts_per_week?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_comments?: number | null
          avg_likes?: number | null
          competitor_handle?: string
          competitor_name?: string
          created_at?: string
          engagement_rate?: number | null
          followers_count?: number | null
          id?: string
          last_analyzed?: string | null
          platform?: string
          posts_per_week?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_insights: {
        Row: {
          avg_engagement_rate: number | null
          avg_impressions: number | null
          avg_reach: number | null
          best_performing_day: string | null
          best_performing_time: string | null
          content_type: string
          created_at: string
          date_analyzed: string
          id: string
          platform: string
          total_posts: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_engagement_rate?: number | null
          avg_impressions?: number | null
          avg_reach?: number | null
          best_performing_day?: string | null
          best_performing_time?: string | null
          content_type: string
          created_at?: string
          date_analyzed?: string
          id?: string
          platform: string
          total_posts?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_engagement_rate?: number | null
          avg_impressions?: number | null
          avg_reach?: number | null
          best_performing_day?: string | null
          best_performing_time?: string | null
          content_type?: string
          created_at?: string
          date_analyzed?: string
          id?: string
          platform?: string
          total_posts?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          created_at: string | null
          generated_caption: string
          generated_hashtags: string[]
          goal: string
          id: string
          industry: string
          media_url: string | null
          niche_info: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          generated_caption: string
          generated_hashtags: string[]
          goal: string
          id?: string
          industry: string
          media_url?: string | null
          niche_info?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          generated_caption?: string
          generated_hashtags?: string[]
          goal?: string
          id?: string
          industry?: string
          media_url?: string | null
          niche_info?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          access_token: string | null
          account_data: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          platform: string
          platform_user_id: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          access_token?: string | null
          account_data?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          platform: string
          platform_user_id: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          access_token?: string | null
          account_data?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          platform?: string
          platform_user_id?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      social_metrics: {
        Row: {
          avg_comments: number | null
          avg_likes: number | null
          created_at: string
          engagement_rate: number | null
          followers_count: number | null
          following_count: number | null
          id: string
          metrics_date: string
          platform: string
          posts_count: number | null
          scheduled_posts_count: number | null
          social_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_comments?: number | null
          avg_likes?: number | null
          created_at?: string
          engagement_rate?: number | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          metrics_date?: string
          platform: string
          posts_count?: number | null
          scheduled_posts_count?: number | null
          social_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_comments?: number | null
          avg_likes?: number | null
          created_at?: string
          engagement_rate?: number | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          metrics_date?: string
          platform?: string
          posts_count?: number | null
          scheduled_posts_count?: number | null
          social_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_metrics_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          is_active: boolean
          role: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          is_active?: boolean
          role: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          is_active?: boolean
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_monthly_post_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_monthly_post_count_with_limit: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_user_latest_metrics: {
        Args: { user_uuid: string }
        Returns: {
          platform: string
          followers_count: number
          engagement_rate: number
          posts_count: number
          scheduled_posts_count: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: { _user_id: string; _role: string }
        Returns: boolean
      }
      user_can_access_campaign: {
        Args: { campaign_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
