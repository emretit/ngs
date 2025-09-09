
export type PaymentType = "havale" | "eft" | "kredi_karti" | "nakit";
export type PaymentStatus = "pending" | "completed" | "cancelled" | "refunded";
export type PaymentDirection = "incoming" | "outgoing";

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_type: PaymentType;
  payment_date: string;
  description: string | null;
  status: PaymentStatus;
  bank_account_id: string;
  customer_id: string | null;
  supplier_id: string | null;
  payment_direction: PaymentDirection;
  recipient_name: string;
  created_at: string;
  updated_at: string;
  bank_accounts?: {
    bank_name: string;
    account_name: string;
  };
}
