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
      account_transfers: {
        Row: {
          amount: number
          company_id: string | null
          created_at: string | null
          currency: string
          description: string | null
          from_account_id: string
          from_account_type: string
          id: string
          to_account_id: string
          to_account_type: string
          transfer_date: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          company_id?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          from_account_id: string
          from_account_type: string
          id?: string
          to_account_id: string
          to_account_type: string
          transfer_date?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          from_account_id?: string
          from_account_type?: string
          id?: string
          to_account_id?: string
          to_account_type?: string
          transfer_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_transfers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_number: string | null
          account_type: string
          available_balance: number | null
          available_limit: number | null
          bank_name: string | null
          branch_name: string | null
          card_number: string | null
          card_type: string | null
          company_id: string
          created_at: string | null
          credit_limit: number | null
          currency: string | null
          current_balance: number | null
          description: string | null
          end_date: string | null
          expiry_date: string | null
          iban: string | null
          id: string
          initial_capital: number | null
          interest_rate: number | null
          investment_date: string | null
          is_active: boolean | null
          last_payment_date: string | null
          last_transaction_date: string | null
          location: string | null
          minimum_payment: number | null
          name: string
          notes: string | null
          ownership_percentage: number | null
          partner_type: string | null
          payment_due_date: string | null
          profit_share: number | null
          responsible_person: string | null
          start_date: string | null
          status: string | null
          swift_code: string | null
          updated_at: string | null
        }
        Insert: {
          account_number?: string | null
          account_type: string
          available_balance?: number | null
          available_limit?: number | null
          bank_name?: string | null
          branch_name?: string | null
          card_number?: string | null
          card_type?: string | null
          company_id: string
          created_at?: string | null
          credit_limit?: number | null
          currency?: string | null
          current_balance?: number | null
          description?: string | null
          end_date?: string | null
          expiry_date?: string | null
          iban?: string | null
          id?: string
          initial_capital?: number | null
          interest_rate?: number | null
          investment_date?: string | null
          is_active?: boolean | null
          last_payment_date?: string | null
          last_transaction_date?: string | null
          location?: string | null
          minimum_payment?: number | null
          name: string
          notes?: string | null
          ownership_percentage?: number | null
          partner_type?: string | null
          payment_due_date?: string | null
          profit_share?: number | null
          responsible_person?: string | null
          start_date?: string | null
          status?: string | null
          swift_code?: string | null
          updated_at?: string | null
        }
        Update: {
          account_number?: string | null
          account_type?: string
          available_balance?: number | null
          available_limit?: number | null
          bank_name?: string | null
          branch_name?: string | null
          card_number?: string | null
          card_type?: string | null
          company_id?: string
          created_at?: string | null
          credit_limit?: number | null
          currency?: string | null
          current_balance?: number | null
          description?: string | null
          end_date?: string | null
          expiry_date?: string | null
          iban?: string | null
          id?: string
          initial_capital?: number | null
          interest_rate?: number | null
          investment_date?: string | null
          is_active?: boolean | null
          last_payment_date?: string | null
          last_transaction_date?: string | null
          location?: string | null
          minimum_payment?: number | null
          name?: string
          notes?: string | null
          ownership_percentage?: number | null
          partner_type?: string | null
          payment_due_date?: string | null
          profit_share?: number | null
          responsible_person?: string | null
          start_date?: string | null
          status?: string | null
          swift_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          assignee_id: string | null
          company_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_recurring: boolean | null
          is_recurring_instance: boolean | null
          opportunity_id: string | null
          order_rank: string | null
          parent_task_id: string | null
          priority: string
          recurrence_day_of_month: number | null
          recurrence_days: string[] | null
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_type: string | null
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
          is_recurring?: boolean | null
          is_recurring_instance?: boolean | null
          opportunity_id?: string | null
          order_rank?: string | null
          parent_task_id?: string | null
          priority?: string
          recurrence_day_of_month?: number | null
          recurrence_days?: string[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
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
          is_recurring?: boolean | null
          is_recurring_instance?: boolean | null
          opportunity_id?: string | null
          order_rank?: string | null
          parent_task_id?: string | null
          priority?: string
          recurrence_day_of_month?: number | null
          recurrence_days?: string[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
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
            foreignKeyName: "activities_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "v_tasks"
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
      ai_insights: {
        Row: {
          company_id: string
          created_at: string | null
          data_summary: Json | null
          id: string
          insight_text: string
          insight_type: string
          period_end: string
          period_start: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          data_summary?: Json | null
          id?: string
          insight_text: string
          insight_type: string
          period_end: string
          period_start: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          data_summary?: Json | null
          id?: string
          insight_text?: string
          insight_type?: string
          period_end?: string
          period_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          approver_id: string | null
          comment: string | null
          company_id: string | null
          created_at: string | null
          decided_at: string | null
          id: string
          object_id: string
          object_type: string
          status: string | null
          step: number | null
          updated_at: string | null
        }
        Insert: {
          approver_id?: string | null
          comment?: string | null
          company_id?: string | null
          created_at?: string | null
          decided_at?: string | null
          id?: string
          object_id: string
          object_type: string
          status?: string | null
          step?: number | null
          updated_at?: string | null
        }
        Update: {
          approver_id?: string | null
          comment?: string | null
          company_id?: string | null
          created_at?: string | null
          decided_at?: string | null
          id?: string
          object_id?: string
          object_type?: string
          status?: string | null
          step?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      banks: {
        Row: {
          bank_code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          short_name: string | null
          swift_code: string | null
          updated_at: string
        }
        Insert: {
          bank_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          short_name?: string | null
          swift_code?: string | null
          updated_at?: string
        }
        Update: {
          bank_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          short_name?: string | null
          swift_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bom_items: {
        Row: {
          bom_id: string
          created_at: string
          id: string
          item_name: string
          quantity: number
          unit: string
        }
        Insert: {
          bom_id: string
          created_at?: string
          id?: string
          item_name: string
          quantity: number
          unit: string
        }
        Update: {
          bom_id?: string
          created_at?: string
          id?: string
          item_name?: string
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_items_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "boms"
            referencedColumns: ["id"]
          },
        ]
      }
      boms: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          product_id: string | null
          product_name: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          product_id?: string | null
          product_name?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          product_id?: string | null
          product_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boms_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_warehouse_stocks"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "boms_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_categories: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_auto_populated: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
          type: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_auto_populated?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          type?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_auto_populated?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          actual_amount: number
          budget_amount: number
          category: string
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          department_id: string | null
          forecast_amount: number | null
          id: string
          month: number
          notes: string | null
          project_id: string | null
          status: string
          subcategory: string | null
          updated_at: string
          year: number
        }
        Insert: {
          actual_amount?: number
          budget_amount?: number
          category: string
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          department_id?: string | null
          forecast_amount?: number | null
          id?: string
          month: number
          notes?: string | null
          project_id?: string | null
          status?: string
          subcategory?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          actual_amount?: number
          budget_amount?: number
          category?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          department_id?: string | null
          forecast_amount?: number | null
          id?: string
          month?: number
          notes?: string | null
          project_id?: string | null
          status?: string
          subcategory?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
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
          transaction_type: string | null
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
          transaction_type?: string | null
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
          transaction_type?: string | null
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
      cash_accounts: {
        Row: {
          company_id: string | null
          created_at: string | null
          currency: string | null
          current_balance: number | null
          description: string | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          responsible_person: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          responsible_person?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          responsible_person?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_accounts_company_id_fkey"
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
      cash_transactions: {
        Row: {
          account_id: string
          amount: number
          category: string | null
          company_id: string | null
          created_at: string | null
          description: string
          id: string
          reference: string | null
          transaction_date: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          account_id: string
          amount: number
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          reference?: string | null
          transaction_date?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          reference?: string | null
          transaction_date?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cash_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_company_id_fkey"
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
          is_default: boolean | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
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
      cashflow_subcategories: {
        Row: {
          category_id: string
          company_id: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cashflow_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      checks: {
        Row: {
          amount: number
          bank: string
          check_number: string
          check_type: string | null
          company_id: string | null
          created_at: string
          due_date: string
          id: string
          issue_date: string
          issuer_customer_id: string | null
          issuer_name: string | null
          issuer_supplier_id: string | null
          notes: string | null
          payee: string
          payee_customer_id: string | null
          payee_supplier_id: string | null
          portfolio_status: string | null
          status: string
          transferred_date: string | null
          transferred_to_supplier_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          bank: string
          check_number: string
          check_type?: string | null
          company_id?: string | null
          created_at?: string
          due_date: string
          id?: string
          issue_date: string
          issuer_customer_id?: string | null
          issuer_name?: string | null
          issuer_supplier_id?: string | null
          notes?: string | null
          payee: string
          payee_customer_id?: string | null
          payee_supplier_id?: string | null
          portfolio_status?: string | null
          status?: string
          transferred_date?: string | null
          transferred_to_supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank?: string
          check_number?: string
          check_type?: string | null
          company_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          issue_date?: string
          issuer_customer_id?: string | null
          issuer_name?: string | null
          issuer_supplier_id?: string | null
          notes?: string | null
          payee?: string
          payee_customer_id?: string | null
          payee_supplier_id?: string | null
          portfolio_status?: string | null
          status?: string
          transferred_date?: string | null
          transferred_to_supplier_id?: string | null
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
          {
            foreignKeyName: "checks_issuer_customer_id_fkey"
            columns: ["issuer_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_issuer_supplier_id_fkey"
            columns: ["issuer_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_payee_customer_id_fkey"
            columns: ["payee_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_payee_supplier_id_fkey"
            columns: ["payee_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_transferred_to_supplier_id_fkey"
            columns: ["transferred_to_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          account_number: string | null
          address: string | null
          apartment_number: string | null
          bank_name: string | null
          city: string | null
          country: string | null
          created_at: string
          default_currency: string | null
          district: string | null
          domain: string | null
          einvoice_alias_name: string | null
          email: string | null
          email_settings: Json | null
          establishment_date: string | null
          iban: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          mersis_number: string | null
          name: string
          phone: string | null
          postal_code: string | null
          sector: string | null
          tax_number: string | null
          tax_office: string | null
          trade_registry_number: string | null
          unit_number: string | null
          updated_at: string
          updated_by: string | null
          website: string | null
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          apartment_number?: string | null
          bank_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          default_currency?: string | null
          district?: string | null
          domain?: string | null
          einvoice_alias_name?: string | null
          email?: string | null
          email_settings?: Json | null
          establishment_date?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          mersis_number?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          sector?: string | null
          tax_number?: string | null
          tax_office?: string | null
          trade_registry_number?: string | null
          unit_number?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          account_number?: string | null
          address?: string | null
          apartment_number?: string | null
          bank_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          default_currency?: string | null
          district?: string | null
          domain?: string | null
          einvoice_alias_name?: string | null
          email?: string | null
          email_settings?: Json | null
          establishment_date?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          mersis_number?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          sector?: string | null
          tax_number?: string | null
          tax_office?: string | null
          trade_registry_number?: string | null
          unit_number?: string | null
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
          bank_name: string | null
          card_name: string
          card_number: string | null
          card_type: Database["public"]["Enums"]["card_type"]
          company_id: string | null
          created_at: string | null
          credit_limit: number | null
          currency: string | null
          current_balance: number | null
          expiry_date: string
          id: string
          is_active: boolean | null
          last_payment_date: string | null
          minimum_payment: number | null
          notes: string | null
          payment_due_date: string | null
          status: Database["public"]["Enums"]["card_status"] | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          available_limit?: number | null
          bank_name?: string | null
          card_name: string
          card_number?: string | null
          card_type: Database["public"]["Enums"]["card_type"]
          company_id?: string | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: string | null
          current_balance?: number | null
          expiry_date: string
          id?: string
          is_active?: boolean | null
          last_payment_date?: string | null
          minimum_payment?: number | null
          notes?: string | null
          payment_due_date?: string | null
          status?: Database["public"]["Enums"]["card_status"] | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          available_limit?: number | null
          bank_name?: string | null
          card_name?: string
          card_number?: string | null
          card_type?: Database["public"]["Enums"]["card_type"]
          company_id?: string | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: string | null
          current_balance?: number | null
          expiry_date?: string
          id?: string
          is_active?: boolean | null
          last_payment_date?: string | null
          minimum_payment?: number | null
          notes?: string | null
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
      custom_account_types: {
        Row: {
          color: string | null
          company_id: string
          created_at: string | null
          display_name: string
          icon: string | null
          id: string
          type_name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string | null
          display_name: string
          icon?: string | null
          id?: string
          type_name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          type_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_account_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_terms: {
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
            foreignKeyName: "custom_terms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          account_number: string | null
          address: string | null
          apartment_number: string | null
          balance: number
          bank_name: string | null
          city: string | null
          city_id: number | null
          company: string | null
          company_id: string | null
          country: string | null
          created_at: string | null
          customer_segment: string | null
          customer_source: string | null
          district: string | null
          district_id: number | null
          einvoice_address: string | null
          einvoice_alias_name: string | null
          einvoice_checked_at: string | null
          einvoice_city: string | null
          einvoice_company_name: string | null
          einvoice_district: string | null
          einvoice_mersis_no: string | null
          einvoice_sicil_no: string | null
          einvoice_tax_office: string | null
          email: string | null
          establishment_date: string | null
          fax: string | null
          first_contact_position: string | null
          iban: string | null
          id: string
          is_active: boolean | null
          is_einvoice_mukellef: boolean | null
          last_interaction: string | null
          mersis_number: string | null
          mobile_phone: string | null
          name: string
          neighborhood_id: number | null
          notes: string | null
          office_phone: string | null
          payment_terms: string | null
          postal_code: string | null
          representative: string | null
          second_address: string | null
          second_city: string | null
          second_city_id: number | null
          second_contact_email: string | null
          second_contact_name: string | null
          second_contact_phone: string | null
          second_contact_position: string | null
          second_country: string | null
          second_district: string | null
          second_district_id: number | null
          second_postal_code: string | null
          sector: string | null
          status: Database["public"]["Enums"]["customer_status"]
          tax_number: string | null
          tax_office: string | null
          trade_registry_number: string | null
          type: Database["public"]["Enums"]["customer_type"]
          unit_number: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          apartment_number?: string | null
          balance?: number
          bank_name?: string | null
          city?: string | null
          city_id?: number | null
          company?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          customer_segment?: string | null
          customer_source?: string | null
          district?: string | null
          district_id?: number | null
          einvoice_address?: string | null
          einvoice_alias_name?: string | null
          einvoice_checked_at?: string | null
          einvoice_city?: string | null
          einvoice_company_name?: string | null
          einvoice_district?: string | null
          einvoice_mersis_no?: string | null
          einvoice_sicil_no?: string | null
          einvoice_tax_office?: string | null
          email?: string | null
          establishment_date?: string | null
          fax?: string | null
          first_contact_position?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean | null
          is_einvoice_mukellef?: boolean | null
          last_interaction?: string | null
          mersis_number?: string | null
          mobile_phone?: string | null
          name: string
          neighborhood_id?: number | null
          notes?: string | null
          office_phone?: string | null
          payment_terms?: string | null
          postal_code?: string | null
          representative?: string | null
          second_address?: string | null
          second_city?: string | null
          second_city_id?: number | null
          second_contact_email?: string | null
          second_contact_name?: string | null
          second_contact_phone?: string | null
          second_contact_position?: string | null
          second_country?: string | null
          second_district?: string | null
          second_district_id?: number | null
          second_postal_code?: string | null
          sector?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          tax_number?: string | null
          tax_office?: string | null
          trade_registry_number?: string | null
          type: Database["public"]["Enums"]["customer_type"]
          unit_number?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          account_number?: string | null
          address?: string | null
          apartment_number?: string | null
          balance?: number
          bank_name?: string | null
          city?: string | null
          city_id?: number | null
          company?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          customer_segment?: string | null
          customer_source?: string | null
          district?: string | null
          district_id?: number | null
          einvoice_address?: string | null
          einvoice_alias_name?: string | null
          einvoice_checked_at?: string | null
          einvoice_city?: string | null
          einvoice_company_name?: string | null
          einvoice_district?: string | null
          einvoice_mersis_no?: string | null
          einvoice_sicil_no?: string | null
          einvoice_tax_office?: string | null
          email?: string | null
          establishment_date?: string | null
          fax?: string | null
          first_contact_position?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean | null
          is_einvoice_mukellef?: boolean | null
          last_interaction?: string | null
          mersis_number?: string | null
          mobile_phone?: string | null
          name?: string
          neighborhood_id?: number | null
          notes?: string | null
          office_phone?: string | null
          payment_terms?: string | null
          postal_code?: string | null
          representative?: string | null
          second_address?: string | null
          second_city?: string | null
          second_city_id?: number | null
          second_contact_email?: string | null
          second_contact_name?: string | null
          second_contact_phone?: string | null
          second_contact_position?: string | null
          second_country?: string | null
          second_district?: string | null
          second_district_id?: number | null
          second_postal_code?: string | null
          sector?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          tax_number?: string | null
          tax_office?: string | null
          trade_registry_number?: string | null
          type?: Database["public"]["Enums"]["customer_type"]
          unit_number?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "turkey_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "turkey_districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "turkey_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_second_city_id_fkey"
            columns: ["second_city_id"]
            isOneToOne: false
            referencedRelation: "turkey_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_second_district_id_fkey"
            columns: ["second_district_id"]
            isOneToOne: false
            referencedRelation: "turkey_districts"
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
      deliveries: {
        Row: {
          actual_delivery_date: string | null
          carrier_name: string | null
          company_id: string
          created_at: string
          created_by: string | null
          customer_id: string
          delivered_by: string | null
          delivery_address: string | null
          delivery_contact_name: string | null
          delivery_contact_phone: string | null
          delivery_number: string
          employee_id: string | null
          id: string
          notes: string | null
          order_id: string | null
          planned_delivery_date: string | null
          sales_invoice_id: string | null
          shipping_method: string | null
          status: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          actual_delivery_date?: string | null
          carrier_name?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          delivered_by?: string | null
          delivery_address?: string | null
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          delivery_number: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          planned_delivery_date?: string | null
          sales_invoice_id?: string | null
          shipping_method?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          actual_delivery_date?: string | null
          carrier_name?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          delivered_by?: string | null
          delivery_address?: string | null
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          delivery_number?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          planned_delivery_date?: string | null
          sales_invoice_id?: string | null
          shipping_method?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_delivered_by_fkey"
            columns: ["delivered_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_sales_invoice_id_fkey"
            columns: ["sales_invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_items: {
        Row: {
          created_at: string
          delivery_id: string
          id: string
          notes: string | null
          order_item_id: string | null
          product_id: string | null
          product_name: string
          quantity: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_id: string
          id?: string
          notes?: string | null
          order_item_id?: string | null
          product_id?: string | null
          product_name: string
          quantity: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_id?: string
          id?: string
          notes?: string | null
          order_item_id?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_items_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_warehouse_stocks"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "delivery_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          is_active: boolean | null
          is_default: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          sort_order?: number | null
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
          notes: string | null
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
          notes?: string | null
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
          notes?: string | null
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
            referencedRelation: "product_warehouse_stocks"
            referencedColumns: ["product_id"]
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
      e_invoice_drafts: {
        Row: {
          company_id: string | null
          created_at: string | null
          currency_code: string | null
          customer_alias: string | null
          customer_name: string
          customer_vkn: string
          id: string
          invoice_profile: string | null
          invoice_type: string | null
          sales_invoice_id: string | null
          status: string | null
          subtotal: number | null
          tax_total: number | null
          total_amount: number | null
          updated_at: string | null
          xml_content: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          currency_code?: string | null
          customer_alias?: string | null
          customer_name: string
          customer_vkn: string
          id?: string
          invoice_profile?: string | null
          invoice_type?: string | null
          sales_invoice_id?: string | null
          status?: string | null
          subtotal?: number | null
          tax_total?: number | null
          total_amount?: number | null
          updated_at?: string | null
          xml_content?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          currency_code?: string | null
          customer_alias?: string | null
          customer_name?: string
          customer_vkn?: string
          id?: string
          invoice_profile?: string | null
          invoice_type?: string | null
          sales_invoice_id?: string | null
          status?: string | null
          subtotal?: number | null
          tax_total?: number | null
          total_amount?: number | null
          updated_at?: string | null
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "e_invoice_drafts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "e_invoice_drafts_sales_invoice_id_fkey"
            columns: ["sales_invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      e_invoice_settings: {
        Row: {
          auto_send_enabled: boolean | null
          company_id: string | null
          created_at: string | null
          default_delivery_terms: string | null
          default_invoice_profile: string | null
          default_payment_terms: string | null
          email_notifications: boolean | null
          id: string
          sms_notifications: boolean | null
          updated_at: string | null
          whatsapp_notifications: boolean | null
        }
        Insert: {
          auto_send_enabled?: boolean | null
          company_id?: string | null
          created_at?: string | null
          default_delivery_terms?: string | null
          default_invoice_profile?: string | null
          default_payment_terms?: string | null
          email_notifications?: boolean | null
          id?: string
          sms_notifications?: boolean | null
          updated_at?: string | null
          whatsapp_notifications?: boolean | null
        }
        Update: {
          auto_send_enabled?: boolean | null
          company_id?: string | null
          created_at?: string | null
          default_delivery_terms?: string | null
          default_invoice_profile?: string | null
          default_payment_terms?: string | null
          email_notifications?: boolean | null
          id?: string
          sms_notifications?: boolean | null
          updated_at?: string | null
          whatsapp_notifications?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "e_invoice_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
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
      elogo_auth: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          password: string
          test_mode: boolean | null
          updated_at: string | null
          user_id: string | null
          username: string
          webservice_url: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          password: string
          test_mode?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          username: string
          webservice_url?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          password?: string
          test_mode?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          username?: string
          webservice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elogo_auth_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
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
          name: string | null
          size: number | null
          type: string | null
          updated_at: string | null
          upload_date: string | null
          uploaded_at: string | null
          url: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          document_type: string
          employee_id?: string | null
          file_name: string
          file_url: string
          id?: string
          name?: string | null
          size?: number | null
          type?: string | null
          updated_at?: string | null
          upload_date?: string | null
          uploaded_at?: string | null
          url?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          document_type?: string
          employee_id?: string | null
          file_name?: string
          file_url?: string
          id?: string
          name?: string | null
          size?: number | null
          type?: string | null
          updated_at?: string | null
          upload_date?: string | null
          uploaded_at?: string | null
          url?: string | null
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
      employees: {
        Row: {
          accident_insurance_rate: number | null
          address: string | null
          address_line: string | null
          allowances: Json | null
          apartment_number: string | null
          avatar_url: string | null
          balance: number | null
          bonus_provision: number | null
          calculate_as_minimum_wage: boolean | null
          city: string | null
          city_id: number | null
          company_id: string | null
          country: string | null
          created_at: string | null
          cumulative_yearly_gross: number | null
          cumulative_yearly_tax: number | null
          date_of_birth: string | null
          department: string
          district: string | null
          district_id: number | null
          effective_date: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          gross_salary: number | null
          hire_date: string
          id: string
          id_ssn: string | null
          income_tax_amount: number | null
          is_technical: boolean | null
          last_name: string
          manual_employer_sgk_cost: number | null
          marital_status:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          meal_allowance: number | null
          neighborhood: string | null
          neighborhood_id: number | null
          net_salary: number | null
          payment_frequency: string | null
          phone: string | null
          position: string
          postal_code: string | null
          salary_amount: number | null
          salary_currency: string | null
          salary_input_type: string | null
          salary_notes: string | null
          salary_start_date: string | null
          salary_type: string | null
          severance_provision: number | null
          sgk_employee_amount: number | null
          sgk_employee_rate: number | null
          sgk_employer_amount: number | null
          sgk_employer_rate: number | null
          stamp_tax: number | null
          stamp_tax_amount: number | null
          stamp_tax_rate: number | null
          status: Database["public"]["Enums"]["employee_status"]
          tax_year: number | null
          total_deductions: number | null
          total_employer_cost: number | null
          transport_allowance: number | null
          unemployment_employee_amount: number | null
          unemployment_employee_rate: number | null
          unemployment_employer_rate: number | null
          unit_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accident_insurance_rate?: number | null
          address?: string | null
          address_line?: string | null
          allowances?: Json | null
          apartment_number?: string | null
          avatar_url?: string | null
          balance?: number | null
          bonus_provision?: number | null
          calculate_as_minimum_wage?: boolean | null
          city?: string | null
          city_id?: number | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          cumulative_yearly_gross?: number | null
          cumulative_yearly_tax?: number | null
          date_of_birth?: string | null
          department: string
          district?: string | null
          district_id?: number | null
          effective_date?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          first_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          gross_salary?: number | null
          hire_date: string
          id?: string
          id_ssn?: string | null
          income_tax_amount?: number | null
          is_technical?: boolean | null
          last_name: string
          manual_employer_sgk_cost?: number | null
          marital_status?:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          meal_allowance?: number | null
          neighborhood?: string | null
          neighborhood_id?: number | null
          net_salary?: number | null
          payment_frequency?: string | null
          phone?: string | null
          position: string
          postal_code?: string | null
          salary_amount?: number | null
          salary_currency?: string | null
          salary_input_type?: string | null
          salary_notes?: string | null
          salary_start_date?: string | null
          salary_type?: string | null
          severance_provision?: number | null
          sgk_employee_amount?: number | null
          sgk_employee_rate?: number | null
          sgk_employer_amount?: number | null
          sgk_employer_rate?: number | null
          stamp_tax?: number | null
          stamp_tax_amount?: number | null
          stamp_tax_rate?: number | null
          status?: Database["public"]["Enums"]["employee_status"]
          tax_year?: number | null
          total_deductions?: number | null
          total_employer_cost?: number | null
          transport_allowance?: number | null
          unemployment_employee_amount?: number | null
          unemployment_employee_rate?: number | null
          unemployment_employer_rate?: number | null
          unit_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accident_insurance_rate?: number | null
          address?: string | null
          address_line?: string | null
          allowances?: Json | null
          apartment_number?: string | null
          avatar_url?: string | null
          balance?: number | null
          bonus_provision?: number | null
          calculate_as_minimum_wage?: boolean | null
          city?: string | null
          city_id?: number | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          cumulative_yearly_gross?: number | null
          cumulative_yearly_tax?: number | null
          date_of_birth?: string | null
          department?: string
          district?: string | null
          district_id?: number | null
          effective_date?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          gross_salary?: number | null
          hire_date?: string
          id?: string
          id_ssn?: string | null
          income_tax_amount?: number | null
          is_technical?: boolean | null
          last_name?: string
          manual_employer_sgk_cost?: number | null
          marital_status?:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          meal_allowance?: number | null
          neighborhood?: string | null
          neighborhood_id?: number | null
          net_salary?: number | null
          payment_frequency?: string | null
          phone?: string | null
          position?: string
          postal_code?: string | null
          salary_amount?: number | null
          salary_currency?: string | null
          salary_input_type?: string | null
          salary_notes?: string | null
          salary_start_date?: string | null
          salary_type?: string | null
          severance_provision?: number | null
          sgk_employee_amount?: number | null
          sgk_employee_rate?: number | null
          sgk_employer_amount?: number | null
          sgk_employer_rate?: number | null
          stamp_tax?: number | null
          stamp_tax_amount?: number | null
          stamp_tax_rate?: number | null
          status?: Database["public"]["Enums"]["employee_status"]
          tax_year?: number | null
          total_deductions?: number | null
          total_employer_cost?: number | null
          transport_allowance?: number | null
          unemployment_employee_amount?: number | null
          unemployment_employee_rate?: number | null
          unemployment_employer_rate?: number | null
          unit_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "turkey_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "turkey_districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "turkey_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          category: string | null
          company_id: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          installation_date: string | null
          location: unknown
          location_address: string | null
          maintenance_schedule: Json | null
          manufacturer: string | null
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
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          installation_date?: string | null
          location?: unknown
          location_address?: string | null
          maintenance_schedule?: Json | null
          manufacturer?: string | null
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
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          installation_date?: string | null
          location?: unknown
          location_address?: string | null
          maintenance_schedule?: Json | null
          manufacturer?: string | null
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
          updated_at?: string
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
          effective_buying: number | null
          effective_selling: number | null
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
          effective_buying?: number | null
          effective_selling?: number | null
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
          effective_buying?: number | null
          effective_selling?: number | null
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
      expenses: {
        Row: {
          amount: number
          attachment_url: string | null
          category_id: string
          company_id: string | null
          created_at: string
          date: string
          description: string | null
          employee_id: string | null
          expense_type: string | null
          id: string
          is_paid: boolean | null
          is_recurring: boolean | null
          is_recurring_instance: boolean | null
          paid_date: string | null
          parent_expense_id: string | null
          payment_account_id: string | null
          payment_account_type: string | null
          payment_amount: number | null
          recurrence_day_of_month: number | null
          recurrence_days: string[] | null
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_pattern: string | null
          recurrence_type: string | null
          subcategory: string | null
          type: string
          updated_at: string
          vat_rate: number | null
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          category_id: string
          company_id?: string | null
          created_at?: string
          date: string
          description?: string | null
          employee_id?: string | null
          expense_type?: string | null
          id?: string
          is_paid?: boolean | null
          is_recurring?: boolean | null
          is_recurring_instance?: boolean | null
          paid_date?: string | null
          parent_expense_id?: string | null
          payment_account_id?: string | null
          payment_account_type?: string | null
          payment_amount?: number | null
          recurrence_day_of_month?: number | null
          recurrence_days?: string[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          recurrence_type?: string | null
          subcategory?: string | null
          type: string
          updated_at?: string
          vat_rate?: number | null
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          category_id?: string
          company_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          employee_id?: string | null
          expense_type?: string | null
          id?: string
          is_paid?: boolean | null
          is_recurring?: boolean | null
          is_recurring_instance?: boolean | null
          paid_date?: string | null
          parent_expense_id?: string | null
          payment_account_id?: string | null
          payment_account_type?: string | null
          payment_amount?: number | null
          recurrence_day_of_month?: number | null
          recurrence_days?: string[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          recurrence_type?: string | null
          subcategory?: string | null
          type?: string
          updated_at?: string
          vat_rate?: number | null
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
          {
            foreignKeyName: "expenses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_parent_expense_id_fkey"
            columns: ["parent_expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
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
      geocoding_cache: {
        Row: {
          address: string
          city: string | null
          country: string | null
          created_at: string | null
          display_name: string | null
          district: string | null
          expires_at: string | null
          id: string
          latitude: number
          longitude: number
          postal_code: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          district?: string | null
          expires_at?: string | null
          id?: string
          latitude: number
          longitude: number
          postal_code?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          district?: string | null
          expires_at?: string | null
          id?: string
          latitude?: number
          longitude?: number
          postal_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      grn_lines: {
        Row: {
          batches: Json | null
          company_id: string
          created_at: string
          grn_id: string
          id: string
          location_id: string | null
          notes: string | null
          po_line_id: string
          qc_status: string
          received_quantity: number
          serials: Json | null
          updated_at: string
        }
        Insert: {
          batches?: Json | null
          company_id: string
          created_at?: string
          grn_id: string
          id?: string
          location_id?: string | null
          notes?: string | null
          po_line_id: string
          qc_status?: string
          received_quantity: number
          serials?: Json | null
          updated_at?: string
        }
        Update: {
          batches?: Json | null
          company_id?: string
          created_at?: string
          grn_id?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          po_line_id?: string
          qc_status?: string
          received_quantity?: number
          serials?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grn_lines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_lines_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "grns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_lines_po_line_id_fkey"
            columns: ["po_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      grns: {
        Row: {
          attachments: Json | null
          company_id: string
          created_at: string
          created_by: string | null
          grn_number: string
          id: string
          notes: string | null
          po_id: string
          received_by: string | null
          received_date: string
          status: string
          updated_at: string
          updated_by: string | null
          warehouse_id: string | null
        }
        Insert: {
          attachments?: Json | null
          company_id: string
          created_at?: string
          created_by?: string | null
          grn_number: string
          id?: string
          notes?: string | null
          po_id: string
          received_by?: string | null
          received_date?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          warehouse_id?: string | null
        }
        Update: {
          attachments?: Json | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          grn_number?: string
          id?: string
          notes?: string | null
          po_id?: string
          received_by?: string | null
          received_date?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grns_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grns_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      integrator_settings: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          selected_integrator: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          selected_integrator?: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          selected_integrator?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrator_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transaction_items: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          product_id: string
          product_name: string
          quantity: number
          transaction_id: string
          unit: string
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id: string
          product_name: string
          quantity: number
          transaction_id: string
          unit?: string
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          product_name?: string
          quantity?: number
          transaction_id?: string
          unit?: string
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_warehouse_stocks"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "inventory_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          from_warehouse_id: string | null
          id: string
          notes: string | null
          reference_number: string | null
          status: string
          to_warehouse_id: string | null
          transaction_date: string
          transaction_number: string
          transaction_type: string
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          from_warehouse_id?: string | null
          id?: string
          notes?: string | null
          reference_number?: string | null
          status?: string
          to_warehouse_id?: string | null
          transaction_date?: string
          transaction_number: string
          transaction_type: string
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          from_warehouse_id?: string | null
          id?: string
          notes?: string | null
          reference_number?: string | null
          status?: string
          to_warehouse_id?: string | null
          transaction_date?: string
          transaction_number?: string
          transaction_type?: string
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "product_warehouse_stocks"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "inventory_transactions_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "product_warehouse_stocks"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "inventory_transactions_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "product_warehouse_stocks"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "inventory_transactions_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
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
      memberships: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      module_links: {
        Row: {
          company_id: string | null
          created_at: string | null
          label: string | null
          source: string
          style: Json | null
          target: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          label?: string | null
          source: string
          style?: Json | null
          target: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          label?: string | null
          source?: string
          style?: Json | null
          target?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_links_source_fkey"
            columns: ["source"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_links_target_fkey"
            columns: ["target"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          code: string | null
          color: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          href: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          kind: string | null
          kpi_count: number | null
          name: string
          order_no: number | null
          parent: string | null
          tags: Json | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          href?: string | null
          icon?: string | null
          id: string
          is_active?: boolean | null
          kind?: string | null
          kpi_count?: number | null
          name: string
          order_no?: number | null
          parent?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          href?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          kind?: string | null
          kpi_count?: number | null
          name?: string
          order_no?: number | null
          parent?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modules_parent_fkey"
            columns: ["parent"]
            isOneToOne: false
            referencedRelation: "modules"
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
          company_id: string | null
          company_info: Json | null
          created_at: string
          id: string
          invoice_series: string | null
          is_active: boolean
          last_login_at: string | null
          login_token: string | null
          password: string
          test_mode: boolean | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          api_key: string
          company_id?: string | null
          company_info?: Json | null
          created_at?: string
          id?: string
          invoice_series?: string | null
          is_active?: boolean
          last_login_at?: string | null
          login_token?: string | null
          password: string
          test_mode?: boolean | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          api_key?: string
          company_id?: string | null
          company_info?: Json | null
          created_at?: string
          id?: string
          invoice_series?: string | null
          is_active?: boolean
          last_login_at?: string | null
          login_token?: string | null
          password?: string
          test_mode?: boolean | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "nilvera_auth_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          appointment_reminders: boolean | null
          created_at: string | null
          emergency_notifications: boolean | null
          general_notifications: boolean | null
          id: string
          service_assignments: boolean | null
          service_completed: boolean | null
          status_updates: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appointment_reminders?: boolean | null
          created_at?: string | null
          emergency_notifications?: boolean | null
          general_notifications?: boolean | null
          id?: string
          service_assignments?: boolean | null
          service_completed?: boolean | null
          status_updates?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          appointment_reminders?: boolean | null
          created_at?: string | null
          emergency_notifications?: boolean | null
          general_notifications?: boolean | null
          id?: string
          service_assignments?: boolean | null
          service_completed?: boolean | null
          status_updates?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body_template: string
          company_id: string | null
          created_at: string | null
          data_schema: Json | null
          id: string
          is_active: boolean | null
          priority: string | null
          step_name: string | null
          template_name: string
          template_type: string
          title_template: string
          updated_at: string | null
        }
        Insert: {
          body_template: string
          company_id?: string | null
          created_at?: string | null
          data_schema?: Json | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          step_name?: string | null
          template_name: string
          template_type: string
          title_template: string
          updated_at?: string | null
        }
        Update: {
          body_template?: string
          company_id?: string | null
          created_at?: string | null
          data_schema?: Json | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          step_name?: string | null
          template_name?: string
          template_type?: string
          title_template?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action: string | null
          body: string
          company_id: string | null
          created_at: string | null
          customer_id: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          service_request_id: string | null
          technician_id: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action?: string | null
          body: string
          company_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          service_request_id?: string | null
          technician_id?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action?: string | null
          body?: string
          company_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          service_request_id?: string | null
          technician_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      opex_subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opex_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cashflow_categories"
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
            referencedRelation: "product_warehouse_stocks"
            referencedColumns: ["product_id"]
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
      partner_accounts: {
        Row: {
          company_id: string | null
          created_at: string | null
          currency: string | null
          current_balance: number | null
          id: string
          initial_capital: number | null
          investment_date: string | null
          is_active: boolean | null
          ownership_percentage: number | null
          partner_name: string
          partner_type: string
          profit_share: number | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          id?: string
          initial_capital?: number | null
          investment_date?: string | null
          is_active?: boolean | null
          ownership_percentage?: number | null
          partner_name: string
          partner_type: string
          profit_share?: number | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          id?: string
          initial_capital?: number | null
          investment_date?: string | null
          is_active?: boolean | null
          ownership_percentage?: number | null
          partner_name?: string
          partner_type?: string
          profit_share?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_transactions: {
        Row: {
          amount: number
          category: string | null
          company_id: string | null
          created_at: string | null
          description: string
          id: string
          partner_id: string
          reference: string | null
          transaction_date: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          partner_id: string
          reference?: string | null
          transaction_date?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          partner_id?: string
          reference?: string | null
          transaction_date?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_accounts"
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
          account_id: string | null
          amount: number
          company_id: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          customer_id: string | null
          description: string | null
          id: string
          payment_date: string
          payment_direction: string | null
          payment_type: string | null
          recipient_name: string | null
          reference_note: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          company_id?: string | null
          created_at?: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          customer_id?: string | null
          description?: string | null
          id?: string
          payment_date?: string
          payment_direction?: string | null
          payment_type?: string | null
          recipient_name?: string | null
          reference_note?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          company_id?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          customer_id?: string | null
          description?: string | null
          id?: string
          payment_date?: string
          payment_direction?: string | null
          payment_type?: string | null
          recipient_name?: string | null
          reference_note?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
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
          created_by: string | null
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
          created_by?: string | null
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
          created_by?: string | null
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
      pending_operations: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          last_error: string | null
          max_retries: number | null
          operation_type: string
          payload_json: Json
          processed_at: string | null
          record_id: string | null
          retry_count: number | null
          status: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          last_error?: string | null
          max_retries?: number | null
          operation_type: string
          payload_json: Json
          processed_at?: string | null
          record_id?: string | null
          retry_count?: number | null
          status?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          last_error?: string | null
          max_retries?: number | null
          operation_type?: string
          payload_json?: Json
          processed_at?: string | null
          record_id?: string | null
          retry_count?: number | null
          status?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_operations_company_id_fkey"
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
          is_active: boolean | null
          is_default: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          sort_order?: number | null
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
          attachments: Json | null
          barcode: string | null
          category_id: string | null
          category_type: string
          company_id: string | null
          created_at: string | null
          currency: string
          description: string | null
          dimensions: string | null
          discount_rate: number | null
          id: string
          image_url: string | null
          is_active: boolean
          max_stock_level: number | null
          min_stock_level: number
          name: string
          price: number
          price_includes_vat: boolean | null
          product_type: string
          purchase_price: number | null
          purchase_price_includes_vat: boolean | null
          sku: string | null
          status: string
          stock_quantity: number | null
          stock_threshold: number | null
          supplier_id: string | null
          tags: string[] | null
          tax_rate: number
          unit: string
          updated_at: string | null
          vat_included: boolean | null
          warranty_period: number | null
          weight: number | null
        }
        Insert: {
          attachments?: Json | null
          barcode?: string | null
          category_id?: string | null
          category_type?: string
          company_id?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          dimensions?: string | null
          discount_rate?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          max_stock_level?: number | null
          min_stock_level?: number
          name: string
          price?: number
          price_includes_vat?: boolean | null
          product_type?: string
          purchase_price?: number | null
          purchase_price_includes_vat?: boolean | null
          sku?: string | null
          status?: string
          stock_quantity?: number | null
          stock_threshold?: number | null
          supplier_id?: string | null
          tags?: string[] | null
          tax_rate?: number
          unit?: string
          updated_at?: string | null
          vat_included?: boolean | null
          warranty_period?: number | null
          weight?: number | null
        }
        Update: {
          attachments?: Json | null
          barcode?: string | null
          category_id?: string | null
          category_type?: string
          company_id?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          dimensions?: string | null
          discount_rate?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          max_stock_level?: number | null
          min_stock_level?: number
          name?: string
          price?: number
          price_includes_vat?: boolean | null
          product_type?: string
          purchase_price?: number | null
          purchase_price_includes_vat?: boolean | null
          sku?: string | null
          status?: string
          stock_quantity?: number | null
          stock_threshold?: number | null
          supplier_id?: string | null
          tags?: string[] | null
          tax_rate?: number
          unit?: string
          updated_at?: string | null
          vat_included?: boolean | null
          warranty_period?: number | null
          weight?: number | null
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
          device_id: string | null
          email: string | null
          employee_id: string | null
          fcm_token: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          last_name: string | null
          last_token_updated: string | null
          notification_enabled: boolean | null
          phone: string | null
          platform: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id: string
          company_name?: string | null
          created_at?: string | null
          device_id?: string | null
          email?: string | null
          employee_id?: string | null
          fcm_token?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          last_token_updated?: string | null
          notification_enabled?: boolean | null
          phone?: string | null
          platform?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string
          company_name?: string | null
          created_at?: string | null
          device_id?: string | null
          email?: string | null
          employee_id?: string | null
          fcm_token?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          last_token_updated?: string | null
          notification_enabled?: boolean | null
          phone?: string | null
          platform?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
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
          exchange_rate: number | null
          history: Json | null
          id: string
          items: Json | null
          notes: string | null
          number: string
          offer_date: string | null
          opportunity_id: string | null
          other_terms: string | null
          parent_proposal_id: string | null
          payment_terms: string | null
          price_terms: string | null
          revision_number: number | null
          selected_delivery_terms: string[] | null
          selected_other_terms: string[] | null
          selected_payment_terms: string[] | null
          selected_pricing_terms: string[] | null
          selected_warranty_terms: string[] | null
          status: string
          subject: string | null
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
          exchange_rate?: number | null
          history?: Json | null
          id?: string
          items?: Json | null
          notes?: string | null
          number: string
          offer_date?: string | null
          opportunity_id?: string | null
          other_terms?: string | null
          parent_proposal_id?: string | null
          payment_terms?: string | null
          price_terms?: string | null
          revision_number?: number | null
          selected_delivery_terms?: string[] | null
          selected_other_terms?: string[] | null
          selected_payment_terms?: string[] | null
          selected_pricing_terms?: string[] | null
          selected_warranty_terms?: string[] | null
          status?: string
          subject?: string | null
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
          exchange_rate?: number | null
          history?: Json | null
          id?: string
          items?: Json | null
          notes?: string | null
          number?: string
          offer_date?: string | null
          opportunity_id?: string | null
          other_terms?: string | null
          parent_proposal_id?: string | null
          payment_terms?: string | null
          price_terms?: string | null
          revision_number?: number | null
          selected_delivery_terms?: string[] | null
          selected_other_terms?: string[] | null
          selected_payment_terms?: string[] | null
          selected_pricing_terms?: string[] | null
          selected_warranty_terms?: string[] | null
          status?: string
          subject?: string | null
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
          {
            foreignKeyName: "proposals_parent_proposal_id_fkey"
            columns: ["parent_proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_invoice_items: {
        Row: {
          company_id: string | null
          created_at: string | null
          discount_rate: number
          id: string
          line_total: number
          product_id: string | null
          product_name: string
          purchase_invoice_id: string
          quantity: number
          sku: string | null
          tax_rate: number
          unit: string
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          discount_rate?: number
          id?: string
          line_total?: number
          product_id?: string | null
          product_name: string
          purchase_invoice_id: string
          quantity?: number
          sku?: string | null
          tax_rate?: number
          unit?: string
          unit_price?: number
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          discount_rate?: number
          id?: string
          line_total?: number
          product_id?: string | null
          product_name?: string
          purchase_invoice_id?: string
          quantity?: number
          sku?: string | null
          tax_rate?: number
          unit?: string
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_warehouse_stocks"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "purchase_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoice_items_purchase_invoice_id_fkey"
            columns: ["purchase_invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
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
          einvoice_id: string | null
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
          einvoice_id?: string | null
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
          einvoice_id?: string | null
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
          created_at: string
          description: string
          discount_rate: number | null
          id: string
          line_total: number
          notes: string | null
          order_id: string
          product_id: string | null
          quantity: number
          received_quantity: number | null
          tax_rate: number | null
          unit_price: number
          uom: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          discount_rate?: number | null
          id?: string
          line_total: number
          notes?: string | null
          order_id: string
          product_id?: string | null
          quantity: number
          received_quantity?: number | null
          tax_rate?: number | null
          unit_price: number
          uom?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          discount_rate?: number | null
          id?: string
          line_total?: number
          notes?: string | null
          order_id?: string
          product_id?: string | null
          quantity?: number
          received_quantity?: number | null
          tax_rate?: number | null
          unit_price?: number
          uom?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_warehouse_stocks"
            referencedColumns: ["product_id"]
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
          approved_at: string | null
          approved_by: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          delivery_address: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          payment_terms: string | null
          priority: string
          request_id: string | null
          status: string
          subtotal: number | null
          supplier_id: string | null
          tax_total: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          delivery_address?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          payment_terms?: string | null
          priority?: string
          request_id?: string | null
          status?: string
          subtotal?: number | null
          supplier_id?: string | null
          tax_total?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          delivery_address?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          payment_terms?: string | null
          priority?: string
          request_id?: string | null
          status?: string
          subtotal?: number | null
          supplier_id?: string | null
          tax_total?: number | null
          total_amount?: number | null
          updated_at?: string
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
            referencedRelation: "product_warehouse_stocks"
            referencedColumns: ["product_id"]
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
          cost_center: string | null
          created_at: string | null
          department: string | null
          department_id: string | null
          description: string | null
          id: string
          need_by_date: string | null
          needed_by_date: string | null
          notes: string | null
          preferred_supplier_id: string | null
          priority: string | null
          request_number: string
          requested_date: string | null
          requester_id: string
          requester_notes: string | null
          status: Database["public"]["Enums"]["purchase_request_status"] | null
          title: string
          total_budget: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          cost_center?: string | null
          created_at?: string | null
          department?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          need_by_date?: string | null
          needed_by_date?: string | null
          notes?: string | null
          preferred_supplier_id?: string | null
          priority?: string | null
          request_number?: string
          requested_date?: string | null
          requester_id: string
          requester_notes?: string | null
          status?: Database["public"]["Enums"]["purchase_request_status"] | null
          title: string
          total_budget?: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          cost_center?: string | null
          created_at?: string | null
          department?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          need_by_date?: string | null
          needed_by_date?: string | null
          notes?: string | null
          preferred_supplier_id?: string | null
          priority?: string | null
          request_number?: string
          requested_date?: string | null
          requester_id?: string
          requester_notes?: string | null
          status?: Database["public"]["Enums"]["purchase_request_status"] | null
          title?: string
          total_budget?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_purchase_requests_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_purchase_requests_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_purchase_requests_requester"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_purchase_requests_supplier"
            columns: ["preferred_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchasing_attachments: {
        Row: {
          company_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          object_id: string
          object_type: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          object_id: string
          object_type: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          object_id?: string
          object_type?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchasing_attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      purchasing_settings: {
        Row: {
          approval_threshold_level1: number | null
          approval_threshold_level2: number | null
          company_id: string | null
          created_at: string | null
          default_currency: string | null
          default_tax_rate: number | null
          grn_prefix: string | null
          id: string
          po_prefix: string | null
          pr_prefix: string | null
          rfq_prefix: string | null
          updated_at: string | null
        }
        Insert: {
          approval_threshold_level1?: number | null
          approval_threshold_level2?: number | null
          company_id?: string | null
          created_at?: string | null
          default_currency?: string | null
          default_tax_rate?: number | null
          grn_prefix?: string | null
          id?: string
          po_prefix?: string | null
          pr_prefix?: string | null
          rfq_prefix?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_threshold_level1?: number | null
          approval_threshold_level2?: number | null
          company_id?: string | null
          created_at?: string | null
          default_currency?: string | null
          default_tax_rate?: number | null
          grn_prefix?: string | null
          id?: string
          po_prefix?: string | null
          pr_prefix?: string | null
          rfq_prefix?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchasing_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_lines: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          notes: string | null
          product_id: string | null
          quantity: number
          rfq_id: string
          target_price: number | null
          uom: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity: number
          rfq_id: string
          target_price?: number | null
          uom?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          rfq_id?: string
          target_price?: number | null
          uom?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_lines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_lines_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_quote_lines: {
        Row: {
          company_id: string
          created_at: string
          delivery_days: number | null
          discount_rate: number | null
          id: string
          line_total: number | null
          notes: string | null
          rfq_line_id: string
          rfq_quote_id: string
          tax_rate: number | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          delivery_days?: number | null
          discount_rate?: number | null
          id?: string
          line_total?: number | null
          notes?: string | null
          rfq_line_id: string
          rfq_quote_id: string
          tax_rate?: number | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          delivery_days?: number | null
          discount_rate?: number | null
          id?: string
          line_total?: number | null
          notes?: string | null
          rfq_line_id?: string
          rfq_quote_id?: string
          tax_rate?: number | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_quote_lines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_quote_lines_rfq_line_id_fkey"
            columns: ["rfq_line_id"]
            isOneToOne: false
            referencedRelation: "rfq_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_quote_lines_rfq_quote_id_fkey"
            columns: ["rfq_quote_id"]
            isOneToOne: false
            referencedRelation: "rfq_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_quotes: {
        Row: {
          attachments: Json | null
          company_id: string
          created_at: string
          currency: string | null
          delivery_days: number | null
          discount_rate: number | null
          exchange_rate: number | null
          grand_total: number | null
          id: string
          is_selected: boolean | null
          notes: string | null
          payment_terms: string | null
          quote_number: string | null
          rfq_id: string
          shipping_cost: number | null
          submitted_at: string | null
          submitted_via_portal: boolean | null
          subtotal: number | null
          supplier_id: string
          tax_total: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          attachments?: Json | null
          company_id: string
          created_at?: string
          currency?: string | null
          delivery_days?: number | null
          discount_rate?: number | null
          exchange_rate?: number | null
          grand_total?: number | null
          id?: string
          is_selected?: boolean | null
          notes?: string | null
          payment_terms?: string | null
          quote_number?: string | null
          rfq_id: string
          shipping_cost?: number | null
          submitted_at?: string | null
          submitted_via_portal?: boolean | null
          subtotal?: number | null
          supplier_id: string
          tax_total?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          attachments?: Json | null
          company_id?: string
          created_at?: string
          currency?: string | null
          delivery_days?: number | null
          discount_rate?: number | null
          exchange_rate?: number | null
          grand_total?: number | null
          id?: string
          is_selected?: boolean | null
          notes?: string | null
          payment_terms?: string | null
          quote_number?: string | null
          rfq_id?: string
          shipping_cost?: number | null
          submitted_at?: string | null
          submitted_via_portal?: boolean | null
          subtotal?: number | null
          supplier_id?: string
          tax_total?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfq_quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_quotes_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_quotes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_vendors: {
        Row: {
          company_id: string
          id: string
          invited_at: string | null
          responded_at: string | null
          rfq_id: string
          status: string
          supplier_id: string
        }
        Insert: {
          company_id: string
          id?: string
          invited_at?: string | null
          responded_at?: string | null
          rfq_id: string
          status?: string
          supplier_id: string
        }
        Update: {
          company_id?: string
          id?: string
          invited_at?: string | null
          responded_at?: string | null
          rfq_id?: string
          status?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_vendors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_vendors_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_vendors_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          attachments: Json | null
          company_id: string
          created_at: string
          created_by: string | null
          currency: string | null
          due_date: string | null
          id: string
          incoterm: string | null
          notes: string | null
          pr_id: string | null
          rfq_number: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          attachments?: Json | null
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          incoterm?: string | null
          notes?: string | null
          pr_id?: string | null
          rfq_number: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          attachments?: Json | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          incoterm?: string | null
          notes?: string | null
          pr_id?: string | null
          rfq_number?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfqs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_role_id: string | null
          permissions: Json | null
          priority: number | null
          role_type: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_role_id?: string | null
          permissions?: Json | null
          priority?: number | null
          role_type?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_role_id?: string | null
          permissions?: Json | null
          priority?: number | null
          role_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roles_parent_role_id_fkey"
            columns: ["parent_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_invoice_items: {
        Row: {
          aciklama: string | null
          birim: string
          birim_fiyat: number
          buyer_code: string | null
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
          seller_code: string | null
          sira_no: number | null
          updated_at: string
          urun_adi: string
        }
        Insert: {
          aciklama?: string | null
          birim?: string
          birim_fiyat?: number
          buyer_code?: string | null
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
          seller_code?: string | null
          sira_no?: number | null
          updated_at?: string
          urun_adi: string
        }
        Update: {
          aciklama?: string | null
          birim?: string
          birim_fiyat?: number
          buyer_code?: string | null
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
          seller_code?: string | null
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
            referencedRelation: "product_warehouse_stocks"
            referencedColumns: ["product_id"]
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
          delivery_terms: string | null
          document_type: string | null
          durum: string
          einvoice_answer_type: number | null
          einvoice_delivered_at: string | null
          einvoice_error_code: string | null
          einvoice_error_message: string | null
          einvoice_invoice_state: number | null
          einvoice_nilvera_response: Json | null
          einvoice_responded_at: string | null
          einvoice_sent_at: string | null
          einvoice_status: string | null
          einvoice_transfer_state: number | null
          einvoice_xml_content: string | null
          ek_belgeler: Json | null
          employee_id: string | null
          exchange_rate: number | null
          fatura_no: string | null
          fatura_tarihi: string
          id: string
          indirim_tutari: number
          internet_info: Json | null
          invoice_profile: string | null
          invoice_type: string | null
          is_despatch: boolean | null
          issue_time: string | null
          kdv_tutari: number
          nilvera_invoice_id: string | null
          nilvera_transfer_id: string | null
          notlar: string | null
          odeme_durumu: string
          odeme_sekli: string | null
          odenen_tutar: number
          order_id: string | null
          other_terms: string | null
          para_birimi: string
          payment_terms: string | null
          pdf_url: string | null
          price_terms: string | null
          proposal_id: string | null
          return_invoice_info: Json | null
          sales_platform: string | null
          send_type: string | null
          toplam_tutar: number
          updated_at: string
          vade_tarihi: string | null
          warranty_terms: string | null
          xml_data: Json | null
        }
        Insert: {
          aciklama?: string | null
          ara_toplam?: number
          banka_bilgileri?: string | null
          company_id?: string | null
          created_at?: string
          customer_id: string
          delivery_terms?: string | null
          document_type?: string | null
          durum?: string
          einvoice_answer_type?: number | null
          einvoice_delivered_at?: string | null
          einvoice_error_code?: string | null
          einvoice_error_message?: string | null
          einvoice_invoice_state?: number | null
          einvoice_nilvera_response?: Json | null
          einvoice_responded_at?: string | null
          einvoice_sent_at?: string | null
          einvoice_status?: string | null
          einvoice_transfer_state?: number | null
          einvoice_xml_content?: string | null
          ek_belgeler?: Json | null
          employee_id?: string | null
          exchange_rate?: number | null
          fatura_no?: string | null
          fatura_tarihi?: string
          id?: string
          indirim_tutari?: number
          internet_info?: Json | null
          invoice_profile?: string | null
          invoice_type?: string | null
          is_despatch?: boolean | null
          issue_time?: string | null
          kdv_tutari?: number
          nilvera_invoice_id?: string | null
          nilvera_transfer_id?: string | null
          notlar?: string | null
          odeme_durumu?: string
          odeme_sekli?: string | null
          odenen_tutar?: number
          order_id?: string | null
          other_terms?: string | null
          para_birimi?: string
          payment_terms?: string | null
          pdf_url?: string | null
          price_terms?: string | null
          proposal_id?: string | null
          return_invoice_info?: Json | null
          sales_platform?: string | null
          send_type?: string | null
          toplam_tutar?: number
          updated_at?: string
          vade_tarihi?: string | null
          warranty_terms?: string | null
          xml_data?: Json | null
        }
        Update: {
          aciklama?: string | null
          ara_toplam?: number
          banka_bilgileri?: string | null
          company_id?: string | null
          created_at?: string
          customer_id?: string
          delivery_terms?: string | null
          document_type?: string | null
          durum?: string
          einvoice_answer_type?: number | null
          einvoice_delivered_at?: string | null
          einvoice_error_code?: string | null
          einvoice_error_message?: string | null
          einvoice_invoice_state?: number | null
          einvoice_nilvera_response?: Json | null
          einvoice_responded_at?: string | null
          einvoice_sent_at?: string | null
          einvoice_status?: string | null
          einvoice_transfer_state?: number | null
          einvoice_xml_content?: string | null
          ek_belgeler?: Json | null
          employee_id?: string | null
          exchange_rate?: number | null
          fatura_no?: string | null
          fatura_tarihi?: string
          id?: string
          indirim_tutari?: number
          internet_info?: Json | null
          invoice_profile?: string | null
          invoice_type?: string | null
          is_despatch?: boolean | null
          issue_time?: string | null
          kdv_tutari?: number
          nilvera_invoice_id?: string | null
          nilvera_transfer_id?: string | null
          notlar?: string | null
          odeme_durumu?: string
          odeme_sekli?: string | null
          odenen_tutar?: number
          order_id?: string | null
          other_terms?: string | null
          para_birimi?: string
          payment_terms?: string | null
          pdf_url?: string | null
          price_terms?: string | null
          proposal_id?: string | null
          return_invoice_info?: Json | null
          sales_platform?: string | null
          send_type?: string | null
          toplam_tutar?: number
          updated_at?: string
          vade_tarihi?: string | null
          warranty_terms?: string | null
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
          {
            foreignKeyName: "sales_invoices_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
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
      service_equipment: {
        Row: {
          brand: string | null
          category: string | null
          company_id: string
          condition: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          equipment_name: string
          id: string
          location: string | null
          model: string | null
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string | null
          specifications: Json | null
          status: string
          supplier: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          company_id: string
          condition?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          equipment_name: string
          id?: string
          location?: string | null
          model?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string
          supplier?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          company_id?: string
          condition?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          equipment_name?: string
          id?: string
          location?: string | null
          model?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string
          supplier?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_equipment_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_history: {
        Row: {
          action_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          service_request_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          service_request_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          service_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_history_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_items: {
        Row: {
          company_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          discount_rate: number | null
          id: string
          item_group: string | null
          name: string
          original_currency: string | null
          original_price: number | null
          product_id: string | null
          quantity: number
          row_number: number | null
          service_request_id: string
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
          original_currency?: string | null
          original_price?: number | null
          product_id?: string | null
          quantity?: number
          row_number?: number | null
          service_request_id: string
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
          original_currency?: string | null
          original_price?: number | null
          product_id?: string | null
          quantity?: number
          row_number?: number | null
          service_request_id?: string
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
            foreignKeyName: "service_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_warehouse_stocks"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "service_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_items_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          assigned_technician: string | null
          attachments: Json | null
          company_id: string | null
          completion_date: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          customer_data: Json | null
          customer_id: string | null
          customer_signature: string | null
          equipment_data: Json | null
          id: string
          is_recurring: boolean | null
          is_recurring_instance: boolean | null
          issue_date: string | null
          next_recurrence_date: string | null
          notes: string[] | null
          parent_service_id: string | null
          received_by: string | null
          recurrence_day_of_month: number | null
          recurrence_days: number[] | null
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_type: string | null
          service_details: Json | null
          service_due_date: string | null
          service_end_date: string | null
          service_location: string | null
          service_number: string | null
          service_priority:
            | Database["public"]["Enums"]["service_priority"]
            | null
          service_reported_date: string | null
          service_request_description: string | null
          service_result: string | null
          service_start_date: string | null
          service_status: Database["public"]["Enums"]["service_status"] | null
          service_title: string
          service_type: string | null
          slip_status: string | null
          supplier_id: string | null
          technician_name: string | null
          technician_signature: string | null
          updated_at: string | null
          warranty_info: Json | null
        }
        Insert: {
          assigned_technician?: string | null
          attachments?: Json | null
          company_id?: string | null
          completion_date?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_data?: Json | null
          customer_id?: string | null
          customer_signature?: string | null
          equipment_data?: Json | null
          id?: string
          is_recurring?: boolean | null
          is_recurring_instance?: boolean | null
          issue_date?: string | null
          next_recurrence_date?: string | null
          notes?: string[] | null
          parent_service_id?: string | null
          received_by?: string | null
          recurrence_day_of_month?: number | null
          recurrence_days?: number[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
          service_details?: Json | null
          service_due_date?: string | null
          service_end_date?: string | null
          service_location?: string | null
          service_number?: string | null
          service_priority?:
            | Database["public"]["Enums"]["service_priority"]
            | null
          service_reported_date?: string | null
          service_request_description?: string | null
          service_result?: string | null
          service_start_date?: string | null
          service_status?: Database["public"]["Enums"]["service_status"] | null
          service_title: string
          service_type?: string | null
          slip_status?: string | null
          supplier_id?: string | null
          technician_name?: string | null
          technician_signature?: string | null
          updated_at?: string | null
          warranty_info?: Json | null
        }
        Update: {
          assigned_technician?: string | null
          attachments?: Json | null
          company_id?: string | null
          completion_date?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_data?: Json | null
          customer_id?: string | null
          customer_signature?: string | null
          equipment_data?: Json | null
          id?: string
          is_recurring?: boolean | null
          is_recurring_instance?: boolean | null
          issue_date?: string | null
          next_recurrence_date?: string | null
          notes?: string[] | null
          parent_service_id?: string | null
          received_by?: string | null
          recurrence_day_of_month?: number | null
          recurrence_days?: number[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
          service_details?: Json | null
          service_due_date?: string | null
          service_end_date?: string | null
          service_location?: string | null
          service_number?: string | null
          service_priority?:
            | Database["public"]["Enums"]["service_priority"]
            | null
          service_reported_date?: string | null
          service_request_description?: string | null
          service_result?: string | null
          service_start_date?: string | null
          service_status?: Database["public"]["Enums"]["service_status"] | null
          service_title?: string
          service_type?: string | null
          slip_status?: string | null
          supplier_id?: string | null
          technician_name?: string | null
          technician_signature?: string | null
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
          {
            foreignKeyName: "service_requests_parent_service_id_fkey"
            columns: ["parent_service_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_templates: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          default_location: string | null
          default_technician_id: string | null
          description: string | null
          estimated_duration: number | null
          id: string
          instructions: Json | null
          is_active: boolean | null
          name: string
          parts_list: Json | null
          service_details: Json | null
          service_priority: string | null
          service_request_description: string | null
          service_title: string
          service_type: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          default_location?: string | null
          default_technician_id?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          instructions?: Json | null
          is_active?: boolean | null
          name: string
          parts_list?: Json | null
          service_details?: Json | null
          service_priority?: string | null
          service_request_description?: string | null
          service_title: string
          service_type?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          default_location?: string | null
          default_technician_id?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          instructions?: Json | null
          is_active?: boolean | null
          name?: string
          parts_list?: Json | null
          service_details?: Json | null
          service_priority?: string | null
          service_request_description?: string | null
          service_title?: string
          service_type?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_templates_default_technician_id_fkey"
            columns: ["default_technician_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      service_warranties: {
        Row: {
          company_id: string
          coverage_description: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          end_date: string
          equipment_id: string
          id: string
          notes: string | null
          start_date: string
          status: string
          support_email: string | null
          support_phone: string | null
          terms_conditions: string | null
          updated_at: string
          updated_by: string | null
          warranty_cost: number | null
          warranty_number: string | null
          warranty_provider: string | null
          warranty_type: string
        }
        Insert: {
          company_id: string
          coverage_description?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          end_date: string
          equipment_id: string
          id?: string
          notes?: string | null
          start_date: string
          status?: string
          support_email?: string | null
          support_phone?: string | null
          terms_conditions?: string | null
          updated_at?: string
          updated_by?: string | null
          warranty_cost?: number | null
          warranty_number?: string | null
          warranty_provider?: string | null
          warranty_type: string
        }
        Update: {
          company_id?: string
          coverage_description?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          end_date?: string
          equipment_id?: string
          id?: string
          notes?: string | null
          start_date?: string
          status?: string
          support_email?: string | null
          support_phone?: string | null
          terms_conditions?: string | null
          updated_at?: string
          updated_by?: string | null
          warranty_cost?: number | null
          warranty_number?: string | null
          warranty_provider?: string | null
          warranty_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_warranties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_warranties_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_warranties_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "service_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      step_notifications: {
        Row: {
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          data: Json | null
          fcm_message_id: string | null
          id: string
          is_completed: boolean | null
          notification_sent: boolean | null
          notification_sent_at: string | null
          service_request_id: string | null
          step_description: string | null
          step_name: string
          step_order: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          fcm_message_id?: string | null
          id?: string
          is_completed?: boolean | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          service_request_id?: string | null
          step_description?: string | null
          step_name: string
          step_order: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          fcm_message_id?: string | null
          id?: string
          is_completed?: boolean | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          service_request_id?: string | null
          step_description?: string | null
          step_name?: string
          step_order?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_notifications_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      subtasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          task_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          task_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          task_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_contacts: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contacts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoice_lines: {
        Row: {
          company_id: string
          created_at: string
          description: string
          discount_rate: number | null
          id: string
          line_total: number | null
          match_status: string | null
          po_line_id: string | null
          product_id: string | null
          quantity: number
          supplier_invoice_id: string
          tax_rate: number | null
          unit_price: number
          uom: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description: string
          discount_rate?: number | null
          id?: string
          line_total?: number | null
          match_status?: string | null
          po_line_id?: string | null
          product_id?: string | null
          quantity: number
          supplier_invoice_id: string
          tax_rate?: number | null
          unit_price: number
          uom?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          discount_rate?: number | null
          id?: string
          line_total?: number | null
          match_status?: string | null
          po_line_id?: string | null
          product_id?: string | null
          quantity?: number
          supplier_invoice_id?: string
          tax_rate?: number | null
          unit_price?: number
          uom?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoice_lines_supplier_invoice_id_fkey"
            columns: ["supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_invoice_lines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_invoice_lines_po_line_id_fkey"
            columns: ["po_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoices: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attachments: Json | null
          company_id: string
          created_at: string
          created_by: string | null
          currency: string | null
          due_date: string | null
          e_invoice_uuid: string | null
          exchange_rate: number | null
          grand_total: number | null
          grn_id: string | null
          id: string
          invoice_date: string
          invoice_number: string
          match_status: string | null
          notes: string | null
          paid_amount: number | null
          payment_terms: string | null
          po_id: string | null
          posted_at: string | null
          status: string
          subtotal: number | null
          supplier_id: string
          tax_total: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          due_date?: string | null
          e_invoice_uuid?: string | null
          exchange_rate?: number | null
          grand_total?: number | null
          grn_id?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          match_status?: string | null
          notes?: string | null
          paid_amount?: number | null
          payment_terms?: string | null
          po_id?: string | null
          posted_at?: string | null
          status?: string
          subtotal?: number | null
          supplier_id: string
          tax_total?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          due_date?: string | null
          e_invoice_uuid?: string | null
          exchange_rate?: number | null
          grand_total?: number | null
          grn_id?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          match_status?: string | null
          notes?: string | null
          paid_amount?: number | null
          payment_terms?: string | null
          po_id?: string | null
          posted_at?: string | null
          status?: string
          subtotal?: number | null
          supplier_id?: string
          tax_total?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_invoices_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "grns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_invoices_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_portal_activities: {
        Row: {
          activity_type: string
          company_id: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          object_id: string | null
          object_type: string | null
          supplier_id: string
        }
        Insert: {
          activity_type: string
          company_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          object_id?: string | null
          object_type?: string | null
          supplier_id: string
        }
        Update: {
          activity_type?: string
          company_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          object_id?: string | null
          object_type?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_portal_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_portal_activities_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_portal_sessions: {
        Row: {
          company_id: string
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          last_activity: string | null
          session_token: string
          supplier_id: string
          user_agent: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          last_activity?: string | null
          session_token: string
          supplier_id: string
          user_agent?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_activity?: string | null
          session_token?: string
          supplier_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_portal_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_portal_sessions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_portal_tokens: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          id: string
          is_used: boolean | null
          supplier_id: string
          token_hash: string
          used_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          email: string
          expires_at: string
          id?: string
          is_used?: boolean | null
          supplier_id: string
          token_hash: string
          used_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          supplier_id?: string
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_portal_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_portal_tokens_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          account_number: string | null
          address: string | null
          address_line: string | null
          aliases: Json | null
          apartment_number: string | null
          balance: number
          bank_name: string | null
          city: string | null
          city_id: number | null
          company: string | null
          company_id: string | null
          country: string | null
          created_at: string | null
          district: string | null
          district_id: number | null
          einvoice_address: string | null
          einvoice_alias_name: string | null
          einvoice_checked_at: string | null
          einvoice_city: string | null
          einvoice_company_name: string | null
          einvoice_district: string | null
          einvoice_mersis_no: string | null
          einvoice_sicil_no: string | null
          einvoice_tax_office: string | null
          email: string | null
          establishment_date: string | null
          fax: string | null
          first_contact_position: string | null
          iban: string | null
          id: string
          is_active: boolean | null
          is_einvoice_mukellef: boolean | null
          last_interaction: string | null
          last_portal_login: string | null
          mersis_number: string | null
          mobile_phone: string | null
          name: string
          neighborhood_id: number | null
          notes: string | null
          office_phone: string | null
          payee_financial_account_id: string | null
          payment_means_channel_code: string | null
          payment_means_code: string | null
          payment_terms: string | null
          portal_email: string | null
          portal_enabled: boolean | null
          postal_code: string | null
          representative: string | null
          second_address: string | null
          second_city: string | null
          second_contact_email: string | null
          second_contact_name: string | null
          second_contact_phone: string | null
          second_contact_position: string | null
          second_country: string | null
          second_district: string | null
          second_postal_code: string | null
          sector: string | null
          status: Database["public"]["Enums"]["supplier_status"]
          supplier_segment: string | null
          supplier_source: string | null
          tax_number: string | null
          tax_office: string | null
          trade_registry_number: string | null
          type: Database["public"]["Enums"]["supplier_type"]
          unit_number: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          address_line?: string | null
          aliases?: Json | null
          apartment_number?: string | null
          balance?: number
          bank_name?: string | null
          city?: string | null
          city_id?: number | null
          company?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          district?: string | null
          district_id?: number | null
          einvoice_address?: string | null
          einvoice_alias_name?: string | null
          einvoice_checked_at?: string | null
          einvoice_city?: string | null
          einvoice_company_name?: string | null
          einvoice_district?: string | null
          einvoice_mersis_no?: string | null
          einvoice_sicil_no?: string | null
          einvoice_tax_office?: string | null
          email?: string | null
          establishment_date?: string | null
          fax?: string | null
          first_contact_position?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean | null
          is_einvoice_mukellef?: boolean | null
          last_interaction?: string | null
          last_portal_login?: string | null
          mersis_number?: string | null
          mobile_phone?: string | null
          name: string
          neighborhood_id?: number | null
          notes?: string | null
          office_phone?: string | null
          payee_financial_account_id?: string | null
          payment_means_channel_code?: string | null
          payment_means_code?: string | null
          payment_terms?: string | null
          portal_email?: string | null
          portal_enabled?: boolean | null
          postal_code?: string | null
          representative?: string | null
          second_address?: string | null
          second_city?: string | null
          second_contact_email?: string | null
          second_contact_name?: string | null
          second_contact_phone?: string | null
          second_contact_position?: string | null
          second_country?: string | null
          second_district?: string | null
          second_postal_code?: string | null
          sector?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          supplier_segment?: string | null
          supplier_source?: string | null
          tax_number?: string | null
          tax_office?: string | null
          trade_registry_number?: string | null
          type: Database["public"]["Enums"]["supplier_type"]
          unit_number?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          account_number?: string | null
          address?: string | null
          address_line?: string | null
          aliases?: Json | null
          apartment_number?: string | null
          balance?: number
          bank_name?: string | null
          city?: string | null
          city_id?: number | null
          company?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          district?: string | null
          district_id?: number | null
          einvoice_address?: string | null
          einvoice_alias_name?: string | null
          einvoice_checked_at?: string | null
          einvoice_city?: string | null
          einvoice_company_name?: string | null
          einvoice_district?: string | null
          einvoice_mersis_no?: string | null
          einvoice_sicil_no?: string | null
          einvoice_tax_office?: string | null
          email?: string | null
          establishment_date?: string | null
          fax?: string | null
          first_contact_position?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean | null
          is_einvoice_mukellef?: boolean | null
          last_interaction?: string | null
          last_portal_login?: string | null
          mersis_number?: string | null
          mobile_phone?: string | null
          name?: string
          neighborhood_id?: number | null
          notes?: string | null
          office_phone?: string | null
          payee_financial_account_id?: string | null
          payment_means_channel_code?: string | null
          payment_means_code?: string | null
          payment_terms?: string | null
          portal_email?: string | null
          portal_enabled?: boolean | null
          postal_code?: string | null
          representative?: string | null
          second_address?: string | null
          second_city?: string | null
          second_contact_email?: string | null
          second_contact_name?: string | null
          second_contact_phone?: string | null
          second_contact_position?: string | null
          second_country?: string | null
          second_district?: string | null
          second_postal_code?: string | null
          sector?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          supplier_segment?: string | null
          supplier_source?: string | null
          tax_number?: string | null
          tax_office?: string | null
          trade_registry_number?: string | null
          type?: Database["public"]["Enums"]["supplier_type"]
          unit_number?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "turkey_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "turkey_districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "turkey_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_representative_uuid_fkey"
            columns: ["representative"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      system_parameters: {
        Row: {
          category: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_editable: boolean | null
          is_system_parameter: boolean | null
          parameter_key: string
          parameter_type: string | null
          parameter_value: string | null
          updated_at: string
          updated_by: string | null
          validation_rules: Json | null
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_editable?: boolean | null
          is_system_parameter?: boolean | null
          parameter_key: string
          parameter_type?: string | null
          parameter_value?: string | null
          updated_at?: string
          updated_by?: string | null
          validation_rules?: Json | null
        }
        Update: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_editable?: boolean | null
          is_system_parameter?: boolean | null
          parameter_key?: string
          parameter_type?: string | null
          parameter_value?: string | null
          updated_at?: string
          updated_by?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "system_parameters_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      turkey_address_sync: {
        Row: {
          created_at: string
          districts_count: number | null
          error_message: string | null
          id: string
          last_sync_date: string
          neighborhoods_count: number | null
          provinces_count: number | null
          sync_status: string | null
        }
        Insert: {
          created_at?: string
          districts_count?: number | null
          error_message?: string | null
          id?: string
          last_sync_date?: string
          neighborhoods_count?: number | null
          provinces_count?: number | null
          sync_status?: string | null
        }
        Update: {
          created_at?: string
          districts_count?: number | null
          error_message?: string | null
          id?: string
          last_sync_date?: string
          neighborhoods_count?: number | null
          provinces_count?: number | null
          sync_status?: string | null
        }
        Relationships: []
      }
      turkey_cities: {
        Row: {
          code: string | null
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      turkey_districts: {
        Row: {
          city_id: number | null
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          city_id?: number | null
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          city_id?: number | null
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "turkey_districts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "turkey_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      turkey_neighborhoods: {
        Row: {
          created_at: string | null
          district_id: number | null
          id: number
          name: string
          postal_code: string | null
        }
        Insert: {
          created_at?: string | null
          district_id?: number | null
          id?: number
          name: string
          postal_code?: string | null
        }
        Update: {
          created_at?: string | null
          district_id?: number | null
          id?: number
          name?: string
          postal_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turkey_neighborhoods_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "turkey_districts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_companies: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_owner: boolean | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_owner?: boolean | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_owner?: boolean | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_companies_company_id_fkey"
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
          is_super_admin: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          role_id: string | null
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          is_super_admin?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          role_id?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          is_super_admin?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          role_id?: string | null
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
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
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
      vehicle_contracts: {
        Row: {
          attachments: Json | null
          auto_renewal: boolean | null
          company_id: string | null
          contract_name: string
          contract_number: string
          contract_terms: string | null
          contract_type: string
          created_at: string | null
          currency: string | null
          end_date: string
          id: string
          monthly_cost: number | null
          notes: string | null
          payment_frequency: string | null
          payment_method: string | null
          provider_contact: string | null
          provider_email: string | null
          provider_name: string
          provider_phone: string | null
          renewal_notice_days: number | null
          special_conditions: string | null
          start_date: string
          status: string | null
          total_cost: number | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          attachments?: Json | null
          auto_renewal?: boolean | null
          company_id?: string | null
          contract_name: string
          contract_number: string
          contract_terms?: string | null
          contract_type: string
          created_at?: string | null
          currency?: string | null
          end_date: string
          id?: string
          monthly_cost?: number | null
          notes?: string | null
          payment_frequency?: string | null
          payment_method?: string | null
          provider_contact?: string | null
          provider_email?: string | null
          provider_name: string
          provider_phone?: string | null
          renewal_notice_days?: number | null
          special_conditions?: string | null
          start_date: string
          status?: string | null
          total_cost?: number | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          attachments?: Json | null
          auto_renewal?: boolean | null
          company_id?: string | null
          contract_name?: string
          contract_number?: string
          contract_terms?: string | null
          contract_type?: string
          created_at?: string | null
          currency?: string | null
          end_date?: string
          id?: string
          monthly_cost?: number | null
          notes?: string | null
          payment_frequency?: string | null
          payment_method?: string | null
          provider_contact?: string | null
          provider_email?: string | null
          provider_name?: string
          provider_phone?: string | null
          renewal_notice_days?: number | null
          special_conditions?: string | null
          start_date?: string
          status?: string | null
          total_cost?: number | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_contracts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_documents: {
        Row: {
          company_id: string | null
          created_at: string | null
          document_name: string
          document_type: string
          expiry_date: string | null
          file_url: string
          id: string
          issue_date: string | null
          issuer: string | null
          notes: string | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          document_name: string
          document_type: string
          expiry_date?: string | null
          file_url: string
          id?: string
          issue_date?: string | null
          issuer?: string | null
          notes?: string | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          document_name?: string
          document_type?: string
          expiry_date?: string | null
          file_url?: string
          id?: string
          issue_date?: string | null
          issuer?: string | null
          notes?: string | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_fuel: {
        Row: {
          company_id: string | null
          cost_per_liter: number
          created_at: string | null
          fuel_date: string
          fuel_station: string | null
          id: string
          liters: number
          mileage: number | null
          notes: string | null
          receipt_url: string | null
          total_cost: number
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          company_id?: string | null
          cost_per_liter: number
          created_at?: string | null
          fuel_date: string
          fuel_station?: string | null
          id?: string
          liters: number
          mileage?: number | null
          notes?: string | null
          receipt_url?: string | null
          total_cost: number
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          company_id?: string | null
          cost_per_liter?: number
          created_at?: string | null
          fuel_date?: string
          fuel_station?: string | null
          id?: string
          liters?: number
          mileage?: number | null
          notes?: string | null
          receipt_url?: string | null
          total_cost?: number
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_fuel_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_fuel_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_incidents: {
        Row: {
          attachments: Json | null
          company_id: string | null
          cost: number | null
          created_at: string | null
          description: string
          due_date: string | null
          fine_amount: number | null
          id: string
          incident_date: string
          incident_type: string
          location: string | null
          notes: string | null
          priority: string | null
          responsible_person: string | null
          status: string | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          attachments?: Json | null
          company_id?: string | null
          cost?: number | null
          created_at?: string | null
          description: string
          due_date?: string | null
          fine_amount?: number | null
          id?: string
          incident_date: string
          incident_type: string
          location?: string | null
          notes?: string | null
          priority?: string | null
          responsible_person?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          attachments?: Json | null
          company_id?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          fine_amount?: number | null
          id?: string
          incident_date?: string
          incident_type?: string
          location?: string | null
          notes?: string | null
          priority?: string | null
          responsible_person?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_incidents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_incidents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_maintenance: {
        Row: {
          company_id: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          maintenance_date: string
          maintenance_type: string
          mileage_at_maintenance: number | null
          next_maintenance_date: string | null
          next_maintenance_mileage: number | null
          notes: string | null
          service_provider: string | null
          status: string | null
          technician_id: string | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          company_id?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          maintenance_date: string
          maintenance_type: string
          mileage_at_maintenance?: number | null
          next_maintenance_date?: string | null
          next_maintenance_mileage?: number | null
          notes?: string | null
          service_provider?: string | null
          status?: string | null
          technician_id?: string | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          company_id?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          maintenance_date?: string
          maintenance_type?: string
          mileage_at_maintenance?: number | null
          next_maintenance_date?: string | null
          next_maintenance_mileage?: number | null
          notes?: string | null
          service_provider?: string | null
          status?: string | null
          technician_id?: string | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_maintenance_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_maintenance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          assigned_department: string | null
          assigned_driver_id: string | null
          brand: string
          color: string | null
          company_id: string | null
          created_at: string | null
          current_value: number | null
          engine_size: string | null
          fuel_type: string | null
          id: string
          inspection_date: string | null
          insurance_company: string | null
          insurance_end_date: string | null
          insurance_policy_number: string | null
          insurance_start_date: string | null
          location_address: string | null
          mileage: number | null
          model: string
          next_inspection_date: string | null
          notes: string | null
          plate_number: string
          purchase_date: string | null
          purchase_price: number | null
          status: string | null
          transmission: string | null
          updated_at: string | null
          vin_number: string | null
          year: number | null
        }
        Insert: {
          assigned_department?: string | null
          assigned_driver_id?: string | null
          brand: string
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          current_value?: number | null
          engine_size?: string | null
          fuel_type?: string | null
          id?: string
          inspection_date?: string | null
          insurance_company?: string | null
          insurance_end_date?: string | null
          insurance_policy_number?: string | null
          insurance_start_date?: string | null
          location_address?: string | null
          mileage?: number | null
          model: string
          next_inspection_date?: string | null
          notes?: string | null
          plate_number: string
          purchase_date?: string | null
          purchase_price?: number | null
          status?: string | null
          transmission?: string | null
          updated_at?: string | null
          vin_number?: string | null
          year?: number | null
        }
        Update: {
          assigned_department?: string | null
          assigned_driver_id?: string | null
          brand?: string
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          current_value?: number | null
          engine_size?: string | null
          fuel_type?: string | null
          id?: string
          inspection_date?: string | null
          insurance_company?: string | null
          insurance_end_date?: string | null
          insurance_policy_number?: string | null
          insurance_start_date?: string | null
          location_address?: string | null
          mileage?: number | null
          model?: string
          next_inspection_date?: string | null
          notes?: string | null
          plate_number?: string
          purchase_date?: string | null
          purchase_price?: number | null
          status?: string | null
          transmission?: string | null
          updated_at?: string | null
          vin_number?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_vehicles_assigned_driver"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_company_id_fkey"
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      warehouse_stock: {
        Row: {
          available_quantity: number | null
          company_id: string
          created_at: string
          id: string
          last_transaction_date: string | null
          max_stock_level: number | null
          min_stock_level: number | null
          notes: string | null
          product_id: string
          quantity: number
          reserved_quantity: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          available_quantity?: number | null
          company_id: string
          created_at?: string
          id?: string
          last_transaction_date?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          notes?: string | null
          product_id: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          available_quantity?: number | null
          company_id?: string
          created_at?: string
          id?: string
          last_transaction_date?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          notes?: string | null
          product_id?: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_warehouse_stocks"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "warehouse_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "product_warehouse_stocks"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "warehouse_stock_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          capacity: number | null
          capacity_unit: string | null
          city: string | null
          code: string | null
          company_id: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          district: string | null
          email: string | null
          id: string
          is_active: boolean | null
          manager_email: string | null
          manager_name: string | null
          manager_phone: string | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string | null
          updated_by: string | null
          warehouse_type: string | null
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          capacity_unit?: string | null
          city?: string | null
          code?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          district?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
          updated_by?: string | null
          warehouse_type?: string | null
        }
        Update: {
          address?: string | null
          capacity?: number | null
          capacity_unit?: string | null
          city?: string | null
          code?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          district?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
          updated_by?: string | null
          warehouse_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      wo_checklists: {
        Row: {
          company_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          is_required: boolean | null
          name: string
          result_json: Json | null
          schema_json: Json
          updated_at: string | null
          work_order_id: string | null
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          is_required?: boolean | null
          name: string
          result_json?: Json | null
          schema_json: Json
          updated_at?: string | null
          work_order_id?: string | null
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          is_required?: boolean | null
          name?: string
          result_json?: Json | null
          schema_json?: Json
          updated_at?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wo_checklists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wo_checklists_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      wo_files: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          location: unknown
          meta: Json | null
          mime_type: string | null
          storage_path: string
          tags: string[] | null
          uploaded_by: string | null
          work_order_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          location?: unknown
          meta?: Json | null
          mime_type?: string | null
          storage_path: string
          tags?: string[] | null
          uploaded_by?: string | null
          work_order_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          location?: unknown
          meta?: Json | null
          mime_type?: string | null
          storage_path?: string
          tags?: string[] | null
          uploaded_by?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wo_files_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wo_files_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      wo_logs: {
        Row: {
          action: string
          actor_id: string | null
          company_id: string | null
          created_at: string | null
          id: string
          location: unknown
          meta: Json | null
          new_values: Json | null
          note: string | null
          old_values: Json | null
          work_order_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          location?: unknown
          meta?: Json | null
          new_values?: Json | null
          note?: string | null
          old_values?: Json | null
          work_order_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          location?: unknown
          meta?: Json | null
          new_values?: Json | null
          note?: string | null
          old_values?: Json | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wo_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wo_logs_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      wo_notifications: {
        Row: {
          body: string
          company_id: string | null
          data: Json | null
          fcm_message_id: string | null
          fcm_sent: boolean | null
          fcm_sent_at: string | null
          id: string
          is_read: boolean | null
          notification_type: string
          read_at: string | null
          sent_at: string | null
          title: string
          user_id: string | null
          work_order_id: string | null
        }
        Insert: {
          body: string
          company_id?: string | null
          data?: Json | null
          fcm_message_id?: string | null
          fcm_sent?: boolean | null
          fcm_sent_at?: string | null
          id?: string
          is_read?: boolean | null
          notification_type: string
          read_at?: string | null
          sent_at?: string | null
          title: string
          user_id?: string | null
          work_order_id?: string | null
        }
        Update: {
          body?: string
          company_id?: string | null
          data?: Json | null
          fcm_message_id?: string | null
          fcm_sent?: boolean | null
          fcm_sent_at?: string | null
          id?: string
          is_read?: boolean | null
          notification_type?: string
          read_at?: string | null
          sent_at?: string | null
          title?: string
          user_id?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wo_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wo_notifications_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      wo_parts: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          is_returned: boolean | null
          meta: Json | null
          name: string
          product_id: string | null
          quantity: number
          return_reason: string | null
          serial_numbers: string[] | null
          sku: string | null
          total_price: number | null
          unit: string | null
          unit_price: number | null
          used_at: string | null
          used_by: string | null
          warehouse_location: string | null
          work_order_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_returned?: boolean | null
          meta?: Json | null
          name: string
          product_id?: string | null
          quantity?: number
          return_reason?: string | null
          serial_numbers?: string[] | null
          sku?: string | null
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
          used_at?: string | null
          used_by?: string | null
          warehouse_location?: string | null
          work_order_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_returned?: boolean | null
          meta?: Json | null
          name?: string
          product_id?: string | null
          quantity?: number
          return_reason?: string | null
          serial_numbers?: string[] | null
          sku?: string | null
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
          used_at?: string | null
          used_by?: string | null
          warehouse_location?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wo_parts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wo_parts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_warehouse_stocks"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "wo_parts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wo_parts_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      wo_time_entries: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          ended_at: string | null
          entry_type: string | null
          hourly_rate: number | null
          id: string
          is_billable: boolean | null
          location_end: unknown
          location_start: unknown
          started_at: string
          updated_at: string | null
          user_id: string | null
          work_order_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          entry_type?: string | null
          hourly_rate?: number | null
          id?: string
          is_billable?: boolean | null
          location_end?: unknown
          location_start?: unknown
          started_at: string
          updated_at?: string | null
          user_id?: string | null
          work_order_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          entry_type?: string | null
          hourly_rate?: number | null
          id?: string
          is_billable?: boolean | null
          location_end?: unknown
          location_start?: unknown
          started_at?: string
          updated_at?: string | null
          user_id?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wo_time_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wo_time_entries_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_operations: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          order_index: number | null
          status: string
          work_order_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          order_index?: number | null
          status?: string
          work_order_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          order_index?: number | null
          status?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_operations_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          asset_id: string | null
          assigned_at: string | null
          assigned_to: string | null
          bom_id: string | null
          code: string
          company_id: string | null
          created_at: string | null
          customer_contact_name: string | null
          customer_contact_phone: string | null
          customer_id: string | null
          description: string | null
          dispatcher_id: string | null
          id: string
          internal_notes: string | null
          location: unknown
          location_address: string | null
          priority: string
          scheduled_end: string | null
          scheduled_start: string | null
          service_type: string | null
          sla_due: string | null
          special_instructions: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          asset_id?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          bom_id?: string | null
          code: string
          company_id?: string | null
          created_at?: string | null
          customer_contact_name?: string | null
          customer_contact_phone?: string | null
          customer_id?: string | null
          description?: string | null
          dispatcher_id?: string | null
          id?: string
          internal_notes?: string | null
          location?: unknown
          location_address?: string | null
          priority?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          service_type?: string | null
          sla_due?: string | null
          special_instructions?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          asset_id?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          bom_id?: string | null
          code?: string
          company_id?: string | null
          created_at?: string | null
          customer_contact_name?: string | null
          customer_contact_phone?: string | null
          customer_id?: string | null
          description?: string | null
          dispatcher_id?: string | null
          id?: string
          internal_notes?: string | null
          location?: unknown
          location_address?: string | null
          priority?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          service_type?: string | null
          sla_due?: string | null
          special_instructions?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "boms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      product_warehouse_stocks: {
        Row: {
          product_id: string | null
          stock_quantity: number | null
          unit: string | null
          warehouse_code: string | null
          warehouse_id: string | null
          warehouse_name: string | null
        }
        Relationships: []
      }
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
      v_tasks: {
        Row: {
          assignee_id: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string | null
          opportunity_id: string | null
          order_rank: string | null
          priority: string | null
          related_item_id: string | null
          related_item_title: string | null
          related_item_type: string | null
          status: string | null
          title: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string | null
          opportunity_id?: string | null
          order_rank?: string | null
          priority?: string | null
          related_item_id?: string | null
          related_item_title?: string | null
          related_item_type?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string | null
          opportunity_id?: string | null
          order_rank?: string | null
          priority?: string | null
          related_item_id?: string | null
          related_item_title?: string | null
          related_item_type?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
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
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      api_remove_fcm_token: { Args: { p_device_id?: string }; Returns: Json }
      api_update_fcm_token: {
        Args: { p_device_id?: string; p_fcm_token: string; p_platform?: string }
        Returns: Json
      }
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
      base64_decode_with_padding: { Args: { data: string }; Returns: string }
      base64_encode_no_padding: { Args: { data: string }; Returns: string }
      calculate_next_recurrence_date: {
        Args: {
          base_date: string
          rec_day_of_month?: number
          rec_days?: number[]
          rec_interval?: number
          rec_type: string
        }
        Returns: string
      }
      check_po_approvals_completed: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      check_purchase_order_company: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      check_stock_status: {
        Args: { current_quantity: number; threshold: number }
        Returns: string
      }
      check_user_module_access: {
        Args: { _action?: string; _module: string; _user_id: string }
        Returns: boolean
      }
      clean_expired_email_confirmations: { Args: never; Returns: undefined }
      clean_expired_geocoding_cache: { Args: never; Returns: undefined }
      clean_token: { Args: { token: string }; Returns: string }
      complete_step_notification: {
        Args: { p_completion_data?: Json; p_notification_id: string }
        Returns: boolean
      }
      create_approval_workflow: {
        Args: {
          p_amount?: number
          p_company_id: string
          p_object_id: string
          p_object_type: string
        }
        Returns: undefined
      }
      create_company_for_user: { Args: { company_name: string }; Returns: Json }
      create_default_cashflow_categories: {
        Args: { company_uuid: string }
        Returns: undefined
      }
      create_default_expense_categories: {
        Args: { company_uuid: string }
        Returns: undefined
      }
      create_default_income_categories: {
        Args: { company_uuid: string }
        Returns: undefined
      }
      create_default_templates_for_company: {
        Args: { company_id_param: string }
        Returns: undefined
      }
      create_simple_jwt_token: {
        Args: { project_id: string; user_email: string; user_id: string }
        Returns: string
      }
      create_step_notification: {
        Args: {
          p_company_id?: string
          p_data?: Json
          p_service_request_id?: string
          p_step_description?: string
          p_step_name: string
          p_step_order?: number
          p_user_id: string
        }
        Returns: string
      }
      create_supplier_portal_session: {
        Args: { p_ip_address?: string; p_token: string; p_user_agent?: string }
        Returns: {
          company_id: string
          expires_at: string
          session_token: string
          supplier_id: string
        }[]
      }
      current_company_id: { Args: never; Returns: string }
      current_user_id: { Args: never; Returns: string }
      decode_simple_jwt_token: { Args: { token: string }; Returns: Json }
      delete_employee_with_cleanup: {
        Args: { employee_id_param: string }
        Returns: undefined
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      generate_document_number: {
        Args: { p_company_id: string; p_doc_type: string }
        Returns: string
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
      generate_order_number: { Args: never; Returns: string }
      generate_order_rank: {
        Args: { company_id_val: string; status_column: string }
        Returns: string
      }
      generate_recurring_service_instances: { Args: never; Returns: number }
      generate_work_order_code: { Args: never; Returns: string }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_cities: {
        Args: never
        Returns: {
          code: string
          id: number
          name: string
        }[]
      }
      get_deal_counts_by_status: {
        Args: never
        Returns: {
          count: number
          status: string
        }[]
      }
      get_districts_by_city: {
        Args: { city_id_param: number }
        Returns: {
          city_name: string
          id: number
          name: string
        }[]
      }
      get_full_address: {
        Args: {
          address_line_param?: string
          city_id_param?: number
          district_id_param?: number
          neighborhood_id_param?: number
        }
        Returns: string
      }
      get_jwt_secret: { Args: never; Returns: string }
      get_neighborhoods_by_district: {
        Args: { district_id_param: number }
        Returns: {
          city_name: string
          district_name: string
          id: number
          name: string
          postal_code: string
        }[]
      }
      get_next_revision_number: {
        Args: { p_parent_id: string }
        Returns: number
      }
      get_or_create_warehouse_stock: {
        Args: {
          p_company_id: string
          p_product_id: string
          p_warehouse_id: string
        }
        Returns: string
      }
      get_proposal_counts_by_status: {
        Args: never
        Returns: {
          count: number
          status: string
        }[]
      }
      get_user_company_context: {
        Args: never
        Returns: {
          company_id: string
          company_name: string
          user_id: string
        }[]
      }
      get_user_role_in_company: {
        Args: { target_company_id?: string; target_user_id: string }
        Returns: string
      }
      gettransactionid: { Args: never; Returns: unknown }
      has_role:
        | {
            Args: { required_role: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.has_role(required_role => text), public.has_role(required_role => user_role). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { required_role: Database["public"]["Enums"]["user_role"] }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.has_role(required_role => text), public.has_role(required_role => user_role). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      initialize_default_parameters: {
        Args: { target_company_id: string }
        Returns: undefined
      }
      is_super_admin: { Args: { user_id_param: string }; Returns: boolean }
      log_exchange_rate_schedule: { Args: never; Returns: undefined }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      record_audit_log: {
        Args: {
          action: string
          changes?: Json
          entity_id: string
          entity_type: string
        }
        Returns: undefined
      }
      remove_user_fcm_token: {
        Args: { p_device_id?: string; p_user_id: string }
        Returns: boolean
      }
      request_password_reset: { Args: { email: string }; Returns: undefined }
      seed_demo_modules: { Args: { p_company_id: string }; Returns: undefined }
      send_push_notification: {
        Args: { body: string; data?: Json; title: string; user_ids: string[] }
        Returns: undefined
      }
      set_config: { Args: { key: string; value: string }; Returns: undefined }
      setup_exchange_rate_cron: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
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
      unlockrows: { Args: { "": string }; Returns: number }
      update_cash_account_balance: {
        Args: { p_account_id: string; p_amount: number; p_type: string }
        Returns: undefined
      }
      update_order_totals: { Args: { order_uuid: string }; Returns: undefined }
      update_partner_account_balance: {
        Args: { amount_change: number; partner_account_id: string }
        Returns: undefined
      }
      update_user_fcm_token: {
        Args: {
          p_device_id?: string
          p_fcm_token: string
          p_platform?: string
          p_user_id: string
        }
        Returns: boolean
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      user_company_id: { Args: never; Returns: string }
      user_has_role_or_higher: {
        Args: { required_role: string; target_company_id?: string }
        Returns: boolean
      }
      validate_jwt_token: { Args: { token: string }; Returns: Json }
      verify_supplier_portal_session: {
        Args: { p_session_token: string }
        Returns: {
          company_id: string
          is_valid: boolean
          supplier_id: string
        }[]
      }
      verify_supplier_portal_token: {
        Args: { p_token: string }
        Returns: {
          company_id: string
          email: string
          is_valid: boolean
          supplier_id: string
        }[]
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
      gender_type: "male" | "female" | "other" | "erkek" | "kadın" | "diğer"
      invoice_status:
        | "pending"
        | "paid"
        | "partially_paid"
        | "overdue"
        | "cancelled"
      marital_status_type:
        | "single"
        | "married"
        | "divorced"
        | "widowed"
        | "bekar"
        | "evli"
        | "boşanmış"
        | "dul"
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
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
      gender_type: ["male", "female", "other", "erkek", "kadın", "diğer"],
      invoice_status: [
        "pending",
        "paid",
        "partially_paid",
        "overdue",
        "cancelled",
      ],
      marital_status_type: [
        "single",
        "married",
        "divorced",
        "widowed",
        "bekar",
        "evli",
        "boşanmış",
        "dul",
      ],
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
