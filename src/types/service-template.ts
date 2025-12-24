import { PageSettings, HeaderSettings, NotesSettings } from './pdf-template';

/**
 * Service Template PDF Schema - Flutter ile uyumlu yapı
 * Dokümantasyon: docs/flutter-template-integration.md
 */
export interface ServiceTemplateSchema {
  page: {
    size: 'A4';
    padding: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    fontSize: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold';
    fontColor?: string;
    backgroundColor?: string;
  };
  header: {
    showLogo: boolean;
    logoUrl?: string;
    logoPosition: 'left' | 'center' | 'right';
    logoSize: number;
    showTitle: boolean;
    title: string;
    titleFontSize: number;
    showCompanyInfo: boolean;
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyEmail: string;
    companyWebsite: string;
    companyTaxNumber: string;
    companyInfoFontSize: number;
  };
  serviceInfo: {
    titleFontSize: number;
    infoFontSize: number;
    showServiceNumber: boolean;
    showServiceStatus: boolean;
    showTechnician: boolean;
    showServiceType: boolean;
    showDates: boolean;
  };
  partsTable: {
    show: boolean;
    columns: Array<{
      key: string;
      label: string;
      show: boolean;
      align: 'left' | 'center' | 'right';
    }>;
    showRowNumber: boolean;
  };
  signatures: {
    show: boolean;
    showTechnician: boolean;
    showCustomer: boolean;
    technicianLabel: string;
    customerLabel: string;
    fontSize: number;
  };
  notes: {
    footer: string;
    footerFontSize: number;
    showFooterLogo?: boolean;
  };
}

export interface ServicePdfData {
  id: string;
  serviceNumber: string;
  serviceTitle: string;
  serviceDescription?: string;
  serviceResult?: string;
  serviceType?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  estimatedDuration?: number;
  location?: string;
  reportedDate?: string;
  dueDate?: string;
  completedDate?: string;
  customer?: {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  technician?: {
    name: string;
    email?: string;
    phone?: string;
  };
  company?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo_url?: string;
    tax_number?: string;
  };
  parts?: Array<{
    id: string;
    name: string;
    quantity: number;
    unit?: string;
    unitPrice?: number;
    total?: number;
  }>;
  instructions?: string[];
  notes?: string;
  technicianSignature?: string; // Base64 image URL
  customerSignature?: string; // Base64 image URL
  createdAt: string;
}

export interface ServicePdfTemplate {
  id: string;
  name: string;
  description?: string;
  schema_json: ServiceTemplateSchema;
  is_active: boolean;
  company_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Default Service Template Schema - Flutter ile uyumlu
 * Dokümantasyon: docs/flutter-template-integration.md
 */
export const defaultServiceTemplateSchema: ServiceTemplateSchema = {
  page: {
    size: 'A4',
    padding: { top: 40, right: 40, bottom: 40, left: 40 },
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: 'normal',
    fontColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  header: {
    showLogo: true,
    logoUrl: undefined,
    logoPosition: 'left',
    logoSize: 80,
    showTitle: true,
    title: 'SERVİS FORMU',
    titleFontSize: 18,
    showCompanyInfo: true,
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    companyTaxNumber: '',
    companyInfoFontSize: 10,
  },
  serviceInfo: {
    titleFontSize: 14,
    infoFontSize: 10,
    showServiceNumber: true,
    showServiceStatus: true,
    showTechnician: true,
    showServiceType: true,
    showDates: true,
  },
  partsTable: {
    show: true,
    columns: [
      { key: 'name', label: 'Ürün Adı', show: true, align: 'left' },
      { key: 'quantity', label: 'Miktar', show: true, align: 'center' },
      { key: 'unit', label: 'Birim', show: true, align: 'center' },
      { key: 'unitPrice', label: 'Birim Fiyat', show: true, align: 'right' },
      { key: 'total', label: 'Toplam', show: true, align: 'right' },
    ],
    showRowNumber: true,
  },
  signatures: {
    show: true,
    showTechnician: true,
    showCustomer: true,
    technicianLabel: 'Teknisyen',
    customerLabel: 'Müşteri',
    fontSize: 10,
  },
  notes: {
    footer: 'Servis hizmeti için teşekkür ederiz.',
    footerFontSize: 10,
    showFooterLogo: false,
  },
};

export const sampleServicePdfData: ServicePdfData = {
  id: 'sample-1',
  serviceNumber: 'SRV-2024-001',
  serviceTitle: 'Yıllık Bakım Hizmeti',
  serviceDescription: 'Klimaların yıllık periyodik bakımı ve filtre değişimi işlemleri.',
  serviceResult: 'Servis başarıyla tamamlandı. Tüm filtreler değiştirildi ve sistem test edildi. Müşteri memnuniyeti sağlandı.',
  serviceType: 'Bakım',
  priority: 'medium',
  status: 'in_progress',
  estimatedDuration: 120,
  location: 'Ana Ofis - 3. Kat',
  reportedDate: new Date().toISOString(),
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  customer: {
    name: 'Ahmet Yılmaz',
    company: 'ABC Teknoloji A.Ş.',
    email: 'ahmet@abc.com',
    phone: '+90 532 123 4567',
    address: 'Atatürk Cad. No:123, Kadıköy, İstanbul',
  },
  technician: {
    name: 'Mehmet Demir',
    email: 'mehmet@servis.com',
    phone: '+90 533 987 6543',
  },
  company: {
    name: 'NGS Teknoloji',
    address: 'Levent, İstanbul',
    phone: '+90 212 555 0123',
    email: 'info@ngs.com',
    website: 'www.ngs.com',
  },
  parts: [
    { id: '1', name: 'Klima Filtresi', quantity: 4, unit: 'Adet', unitPrice: 150, total: 600 },
    { id: '2', name: 'Temizlik Solüsyonu', quantity: 2, unit: 'Litre', unitPrice: 75, total: 150 },
    { id: '3', name: 'Bakım Kiti', quantity: 1, unit: 'Set', unitPrice: 250, total: 250 },
  ],
  instructions: [
    'Klimaların dış ünitelerini kontrol edin',
    'Filtreleri çıkarın ve temizleyin veya değiştirin',
    'Soğutucu gaz seviyesini kontrol edin',
    'Elektrik bağlantılarını kontrol edin',
    'Test çalıştırması yapın',
  ],
  notes: 'Müşteri öğleden sonra müsait olacaktır.',
  createdAt: new Date().toISOString(),
};
