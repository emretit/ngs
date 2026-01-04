import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export const defaultTemplates = [
  {
    name: 'Hazır Teklif Şablonu',
    type: 'quote' as const,
    locale: 'tr' as const,
    is_default: false,
    version: 1,
    schema_json: {
      page: {
        size: 'A4' as const,
        padding: { top: 40, left: 40, right: 40, bottom: 40 },
        fontSize: 12,
      },
      header: {
        title: 'TEKLİF',
        titleFontSize: 18,
        showLogo: true,
        logoUrl: '',
        logoPosition: 'left' as const,
        logoSize: 80,
        showValidity: true,
        showCompanyInfo: true,
        companyName: '',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        companyWebsite: '',
        companyTaxNumber: '',
        companyInfoFontSize: 10,
      },
      lineTable: {
        columns: [
          { key: 'product_image', show: true, align: 'center' as const, label: 'Görsel' },
          { key: 'description', show: true, align: 'left' as const, label: 'Açıklama' },
          { key: 'quantity', show: true, align: 'center' as const, label: 'Miktar' },
          { key: 'unit_price', show: true, align: 'right' as const, label: 'Birim Fiyat' },
          { key: 'total', show: true, align: 'right' as const, label: 'Toplam' },
        ],
      },
      totals: {
        showGross: true,
        showDiscount: true,
        showTax: true,
        showNet: true,
      },
      notes: {
        intro: 'Bu teklif 30 gün geçerlidir.',
        introFontSize: 10,
        footer: 'İyi çalışmalar dileriz.',
        footerFontSize: 10,
        customFields: [],
      },
    },
  },
  {
    name: 'Hazır Fatura Şablonu',
    type: 'invoice' as const,
    locale: 'tr' as const,
    is_default: false,
    version: 1,
    schema_json: {
      page: {
        size: 'A4' as const,
        padding: { top: 40, left: 40, right: 40, bottom: 40 },
        fontSize: 12,
      },
      header: {
        title: 'FATURA',
        titleFontSize: 18,
        showLogo: true,
        logoUrl: '',
        logoPosition: 'left' as const,
        logoSize: 80,
        showValidity: false,
        showCompanyInfo: true,
        companyName: '',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        companyWebsite: '',
        companyTaxNumber: '',
        companyInfoFontSize: 10,
      },
      lineTable: {
        columns: [
          { key: 'product_image', show: true, align: 'center' as const, label: 'Görsel' },
          { key: 'description', show: true, align: 'left' as const, label: 'Açıklama' },
          { key: 'quantity', show: true, align: 'center' as const, label: 'Miktar' },
          { key: 'unit_price', show: true, align: 'right' as const, label: 'Birim Fiyat' },
          { key: 'total', show: true, align: 'right' as const, label: 'Toplam' },
        ],
      },
      totals: {
        showGross: true,
        showDiscount: true,
        showTax: true,
        showNet: true,
      },
      notes: {
        intro: '',
        introFontSize: 10,
        footer: 'Ödeme için teşekkür ederiz.',
        footerFontSize: 10,
        customFields: [],
      },
    },
  },
];

export async function createDefaultTemplates(companyId: string) {
  const results = [];
  for (const template of defaultTemplates) {
    // Check if template already exists for this company
    const { data: existing } = await supabase
      .from('pdf_templates')
      .select('id')
      .eq('company_id', companyId)
      .eq('type', template.type)
      .eq('name', template.name)
      .maybeSingle();

    if (!existing) {
      const { data, error } = await supabase
        .from('pdf_templates')
        .insert({
          ...template,
          company_id: companyId,
        })
        .select()
        .single();

      if (error) {
        logger.error(`Error creating default ${template.type} template`, error);
      } else {
        results.push(data);
      }
    }
  }

  return results;
}

