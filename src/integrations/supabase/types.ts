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
      api_usage_logs: {
        Row: {
          created_at: string | null
          endpoint: string | null
          function_name: string | null
          id: number
          response_time_ms: number | null
          status_code: number | null
        }
        Insert: {
          created_at?: string | null
          endpoint?: string | null
          function_name?: string | null
          id?: number
          response_time_ms?: number | null
          status_code?: number | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string | null
          function_name?: string | null
          id?: number
          response_time_ms?: number | null
          status_code?: number | null
        }
        Relationships: []
      }
      channel_posts: {
        Row: {
          ai_generated: boolean | null
          content: string
          created_at: string | null
          engagement_stats: Json | null
          id: number
          images: string[] | null
          post_type: string
          published_at: string | null
          scheduled_at: string | null
          source_data: Json | null
          status: string | null
          telegram_message_id: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          content: string
          created_at?: string | null
          engagement_stats?: Json | null
          id?: number
          images?: string[] | null
          post_type: string
          published_at?: string | null
          scheduled_at?: string | null
          source_data?: Json | null
          status?: string | null
          telegram_message_id?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          content?: string
          created_at?: string | null
          engagement_stats?: Json | null
          id?: number
          images?: string[] | null
          post_type?: string
          published_at?: string | null
          scheduled_at?: string | null
          source_data?: Json | null
          status?: string | null
          telegram_message_id?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_schedule: {
        Row: {
          created_at: string | null
          day_of_week: number | null
          id: number
          is_active: boolean | null
          post_time: string
          post_type: string
          template: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          id?: number
          is_active?: boolean | null
          post_time: string
          post_type: string
          template?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          id?: number
          is_active?: boolean | null
          post_time?: string
          post_type?: string
          template?: string | null
        }
        Relationships: []
      }
      district_reviews: {
        Row: {
          avg_rent_1br: number | null
          avg_rent_2br: number | null
          avg_rent_3br: number | null
          created_at: string | null
          description: string | null
          district: string
          expat_friendly_score: number | null
          family_score: number | null
          id: number
          infrastructure_score: number | null
          last_review_at: string | null
          nightlife_score: number | null
          popular_places: Json | null
          tips: string[] | null
          updated_at: string | null
        }
        Insert: {
          avg_rent_1br?: number | null
          avg_rent_2br?: number | null
          avg_rent_3br?: number | null
          created_at?: string | null
          description?: string | null
          district: string
          expat_friendly_score?: number | null
          family_score?: number | null
          id?: number
          infrastructure_score?: number | null
          last_review_at?: string | null
          nightlife_score?: number | null
          popular_places?: Json | null
          tips?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avg_rent_1br?: number | null
          avg_rent_2br?: number | null
          avg_rent_3br?: number | null
          created_at?: string | null
          description?: string | null
          district?: string
          expat_friendly_score?: number | null
          family_score?: number | null
          id?: number
          infrastructure_score?: number | null
          last_review_at?: string | null
          nightlife_score?: number | null
          popular_places?: Json | null
          tips?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      market_analysis: {
        Row: {
          analysis_data: Json | null
          created_at: string | null
          id: number
          news_articles: Json | null
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string | null
          id?: number
          news_articles?: Json | null
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string | null
          id?: number
          news_articles?: Json | null
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          created_at: string | null
          full_content: string | null
          id: number
          images: string[] | null
          is_posted: boolean | null
          is_processed: boolean | null
          original_content: string | null
          original_title: string
          original_url: string | null
          published_date: string | null
          relevance_score: number | null
          source_id: number | null
          telegraph_url: string | null
          translated_content: string | null
          translated_title: string | null
        }
        Insert: {
          created_at?: string | null
          full_content?: string | null
          id?: number
          images?: string[] | null
          is_posted?: boolean | null
          is_processed?: boolean | null
          original_content?: string | null
          original_title: string
          original_url?: string | null
          published_date?: string | null
          relevance_score?: number | null
          source_id?: number | null
          telegraph_url?: string | null
          translated_content?: string | null
          translated_title?: string | null
        }
        Update: {
          created_at?: string | null
          full_content?: string | null
          id?: number
          images?: string[] | null
          is_posted?: boolean | null
          is_processed?: boolean | null
          original_content?: string | null
          original_title?: string
          original_url?: string | null
          published_date?: string | null
          relevance_score?: number | null
          source_id?: number | null
          telegraph_url?: string | null
          translated_content?: string | null
          translated_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_articles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "news_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      news_sources: {
        Row: {
          articles_count: number | null
          created_at: string | null
          id: number
          is_active: boolean | null
          last_scraped_at: string | null
          source_name: string
          source_url: string
        }
        Insert: {
          articles_count?: number | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_scraped_at?: string | null
          source_name: string
          source_url: string
        }
        Update: {
          articles_count?: number | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_scraped_at?: string | null
          source_name?: string
          source_url?: string
        }
        Relationships: []
      }
      property_listings: {
        Row: {
          agent_name: string | null
          agent_phone: string | null
          area_sqft: number | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string | null
          district: string | null
          external_id: string | null
          housing_status: string | null
          id: number
          images: string[] | null
          location_area: string | null
          pets_allowed: boolean | null
          price: number | null
          property_type: string | null
          purpose: string | null
          rental_period: string | null
          source_category: string | null
          source_name: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          agent_name?: string | null
          agent_phone?: string | null
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          district?: string | null
          external_id?: string | null
          housing_status?: string | null
          id?: number
          images?: string[] | null
          location_area?: string | null
          pets_allowed?: boolean | null
          price?: number | null
          property_type?: string | null
          purpose?: string | null
          rental_period?: string | null
          source_category?: string | null
          source_name?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          agent_name?: string | null
          agent_phone?: string | null
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          district?: string | null
          external_id?: string | null
          housing_status?: string | null
          id?: number
          images?: string[] | null
          location_area?: string | null
          pets_allowed?: boolean | null
          price?: number | null
          property_type?: string | null
          purpose?: string | null
          rental_period?: string | null
          source_category?: string | null
          source_name?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scraped_properties: {
        Row: {
          agent_name: string | null
          agent_phone: string | null
          area_sqft: number | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string | null
          district: string | null
          housing_status: string | null
          id: number
          images: string[] | null
          location_area: string | null
          pets_allowed: boolean | null
          price: number | null
          property_type: string | null
          purpose: string | null
          rental_period: string | null
          source_category: string | null
          source_name: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          agent_name?: string | null
          agent_phone?: string | null
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          district?: string | null
          housing_status?: string | null
          id?: number
          images?: string[] | null
          location_area?: string | null
          pets_allowed?: boolean | null
          price?: number | null
          property_type?: string | null
          purpose?: string | null
          rental_period?: string | null
          source_category?: string | null
          source_name?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          agent_name?: string | null
          agent_phone?: string | null
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          district?: string | null
          housing_status?: string | null
          id?: number
          images?: string[] | null
          location_area?: string | null
          pets_allowed?: boolean | null
          price?: number | null
          property_type?: string | null
          purpose?: string | null
          rental_period?: string | null
          source_category?: string | null
          source_name?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      search_history: {
        Row: {
          created_at: string | null
          filters: Json | null
          id: number
          query: string | null
          results_count: number | null
          telegram_user_id: number | null
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id?: number
          query?: string | null
          results_count?: number | null
          telegram_user_id?: number | null
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: number
          query?: string | null
          results_count?: number | null
          telegram_user_id?: number | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: number
          preferences: Json | null
          telegram_user_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          preferences?: Json | null
          telegram_user_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          preferences?: Json | null
          telegram_user_id?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_properties_unified: {
        Args: {
          p_housing_status?: string
          p_limit?: number
          p_location?: string
          p_max_bedrooms?: number
          p_max_price?: number
          p_min_bedrooms?: number
          p_min_price?: number
          p_property_type?: string
          p_purpose?: string
          p_query?: string
        }
        Returns: {
          agent_name: string
          agent_phone: string
          area_sqft: number
          bathrooms: number
          bedrooms: number
          created_at: string
          housing_status: string
          id: number
          images: string[]
          location_area: string
          price: number
          property_type: string
          purpose: string
          source_category: string
          source_name: string
          title: string
        }[]
      }
      search_scraped_properties: {
        Args: {
          p_limit?: number
          p_location?: string
          p_max_bedrooms?: number
          p_max_price?: number
          p_min_bedrooms?: number
          p_min_price?: number
          p_property_type?: string
          p_purpose?: string
          p_query?: string
        }
        Returns: {
          agent_name: string
          agent_phone: string
          area_sqft: number
          bathrooms: number
          bedrooms: number
          created_at: string
          housing_status: string
          id: number
          images: string[]
          location_area: string
          price: number
          property_type: string
          purpose: string
          source_category: string
          source_name: string
          title: string
        }[]
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
