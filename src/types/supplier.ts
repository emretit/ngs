
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
  bank_name: string | null;
  iban: string | null;
  account_number: string | null;
  trade_registry_number: string | null;
  mersis_number: string | null;
  last_interaction: string | null;
  is_einvoice_mukellef: boolean;
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
  // İkinci yetkili kişi bilgileri
  second_contact_name: string;
  second_contact_email: string;
  second_contact_phone: string;
  second_contact_position: string;
  // İkinci adres bilgileri
  second_address: string;
  second_city: string;
  second_district: string;
  second_country: string;
  second_postal_code: string;
  // Finansal bilgiler
  bank_name: string;
  iban: string;
  account_number: string;
  payment_terms: string;
  // Şirket detay bilgileri
  trade_registry_number: string;
  mersis_number: string;
  establishment_date: string;
  sector: string;
  supplier_segment: string;
  supplier_source: string;
  // Notlar
  notes: string;
  // İlk yetkili kişi pozisyonu
  first_contact_position: string;
}
