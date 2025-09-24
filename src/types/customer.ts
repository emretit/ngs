
export interface Customer {
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
  city: string | null;
  district: string | null;
  country: string | null;
  postal_code: string | null;
  fax: string | null;
  website: string | null;
  bank_name: string | null;
  iban: string | null;
  account_number: string | null;
  trade_registry_number: string | null;
  mersis_number: string | null;
  tax_number: string | null;
  tax_office: string | null;
  is_einvoice_mukellef: boolean;
  einvoice_alias_name: string | null;
  einvoice_company_name: string | null;
  einvoice_tax_office: string | null;
  einvoice_address: string | null;
  einvoice_city: string | null;
  einvoice_district: string | null;
  einvoice_mersis_no: string | null;
  einvoice_sicil_no: string | null;
  einvoice_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
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
