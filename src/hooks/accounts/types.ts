// Shared types for account-related hooks
export interface CashAccount {
  id: string;
  name: string;
  description?: string;
  current_balance: number;
  currency: string;
  is_active: boolean;
  location?: string;
  responsible_person?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  branch_name?: string;
  account_type: string;
  account_number: string;
  iban: string;
  swift_code?: string;
  currency: string;
  current_balance: number;
  available_balance: number;
  credit_limit?: number;
  interest_rate?: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreditCard {
  id: string;
  card_name: string;
  card_number: string;
  card_type: string;
  bank_name: string;
  current_balance: number;
  credit_limit: number;
  available_limit: number;
  status: string;
  expiry_date: string;
  currency: string;
  payment_due_date?: string;
  minimum_payment?: number;
  last_payment_date?: string;
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PartnerAccount {
  id: string;
  partner_name: string;
  partner_type: string;
  current_balance: number;
  initial_capital: number;
  profit_share: number;
  ownership_percentage: number;
  currency: string;
  is_active: boolean;
  investment_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  account_id?: string;
  card_id?: string;
  partner_id?: string;
  amount: number;
  type: "income" | "expense";
  transaction_type?: string;
  description: string;
  category?: string;
  merchant_name?: string;
  merchant_category?: string;
  transaction_date: string;
  reference?: string;
  created_at?: string;
  updated_at?: string;
  customer_name?: string;
  supplier_name?: string;
  payment_direction?: string;
  payment_type?: string;
  user_name?: string | null;
}

export interface TransferTransaction {
  id: string;
  from_account_type: string;
  from_account_id: string;
  to_account_type: string;
  to_account_id: string;
  amount: number;
  currency: string;
  description?: string;
  transfer_date: string;
  created_at: string;
  updated_at: string;
  from_account_name?: string;
  to_account_name?: string;
}

export interface PaymentAccount {
  id: string;
  label: string;
}
