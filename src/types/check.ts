export interface Check {
  id: string;
  check_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  bank: string;
  issuer_name?: string;
  payee: string;
  status: string;
  notes?: string;
  created_at: string;
  check_type?: 'incoming' | 'outgoing';
  company_id?: string;
  issuer_customer_id?: string;
  issuer_supplier_id?: string;
  payee_customer_id?: string;
  payee_supplier_id?: string;
  portfolio_status?: string;
  transferred_to_supplier_id?: string;
  transferred_date?: string;
  updated_at?: string;
}

