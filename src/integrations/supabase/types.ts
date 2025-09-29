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
          api_source: string
          created_at: string | null
          credits_used: number | null
          endpoint: string | null
          execution_time_ms: number | null
          id: string
          request_params: Json | null
          response_status: number | null
        }
        Insert: {
          api_source: string
          created_at?: string | null
          credits_used?: number | null
          endpoint?: string | null
          execution_time_ms?: number | null
          id?: string
          request_params?: Json | null
          response_status?: number | null
        }
        Update: {
          api_source?: string
          created_at?: string | null
          credits_used?: number | null
          endpoint?: string | null
          execution_time_ms?: number | null
          id?: string
          request_params?: Json | null
          response_status?: number | null
        }
        Relationships: []
      }
      cron_job_logs: {
        Row: {
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          response_data: Json | null
          status: string
        }
        Insert: {
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          response_data?: Json | null
          status: string
        }
        Update: {
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          response_data?: Json | null
          status?: string
        }
        Relationships: []
      }
      data_sources: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_scraped_at: string | null
          name: string
          scraping_frequency: number
          source_type: string
          telegram_username: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          name: string
          scraping_frequency?: number
          source_type: string
          telegram_username?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          name?: string
          scraping_frequency?: number
          source_type?: string
          telegram_username?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      market_analysis: {
        Row: {
          analysis_date: string
          confidence_score: number
          created_at: string
          id: string
          impact_factors: string[]
          key_events: string[]
          news_articles: Json | null
          price_prediction: string
          sentiment: string
          summary: string
          updated_at: string
        }
        Insert: {
          analysis_date: string
          confidence_score: number
          created_at?: string
          id?: string
          impact_factors?: string[]
          key_events?: string[]
          news_articles?: Json | null
          price_prediction: string
          sentiment: string
          summary: string
          updated_at?: string
        }
        Update: {
          analysis_date?: string
          confidence_score?: number
          created_at?: string
          id?: string
          impact_factors?: string[]
          key_events?: string[]
          news_articles?: Json | null
          price_prediction?: string
          sentiment?: string
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      property_listings: {
        Row: {
          agent_name: string | null
          agent_phone: string | null
          amenities: string[] | null
          area_sqft: number | null
          bathrooms: number | null
          bedrooms: number | null
          completion_status: string | null
          created_at: string | null
          description: string | null
          external_id: string
          housing_status: string | null
          id: string
          images: string[] | null
          is_furnished: boolean | null
          last_verified: string | null
          location_area: string | null
          location_city: string | null
          location_coords: unknown | null
          price: number
          price_currency: string | null
          property_type: string
          purpose: string
          raw_data: Json | null
          source: string
          title: string
          title_ar: string | null
          updated_at: string | null
        }
        Insert: {
          agent_name?: string | null
          agent_phone?: string | null
          amenities?: string[] | null
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          completion_status?: string | null
          created_at?: string | null
          description?: string | null
          external_id: string
          housing_status?: string | null
          id?: string
          images?: string[] | null
          is_furnished?: boolean | null
          last_verified?: string | null
          location_area?: string | null
          location_city?: string | null
          location_coords?: unknown | null
          price: number
          price_currency?: string | null
          property_type: string
          purpose: string
          raw_data?: Json | null
          source: string
          title: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_name?: string | null
          agent_phone?: string | null
          amenities?: string[] | null
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          completion_status?: string | null
          created_at?: string | null
          description?: string | null
          external_id?: string
          housing_status?: string | null
          id?: string
          images?: string[] | null
          is_furnished?: boolean | null
          last_verified?: string | null
          location_area?: string | null
          location_city?: string | null
          location_coords?: unknown | null
          price?: number
          price_currency?: string | null
          property_type?: string
          purpose?: string
          raw_data?: Json | null
          source?: string
          title?: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      property_valuations: {
        Row: {
          comparable_properties: string[] | null
          confidence_score: number | null
          created_at: string | null
          estimated_value: number
          id: string
          market_trends: Json | null
          property_listing_id: string | null
          valuation_factors: Json | null
        }
        Insert: {
          comparable_properties?: string[] | null
          confidence_score?: number | null
          created_at?: string | null
          estimated_value: number
          id?: string
          market_trends?: Json | null
          property_listing_id?: string | null
          valuation_factors?: Json | null
        }
        Update: {
          comparable_properties?: string[] | null
          confidence_score?: number | null
          created_at?: string | null
          estimated_value?: number
          id?: string
          market_trends?: Json | null
          property_listing_id?: string | null
          valuation_factors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "property_valuations_property_listing_id_fkey"
            columns: ["property_listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      scraped_properties: {
        Row: {
          agent_name: string | null
          agent_phone: string | null
          area_sqft: number | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          description: string | null
          external_id: string | null
          housing_status: string | null
          id: string
          images: string[] | null
          location_area: string | null
          location_city: string | null
          price: number | null
          price_currency: string | null
          property_type: string | null
          purpose: string | null
          raw_content: string | null
          scraped_at: string
          source_id: string
          title: string
          updated_at: string
        }
        Insert: {
          agent_name?: string | null
          agent_phone?: string | null
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          housing_status?: string | null
          id?: string
          images?: string[] | null
          location_area?: string | null
          location_city?: string | null
          price?: number | null
          price_currency?: string | null
          property_type?: string | null
          purpose?: string | null
          raw_content?: string | null
          scraped_at?: string
          source_id: string
          title: string
          updated_at?: string
        }
        Update: {
          agent_name?: string | null
          agent_phone?: string | null
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          housing_status?: string | null
          id?: string
          images?: string[] | null
          location_area?: string | null
          location_city?: string | null
          price?: number | null
          price_currency?: string | null
          property_type?: string | null
          purpose?: string | null
          raw_content?: string | null
          scraped_at?: string
          source_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scraped_properties_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      scraping_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          properties_found: number | null
          properties_processed: number | null
          source_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          properties_found?: number | null
          properties_processed?: number | null
          source_id: string
          started_at?: string | null
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          properties_found?: number | null
          properties_processed?: number | null
          source_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scraping_jobs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          created_at: string | null
          id: string
          results_count: number | null
          search_filters: Json | null
          search_query: string
          telegram_user_id: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          results_count?: number | null
          search_filters?: Json | null
          search_query: string
          telegram_user_id: number
        }
        Update: {
          created_at?: string | null
          id?: string
          results_count?: number | null
          search_filters?: Json | null
          search_query?: string
          telegram_user_id?: number
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          max_area_sqft: number | null
          max_bedrooms: number | null
          max_price: number | null
          min_area_sqft: number | null
          min_bedrooms: number | null
          min_price: number | null
          notifications_enabled: boolean | null
          preferred_areas: string[] | null
          property_types: string[] | null
          purpose: string | null
          telegram_user_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_area_sqft?: number | null
          max_bedrooms?: number | null
          max_price?: number | null
          min_area_sqft?: number | null
          min_bedrooms?: number | null
          min_price?: number | null
          notifications_enabled?: boolean | null
          preferred_areas?: string[] | null
          property_types?: string[] | null
          purpose?: string | null
          telegram_user_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_area_sqft?: number | null
          max_bedrooms?: number | null
          max_price?: number | null
          min_area_sqft?: number | null
          min_bedrooms?: number | null
          min_price?: number | null
          notifications_enabled?: boolean | null
          preferred_areas?: string[] | null
          property_types?: string[] | null
          purpose?: string | null
          telegram_user_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_properties: {
        Args:
          | {
              housing_status_param?: string
              limit_param?: number
              location_param?: string
              max_bedrooms_param?: number
              max_price_param?: number
              min_bedrooms_param?: number
              min_price_param?: number
              property_type_param?: string
              search_purpose?: string
            }
          | {
              limit_param?: number
              location_param?: string
              max_bedrooms_param?: number
              max_price_param?: number
              min_bedrooms_param?: number
              min_price_param?: number
              property_type_param?: string
              search_purpose?: string
            }
        Returns: {
          agent_name: string
          agent_phone: string
          area_sqft: number
          bathrooms: number
          bedrooms: number
          external_id: string
          housing_status: string
          id: string
          images: string[]
          location_area: string
          price: number
          property_type: string
          purpose: string
          title: string
        }[]
      }
      search_scraped_properties: {
        Args:
          | {
              housing_status_param?: string
              limit_param?: number
              location_param?: string
              max_bedrooms_param?: number
              max_price_param?: number
              min_bedrooms_param?: number
              min_price_param?: number
              property_type_param?: string
              search_purpose?: string
              source_type_param?: string
            }
          | {
              limit_param?: number
              location_param?: string
              max_bedrooms_param?: number
              max_price_param?: number
              min_bedrooms_param?: number
              min_price_param?: number
              property_type_param?: string
              search_purpose?: string
              source_type_param?: string
            }
        Returns: {
          agent_name: string
          agent_phone: string
          area_sqft: number
          bathrooms: number
          bedrooms: number
          housing_status: string
          id: string
          images: string[]
          location_area: string
          price: number
          property_type: string
          purpose: string
          scraped_at: string
          source_name: string
          source_type: string
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
