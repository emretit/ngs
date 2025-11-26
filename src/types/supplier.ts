
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
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    position: string;
  } | null;
  balance: number;
  address: string | null;
  tax_number: string | null;
  tax_office: string | null;
  city: string | null;
  district: string | null;
  country: string | null;
  postal_code: string | null;
  apartment_number: string | null;
  unit_number: string | null;
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
  establishment_date: string | null;
  sector: string | null;
  supplier_segment: string | null;
  supplier_source: string | null;
  notes: string | null;
  first_contact_position: string | null;
  second_contact_name: string | null;
  second_contact_email: string | null;
  second_contact_phone: string | null;
  second_contact_position: string | null;
  second_address: string | null;
  second_city: string | null;
  second_district: string | null;
  second_country: string | null;
  second_postal_code: string | null;
  payment_terms: string | null;
  created_at: string;
  updated_at: string;
  company_id: string | null;
  // Portal alanları
  portal_enabled?: boolean;
  portal_email?: string | null;
  last_portal_login?: string | null;
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
  apartment_number: string;
  unit_number: string;
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
