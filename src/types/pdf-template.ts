export interface PageSettings {
  size: "A4" | "A3" | "LETTER";
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  fontSize: number;
  fontFamily?: "Roboto" | "Helvetica" | "Times-Roman" | "Courier";
  backgroundColor?: string; // Hex color code (e.g., "#FFFFFF", "#F9FAFB", "#F3F4F6")
}

export interface HeaderSettings {
  showLogo: boolean;
  logoUrl?: string;
  logoPosition: "left" | "center" | "right";
  logoSize: number;
  title: string;
  titleFontSize: number;
  showValidity: boolean;
  showCompanyInfo: boolean;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  companyTaxNumber: string;
  companyInfoFontSize: number;
}



export interface ColumnSettings {
  key: string;
  label: string;
  show: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface LineTableSettings {
  columns: ColumnSettings[];
  showRowNumber?: boolean; // Sıra numarası göster/gizle
}

export interface TotalsSettings {
  showGross: boolean;
  showDiscount: boolean;
  showTax: boolean;
  showNet: boolean;
}

export interface CustomTextField {
  id: string;
  label: string;
  text: string;
  position: "header" | "footer" | "before-table" | "after-table";
  style?: {
    fontSize?: number;
    align?: "left" | "center" | "right";
    bold?: boolean;
    color?: string;
  };
}

export interface NotesSettings {
  footer?: string;
  footerFontSize: number;
  // Şartlar ve Koşullar göster/gizle ayarları
  termsSettings?: {
    showPaymentTerms: boolean;
    showDeliveryTerms: boolean;
    showWarrantyTerms: boolean;
    showPriceTerms: boolean;
    showOtherTerms: boolean;
    titleAlign?: 'left' | 'center' | 'right'; // Başlık hizalama
  };
}

export interface TemplateSchema {
  page: PageSettings;
  header: HeaderSettings;
  lineTable: LineTableSettings;
  totals: TotalsSettings;
  notes: NotesSettings;
}

export interface PdfTemplate {
  id: string;
  name: string;
  type: "quote" | "invoice" | "proposal";
  locale: "tr" | "en";
  schema_json: TemplateSchema;
  version: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  company_id?: string | null;
}

export interface QuoteData extends Record<string, unknown> {
  id?: string;
  number: string;
  title: string;
  description?: string;
  customer?: {
    name: string;
    company?: string;
    email?: string;
    mobile_phone?: string;
    office_phone?: string;
    address?: string;
    tax_number?: string;
    tax_office?: string;
  };
  employee?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  prepared_by?: string;
  company?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    tax_number?: string;
    tax_office?: string;
    logo_url?: string;
    website?: string;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    unit?: string;
    tax_rate?: number;
    discount_rate?: number;
    total: number;
  }>;
  subtotal: number;
  total_discount?: number;
  total_tax: number;
  total_amount: number;
  currency: string;
  valid_until?: string;
  payment_terms?: string;
  delivery_terms?: string;
  warranty_terms?: string;
  notes?: string;
  created_at: string;
}

export interface PdfExportOptions {
  templateId?: string;
  filename?: string;
  uploadToStorage?: boolean;
  storagePath?: string;
}
