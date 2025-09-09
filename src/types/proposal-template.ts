
import { ProposalItem } from "./proposal";

export interface TermOption {
  id: string;
  label: string;
  text: string;
  isDefault?: boolean;
  isCustom?: boolean;
}

export interface TemplateSection {
  id: string;
  type: 'header' | 'customer-info' | 'proposal-info' | 'items-table' | 'totals' | 'terms' | 'footer' | 'custom';
  title: string;
  enabled: boolean;
  order: number;
  settings: Record<string, any>;
  fields?: TemplateField[];
}

export interface TemplateField {
  id: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'image' | 'table';
  label: string;
  key: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  style?: {
    width?: string;
    alignment?: 'left' | 'center' | 'right';
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    color?: string;
  };
}

export interface TemplateDesignSettings {
  // Page Settings
  pageSize: 'A4' | 'A3' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Header Settings
  header: {
    enabled: boolean;
    height: number;
    logoPosition: 'left' | 'center' | 'right';
    logoSize: 'small' | 'medium' | 'large';
    showCompanyInfo: boolean;
    backgroundColor: string;
    textColor: string;
  };
  
  // Footer Settings
  footer: {
    enabled: boolean;
    height: number;
    showPageNumbers: boolean;
    showContactInfo: boolean;
    backgroundColor: string;
    textColor: string;
  };
  
  // Colors & Typography
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    border: string;
  };
  
  fonts: {
    primary: string;
    secondary: string;
    sizes: {
      title: number;
      heading: number;
      body: number;
      small: number;
    };
  };
  
  // Table Settings
  table: {
    headerBackground: string;
    headerText: string;
    rowAlternating: boolean;
    borderColor: string;
    borderWidth: number;
  };
  
  // Layout Settings
  layout: {
    spacing: 'compact' | 'normal' | 'spacious';
    showBorders: boolean;
    roundedCorners: boolean;
    shadowEnabled: boolean;
  };

  // Visual Editor Settings
  branding: {
    logo?: string;
    companyName: string;
    tagline?: string;
    website?: string;
  };

  // Section Layout
  sections: TemplateSection[];
}

export interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  templateType: string;
  templateFeatures: string[];
  items: ProposalItem[];
  designSettings?: TemplateDesignSettings;
  prefilledFields?: {
    title?: string;
    validityDays?: number;
    paymentTerm?: string;
    internalNotes?: string;
  };
  // Şablon şart seçenekleri
  availableTerms?: {
    payment?: TermOption[];
    pricing?: TermOption[];
    warranty?: TermOption[];
    delivery?: TermOption[];
  };
  // Enhanced fields for better UX
  popularity?: number;
  estimatedTime?: string;
  usageCount?: string;
  isRecommended?: boolean;
  tags?: string[];
  previewImage?: string;
  created_at?: string;
  updated_at?: string;
}
