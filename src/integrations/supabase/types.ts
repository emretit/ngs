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
      activities: {
        Row: {
          assignee_id: string | null
          company_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          opportunity_id: string | null
          priority: string
          related_item_id: string | null
          related_item_title: string | null
          related_item_type: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          opportunity_id?: string | null
          priority?: string
          related_item_id?: string | null
          related_item_title?: string | null
          related_item_type?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          opportunity_id?: string | null
          priority?: string
          related_item_id?: string | null
          related_item_title?: string | null
          related_item_type?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          company_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          company_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          company_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string | null
          account_type: Database["public"]["Enums"]["account_type"]
          available_balance: number | null
          bank_name: string
          branch_name: string | null
          company_id: string | null
          created_at: string | null
          credit_limit: number | null
          currency: Database["public"]["Enums"]["currency_type"]
          current_balance: number | null
          end_date: string | null
          iban: string | null
          id: string
          interest_rate: number | null
          is_active: boolean | null
          last_transaction_date: string | null
          notes: string | null
          start_date: string
          swift_code: string | null
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_number?: string | null
          account_type: Database["public"]["Enums"]["account_type"]
          available_balance?: number | null
          bank_name: string
          branch_name?: string | null
          company_id?: string | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: Database["public"]["Enums"]["currency_type"]
          current_balance?: number | null
          end_date?: string | null
          iban?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          last_transaction_date?: string | null
          notes?: string | null
          start_date?: string
          swift_code?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string | null
          account_type?: Database["public"]["Enums"]["account_type"]
          available_balance?: number | null
          bank_name?: string
          branch_name?: string | null
          company_id?: string | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: Database["public"]["Enums"]["currency_type"]
          current_balance?: number | null
          end_date?: string | null
          iban?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          last_transaction_date?: string | null
          notes?: string | null
          start_date?: string
          swift_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          account_id: string | null
          amount: number
          company_id: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          description: string | null
          exchange_rate: number | null
          id: string
          metadata: Json | null
          reference_number: string | null
          related_transaction_id: string | null
          status: string | null
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          value_date: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          company_id?: string | null
          created_at?: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          description?: string | null
          exchange_rate?: number | null
          id?: string
          metadata?: Json | null
          reference_number?: string | null
          related_transaction_id?: string | null
          status?: string | null
          transaction_date?: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          value_date?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          company_id?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          description?: string | null
          exchange_rate?: number | null
          id?: string
          metadata?: Json | null
          reference_number?: string | null
          related_transaction_id?: string | null
          status?: string | null
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      card_transactions: {
        Row: {
          amount: number
          card_id: string | null
          company_id: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          description: string | null
          id: string
          installment_count: number | null
          merchant_category: string | null
          merchant_name: string | null
          reference_number: string | null
          transaction_date: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          card_id?: string | null
          company_id?: string | null
          created_at?: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          description?: string | null
          id?: string
          installment_count?: number | null
          merchant_category?: string | null
          merchant_name?: string | null
          reference_number?: string | null
          transaction_date?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          card_id?: string | null
          company_id?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          description?: string | null
          id?: string
          installment_count?: number | null
          merchant_category?: string | null
          merchant_name?: string | null
          reference_number?: string | null
          transaction_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_forecasts: {
        Row: {
          amount: number
          company_id: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          description: string | null
          forecast_date: string
          forecast_type: string
          id: string
          is_recurring: boolean | null
          next_occurrence_date: string | null
          probability: number | null
          recurrence_pattern: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          company_id?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          description?: string | null
          forecast_date: string
          forecast_type: string
          id?: string
          is_recurring?: boolean | null
          next_occurrence_date?: string | null
          probability?: number | null
          recurrence_pattern?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          description?: string | null
          forecast_date?: string
          forecast_type?: string
          id?: string
          is_recurring?: boolean | null
          next_occurrence_date?: string | null
          probability?: number | null
          recurrence_pattern?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_forecasts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_categories: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_main: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          main_category: string
          month: number
          subcategory: string
          updated_at: string
          value: number
          year: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          main_category: string
          month: number
          subcategory: string
          updated_at?: string
          value?: number
          year: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          main_category?: string
          month?: number
          subcategory?: string
          updated_at?: string
          value?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_main_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_transactions: {
        Row: {
          amount: number
          attachment_url: string | null
          category_id: string
          company_id: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          category_id: string
          company_id?: string | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          category_id?: string
          company_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cashflow_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      checks: {
        Row: {
          amount: number
          bank: string
          check_number: string
          company_id: string | null
          created_at: string
          due_date: string
          id: string
          issue_date: string
          notes: string | null
          payee: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank: string
          check_number: string
          company_id?: string | null
          created_at?: string
          due_date: string
          id?: string
          issue_date: string
          notes?: string | null
          payee: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank?: string
          check_number?: string
          company_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          issue_date?: string
          notes?: string | null
          payee?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          created_at: string
          default_currency: string | null
          domain: string | null
          email: string | null
          email_settings: Json | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          phone: string | null
          tax_number: string | null
          tax_office: string | null
          updated_at: string
          updated_by: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          default_currency?: string | null
          domain?: string | null
          email?: string | null
          email_settings?: Json | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          tax_number?: string | null
          tax_office?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          default_currency?: string | null
          domain?: string | null
          email?: string | null
          email_settings?: Json | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          tax_number?: string | null
          tax_office?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      credit_cards: {
        Row: {
          account_id: string | null
          available_limit: number | null
          card_name: string
          card_number: string | null
          card_type: Database["public"]["Enums"]["card_type"]
          company_id: string | null
          created_at: string | null
          credit_limit: number | null
          current_balance: number | null
          expiry_date: string
          id: string
          last_payment_date: string | null
          minimum_payment: number | null
          payment_due_date: string | null
          status: Database["public"]["Enums"]["card_status"] | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          available_limit?: number | null
          card_name: string
          card_number?: string | null
          card_type: Database["public"]["Enums"]["card_type"]
          company_id?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          expiry_date: string
          id?: string
          last_payment_date?: string | null
          minimum_payment?: number | null
          payment_due_date?: string | null
          status?: Database["public"]["Enums"]["card_status"] | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          available_limit?: number | null
          card_name?: string
          card_number?: string | null
          card_type?: Database["public"]["Enums"]["card_type"]
          company_id?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          expiry_date?: string
          id?: string
          last_payment_date?: string | null
          minimum_payment?: number | null
          payment_due_date?: string | null
          status?: Database["public"]["Enums"]["card_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_cards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_aliases: {
        Row: {
          alias_name: string
          company_id: string | null
          company_name: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          vkn: string
        }
        Insert: {
          alias_name: string
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          vkn: string
        }
        Update: {
          alias_name?: string
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          vkn?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_aliases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          balance: number
          city: string | null
          company: string | null
          company_id: string | null
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
          city?: string | null
          company?: string | null
          company_id?: string | null
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
          city?: string | null
          company?: string | null
          company_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_customers_representative"
            columns: ["representative"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      e_fatura_stok_eslestirme: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          invoice_id: string
          invoice_line_id: string
          invoice_product_code: string | null
          invoice_product_gtip: string | null
          invoice_product_name: string
          invoice_quantity: number
          invoice_tax_rate: number | null
          invoice_total_amount: number
          invoice_unit: string | null
          invoice_unit_price: number
          is_confirmed: boolean | null
          is_stock_updated: boolean | null
          match_confidence: number | null
          match_notes: string | null
          match_type: string
          matched_stock_code: string | null
          matched_stock_id: string | null
          matched_stock_name: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          invoice_id: string
          invoice_line_id: string
          invoice_product_code?: string | null
          invoice_product_gtip?: string | null
          invoice_product_name: string
          invoice_quantity?: number
          invoice_tax_rate?: number | null
          invoice_total_amount?: number
          invoice_unit?: string | null
          invoice_unit_price?: number
          is_confirmed?: boolean | null
          is_stock_updated?: boolean | null
          match_confidence?: number | null
          match_notes?: string | null
          match_type?: string
          matched_stock_code?: string | null
          matched_stock_id?: string | null
          matched_stock_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          invoice_id?: string
          invoice_line_id?: string
          invoice_product_code?: string | null
          invoice_product_gtip?: string | null
          invoice_product_name?: string
          invoice_quantity?: number
          invoice_tax_rate?: number | null
          invoice_total_amount?: number
          invoice_unit?: string | null
          invoice_unit_price?: number
          is_confirmed?: boolean | null
          is_stock_updated?: boolean | null
          match_confidence?: number | null
          match_notes?: string | null
          match_type?: string
          matched_stock_code?: string | null
          matched_stock_id?: string | null
          matched_stock_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "e_fatura_stok_eslestirme_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "e_fatura_stok_eslestirme_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "einvoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "e_fatura_stok_eslestirme_matched_stock_id_fkey"
            columns: ["matched_stock_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      einvoice_items: {
        Row: {
          company_id: string | null
          created_at: string | null
          discount_rate: number | null
          id: string
          line_number: number
          line_total: number
          product_code: string | null
          product_name: string
          quantity: number
          received_invoice_id: string | null
          sent_invoice_id: string | null
          tax_rate: number | null
          unit: string
          unit_price: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          discount_rate?: number | null
          id?: string
          line_number: number
          line_total: number
          product_code?: string | null
          product_name: string
          quantity: number
          received_invoice_id?: string | null
          sent_invoice_id?: string | null
          tax_rate?: number | null
          unit: string
          unit_price: number
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          discount_rate?: number | null
          id?: string
          line_number?: number
          line_total?: number
          product_code?: string | null
          product_name?: string
          quantity?: number
          received_invoice_id?: string | null
          sent_invoice_id?: string | null
          tax_rate?: number | null
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "einvoice_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "einvoice_items_received_invoice_id_fkey"
            columns: ["received_invoice_id"]
            isOneToOne: false
            referencedRelation: "einvoices_received"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "einvoice_items_sent_invoice_id_fkey"
            columns: ["sent_invoice_id"]
            isOneToOne: false
            referencedRelation: "einvoices_sent"
            referencedColumns: ["id"]
          },
        ]
      }
      einvoice_logs: {
        Row: {
          company_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          operation: string
          operation_type: string
          request_data: Json | null
          response_data: Json | null
          response_time_ms: number | null
          success: boolean
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          operation: string
          operation_type: string
          request_data?: Json | null
          response_data?: Json | null
          response_time_ms?: number | null
          success: boolean
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          operation?: string
          operation_type?: string
          request_data?: Json | null
          response_data?: Json | null
          response_time_ms?: number | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "einvoice_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      einvoice_queue: {
        Row: {
          attempt_count: number | null
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          error_details: Json | null
          error_message: string | null
          id: string
          max_attempts: number | null
          next_retry_at: string | null
          operation_type: string | null
          priority: number | null
          sales_invoice_id: string | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          next_retry_at?: string | null
          operation_type?: string | null
          priority?: number | null
          sales_invoice_id?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          next_retry_at?: string | null
          operation_type?: string | null
          priority?: number | null
          sales_invoice_id?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "einvoice_queue_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "einvoice_queue_sales_invoice_id_fkey"
            columns: ["sales_invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      einvoice_status_tracking: {
        Row: {
          answer_type: number | null
          company_id: string | null
          created_at: string | null
          delivered_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          invoice_state: number | null
          nilvera_invoice_id: string | null
          nilvera_response: Json | null
          nilvera_transfer_id: string | null
          responded_at: string | null
          sales_invoice_id: string | null
          sent_at: string | null
          status: string
          transfer_state: number | null
          updated_at: string | null
          xml_content: string | null
        }
        Insert: {
          answer_type?: number | null
          company_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          invoice_state?: number | null
          nilvera_invoice_id?: string | null
          nilvera_response?: Json | null
          nilvera_transfer_id?: string | null
          responded_at?: string | null
          sales_invoice_id?: string | null
          sent_at?: string | null
          status?: string
          transfer_state?: number | null
          updated_at?: string | null
          xml_content?: string | null
        }
        Update: {
          answer_type?: number | null
          company_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          invoice_state?: number | null
          nilvera_invoice_id?: string | null
          nilvera_response?: Json | null
          nilvera_transfer_id?: string | null
          responded_at?: string | null
          sales_invoice_id?: string | null
          sent_at?: string | null
          status?: string
          transfer_state?: number | null
          updated_at?: string | null
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "einvoice_status_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "einvoice_status_tracking_sales_invoice_id_fkey"
            columns: ["sales_invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      einvoices: {
        Row: {
          company_id: string | null
          created_at: string
          currency: string
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          nilvera_id: string | null
          paid_amount: number
          pdf_url: string | null
          remaining_amount: number
          status: string
          supplier_name: string
          supplier_tax_number: string | null
          tax_amount: number
          total_amount: number
          updated_at: string
          xml_data: Json | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          nilvera_id?: string | null
          paid_amount?: number
          pdf_url?: string | null
          remaining_amount?: number
          status: string
          supplier_name: string
          supplier_tax_number?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          xml_data?: Json | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          nilvera_id?: string | null
          paid_amount?: number
          pdf_url?: string | null
          remaining_amount?: number
          status?: string
          supplier_name?: string
          supplier_tax_number?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          xml_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "einvoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      einvoices_received: {
        Row: {
          answer_type: number | null
          company_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          invoice_date: string
          invoice_id: string | null
          invoice_state: number | null
          invoice_uuid: string
          notes: string | null
          response_sent: boolean | null
          response_xml: string | null
          subtotal: number | null
          supplier_name: string
          supplier_vkn: string
          tax_amount: number | null
          total_amount: number | null
          updated_at: string | null
          xml_content: string | null
        }
        Insert: {
          answer_type?: number | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_date: string
          invoice_id?: string | null
          invoice_state?: number | null
          invoice_uuid: string
          notes?: string | null
          response_sent?: boolean | null
          response_xml?: string | null
          subtotal?: number | null
          supplier_name: string
          supplier_vkn: string
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
          xml_content?: string | null
        }
        Update: {
          answer_type?: number | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_date?: string
          invoice_id?: string | null
          invoice_state?: number | null
          invoice_uuid?: string
          notes?: string | null
          response_sent?: boolean | null
          response_xml?: string | null
          subtotal?: number | null
          supplier_name?: string
          supplier_vkn?: string
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "einvoices_received_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      einvoices_sent: {
        Row: {
          answer_type: number | null
          company_id: string | null
          created_at: string | null
          currency: string | null
          customer_name: string
          customer_vkn: string
          id: string
          invoice_date: string
          invoice_id: string | null
          invoice_state: number | null
          invoice_uuid: string
          notes: string | null
          response_xml: string | null
          subtotal: number | null
          tax_amount: number | null
          total_amount: number | null
          transfer_id: string | null
          transfer_state: number | null
          updated_at: string | null
          xml_content: string | null
          zip_content: string | null
        }
        Insert: {
          answer_type?: number | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_name: string
          customer_vkn: string
          id?: string
          invoice_date: string
          invoice_id?: string | null
          invoice_state?: number | null
          invoice_uuid: string
          notes?: string | null
          response_xml?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          transfer_id?: string | null
          transfer_state?: number | null
          updated_at?: string | null
          xml_content?: string | null
          zip_content?: string | null
        }
        Update: {
          answer_type?: number | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_name?: string
          customer_vkn?: string
          id?: string
          invoice_date?: string
          invoice_id?: string | null
          invoice_state?: number | null
          invoice_uuid?: string
          notes?: string | null
          response_xml?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          transfer_id?: string | null
          transfer_state?: number | null
          updated_at?: string | null
          xml_content?: string | null
          zip_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "einvoices_sent_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_auth: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string
          employee_id: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email: string
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_auth_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_auth_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          company_id: string | null
          created_at: string | null
          document_type: string
          employee_id: string | null
          file_name: string
          file_url: string
          id: string
          updated_at: string | null
          upload_date: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          document_type: string
          employee_id?: string | null
          file_name: string
          file_url: string
          id?: string
          updated_at?: string | null
          upload_date?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          document_type?: string
          employee_id?: string | null
          file_name?: string
          file_url?: string
          id?: string
          updated_at?: string | null
          upload_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_leaves: {
        Row: {
          company_id: string | null
          created_at: string | null
          employee_id: string | null
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_leaves_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_performance: {
        Row: {
          company_id: string | null
          created_at: string | null
          employee_id: string | null
          feedback: string | null
          id: string
          metrics: Json
          rating: number | null
          review_date: string
          review_type: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          feedback?: string | null
          id?: string
          metrics?: Json
          rating?: number | null
          review_date: string
          review_type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          feedback?: string | null
          id?: string
          metrics?: Json
          rating?: number | null
          review_date?: string
          review_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_performance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_performance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_salaries: {
        Row: {
          accident_insurance_amount: number | null
          accident_insurance_rate: number | null
          allowances: Json | null
          bonus_provision: number | null
          calculate_as_minimum_wage: boolean | null
          company_id: string | null
          created_at: string | null
          cumulative_yearly_gross: number | null
          cumulative_yearly_tax: number | null
          effective_date: string
          employee_id: string | null
          gross_salary: number
          id: string
          income_tax_amount: number | null
          manual_employer_sgk_cost: number | null
          meal_allowance: number | null
          net_salary: number
          notes: string | null
          salary_input_type: string | null
          severance_provision: number | null
          sgk_employee_amount: number | null
          sgk_employee_rate: number | null
          sgk_employer_amount: number | null
          sgk_employer_rate: number | null
          stamp_tax: number | null
          stamp_tax_amount: number | null
          stamp_tax_rate: number | null
          tax_year: number | null
          total_deductions: number | null
          total_employer_cost: number | null
          transport_allowance: number | null
          unemployment_employee_amount: number | null
          unemployment_employee_rate: number | null
          unemployment_employer_amount: number | null
          unemployment_employer_rate: number | null
          updated_at: string | null
        }
        Insert: {
          accident_insurance_amount?: number | null
          accident_insurance_rate?: number | null
          allowances?: Json | null
          bonus_provision?: number | null
          calculate_as_minimum_wage?: boolean | null
          company_id?: string | null
          created_at?: string | null
          cumulative_yearly_gross?: number | null
          cumulative_yearly_tax?: number | null
          effective_date: string
          employee_id?: string | null
          gross_salary: number
          id?: string
          income_tax_amount?: number | null
          manual_employer_sgk_cost?: number | null
          meal_allowance?: number | null
          net_salary: number
          notes?: string | null
          salary_input_type?: string | null
          severance_provision?: number | null
          sgk_employee_amount?: number | null
          sgk_employee_rate?: number | null
          sgk_employer_amount?: number | null
          sgk_employer_rate?: number | null
          stamp_tax?: number | null
          stamp_tax_amount?: number | null
          stamp_tax_rate?: number | null
          tax_year?: number | null
          total_deductions?: number | null
          total_employer_cost?: number | null
          transport_allowance?: number | null
          unemployment_employee_amount?: number | null
          unemployment_employee_rate?: number | null
          unemployment_employer_amount?: number | null
          unemployment_employer_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          accident_insurance_amount?: number | null
          accident_insurance_rate?: number | null
          allowances?: Json | null
          bonus_provision?: number | null
          calculate_as_minimum_wage?: boolean | null
          company_id?: string | null
          created_at?: string | null
          cumulative_yearly_gross?: number | null
          cumulative_yearly_tax?: number | null
          effective_date?: string
          employee_id?: string | null
          gross_salary?: number
          id?: string
          income_tax_amount?: number | null
          manual_employer_sgk_cost?: number | null
          meal_allowance?: number | null
          net_salary?: number
          notes?: string | null
          salary_input_type?: string | null
          severance_provision?: number | null
          sgk_employee_amount?: number | null
          sgk_employee_rate?: number | null
          sgk_employer_amount?: number | null
          sgk_employer_rate?: number | null
          stamp_tax?: number | null
          stamp_tax_amount?: number | null
          stamp_tax_rate?: number | null
          tax_year?: number | null
          total_deductions?: number | null
          total_employer_cost?: number | null
          transport_allowance?: number | null
          unemployment_employee_amount?: number | null
          unemployment_employee_rate?: number | null
          unemployment_employer_amount?: number | null
          unemployment_employer_rate?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_salaries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_salaries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          company_id: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          department: string
          district: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          hire_date: string
          id: string
          id_ssn: string | null
          last_name: string
          marital_status:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          phone: string | null
          position: string
          postal_code: string | null
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department: string
          district?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          first_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          hire_date: string
          id?: string
          id_ssn?: string | null
          last_name: string
          marital_status?:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          phone?: string | null
          position: string
          postal_code?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string
          district?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          hire_date?: string
          id?: string
          id_ssn?: string | null
          last_name?: string
          marital_status?:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          phone?: string | null
          position?: string
          postal_code?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          company_id: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          installation_date: string | null
          maintenance_schedule: Json | null
          model: string | null
          name: string
          serial_number: string | null
          specifications: Json | null
          status: string | null
          updated_at: string | null
          warranty_end: string | null
          warranty_start: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          installation_date?: string | null
          maintenance_schedule?: Json | null
          model?: string | null
          name: string
          serial_number?: string | null
          specifications?: Json | null
          status?: string | null
          updated_at?: string | null
          warranty_end?: string | null
          warranty_start?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          installation_date?: string | null
          maintenance_schedule?: Json | null
          model?: string | null
          name?: string
          serial_number?: string | null
          specifications?: Json | null
          status?: string | null
          updated_at?: string | null
          warranty_end?: string | null
          warranty_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          assigned_to: string | null
          category: string
          company_id: string | null
          created_at: string | null
          description: string | null
          end_time: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      example_items: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string
          id: string
          org_id: string
          title: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          org_id: string
          title: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          org_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "example_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "example_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rate_updates: {
        Row: {
          company_id: string | null
          count: number | null
          created_at: string | null
          id: string
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          count?: number | null
          created_at?: string | null
          id?: string
          message?: string | null
          status: string
          updated_at: string
        }
        Update: {
          company_id?: string | null
          count?: number | null
          created_at?: string | null
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rate_updates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          banknote_buying: number | null
          banknote_selling: number | null
          company_id: string | null
          created_at: string | null
          cross_rate: number | null
          currency_code: string
          forex_buying: number | null
          forex_selling: number | null
          id: string
          update_date: string
          updated_at: string | null
        }
        Insert: {
          banknote_buying?: number | null
          banknote_selling?: number | null
          company_id?: string | null
          created_at?: string | null
          cross_rate?: number | null
          currency_code: string
          forex_buying?: number | null
          forex_selling?: number | null
          id?: string
          update_date?: string
          updated_at?: string | null
        }
        Update: {
          banknote_buying?: number | null
          banknote_selling?: number | null
          company_id?: string | null
          created_at?: string | null
          cross_rate?: number | null
          currency_code?: string
          forex_buying?: number | null
          forex_selling?: number | null
          id?: string
          update_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_instruments: {
        Row: {
          amount: number
          bank_account_id: string | null
          bank_name: string | null
          branch_name: string | null
          company_id: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          due_date: string
          id: string
          instrument_number: string
          instrument_type: Database["public"]["Enums"]["financial_instrument_type"]
          issue_date: string
          issuer_name: string
          notes: string | null
          recipient_name: string
          status: Database["public"]["Enums"]["financial_instrument_status"]
          updated_at: string | null
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          bank_name?: string | null
          branch_name?: string | null
          company_id?: string | null
          created_at?: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          due_date: string
          id?: string
          instrument_number: string
          instrument_type: Database["public"]["Enums"]["financial_instrument_type"]
          issue_date?: string
          issuer_name: string
          notes?: string | null
          recipient_name: string
          status?: Database["public"]["Enums"]["financial_instrument_status"]
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          bank_name?: string | null
          branch_name?: string | null
          company_id?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          due_date?: string
          id?: string
          instrument_number?: string
          instrument_type?: Database["public"]["Enums"]["financial_instrument_type"]
          issue_date?: string
          issuer_name?: string
          notes?: string | null
          recipient_name?: string
          status?: Database["public"]["Enums"]["financial_instrument_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_instruments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_instruments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_budget: {
        Row: {
          base_salary: number
          benefits: number | null
          bonus: number | null
          company_id: string | null
          created_at: string | null
          department: string
          headcount: number
          id: string
          month: number
          notes: string | null
          position_name: string
          total_cost: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          base_salary?: number
          benefits?: number | null
          bonus?: number | null
          company_id?: string | null
          created_at?: string | null
          department: string
          headcount?: number
          id?: string
          month: number
          notes?: string | null
          position_name: string
          total_cost?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          base_salary?: number
          benefits?: number | null
          bonus?: number | null
          company_id?: string | null
          created_at?: string | null
          department?: string
          headcount?: number
          id?: string
          month?: number
          notes?: string | null
          position_name?: string
          total_cost?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_budget_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_analysis: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          month: number
          profit_loss: number
          purchase_invoice: number
          purchase_vat: number
          returns_given: number
          returns_received: number
          sales_invoice: number
          sales_vat: number
          updated_at: string
          vat_difference: number
          year: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          month: number
          profit_loss?: number
          purchase_invoice?: number
          purchase_vat?: number
          returns_given?: number
          returns_received?: number
          sales_invoice?: number
          sales_vat?: number
          updated_at?: string
          vat_difference?: number
          year: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          month?: number
          profit_loss?: number
          purchase_invoice?: number
          purchase_vat?: number
          returns_given?: number
          returns_received?: number
          sales_invoice?: number
          sales_vat?: number
          updated_at?: string
          vat_difference?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_analysis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          amount: number
          bank: string
          company_id: string | null
          created_at: string
          end_date: string
          id: string
          installment_amount: number
          interest_rate: number
          loan_name: string
          notes: string | null
          remaining_debt: number
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank: string
          company_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          installment_amount: number
          interest_rate: number
          loan_name: string
          notes?: string | null
          remaining_debt?: number
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank?: string
          company_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          installment_amount?: number
          interest_rate?: number
          loan_name?: string
          notes?: string | null
          remaining_debt?: number
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_financials: {
        Row: {
          amount: number
          category: string
          company_id: string | null
          created_at: string | null
          id: string
          month: number
          notes: string | null
          subcategory: string | null
          target_amount: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          amount?: number
          category: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          month: number
          notes?: string | null
          subcategory?: string | null
          target_amount?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          amount?: number
          category?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          month?: number
          notes?: string | null
          subcategory?: string | null
          target_amount?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_financials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_workflow_logs: {
        Row: {
          company_id: string | null
          created_at: string | null
          error_message: string | null
          execution_id: string | null
          execution_time_ms: number | null
          id: string
          result_data: Json | null
          status: string
          trigger_data: Json | null
          updated_at: string | null
          workflow_name: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_id?: string | null
          execution_time_ms?: number | null
          id?: string
          result_data?: Json | null
          status: string
          trigger_data?: Json | null
          updated_at?: string | null
          workflow_name: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_id?: string | null
          execution_time_ms?: number | null
          id?: string
          result_data?: Json | null
          status?: string
          trigger_data?: Json | null
          updated_at?: string | null
          workflow_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "n8n_workflow_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }

      nilvera_auth: {
        Row: {
          api_key: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          password: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          api_key: string
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          password: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          api_key?: string
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          password?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      opex_matrix: {
        Row: {
          amount: number
          attachment_url: string | null
          category: string
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          month: number
          subcategory: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          amount?: number
          attachment_url?: string | null
          category: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          month: number
          subcategory?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          category?: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          month?: number
          subcategory?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "opex_matrix_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          company_id: string | null
          contact_history: Json | null
          created_at: string
          currency: string | null
          customer_id: string | null
          description: string | null
          employee_id: string | null
          expected_close_date: string | null
          id: string
          notes: string | null
          opportunity_type: string | null
          priority: string
          products: Json | null
          proposal_id: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          company_id?: string | null
          contact_history?: Json | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          employee_id?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          opportunity_type?: string | null
          priority?: string
          products?: Json | null
          proposal_id?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          company_id?: string | null
          contact_history?: Json | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          employee_id?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          opportunity_type?: string | null
          priority?: string
          products?: Json | null
          proposal_id?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_opportunity_type"
            columns: ["opportunity_type"]
            isOneToOne: false
            referencedRelation: "opportunity_types"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
      opportunity_kanban_columns: {
        Row: {
          color: string
          column_id: string
          company_id: string | null
          created_at: string | null
          id: string
          is_default: boolean
          order_index: number
          title: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          column_id: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean
          order_index?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          column_id?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean
          order_index?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_kanban_columns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_types: {
        Row: {
          company_id: string | null
          created_at: string | null
          display_name: string
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          display_name: string
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          display_name?: string
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          company_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          discount_rate: number | null
          id: string
          item_group: string | null
          name: string
          order_id: string
          original_currency: string | null
          original_price: number | null
          product_id: string | null
          quantity: number
          sort_order: number | null
          stock_status: string | null
          tax_rate: number | null
          total_price: number
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          discount_rate?: number | null
          id?: string
          item_group?: string | null
          name: string
          order_id: string
          original_currency?: string | null
          original_price?: number | null
          product_id?: string | null
          quantity?: number
          sort_order?: number | null
          stock_status?: string | null
          tax_rate?: number | null
          total_price?: number
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          discount_rate?: number | null
          id?: string
          item_group?: string | null
          name?: string
          order_id?: string
          original_currency?: string | null
          original_price?: number | null
          product_id?: string | null
          quantity?: number
          sort_order?: number | null
          stock_status?: string | null
          tax_rate?: number | null
          total_price?: number
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          company_id: string | null
          created_at: string
          currency: string
          customer_id: string | null
          delivery_address: string | null
          delivery_contact_name: string | null
          delivery_contact_phone: string | null
          delivery_date: string | null
          delivery_terms: string | null
          description: string | null
          discount_amount: number
          employee_id: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          opportunity_id: string | null
          order_date: string
          order_number: string
          other_terms: string | null
          payment_terms: string | null
          price_terms: string | null
          proposal_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_amount: number
          title: string
          total_amount: number
          updated_at: string
          warranty_terms: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          delivery_address?: string | null
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          delivery_date?: string | null
          delivery_terms?: string | null
          description?: string | null
          discount_amount?: number
          employee_id?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string | null
          order_date?: string
          order_number: string
          other_terms?: string | null
          payment_terms?: string | null
          price_terms?: string | null
          proposal_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_amount?: number
          title: string
          total_amount?: number
          updated_at?: string
          warranty_terms?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          delivery_address?: string | null
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          delivery_date?: string | null
          delivery_terms?: string | null
          description?: string | null
          discount_amount?: number
          employee_id?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string | null
          order_date?: string
          order_number?: string
          other_terms?: string | null
          payment_terms?: string | null
          price_terms?: string | null
          proposal_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_amount?: number
          title?: string
          total_amount?: number
          updated_at?: string
          warranty_terms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          is_active: boolean | null
          joined_at: string | null
          organization_id: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          organization_id?: string | null
          role?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          organization_id?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      orgs: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "orgs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_notifications: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          notification_type: string
          payment_id: string | null
          recipient_email: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          notification_type: string
          payment_id?: string | null
          recipient_email: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          notification_type?: string
          payment_id?: string | null
          recipient_email?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_notifications_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          bank_account_id: string
          company_id: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          customer_id: string | null
          description: string | null
          id: string
          payment_date: string
          payment_direction: string | null
          payment_type: string | null
          recipient_name: string
          reference_note: string | null
          status: Database["public"]["Enums"]["payment_status"]
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          bank_account_id: string
          company_id?: string | null
          created_at?: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          customer_id?: string | null
          description?: string | null
          id?: string
          payment_date?: string
          payment_direction?: string | null
          payment_type?: string | null
          recipient_name: string
          reference_note?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string
          company_id?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          customer_id?: string | null
          description?: string | null
          id?: string
          payment_date?: string
          payment_direction?: string | null
          payment_type?: string | null
          recipient_name?: string
          reference_note?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_templates: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          locale: string
          name: string
          schema_json: Json
          type: string
          updated_at: string | null
          version: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          locale?: string
          name: string
          schema_json: Json
          type?: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          locale?: string
          name?: string
          schema_json?: Json
          type?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "pdf_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          category_type: string
          company_id: string | null
          created_at: string | null
          currency: string
          description: string | null
          discount_rate: number | null
          id: string
          image_url: string | null
          is_active: boolean
          min_stock_level: number
          name: string
          price: number
          product_type: string
          sku: string | null
          status: string
          stock_quantity: number | null
          stock_threshold: number | null
          supplier_id: string | null
          tax_rate: number
          unit: string
          updated_at: string | null
          vat_included: boolean | null
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          category_type?: string
          company_id?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          discount_rate?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock_level?: number
          name: string
          price?: number
          product_type?: string
          sku?: string | null
          status?: string
          stock_quantity?: number | null
          stock_threshold?: number | null
          supplier_id?: string | null
          tax_rate?: number
          unit?: string
          updated_at?: string | null
          vat_included?: boolean | null
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          category_type?: string
          company_id?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          discount_rate?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock_level?: number
          name?: string
          price?: number
          product_type?: string
          sku?: string | null
          status?: string
          stock_quantity?: number | null
          stock_threshold?: number | null
          supplier_id?: string | null
          tax_rate?: number
          unit?: string
          updated_at?: string | null
          vat_included?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string
          company_name: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          last_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id: string
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_company_id"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_terms: {
        Row: {
          category: string
          company_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          label: string
          sort_order: number | null
          text: string
          updated_at: string | null
        }
        Insert: {
          category: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label: string
          sort_order?: number | null
          text: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label?: string
          sort_order?: number | null
          text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_terms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          attachments: Json | null
          company_id: string | null
          created_at: string
          currency: string | null
          customer_id: string | null
          delivery_terms: string | null
          description: string | null
          employee_id: string | null
          id: string
          items: Json | null
          notes: string | null
          number: string
          opportunity_id: string | null
          other_terms: string | null
          payment_terms: string | null
          price_terms: string | null
          selected_delivery_terms: string[] | null
          selected_other_terms: string[] | null
          selected_payment_terms: string[] | null
          selected_pricing_terms: string[] | null
          selected_warranty_terms: string[] | null
          status: string
          terms: string | null
          title: string
          total_amount: number
          updated_at: string
          valid_until: string | null
          warranty_terms: string | null
        }
        Insert: {
          attachments?: Json | null
          company_id?: string | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          delivery_terms?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          number: string
          opportunity_id?: string | null
          other_terms?: string | null
          payment_terms?: string | null
          price_terms?: string | null
          selected_delivery_terms?: string[] | null
          selected_other_terms?: string[] | null
          selected_payment_terms?: string[] | null
          selected_pricing_terms?: string[] | null
          selected_warranty_terms?: string[] | null
          status?: string
          terms?: string | null
          title: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
          warranty_terms?: string | null
        }
        Update: {
          attachments?: Json | null
          company_id?: string | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          delivery_terms?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          number?: string
          opportunity_id?: string | null
          other_terms?: string | null
          payment_terms?: string | null
          price_terms?: string | null
          selected_delivery_terms?: string[] | null
          selected_other_terms?: string[] | null
          selected_payment_terms?: string[] | null
          selected_pricing_terms?: string[] | null
          selected_warranty_terms?: string[] | null
          status?: string
          terms?: string | null
          title?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
          warranty_terms?: string | null
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
      purchase_invoices: {
        Row: {
          company_id: string | null
          created_at: string | null
          currency: string
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          paid_amount: number | null
          po_id: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number
          supplier_id: string
          tax_amount: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          currency?: string
          due_date: string
          id?: string
          invoice_date: string
          invoice_number: string
          notes?: string | null
          paid_amount?: number | null
          po_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number
          supplier_id: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          currency?: string
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          paid_amount?: number | null
          po_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number
          supplier_id?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string
          discount_rate: number | null
          id: string
          po_id: string
          product_id: string | null
          quantity: number
          received_quantity: number | null
          tax_rate: number
          total_price: number
          unit: string
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description: string
          discount_rate?: number | null
          id?: string
          po_id: string
          product_id?: string | null
          quantity: number
          received_quantity?: number | null
          tax_rate?: number
          total_price: number
          unit: string
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string
          discount_rate?: number | null
          id?: string
          po_id?: string
          product_id?: string | null
          quantity?: number
          received_quantity?: number | null
          tax_rate?: number
          total_price?: number
          unit?: string
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          company_id: string | null
          created_at: string | null
          currency: string
          delivery_address: string | null
          delivery_terms: string | null
          expected_delivery_date: string | null
          id: string
          issued_by: string | null
          issued_date: string | null
          notes: string | null
          payment_terms: string | null
          po_number: string
          request_id: string | null
          status: Database["public"]["Enums"]["purchase_order_status"] | null
          subtotal: number
          supplier_id: string
          tax_amount: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          currency?: string
          delivery_address?: string | null
          delivery_terms?: string | null
          expected_delivery_date?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          notes?: string | null
          payment_terms?: string | null
          po_number?: string
          request_id?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"] | null
          subtotal?: number
          supplier_id: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          currency?: string
          delivery_address?: string | null
          delivery_terms?: string | null
          expected_delivery_date?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          notes?: string | null
          payment_terms?: string | null
          po_number?: string
          request_id?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"] | null
          subtotal?: number
          supplier_id?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_request_items: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string
          estimated_total: number | null
          estimated_unit_price: number | null
          id: string
          notes: string | null
          product_id: string | null
          quantity: number
          request_id: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description: string
          estimated_total?: number | null
          estimated_unit_price?: number | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity: number
          request_id: string
          unit: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string
          estimated_total?: number | null
          estimated_unit_price?: number | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          request_id?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_request_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_request_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string | null
          created_at: string | null
          department: string | null
          description: string | null
          id: string
          needed_by_date: string | null
          notes: string | null
          preferred_supplier_id: string | null
          request_number: string
          requested_date: string | null
          requester_id: string
          status: Database["public"]["Enums"]["purchase_request_status"] | null
          title: string
          total_budget: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string | null
          department?: string | null
          description?: string | null
          id?: string
          needed_by_date?: string | null
          notes?: string | null
          preferred_supplier_id?: string | null
          request_number?: string
          requested_date?: string | null
          requester_id: string
          status?: Database["public"]["Enums"]["purchase_request_status"] | null
          title: string
          total_budget?: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string | null
          department?: string | null
          description?: string | null
          id?: string
          needed_by_date?: string | null
          notes?: string | null
          preferred_supplier_id?: string | null
          request_number?: string
          requested_date?: string | null
          requester_id?: string
          status?: Database["public"]["Enums"]["purchase_request_status"] | null
          title?: string
          total_budget?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_preferred_supplier_id_fkey"
            columns: ["preferred_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          permissions: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          permissions?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          permissions?: Json | null
        }
        Relationships: []
      }
      sales_invoice_items: {
        Row: {
          aciklama: string | null
          birim: string
          birim_fiyat: number
          company_id: string | null
          created_at: string
          id: string
          indirim_orani: number | null
          kdv_orani: number
          kdv_tutari: number
          miktar: number
          para_birimi: string | null
          product_id: string | null
          sales_invoice_id: string
          satir_toplami: number
          sira_no: number | null
          updated_at: string
          urun_adi: string
        }
        Insert: {
          aciklama?: string | null
          birim?: string
          birim_fiyat?: number
          company_id?: string | null
          created_at?: string
          id?: string
          indirim_orani?: number | null
          kdv_orani?: number
          kdv_tutari?: number
          miktar?: number
          para_birimi?: string | null
          product_id?: string | null
          sales_invoice_id: string
          satir_toplami?: number
          sira_no?: number | null
          updated_at?: string
          urun_adi: string
        }
        Update: {
          aciklama?: string | null
          birim?: string
          birim_fiyat?: number
          company_id?: string | null
          created_at?: string
          id?: string
          indirim_orani?: number | null
          kdv_orani?: number
          kdv_tutari?: number
          miktar?: number
          para_birimi?: string | null
          product_id?: string | null
          sales_invoice_id?: string
          satir_toplami?: number
          sira_no?: number | null
          updated_at?: string
          urun_adi?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoice_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoice_items_sales_invoice_id_fkey"
            columns: ["sales_invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_invoices: {
        Row: {
          aciklama: string | null
          ara_toplam: number
          banka_bilgileri: string | null
          company_id: string | null
          created_at: string
          customer_id: string
          document_type: string | null
          durum: string
          ek_belgeler: Json | null
          employee_id: string | null
          fatura_no: string
          fatura_tarihi: string
          id: string
          indirim_tutari: number
          kdv_tutari: number
          notlar: string | null
          odeme_durumu: string
          odeme_sekli: string | null
          odenen_tutar: number
          order_id: string | null
          para_birimi: string
          pdf_url: string | null
          toplam_tutar: number
          updated_at: string
          vade_tarihi: string | null
          xml_data: Json | null
        }
        Insert: {
          aciklama?: string | null
          ara_toplam?: number
          banka_bilgileri?: string | null
          company_id?: string | null
          created_at?: string
          customer_id: string
          document_type?: string | null
          durum?: string
          ek_belgeler?: Json | null
          employee_id?: string | null
          fatura_no: string
          fatura_tarihi?: string
          id?: string
          indirim_tutari?: number
          kdv_tutari?: number
          notlar?: string | null
          odeme_durumu?: string
          odeme_sekli?: string | null
          odenen_tutar?: number
          order_id?: string | null
          para_birimi?: string
          pdf_url?: string | null
          toplam_tutar?: number
          updated_at?: string
          vade_tarihi?: string | null
          xml_data?: Json | null
        }
        Update: {
          aciklama?: string | null
          ara_toplam?: number
          banka_bilgileri?: string | null
          company_id?: string | null
          created_at?: string
          customer_id?: string
          document_type?: string | null
          durum?: string
          ek_belgeler?: Json | null
          employee_id?: string | null
          fatura_no?: string
          fatura_tarihi?: string
          id?: string
          indirim_tutari?: number
          kdv_tutari?: number
          notlar?: string | null
          odeme_durumu?: string
          odeme_sekli?: string | null
          odenen_tutar?: number
          order_id?: string | null
          para_birimi?: string
          pdf_url?: string | null
          toplam_tutar?: number
          updated_at?: string
          vade_tarihi?: string | null
          xml_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoices_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_tracking: {
        Row: {
          actual_amount: number
          company_id: string | null
          created_at: string | null
          id: string
          month: number
          notes: string | null
          product_name: string
          sales_channel: string
          target_amount: number
          unit_price: number | null
          units_sold: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          actual_amount?: number
          company_id?: string | null
          created_at?: string | null
          id?: string
          month: number
          notes?: string | null
          product_name: string
          sales_channel: string
          target_amount?: number
          unit_price?: number | null
          units_sold?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          actual_amount?: number
          company_id?: string | null
          created_at?: string | null
          id?: string
          month?: number
          notes?: string | null
          product_name?: string
          sales_channel?: string
          target_amount?: number
          unit_price?: number | null
          units_sold?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      service_activities: {
        Row: {
          activity_type: string
          company_id: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          id: string
          labor_hours: number | null
          location: string | null
          materials_used: Json | null
          performed_by: string | null
          service_request_id: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["service_status"] | null
          updated_at: string | null
        }
        Insert: {
          activity_type: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          labor_hours?: number | null
          location?: string | null
          materials_used?: Json | null
          performed_by?: string | null
          service_request_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["service_status"] | null
          updated_at?: string | null
        }
        Update: {
          activity_type?: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          labor_hours?: number | null
          location?: string | null
          materials_used?: Json | null
          performed_by?: string | null
          service_request_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["service_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_activities_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          company_id: string | null
          created_at: string | null
          customer_id: string | null
          description: string | null
          due_date: string | null
          equipment_id: string | null
          id: string
          location: string | null
          notes: string[] | null
          priority: Database["public"]["Enums"]["service_priority"] | null
          service_type: string | null
          status: Database["public"]["Enums"]["service_status"] | null
          title: string
          updated_at: string | null
          warranty_info: Json | null
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          company_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          equipment_id?: string | null
          id?: string
          location?: string | null
          notes?: string[] | null
          priority?: Database["public"]["Enums"]["service_priority"] | null
          service_type?: string | null
          status?: Database["public"]["Enums"]["service_status"] | null
          title: string
          updated_at?: string | null
          warranty_info?: Json | null
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          company_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          equipment_id?: string | null
          id?: string
          location?: string | null
          notes?: string[] | null
          priority?: Database["public"]["Enums"]["service_priority"] | null
          service_type?: string | null
          status?: Database["public"]["Enums"]["service_status"] | null
          title?: string
          updated_at?: string | null
          warranty_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      suppliers: {
        Row: {
          address: string | null
          balance: number
          company: string | null
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          current_organization_id: string | null
          id: string
          language: string | null
          notifications: Json | null
          theme: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_organization_id?: string | null
          id?: string
          language?: string | null
          notifications?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_organization_id?: string | null
          id?: string
          language?: string | null
          notifications?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_projects: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          company_id: string | null
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          last_activity: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          last_activity?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_activity?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      veriban_incoming_invoices: {
        Row: {
          allowance_total_amount: number | null
          answer_note: string | null
          answer_type: string | null
          company_id: string | null
          created_at: string | null
          currency_code: string | null
          customer_register_number: string | null
          customer_title: string | null
          exchange_rate: number | null
          id: number
          invoice_number: string
          invoice_profile: string | null
          invoice_type: string | null
          invoice_uuid: string
          is_answered: boolean | null
          is_read: boolean | null
          is_transferred: boolean | null
          issue_time: string | null
          line_extension_amount: number | null
          payable_amount: number | null
          processed_at: string | null
          raw_xml_content: string | null
          tax_exclusive_amount: number | null
          tax_total_amount: number | null
          updated_at: string | null
          veriban_response_data: Json | null
        }
        Insert: {
          allowance_total_amount?: number | null
          answer_note?: string | null
          answer_type?: string | null
          company_id?: string | null
          created_at?: string | null
          currency_code?: string | null
          customer_register_number?: string | null
          customer_title?: string | null
          exchange_rate?: number | null
          id?: number
          invoice_number: string
          invoice_profile?: string | null
          invoice_type?: string | null
          invoice_uuid: string
          is_answered?: boolean | null
          is_read?: boolean | null
          is_transferred?: boolean | null
          issue_time?: string | null
          line_extension_amount?: number | null
          payable_amount?: number | null
          processed_at?: string | null
          raw_xml_content?: string | null
          tax_exclusive_amount?: number | null
          tax_total_amount?: number | null
          updated_at?: string | null
          veriban_response_data?: Json | null
        }
        Update: {
          allowance_total_amount?: number | null
          answer_note?: string | null
          answer_type?: string | null
          company_id?: string | null
          created_at?: string | null
          currency_code?: string | null
          customer_register_number?: string | null
          customer_title?: string | null
          exchange_rate?: number | null
          id?: number
          invoice_number?: string
          invoice_profile?: string | null
          invoice_type?: string | null
          invoice_uuid?: string
          is_answered?: boolean | null
          is_read?: boolean | null
          is_transferred?: boolean | null
          issue_time?: string | null
          line_extension_amount?: number | null
          payable_amount?: number | null
          processed_at?: string | null
          raw_xml_content?: string | null
          tax_exclusive_amount?: number | null
          tax_total_amount?: number | null
          updated_at?: string | null
          veriban_response_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "veriban_incoming_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      veriban_invoice_line_items: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: number
          invoice_id: number | null
          item_description: string | null
          item_name: string | null
          line_number: number | null
          line_total: number | null
          quantity: number | null
          tax_amount: number | null
          tax_rate: number | null
          unit_code: string | null
          unit_price: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: number
          invoice_id?: number | null
          item_description?: string | null
          item_name?: string | null
          line_number?: number | null
          line_total?: number | null
          quantity?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          unit_code?: string | null
          unit_price?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: number
          invoice_id?: number | null
          item_description?: string | null
          item_name?: string | null
          line_number?: number | null
          line_total?: number | null
          quantity?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          unit_code?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "veriban_invoice_line_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veriban_invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "veriban_incoming_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      veriban_operation_logs: {
        Row: {
          company_id: string | null
          created_at: string | null
          error_message: string | null
          id: number
          ip_address: unknown | null
          is_successful: boolean | null
          operation_type: string
          request_data: Json | null
          response_data: Json | null
          response_time_ms: number | null
          session_code: string | null
          user_agent: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: number
          ip_address?: unknown | null
          is_successful?: boolean | null
          operation_type: string
          request_data?: Json | null
          response_data?: Json | null
          response_time_ms?: number | null
          session_code?: string | null
          user_agent?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: number
          ip_address?: unknown | null
          is_successful?: boolean | null
          operation_type?: string
          request_data?: Json | null
          response_data?: Json | null
          response_time_ms?: number | null
          session_code?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "veriban_operation_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      veriban_settings: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          mode: string
          password: string
          updated_at: string | null
          username: string
          vkn: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mode?: string
          password: string
          updated_at?: string | null
          username: string
          vkn: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mode?: string
          password?: string
          updated_at?: string | null
          username?: string
          vkn?: string
        }
        Relationships: [
          {
            foreignKeyName: "veriban_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      proposal_stock_view: {
        Row: {
          customer_name: string | null
          items: Json | null
          proposal_currency: string | null
          proposal_number: string | null
          proposal_status: string | null
          proposal_title: string | null
          proposal_total: number | null
          valid_until: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_role: {
        Args: {
          new_role: Database["public"]["Enums"]["user_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      assign_user_role: {
        Args: {
          new_role: string
          target_company_id?: string
          target_user_id: string
        }
        Returns: boolean
      }
      base64_decode_with_padding: {
        Args: { data: string }
        Returns: string
      }
      base64_encode_no_padding: {
        Args: { data: string }
        Returns: string
      }
      check_stock_status: {
        Args: { current_quantity: number; threshold: number }
        Returns: string
      }
      clean_expired_email_confirmations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clean_token: {
        Args: { token: string }
        Returns: string
      }
      create_simple_jwt_token: {
        Args: { project_id: string; user_email: string; user_id: string }
        Returns: string
      }
      current_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      decode_simple_jwt_token: {
        Args: { token: string }
        Returns: Json
      }
      generate_jwt_token: {
        Args: {
          project_id: string
          user_email: string
          user_id: string
          user_role?: string
        }
        Returns: string
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_deal_counts_by_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
          status: string
        }[]
      }
      get_jwt_secret: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_proposal_counts_by_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
          status: string
        }[]
      }
      get_user_role_in_company: {
        Args: { target_company_id?: string; target_user_id: string }
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_role: {
        Args:
          | { required_role: Database["public"]["Enums"]["user_role"] }
          | { required_role: string }
        Returns: boolean
      }
      record_audit_log: {
        Args: {
          action: string
          changes: Json
          entity_id: string
          entity_type: string
        }
        Returns: undefined
      }
      request_password_reset: {
        Args: { email: string }
        Returns: undefined
      }
      set_config: {
        Args: { key: string; value: string }
        Returns: undefined
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      setup_exchange_rate_cron: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      test_rls_with_user: {
        Args: { test_user_id: string }
        Returns: {
          auth_user_id: string
          current_project_result: string
          opportunity_count: number
          user_project_id: string
        }[]
      }
      update_order_totals: {
        Args: { order_uuid: string }
        Returns: undefined
      }
      user_has_role_or_higher: {
        Args: { required_role: string; target_company_id?: string }
        Returns: boolean
      }
      validate_jwt_token: {
        Args: { token: string }
        Returns: Json
      }
    }
    Enums: {
      account_type: "vadesiz" | "vadeli" | "kredi" | "pos"
      card_status: "active" | "blocked" | "expired" | "cancelled"
      card_type: "credit" | "debit" | "corporate"
      currency_type: "TRY" | "USD" | "EUR" | "GBP"
      customer_status: "aktif" | "pasif" | "potansiyel"
      customer_type: "bireysel" | "kurumsal"
      deal_priority: "low" | "medium" | "high"
      deal_status: "new" | "negotiation" | "follow_up" | "won" | "lost"
      employee_status: "aktif" | "pasif"
      event_type: "technical" | "sales"
      financial_instrument_status: "pending" | "cleared" | "bounced"
      financial_instrument_type: "check" | "promissory_note"
      gender_type: "male" | "female" | "other"
      invoice_status:
        | "pending"
        | "paid"
        | "partially_paid"
        | "overdue"
        | "cancelled"
      marital_status_type: "single" | "married" | "divorced" | "widowed"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "completed"
        | "cancelled"
      payment_direction: "incoming" | "outgoing"
      payment_status: "pending" | "completed" | "failed"
      payment_type: "havale" | "eft" | "kredi_karti" | "nakit"
      proposal_status:
        | "draft"
        | "sent"
        | "accepted"
        | "rejected"
        | "expired"
        | "review"
        | "negotiation"
      purchase_order_status:
        | "draft"
        | "sent"
        | "confirmed"
        | "received"
        | "partially_received"
        | "cancelled"
      purchase_request_status:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "converted"
      sales_event_category: "proposal_deadline" | "sales_meeting" | "follow_up"
      service_priority: "low" | "medium" | "high" | "urgent"
      service_status:
        | "new"
        | "assigned"
        | "in_progress"
        | "on_hold"
        | "completed"
        | "cancelled"
      supplier_status: "aktif" | "pasif" | "potansiyel"
      supplier_type: "bireysel" | "kurumsal"
      task_priority: "low" | "medium" | "high"
      task_status: "todo" | "in_progress" | "completed" | "postponed"
      task_type: "opportunity" | "proposal" | "general"
      technical_event_category:
        | "installation"
        | "maintenance"
        | "service_call"
        | "support_ticket"
      transaction_type: "giris" | "cikis" | "havale" | "eft" | "swift" | "pos"
      user_role: "admin" | "sales" | "manager" | "viewer" | "owner" | "member"
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
      account_type: ["vadesiz", "vadeli", "kredi", "pos"],
      card_status: ["active", "blocked", "expired", "cancelled"],
      card_type: ["credit", "debit", "corporate"],
      currency_type: ["TRY", "USD", "EUR", "GBP"],
      customer_status: ["aktif", "pasif", "potansiyel"],
      customer_type: ["bireysel", "kurumsal"],
      deal_priority: ["low", "medium", "high"],
      deal_status: ["new", "negotiation", "follow_up", "won", "lost"],
      employee_status: ["aktif", "pasif"],
      event_type: ["technical", "sales"],
      financial_instrument_status: ["pending", "cleared", "bounced"],
      financial_instrument_type: ["check", "promissory_note"],
      gender_type: ["male", "female", "other"],
      invoice_status: [
        "pending",
        "paid",
        "partially_paid",
        "overdue",
        "cancelled",
      ],
      marital_status_type: ["single", "married", "divorced", "widowed"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "completed",
        "cancelled",
      ],
      payment_direction: ["incoming", "outgoing"],
      payment_status: ["pending", "completed", "failed"],
      payment_type: ["havale", "eft", "kredi_karti", "nakit"],
      proposal_status: [
        "draft",
        "sent",
        "accepted",
        "rejected",
        "expired",
        "review",
        "negotiation",
      ],
      purchase_order_status: [
        "draft",
        "sent",
        "confirmed",
        "received",
        "partially_received",
        "cancelled",
      ],
      purchase_request_status: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "converted",
      ],
      sales_event_category: ["proposal_deadline", "sales_meeting", "follow_up"],
      service_priority: ["low", "medium", "high", "urgent"],
      service_status: [
        "new",
        "assigned",
        "in_progress",
        "on_hold",
        "completed",
        "cancelled",
      ],
      supplier_status: ["aktif", "pasif", "potansiyel"],
      supplier_type: ["bireysel", "kurumsal"],
      task_priority: ["low", "medium", "high"],
      task_status: ["todo", "in_progress", "completed", "postponed"],
      task_type: ["opportunity", "proposal", "general"],
      technical_event_category: [
        "installation",
        "maintenance",
        "service_call",
        "support_ticket",
      ],
      transaction_type: ["giris", "cikis", "havale", "eft", "swift", "pos"],
      user_role: ["admin", "sales", "manager", "viewer", "owner", "member"],
    },
  },
} as const
