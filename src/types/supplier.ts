
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
  einvoice_alias_name: string;
}
