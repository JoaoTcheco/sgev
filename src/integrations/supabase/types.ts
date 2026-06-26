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
      account_movements: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          id: string
          reason: string | null
          sale_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          id?: string
          reason?: string | null
          sale_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          sale_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_movements_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          batch_id: string | null
          created_at: string
          id: string
          message: string
          product_id: string | null
          read: boolean
          resolved: boolean
          severity: Database["public"]["Enums"]["alert_severity"]
          type: Database["public"]["Enums"]["alert_type"]
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          id?: string
          message: string
          product_id?: string | null
          read?: boolean
          resolved?: boolean
          severity?: Database["public"]["Enums"]["alert_severity"]
          type: Database["public"]["Enums"]["alert_type"]
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          id?: string
          message?: string
          product_id?: string | null
          read?: boolean
          resolved?: boolean
          severity?: Database["public"]["Enums"]["alert_severity"]
          type?: Database["public"]["Enums"]["alert_type"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      batches: {
        Row: {
          batch_number: string
          cost_price: number
          created_at: string
          expiry_date: string
          id: string
          product_id: string
          quantity: number
          received_at: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          batch_number: string
          cost_price?: number
          created_at?: string
          expiry_date: string
          id?: string
          product_id: string
          quantity?: number
          received_at?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          batch_number?: string
          cost_price?: number
          created_at?: string
          expiry_date?: string
          id?: string
          product_id?: string
          quantity?: number
          received_at?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          closed_at: string | null
          counted_amount: number | null
          created_at: string
          difference: number | null
          expected_amount: number | null
          id: string
          notes: string | null
          opened_at: string
          opening_amount: number
          status: Database["public"]["Enums"]["cash_session_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          counted_amount?: number | null
          created_at?: string
          difference?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_amount?: number
          status?: Database["public"]["Enums"]["cash_session_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          counted_amount?: number | null
          created_at?: string
          difference?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_amount?: number
          status?: Database["public"]["Enums"]["cash_session_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      financial_accounts: {
        Row: {
          active: boolean
          balance: number
          created_at: string
          created_by: string | null
          id: string
          is_system: boolean
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          balance?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_system?: boolean
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          balance?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_system?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pharmacy_settings: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          id: boolean
          logo_url: string | null
          name: string
          nuit: string | null
          phone: string | null
          receipt_footer: string | null
          receipt_header: string | null
          receipt_width: string
          show_pharmacist: boolean
          slogan: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: boolean
          logo_url?: string | null
          name?: string
          nuit?: string | null
          phone?: string | null
          receipt_footer?: string | null
          receipt_header?: string | null
          receipt_width?: string
          show_pharmacist?: boolean
          slogan?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: boolean
          logo_url?: string | null
          name?: string
          nuit?: string | null
          phone?: string | null
          receipt_footer?: string | null
          receipt_header?: string | null
          receipt_width?: string
          show_pharmacist?: boolean
          slogan?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          active_ingredient: string | null
          barcode: string | null
          category_id: string | null
          cost_price: number
          created_at: string
          expiry_alert_days: number
          id: string
          ideal_stock: number
          manufacturer: string | null
          min_stock: number
          name: string
          pack_size: number
          requires_prescription: boolean
          sale_price: number
          sub_unit_label: string | null
          sub_unit_price: number | null
          tarja: Database["public"]["Enums"]["medicine_tarja"] | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          active_ingredient?: string | null
          barcode?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string
          expiry_alert_days?: number
          id?: string
          ideal_stock?: number
          manufacturer?: string | null
          min_stock?: number
          name: string
          pack_size?: number
          requires_prescription?: boolean
          sale_price?: number
          sub_unit_label?: string | null
          sub_unit_price?: number | null
          tarja?: Database["public"]["Enums"]["medicine_tarja"] | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          active_ingredient?: string | null
          barcode?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string
          expiry_alert_days?: number
          id?: string
          ideal_stock?: number
          manufacturer?: string | null
          min_stock?: number
          name?: string
          pack_size?: number
          requires_prescription?: boolean
          sale_price?: number
          sub_unit_label?: string | null
          sub_unit_price?: number | null
          tarja?: Database["public"]["Enums"]["medicine_tarja"] | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          batch_id: string | null
          created_at: string
          id: string
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          total: number
          unit_kind: string
          unit_label: string | null
          unit_price: number
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          total: number
          unit_kind?: string
          unit_label?: string | null
          unit_price: number
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          sale_id?: string
          total?: number
          unit_kind?: string
          unit_label?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          account_id: string | null
          cash_session_id: string | null
          created_at: string
          customer_id: string | null
          discount: number
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          receipt_number: string | null
          sale_number: number
          status: Database["public"]["Enums"]["sale_status"]
          subtotal: number
          total: number
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          cash_session_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receipt_number?: string | null
          sale_number?: number
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          total?: number
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          cash_session_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receipt_number?: string | null
          sale_number?: number
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          batch_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          reason: string | null
          reference_id: string | null
          type: Database["public"]["Enums"]["movement_type"]
          user_id: string | null
        }
        Insert: {
          batch_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          type: Database["public"]["Enums"]["movement_type"]
          user_id?: string | null
        }
        Update: {
          batch_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          type?: Database["public"]["Enums"]["movement_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean
          address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          legal_name: string
          phone: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          legal_name: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          legal_name?: string
          phone?: string | null
          tax_id?: string | null
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
      add_batch_entry: {
        Args: {
          p_batch_number: string
          p_cost_price: number
          p_expiry_date: string
          p_product_id: string
          p_quantity: number
          p_supplier_id: string
        }
        Returns: string
      }
      adjust_account: {
        Args: {
          p_account_id: string
          p_amount: number
          p_reason: string
          p_type: string
        }
        Returns: string
      }
      admin_set_user_active: {
        Args: { p_active: boolean; p_user_id: string }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      close_cash_session: {
        Args: { p_counted: number; p_notes: string }
        Returns: string
      }
      delete_account: { Args: { p_account_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      open_cash_session: { Args: { p_opening: number }; Returns: string }
      process_sale:
        | {
            Args: {
              p_customer_id: string
              p_discount: number
              p_items: Json
              p_payment_method: Database["public"]["Enums"]["payment_method"]
            }
            Returns: string
          }
        | {
            Args: {
              p_account_id?: string
              p_customer_id: string
              p_discount: number
              p_items: Json
              p_payment_method: Database["public"]["Enums"]["payment_method"]
            }
            Returns: string
          }
      refresh_alerts: { Args: never; Returns: undefined }
    }
    Enums: {
      alert_severity: "info" | "warning" | "critical"
      alert_type: "low_stock" | "near_expiry" | "expired"
      app_role: "admin" | "pharmacist" | "cashier"
      cash_session_status: "open" | "closed"
      medicine_tarja: "livre" | "amarela" | "vermelha" | "preta"
      movement_type: "in" | "out" | "adjust" | "loss" | "return"
      payment_method: "cash" | "debit" | "credit" | "pix" | "other"
      sale_status: "completed" | "canceled"
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
      alert_severity: ["info", "warning", "critical"],
      alert_type: ["low_stock", "near_expiry", "expired"],
      app_role: ["admin", "pharmacist", "cashier"],
      cash_session_status: ["open", "closed"],
      medicine_tarja: ["livre", "amarela", "vermelha", "preta"],
      movement_type: ["in", "out", "adjust", "loss", "return"],
      payment_method: ["cash", "debit", "credit", "pix", "other"],
      sale_status: ["completed", "canceled"],
    },
  },
} as const
