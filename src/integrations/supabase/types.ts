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
      customers: {
        Row: {
          address: string | null
          balance: number
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          last_interaction: string | null
          mobile_phone: string | null
          name: string
          office_phone: string | null
          representative: string | null
          status: Database["public"]["Enums"]["customer_status"]
          tax_number: string | null
          tax_office: string | null
          type: Database["public"]["Enums"]["customer_type"]
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          balance?: number
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_interaction?: string | null
          mobile_phone?: string | null
          name: string
          office_phone?: string | null
          representative?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          tax_number?: string | null
          tax_office?: string | null
          type: Database["public"]["Enums"]["customer_type"]
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          balance?: number
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_interaction?: string | null
          mobile_phone?: string | null
          name?: string
          office_phone?: string | null
          representative?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          tax_number?: string | null
          tax_office?: string | null
          type?: Database["public"]["Enums"]["customer_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string
          email: string
          first_name: string
          hire_date: string
          id: string
          last_name: string
          phone: string | null
          position: string
          status: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department: string
          email: string
          first_name: string
          hire_date: string
          id?: string
          last_name: string
          phone?: string | null
          position: string
          status: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string
          email?: string
          first_name?: string
          hire_date?: string
          id?: string
          last_name?: string
          phone?: string | null
          position?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          balance: number
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          mobile_phone: string | null
          name: string
          office_phone: string | null
          representative: string | null
          status: Database["public"]["Enums"]["supplier_status"]
          tax_number: string | null
          tax_office: string | null
          type: Database["public"]["Enums"]["supplier_type"]
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          balance?: number
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          mobile_phone?: string | null
          name: string
          office_phone?: string | null
          representative?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          tax_number?: string | null
          tax_office?: string | null
          type: Database["public"]["Enums"]["supplier_type"]
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          balance?: number
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          mobile_phone?: string | null
          name?: string
          office_phone?: string | null
          representative?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          tax_number?: string | null
          tax_office?: string | null
          type?: Database["public"]["Enums"]["supplier_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      customer_status: "aktif" | "pasif" | "potansiyel"
      customer_type: "bireysel" | "kurumsal"
      supplier_status: "aktif" | "pasif" | "potansiyel"
      supplier_type: "bireysel" | "kurumsal"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
