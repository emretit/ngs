
export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  mobile_phone: string | null;
  office_phone: string | null;
  company: string | null;
  type: "bireysel" | "kurumsal";
  status: "aktif" | "pasif" | "potansiyel";
  representative: string | null;
  balance: number;
  address: string | null;
  tax_number: string | null;
  tax_office: string | null;
  city: string | null;
  district: string | null;
  country: string | null;
  postal_code: string | null;
  fax: string | null;
  website: string | null;
  is_active: boolean;
  payee_financial_account_id: string | null;
  payment_means_channel_code: string | null;
  payment_means_code: string | null;
  aliases: Array<{
    alias: string;
    alias_type: number;
    type: number;
  }> | null;
  einvoice_alias_name: string | null;
  created_at: string;
  updated_at: string;
  company_id: string | null;
}

export interface SupplierFormData {
  name: string;
  email: string;
  mobile_phone: string;
  office_phone: string;
  company: string;
  type: "bireysel" | "kurumsal";
  status: "aktif" | "pasif" | "potansiyel";
  representative: string;
  balance: number;
  address: string;
  tax_number: string;
  tax_office: string;
  city: string;
  district: string;
  country: string;
  postal_code: string;
  fax: string;
  website: string;
  is_active: boolean;
  payee_financial_account_id: string;
  payment_means_channel_code: string;
  payment_means_code: string;
  aliases: Array<{
    alias: string;
    alias_type: number;
    type: number;
  }>;
  einvoice_alias_name: string;
}
