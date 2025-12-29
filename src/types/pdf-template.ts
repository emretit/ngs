export interface PageSettings {
  size: "A4" | "A3" | "LETTER";
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  fontSize: number;
  fontFamily?: "Roboto" | "Open Sans" | "Lato" | "Montserrat" | "Inter" | "Poppins" | "Nunito" | "Playfair Display" | "Merriweather" | "Source Sans Pro" | "Helvetica" | "Times-Roman" | "Courier";
  fontWeight?: "normal" | "bold";
  fontColor?: string; // Hex color code for text color (e.g., "#000000", "#374151")
  backgroundColor?: string; // Hex color code (e.g., "#FFFFFF", "#F9FAFB", "#F3F4F6")
  backgroundImage?: string; // URL to background image or preset name
  backgroundStyle?: "none" | "corner-wave" | "side-gradient" | "bottom-shapes" | "top-circles" | "diagonal-bands" | "corner-triangles" | "side-curves" | "custom";
  backgroundStyleColor?: string; // Color for background style elements
  backgroundOpacity?: number; // 0-100
}

export interface HeaderSettings {
  showLogo: boolean;
  logoUrl?: string;
  logoPosition: "left" | "center" | "right";
  logoSize: number;
  showTitle?: boolean;
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
  footer?: string; // HTML benzeri format destekler: <b>bold</b>, <i>italic</i>, <u>underline</u>
  footerFontSize: number;
  // Footer logo ayarları (header'daki logoyu kullanır)
  showFooterLogo?: boolean;
  footerLogoSize?: number;
  footerLogo?: {
    showLogo?: boolean;
    logoPosition?: 'left' | 'center' | 'right';
    logoSize?: number;
  };
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

export interface CustomerSettings {
  customerTitleFontSize?: number;
  customerInfoFontSize?: number;
}

export interface SignatureSettings {
  show?: boolean;
  showTechnician?: boolean;
  showCustomer?: boolean;
  technicianLabel?: string;
  customerLabel?: string;
  fontSize?: number;
}

export interface TemplateSchema {
  page: PageSettings;
  header: HeaderSettings;
  customer?: CustomerSettings;
  lineTable: LineTableSettings;
  totals: TotalsSettings;
  notes: NotesSettings;
  signatures?: SignatureSettings;
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
    image_url?: string;
    product?: {
      image_url?: string;
    };
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
  price_terms?: string;
  other_terms?: string;
  notes?: string;
  created_at: string;
}

export interface PdfExportOptions {
  templateId?: string;
  filename?: string;
  uploadToStorage?: boolean;
  storagePath?: string;
}
