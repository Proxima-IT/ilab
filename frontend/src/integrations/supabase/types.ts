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
      batches: {
        Row: {
          course_id: string | null
          course_outline_url: string | null
          created_at: string
          demo_class_url: string | null
          end_date: string | null
          enroll_url: string | null
          enrollment_end: string | null
          enrollment_start: string | null
          id: string
          is_active: boolean
          is_featured_homepage: boolean
          name: string
          preview_video_url: string | null
          seats: number | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          course_outline_url?: string | null
          created_at?: string
          demo_class_url?: string | null
          end_date?: string | null
          enroll_url?: string | null
          enrollment_end?: string | null
          enrollment_start?: string | null
          id?: string
          is_active?: boolean
          is_featured_homepage?: boolean
          name: string
          preview_video_url?: string | null
          seats?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          course_outline_url?: string | null
          created_at?: string
          demo_class_url?: string | null
          end_date?: string | null
          enroll_url?: string | null
          enrollment_end?: string | null
          enrollment_start?: string | null
          id?: string
          is_active?: boolean
          is_featured_homepage?: boolean
          name?: string
          preview_video_url?: string | null
          seats?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string | null
          body: string | null
          category: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          read_time: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          body?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          read_time?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          body?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          read_time?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      course_lessons: {
        Row: {
          created_at: string
          duration: string | null
          id: string
          is_preview: boolean
          module_id: string
          sort_order: number
          title: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          duration?: string | null
          id?: string
          is_preview?: boolean
          module_id: string
          sort_order?: number
          title: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          duration?: string | null
          id?: string
          is_preview?: boolean
          module_id?: string
          sort_order?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          discounted_price: number | null
          duration: string | null
          fun_facts: Json
          hero_badge: string | null
          id: string
          instructor_id: string | null
          is_featured: boolean
          is_free: boolean
          is_published: boolean
          language: string | null
          learning_outcomes: Json
          level: Database["public"]["Enums"]["course_level"]
          mode: Database["public"]["Enums"]["course_mode"]
          preview_video_url: string | null
          price: number
          rating: number | null
          requirements: Json
          short_description: string | null
          slug: string
          target_audience: Json
          thumbnail_url: string | null
          title: string
          total_students: number | null
          type: Database["public"]["Enums"]["course_type"]
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          discounted_price?: number | null
          duration?: string | null
          fun_facts?: Json
          hero_badge?: string | null
          id?: string
          instructor_id?: string | null
          is_featured?: boolean
          is_free?: boolean
          is_published?: boolean
          language?: string | null
          learning_outcomes?: Json
          level?: Database["public"]["Enums"]["course_level"]
          mode?: Database["public"]["Enums"]["course_mode"]
          preview_video_url?: string | null
          price?: number
          rating?: number | null
          requirements?: Json
          short_description?: string | null
          slug: string
          target_audience?: Json
          thumbnail_url?: string | null
          title: string
          total_students?: number | null
          type?: Database["public"]["Enums"]["course_type"]
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          discounted_price?: number | null
          duration?: string | null
          fun_facts?: Json
          hero_badge?: string | null
          id?: string
          instructor_id?: string | null
          is_featured?: boolean
          is_free?: boolean
          is_published?: boolean
          language?: string | null
          learning_outcomes?: Json
          level?: Database["public"]["Enums"]["course_level"]
          mode?: Database["public"]["Enums"]["course_mode"]
          preview_video_url?: string | null
          price?: number
          rating?: number | null
          requirements?: Json
          short_description?: string | null
          slug?: string
          target_audience?: Json
          thumbnail_url?: string | null
          title?: string
          total_students?: number | null
          type?: Database["public"]["Enums"]["course_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          amount: number
          batch_id: string | null
          course_id: string
          created_at: string
          discount: number
          id: string
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          promo_code: string | null
          status: Database["public"]["Enums"]["enrollment_status"]
          student_email: string
          student_name: string
          student_phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          batch_id?: string | null
          course_id: string
          created_at?: string
          discount?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          promo_code?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_email: string
          student_name: string
          student_phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          batch_id?: string | null
          course_id?: string
          created_at?: string
          discount?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          promo_code?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_email?: string
          student_name?: string
          student_phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          event_type: string | null
          id: string
          is_published: boolean
          location: string | null
          registration_url: string | null
          seats: number | null
          slug: string
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_type?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          registration_url?: string | null
          seats?: number | null
          slug: string
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_type?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          registration_url?: string | null
          seats?: number | null
          slug?: string
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          scope: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          scope?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          scope?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      instructors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          facebook_url: string | null
          id: string
          linkedin_url: string | null
          name: string
          title: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          facebook_url?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          title?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          facebook_url?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          title?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      offerings: {
        Row: {
          color_token: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_published: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          color_token?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          color_token?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          course_id: string | null
          created_at: string
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
          used_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          course_id?: string | null
          created_at?: string
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          course_id?: string | null
          created_at?: string
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          avatar_url: string | null
          course_title: string | null
          created_at: string
          id: string
          is_published: boolean
          media_type: string
          media_url: string | null
          rating: number
          sort_order: number
          student_name: string
          text: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          course_title?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          media_type?: string
          media_url?: string | null
          rating?: number
          sort_order?: number
          student_name: string
          text?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          course_title?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          media_type?: string
          media_url?: string | null
          rating?: number
          sort_order?: number
          student_name?: string
          text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_sections: {
        Row: {
          data: Json
          key: string
          updated_at: string
        }
        Insert: {
          data?: Json
          key: string
          updated_at?: string
        }
        Update: {
          data?: Json
          key?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "content_manager" | "user"
      course_level: "beginner" | "intermediate" | "advanced"
      course_mode: "online" | "offline"
      course_type: "live" | "recorded"
      discount_type: "percent" | "flat"
      enrollment_status:
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "cancelled"
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
      app_role: ["super_admin", "content_manager", "user"],
      course_level: ["beginner", "intermediate", "advanced"],
      course_mode: ["online", "offline"],
      course_type: ["live", "recorded"],
      discount_type: ["percent", "flat"],
      enrollment_status: ["pending", "paid", "failed", "refunded", "cancelled"],
    },
  },
} as const
