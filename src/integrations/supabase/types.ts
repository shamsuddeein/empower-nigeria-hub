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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agent_applications: {
        Row: {
          consent: boolean
          created_at: string
          email: string | null
          full_name: string
          has_shop: boolean
          id: string
          lga: string
          note: string | null
          occupation: string
          phone: string
          state: string
          status: string
          town: string
          type: string
          whatsapp: string
        }
        Insert: {
          consent: boolean
          created_at?: string
          email?: string | null
          full_name: string
          has_shop?: boolean
          id?: string
          lga: string
          note?: string | null
          occupation: string
          phone: string
          state: string
          status?: string
          town: string
          type: string
          whatsapp: string
        }
        Update: {
          consent?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          has_shop?: boolean
          id?: string
          lga?: string
          note?: string | null
          occupation?: string
          phone?: string
          state?: string
          status?: string
          town?: string
          type?: string
          whatsapp?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          created_at: string
          id: string
          lga: string | null
          name: string
          phone: string
          show_publicly: boolean
          state: string
          status: string
          town: string | null
          type: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lga?: string | null
          name: string
          phone: string
          show_publicly?: boolean
          state: string
          status?: string
          town?: string | null
          type?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lga?: string | null
          name?: string
          phone?: string
          show_publicly?: boolean
          state?: string
          status?: string
          town?: string | null
          type?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          address: string
          category: string
          created_at: string
          duration: number
          email: string | null
          frequency: string
          full_name: string
          id: string
          lga: string
          notes: string | null
          occupation: string
          payment_amount: number | null
          phone: string
          price: number
          product_id: string | null
          product_name: string
          reference: string
          state: string
          status: string
          whatsapp: string | null
        }
        Insert: {
          address: string
          category: string
          created_at?: string
          duration: number
          email?: string | null
          frequency: string
          full_name: string
          id?: string
          lga: string
          notes?: string | null
          occupation: string
          payment_amount?: number | null
          phone: string
          price: number
          product_id?: string | null
          product_name: string
          reference: string
          state: string
          status?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string
          category?: string
          created_at?: string
          duration?: number
          email?: string | null
          frequency?: string
          full_name?: string
          id?: string
          lga?: string
          notes?: string | null
          occupation?: string
          payment_amount?: number | null
          phone?: string
          price?: number
          product_id?: string | null
          product_name?: string
          reference?: string
          state?: string
          status?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          sort_order: number
          topic: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number
          topic: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
          topic?: string
        }
        Relationships: []
      }
      gallery: {
        Row: {
          approved: boolean
          caption: string | null
          category: string
          created_at: string
          id: string
          image: string | null
          video_url: string | null
        }
        Insert: {
          approved?: boolean
          caption?: string | null
          category?: string
          created_at?: string
          id?: string
          image?: string | null
          video_url?: string | null
        }
        Update: {
          approved?: boolean
          caption?: string | null
          category?: string
          created_at?: string
          id?: string
          image?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      installment_rules: {
        Row: {
          duration_months: number
          markup_percent: number
        }
        Insert: {
          duration_months: number
          markup_percent: number
        }
        Update: {
          duration_months?: number
          markup_percent?: number
        }
        Relationships: []
      }
      land_inquiries: {
        Row: {
          created_at: string
          full_name: string
          id: string
          message: string | null
          payment_plan: string | null
          phone: string
          plot_id: string | null
          plot_name: string | null
          state: string
          status: string
          visit_date: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          message?: string | null
          payment_plan?: string | null
          phone: string
          plot_id?: string | null
          plot_name?: string | null
          state: string
          status?: string
          visit_date?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          message?: string | null
          payment_plan?: string | null
          phone?: string
          plot_id?: string | null
          plot_name?: string | null
          state?: string
          status?: string
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "land_inquiries_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string
          topic: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone: string
          topic: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string
          topic?: string
        }
        Relationships: []
      }
      plots: {
        Row: {
          cash_price: number
          created_at: string
          documents: string[]
          estate_name: string
          id: string
          images: string[]
          landmarks: string[]
          location_description: string | null
          map_link: string | null
          monthly_amount: number | null
          plan_months: number | null
          plan_summary: string | null
          size_sqm: number
          slug: string
          sort_order: number
          state: string
          status: string
          town: string
        }
        Insert: {
          cash_price: number
          created_at?: string
          documents?: string[]
          estate_name: string
          id?: string
          images?: string[]
          landmarks?: string[]
          location_description?: string | null
          map_link?: string | null
          monthly_amount?: number | null
          plan_months?: number | null
          plan_summary?: string | null
          size_sqm: number
          slug: string
          sort_order?: number
          state: string
          status?: string
          town: string
        }
        Update: {
          cash_price?: number
          created_at?: string
          documents?: string[]
          estate_name?: string
          id?: string
          images?: string[]
          landmarks?: string[]
          location_description?: string | null
          map_link?: string | null
          monthly_amount?: number | null
          plan_months?: number | null
          plan_summary?: string | null
          size_sqm?: number
          slug?: string
          sort_order?: number
          state?: string
          status?: string
          town?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
          cash_price: number
          category: string
          created_at: string
          description: string | null
          featured: boolean
          id: string
          images: string[]
          in_stock: boolean
          name: string
          slug: string
          sort_order: number
          specs: Json
        }
        Insert: {
          brand?: string | null
          cash_price: number
          category: string
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          in_stock?: boolean
          name: string
          slug: string
          sort_order?: number
          specs?: Json
        }
        Update: {
          brand?: string | null
          cash_price?: number
          category?: string
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          in_stock?: boolean
          name?: string
          slug?: string
          sort_order?: number
          specs?: Json
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          approved: boolean
          business: string | null
          category: string
          created_at: string
          id: string
          name: string
          photo: string | null
          quote: string
          state: string | null
          video_url: string | null
        }
        Insert: {
          approved?: boolean
          business?: string | null
          category?: string
          created_at?: string
          id?: string
          name: string
          photo?: string | null
          quote: string
          state?: string | null
          video_url?: string | null
        }
        Update: {
          approved?: boolean
          business?: string | null
          category?: string
          created_at?: string
          id?: string
          name?: string
          photo?: string | null
          quote?: string
          state?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      training_courses: {
        Row: {
          active: boolean
          created_at: string
          duration: string | null
          id: string
          learn: string[]
          mode: string
          price: number
          seats_left: number
          slug: string
          start_date: string | null
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration?: string | null
          id?: string
          learn?: string[]
          mode?: string
          price?: number
          seats_left?: number
          slug: string
          start_date?: string | null
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          duration?: string | null
          id?: string
          learn?: string[]
          mode?: string
          price?: number
          seats_left?: number
          slug?: string
          start_date?: string | null
          title?: string
        }
        Relationships: []
      }
      training_signups: {
        Row: {
          course_id: string | null
          course_title: string
          created_at: string
          education: string | null
          email: string | null
          experience: string | null
          full_name: string
          id: string
          phone: string
          state: string
        }
        Insert: {
          course_id?: string | null
          course_title: string
          created_at?: string
          education?: string | null
          email?: string | null
          experience?: string | null
          full_name: string
          id?: string
          phone: string
          state: string
        }
        Update: {
          course_id?: string | null
          course_title?: string
          created_at?: string
          education?: string | null
          email?: string | null
          experience?: string | null
          full_name?: string
          id?: string
          phone?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_signups_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      submit_application: { Args: { p: Json }; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
