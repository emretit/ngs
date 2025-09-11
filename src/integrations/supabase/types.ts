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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string | null
          available_balance: number | null
          bank_name: string
          branch_name: string | null
          created_at: string | null
          credit_limit: number | null
          currency: string | null
          current_balance: number | null
          iban: string | null
          id: string
          interest_rate: number | null
          is_active: boolean | null
          notes: string | null
          swift_code: string | null
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          account_type?: string | null
          available_balance?: number | null
          bank_name: string
          branch_name?: string | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: string | null
          current_balance?: number | null
          iban?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          notes?: string | null
          swift_code?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string | null
          available_balance?: number | null
          bank_name?: string
          branch_name?: string | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: string | null
          current_balance?: number | null
          iban?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          notes?: string | null
          swift_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          mobile_phone: string | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          status: string | null
          tax_number: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          mobile_phone?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          status?: string | null
          tax_number?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          mobile_phone?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          status?: string | null
          tax_number?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          first_name: string
          hire_date: string | null
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          position: string | null
          salary: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          first_name: string
          hire_date?: string | null
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          first_name?: string
          hire_date?: string | null
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          contact_history: Json | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          description: string | null
          employee_id: string | null
          expected_close_date: string | null
          id: string
          notes: string | null
          priority: string
          products: Json | null
          proposal_id: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          contact_history?: Json | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          employee_id?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          products?: Json | null
          proposal_id?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          contact_history?: Json | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          employee_id?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          products?: Json | null
          proposal_id?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          attachments: Json | null
          barcode: string | null
          category_id: string | null
          company_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          dimensions: string | null
          discount_rate: number | null
          id: string
          is_active: boolean | null
          max_stock_level: number | null
          min_stock_level: number | null
          name: string
          price: number
          purchase_price: number | null
          purchase_price_includes_vat: boolean | null
          sku: string | null
          status: string | null
          stock_quantity: number | null
          supplier_id: string | null
          tags: string[] | null
          unit: string | null
          updated_at: string | null
          warranty_period: number | null
          weight: number | null
        }
        Insert: {
          attachments?: Json | null
          barcode?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          dimensions?: string | null
          discount_rate?: number | null
          id?: string
          is_active?: boolean | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          name: string
          price?: number
          purchase_price?: number | null
          purchase_price_includes_vat?: boolean | null
          sku?: string | null
          status?: string | null
          stock_quantity?: number | null
          supplier_id?: string | null
          tags?: string[] | null
          unit?: string | null
          updated_at?: string | null
          warranty_period?: number | null
          weight?: number | null
        }
        Update: {
          attachments?: Json | null
          barcode?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          dimensions?: string | null
          discount_rate?: number | null
          id?: string
          is_active?: boolean | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          name?: string
          price?: number
          purchase_price?: number | null
          purchase_price_includes_vat?: boolean | null
          sku?: string | null
          status?: string | null
          stock_quantity?: number | null
          supplier_id?: string | null
          tags?: string[] | null
          unit?: string | null
          updated_at?: string | null
          warranty_period?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          attachments: Json | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          description: string | null
          employee_id: string | null
          id: string
          items: Json | null
          notes: string | null
          number: string
          opportunity_id: string | null
          status: string
          terms: string | null
          title: string
          total_amount: number
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          number: string
          opportunity_id?: string | null
          status?: string
          terms?: string | null
          title: string
          total_amount?: number
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          number?: string
          opportunity_id?: string | null
          status?: string
          terms?: string | null
          title?: string
          total_amount?: number
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          actual_duration: number | null
          assigned_technician_id: string | null
          attachments: Json | null
          completed_date: string | null
          created_at: string | null
          customer_feedback: string | null
          customer_id: string | null
          customer_rating: number | null
          customer_signature: string | null
          description: string | null
          equipment_model: string | null
          equipment_serial: string | null
          estimated_duration: number | null
          id: string
          labor_cost: number | null
          location: string | null
          parts_cost: number | null
          priority: string | null
          problem_description: string | null
          scheduled_date: string | null
          service_type: string | null
          solution_description: string | null
          status: string | null
          technician_notes: string | null
          title: string
          total_cost: number | null
          updated_at: string | null
          used_parts: Json | null
        }
        Insert: {
          actual_duration?: number | null
          assigned_technician_id?: string | null
          attachments?: Json | null
          completed_date?: string | null
          created_at?: string | null
          customer_feedback?: string | null
          customer_id?: string | null
          customer_rating?: number | null
          customer_signature?: string | null
          description?: string | null
          equipment_model?: string | null
          equipment_serial?: string | null
          estimated_duration?: number | null
          id?: string
          labor_cost?: number | null
          location?: string | null
          parts_cost?: number | null
          priority?: string | null
          problem_description?: string | null
          scheduled_date?: string | null
          service_type?: string | null
          solution_description?: string | null
          status?: string | null
          technician_notes?: string | null
          title: string
          total_cost?: number | null
          updated_at?: string | null
          used_parts?: Json | null
        }
        Update: {
          actual_duration?: number | null
          assigned_technician_id?: string | null
          attachments?: Json | null
          completed_date?: string | null
          created_at?: string | null
          customer_feedback?: string | null
          customer_id?: string | null
          customer_rating?: number | null
          customer_signature?: string | null
          description?: string | null
          equipment_model?: string | null
          equipment_serial?: string | null
          estimated_duration?: number | null
          id?: string
          labor_cost?: number | null
          location?: string | null
          parts_cost?: number | null
          priority?: string | null
          problem_description?: string | null
          scheduled_date?: string | null
          service_type?: string | null
          solution_description?: string | null
          status?: string | null
          technician_notes?: string | null
          title?: string
          total_cost?: number | null
          updated_at?: string | null
          used_parts?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_slips: {
        Row: {
          completion_date: string | null
          created_at: string | null
          customer_address: string | null
          customer_name: string
          customer_phone: string | null
          customer_signature_url: string | null
          device_model: string | null
          device_serial: string | null
          device_type: string | null
          diagnosis: string | null
          id: string
          labor_hours: number | null
          notes: string | null
          parts_used: Json | null
          problem_description: string
          service_request_id: string | null
          slip_number: string
          start_date: string | null
          status: string | null
          technician_id: string | null
          technician_signature_url: string | null
          total_cost: number | null
          updated_at: string | null
          work_performed: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_signature_url?: string | null
          device_model?: string | null
          device_serial?: string | null
          device_type?: string | null
          diagnosis?: string | null
          id?: string
          labor_hours?: number | null
          notes?: string | null
          parts_used?: Json | null
          problem_description: string
          service_request_id?: string | null
          slip_number: string
          start_date?: string | null
          status?: string | null
          technician_id?: string | null
          technician_signature_url?: string | null
          total_cost?: number | null
          updated_at?: string | null
          work_performed?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_signature_url?: string | null
          device_model?: string | null
          device_serial?: string | null
          device_type?: string | null
          diagnosis?: string | null
          id?: string
          labor_hours?: number | null
          notes?: string | null
          parts_used?: Json | null
          problem_description?: string
          service_request_id?: string | null
          slip_number?: string
          start_date?: string | null
          status?: string | null
          technician_id?: string | null
          technician_signature_url?: string | null
          total_cost?: number | null
          updated_at?: string | null
          work_performed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_slips_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_slips_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          related_item_id: string | null
          related_item_title: string | null
          related_item_type: string | null
          status: string | null
          subtasks: Json | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_item_id?: string | null
          related_item_title?: string | null
          related_item_type?: string | null
          status?: string | null
          subtasks?: Json | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_item_id?: string | null
          related_item_title?: string | null
          related_item_type?: string | null
          status?: string | null
          subtasks?: Json | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
