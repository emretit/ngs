
export type PaymentType = "havale" | "eft" | "kredi_karti" | "nakit" | "hesap" | "cek" | "senet";
export type PaymentStatus = "pending" | "completed" | "cancelled" | "refunded";
export type PaymentDirection = "incoming" | "outgoing";

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_type: PaymentType;
  payment_date: string;
  description: string | null;
  account_id: string | null;
  customer_id: string | null;
  supplier_id: string | null;
  company_id: string | null;
  payment_direction: PaymentDirection;
  recipient_name: string | null;
  reference_note?: string | null;
  created_at: string;
  updated_at: string;
  accounts?: {
    name: string;
    account_type: string;
    bank_name?: string;
  };
}
