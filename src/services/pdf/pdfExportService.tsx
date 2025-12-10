import { Document, pdf } from '@react-pdf/renderer';
import { supabase } from '@/integrations/supabase/client';
import { QuoteData, PdfTemplate, PdfExportOptions, TemplateSchema } from '@/types/pdf-template';
import PdfRenderer from '@/components/pdf/PdfRenderer';
import { validatePdfData } from '@/utils/pdfHelpers';
import { ServicePdfData, ServicePdfTemplate, ServiceTemplateSchema } from '@/types/service-template';
import ServicePdfRenderer from '@/components/pdf/ServicePdfRenderer';
import type { ServiceRequest } from '@/hooks/service/types';

export class PdfExportService {
  /**
   * Get current user's company_id
   */
  private static async getCurrentCompanyId(): Promise<string | null> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return null;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profile?.company_id) {
        return null;
      }

      return profile.company_id;
    } catch (error) {
      console.error('Error fetching company_id:', error);
      return null;
    }
  }

  /**
   * Create default templates for a company
   */
  static async createDefaultTemplates(companyId: string) {
    const defaultTemplates = [
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
          console.error(`Error creating default ${template.type} template:`, error);
        } else {
          results.push(data);
        }
      }
    }

    return results;
  }

  /**
   * Ensure default templates exist for current company
   */
  static async ensureDefaultTemplates() {
    const companyId = await this.getCurrentCompanyId();
    if (!companyId) {
      throw new Error('Şirket bilgisi bulunamadı');
    }

    // Check if templates exist
    const { data: existingTemplates } = await supabase
      .from('pdf_templates')
      .select('type')
      .eq('company_id', companyId);

    const existingTypes = new Set(existingTemplates?.map(t => t.type) || []);

    // Create missing templates - create all if none exist, or only missing ones
    if (existingTypes.size === 0) {
      // No templates exist, create all defaults
      await this.createDefaultTemplates(companyId);
    } else {
      // Some templates exist, create only missing ones
      const { data: allTemplates } = await supabase
        .from('pdf_templates')
        .select('type, name')
        .eq('company_id', companyId);

      const hasQuote = allTemplates?.some(t => t.type === 'quote' && t.name === 'Hazır Teklif Şablonu');
      const hasInvoice = allTemplates?.some(t => t.type === 'invoice' && t.name === 'Hazır Fatura Şablonu');

      if (!hasQuote || !hasInvoice) {
        await this.createDefaultTemplates(companyId);
      }
    }
  }

  /**
   * Transform Proposal to QuoteData format for PDF generation
   */
  static async transformProposalForPdf(proposal: any): Promise<QuoteData> {
    try {
      // Null kontrolü
      if (!proposal) {
        throw new Error('Teklif verisi bulunamadı');
      }
      // Müşteri verilerini çek
      let customer = null;
      if (proposal.customer) {
        customer = proposal.customer;
      } else if (proposal.customer_id) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', proposal.customer_id)
          .single();
        customer = customerData;
      } else {
        // Proposal'da direkt müşteri bilgileri varsa onları kullan
        customer = {
          name: proposal.customer_name || '',
          company: proposal.customer_company || '',
          email: proposal.customer_email || '',
          mobile_phone: proposal.mobile_phone || '',
          office_phone: proposal.office_phone || '',
          address: proposal.address || '',
          tax_number: proposal.tax_number || '',
          tax_office: proposal.tax_office || '',
        };
      }

      // Çalışan verilerini çek (Hazırlayan bilgisi için)
      let employee = null;
      let preparedBy = 'Belirtilmemiş';
      if (proposal.employee) {
        employee = proposal.employee;
        preparedBy = `${employee.first_name} ${employee.last_name}`;
      } else if (proposal.employee_id) {
        const { data: employeeData } = await supabase
          .from('employees')
          .select('first_name, last_name, email, phone, position')
          .eq('id', proposal.employee_id)
          .single();
        if (employeeData) {
          employee = employeeData;
          preparedBy = `${employeeData.first_name} ${employeeData.last_name}`;
        }
      } else if (proposal.employee_name) {
        preparedBy = proposal.employee_name;
      }

      // Teklif kalemlerini al (JSON formatında saklı)
      const items = proposal.items || [];

      // Totalleri hesapla - null güvenliği ile
      const subtotal = (items || []).reduce((sum: number, item: any) => {
        if (!item) return sum;
        const total = Number(item.total) || (Number(item.quantity || 0) * Number(item.unit_price || 0));
        return sum + (Number(total) || 0);
      }, 0);

      const totalTax = (items || []).reduce((sum: number, item: any) => {
        if (!item) return sum;
        const itemTotal = Number(item.total) || (Number(item.quantity || 0) * Number(item.unit_price || 0));
        const taxRate = Number(item.tax_rate) || 0;
        return sum + ((Number(itemTotal) || 0) * taxRate / 100);
      }, 0);

      const totalDiscount = (items || []).reduce((sum: number, item: any) => {
        if (!item) return sum;
        const itemTotal = Number(item.total) || (Number(item.quantity || 0) * Number(item.unit_price || 0));
        const discountRate = Number(item.discount_rate) || 0;
        return sum + ((Number(itemTotal) || 0) * discountRate / 100);
      }, 0);

      const totalAmount = subtotal + totalTax - totalDiscount;

      // QuoteData formatına dönüştür
      const quoteData: QuoteData = {
        id: proposal?.id || '',
        number: proposal?.number || proposal?.proposal_number || '',
        title: proposal?.title || '',
        description: proposal?.description || '',
        customer: customer ? {
          name: customer?.name || '',
          company: customer?.company || '',
          email: customer?.email || '',
          mobile_phone: customer?.mobile_phone || '',
          office_phone: customer?.office_phone || '',
          address: customer?.address || '',
          tax_number: customer?.tax_number || '',
          tax_office: customer?.tax_office || '',
        } : undefined,
        prepared_by: preparedBy,
        items: (items || []).map((item: any) => ({
          id: item?.id || item?.product_id || Math.random().toString(),
          description: item?.description || item?.name || '',
          quantity: Number(item?.quantity) || 1,
          unit_price: Number(item?.unit_price) || 0,
          unit: item?.unit || 'adet',
          tax_rate: Number(item?.tax_rate) || 0,
          discount_rate: Number(item?.discount_rate) || 0,
          total: Number(item?.total) || (Number(item?.quantity || 1) * Number(item?.unit_price || 0)) || 0,
          image_url: item?.image_url || undefined, // PDF export için ürün resmi
        })),
        subtotal: Number(subtotal) || 0,
        total_discount: Number(totalDiscount) || 0,
        total_tax: Number(totalTax) || 0,
        total_amount: Number(totalAmount) || 0,
        currency: proposal?.currency || 'TRY',
        valid_until: proposal?.valid_until || undefined,
        payment_terms: proposal?.payment_terms || undefined,
        delivery_terms: proposal?.delivery_terms || undefined,
        warranty_terms: proposal?.warranty_terms || undefined,
        price_terms: proposal?.price_terms || undefined, // Fiyat şartları
        other_terms: proposal?.other_terms || undefined, // Diğer şartlar
        notes: proposal?.notes || undefined,
        created_at: proposal?.created_at || new Date().toISOString(),
      };

      return quoteData;
    } catch (error) {
      console.error('Error transforming proposal for PDF:', error);
      throw new Error('Teklif PDF formatına dönüştürülürken hata oluştu: ' + (error as Error).message);
    }
  }

  /**
   * Get all PDF templates
   */
  static async getTemplates(type: 'quote' | 'invoice' | 'proposal' = 'quote') {
    const companyId = await this.getCurrentCompanyId();
    
    let query = supabase
      .from('pdf_templates')
      .select('*')
      .eq('type', type);

    if (companyId) {
      query = query.eq('company_id', companyId);
    } else {
      // Fallback: only show templates without company_id (legacy)
      query = query.is('company_id', null);
    }

    const { data, error } = await query
      .order('name');

    if (error) {
      console.error('Error fetching templates:', error);
      throw new Error('Şablonlar yüklenirken hata oluştu: ' + error.message);
    }

    // If no templates found and we have a company_id, create default templates
    if (data.length === 0 && companyId) {
      await this.createDefaultTemplates(companyId);
      // Retry fetching
      const { data: newData, error: retryError } = await supabase
        .from('pdf_templates')
        .select('*')
        .eq('type', type)
        .eq('company_id', companyId)
        .order('name');
      
      if (retryError) {
        throw new Error('Şablonlar yüklenirken hata oluştu: ' + retryError.message);
      }
      
      return (newData || []) as PdfTemplate[];
    }

    return data as PdfTemplate[];
  }

  /**
   * Get first available template for a type
   */
  static async getDefaultTemplate(type: 'quote' | 'invoice' | 'proposal' = 'quote') {
    const companyId = await this.getCurrentCompanyId();
    
    let query = supabase
      .from('pdf_templates')
      .select('*')
      .eq('type', type)
      .limit(1);

    if (companyId) {
      query = query.eq('company_id', companyId);
    } else {
      query = query.is('company_id', null);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      console.error('Error fetching template:', error);
      throw new Error('Şablon bulunamadı. Lütfen önce bir şablon oluşturun.');
    }

    return data as PdfTemplate;
  }

  /**
   * Get template by ID
   */
  static async getTemplate(id: string) {
    const { data, error } = await supabase
      .from('pdf_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching template:', error);
      throw new Error('Şablon bulunamadı: ' + error.message);
    }

    return data as PdfTemplate;
  }

  /**
   * Save or update a template
   */
  static async saveTemplate(template: Omit<PdfTemplate, 'id' | 'created_at' | 'updated_at'>, templateId?: string) {
    const companyId = await this.getCurrentCompanyId();
    
    let data, error;
    
    if (templateId) {
      // Update existing template
      ({ data, error } = await supabase
        .from('pdf_templates')
        .update(template)
        .eq('id', templateId)
        .select()
        .single());
    } else {
      // Create new template - ensure company_id is set
      const templateWithCompany = {
        ...template,
        company_id: companyId || template.company_id || null,
      };
      
      ({ data, error } = await supabase
        .from('pdf_templates')
        .insert(templateWithCompany)
        .select()
        .single());
    }

    if (error) {
      console.error('Error saving template:', error);
      throw new Error('Şablon kaydedilirken hata oluştu: ' + error.message);
    }

    return data as PdfTemplate;
  }


  /**
   * Delete a template
   */
  static async deleteTemplate(templateId: string) {
    const { error } = await supabase
      .from('pdf_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Error deleting template:', error);
      throw new Error('Şablon silinirken hata oluştu: ' + error.message);
    }

    return true;
  }

  /**
   * Generate PDF blob from quote data and template
   */
  static async generatePdf(quoteData: QuoteData, options?: { templateId?: string; template?: PdfTemplate }) {
    try {
      // Validate data before PDF generation
      const validation = validatePdfData(quoteData);
      if (!validation.isValid) {
        throw new Error(`PDF oluşturulamıyor. Eksik veriler: ${validation.missingFields.join(', ')}`);
      }

      // Get template if not provided
      let activeTemplate = options?.template;
      if (!activeTemplate && options?.templateId) {
        activeTemplate = await this.getTemplate(options.templateId);
      }
      if (!activeTemplate) {
        activeTemplate = await this.getDefaultTemplate('quote');
      }

      if (!activeTemplate) {
        throw new Error('Şablon bulunamadı. Lütfen önce bir şablon oluşturun.');
      }

      // Create React element for PDF
      try {
        // Validate schema_json
        if (!activeTemplate.schema_json) {
          throw new Error('Template şeması bulunamadı');
        }

        // Ensure schema is parsed object if it's a string
        let schema = activeTemplate.schema_json;
        if (typeof schema === 'string') {
          try {
            schema = JSON.parse(schema);
          } catch (parseError) {
            throw new Error('Template şeması geçersiz JSON formatında');
          }
        }

        console.log('Generating PDF with data:', {
          dataKeys: Object.keys(quoteData),
          customerName: quoteData.customer?.name,
          customerCompany: quoteData.customer?.company,
          itemsCount: quoteData.items?.length,
          schemaKeys: Object.keys(schema)
        });

        const pdfElement = (
          <PdfRenderer
            data={quoteData}
            schema={schema}
          />
        );

        // Generate PDF blob
        const blob = await pdf(pdfElement).toBlob();
        return blob;
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        throw new Error('PDF oluşturulamadı: ' + (pdfError as Error).message);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('PDF oluşturulurken hata oluştu: ' + (error as Error).message);
    }
  }

  /**
   * Open PDF in new tab
   */
  static async openPdfInNewTab(
    quoteData: QuoteData,
    options: PdfExportOptions = {}
  ) {
    try {
      const template = options.templateId 
        ? await this.getTemplate(options.templateId)
        : await this.getDefaultTemplate('quote');

      const blob = await this.generatePdf(quoteData, { template });
      
      // Create blob URL and open in new tab
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        // Fallback to download if popup blocked
        const link = document.createElement('a');
        link.href = url;
        link.download = options.filename || `teklif-${quoteData.number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Clean up blob URL after a delay to allow the new tab to load
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Error opening PDF:', error);
      throw new Error('PDF açılırken hata oluştu: ' + (error as Error).message);
    }
  }

  /**
   * Download PDF file
   */
  static async downloadPdf(
    quoteData: QuoteData,
    options: PdfExportOptions = {}
  ) {
    try {
      const template = options.templateId 
        ? await this.getTemplate(options.templateId)
        : await this.getDefaultTemplate('quote');

      const blob = await this.generatePdf(quoteData, { template });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = options.filename || `teklif-${quoteData.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * Upload PDF to Supabase Storage
   */
  static async uploadPdfToStorage(
    quoteData: QuoteData,
    options: PdfExportOptions = {}
  ) {
    try {
      const template = options.templateId 
        ? await this.getTemplate(options.templateId)
        : await this.getDefaultTemplate('quote');

      const blob = await this.generatePdf(quoteData, { template });
      
      // Generate file path
      const fileName = options.filename || `teklif-${quoteData.number}.pdf`;
      const storagePath = options.storagePath || `quotes/${fileName}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(storagePath, blob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (error) {
        console.error('Error uploading PDF:', error);
        throw new Error('PDF yüklenirken hata oluştu: ' + error.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(storagePath);

      return { 
        success: true, 
        path: data.path,
        url: urlData.publicUrl
      };
    } catch (error) {
      console.error('Error uploading PDF to storage:', error);
      throw error;
    }
  }

  /**
   * Transform proposal data to QuoteData format
   */
  static transformProposalToQuoteData(proposal: any, companySettings?: any): QuoteData {
    console.log('Transforming proposal to QuoteData:', {
      proposalKeys: Object.keys(proposal),
      proposalId: proposal.id,
      proposalNumber: proposal.number || proposal.proposal_number,
      customerExists: !!proposal.customer,
      customerKeys: proposal.customer ? Object.keys(proposal.customer) : [],
      itemsCount: proposal.items?.length || proposal.proposal_items?.length || 0
    });
    // Default company settings if not provided
    const defaultCompany = {
      name: companySettings?.company_name || 'Şirket Adı',
      address: companySettings?.company_address || '',
      phone: companySettings?.company_phone || '',
      email: companySettings?.company_email || '',
      tax_number: companySettings?.company_tax_number || '',
      tax_office: companySettings?.company_tax_office || '',
      logo_url: companySettings?.company_logo_url || null,
      website: companySettings?.company_website || ''
    };

    // Transform customer data with null safety
    const customer = {
      name: proposal.customer?.name || proposal.customer_name || 'Müşteri',
      company: proposal.customer?.company_name || proposal.customer?.company || '',
      email: proposal.customer?.email || '',
      mobile_phone: proposal.customer?.phone || proposal.customer?.mobile_phone || '',
      office_phone: proposal.customer?.office_phone || '',
      address: proposal.customer?.address || '',
      tax_number: proposal.customer?.tax_number || '',
      tax_office: proposal.customer?.tax_office || ''
    };

    // Transform proposal lines
    const proposalItems = proposal.proposal_items || proposal.items || [];
    const lines = proposalItems.length > 0 ? proposalItems.map((item: any) => ({
      id: item.id || '',
      description: item.product_name || item.name || item.description || '',
      quantity: Number(item.quantity) || 0,
      unit_price: Number(item.unit_price) || 0,
      unit: item.unit || '',
      tax_rate: Number(item.tax_rate || item.tax_percentage) || 18,
      discount_rate: Number(item.discount_percentage || item.discount_rate) || 0,
      total: Number(item.total_amount || item.total_price) || (Number(item.quantity) * Number(item.unit_price)),
      image_url: item.image_url || item.product?.image_url || null, // Ürün fotoğrafını PDF için aktar
    })) : [
      // Default empty item if no items exist
      {
        id: '1',
        description: 'Henüz kalem eklenmemiş',
        quantity: 0,
        unit_price: 0,
        unit: 'adet',
        tax_rate: 18,
        discount_rate: 0,
        total: 0,
        image_url: undefined
      }
    ];

    // Calculate totals from items if not provided in proposal
    let subtotal = Number(proposal.subtotal) || 0;
    let total_discount = Number(proposal.total_discount) || 0;
    let total_tax = Number(proposal.total_tax) || 0;
    let total_amount = Number(proposal.total_amount) || 0;

    // If totals are not available, calculate them from items
    if (subtotal === 0 && lines.length > 0) {
      subtotal = lines.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    }

    if (total_discount === 0 && lines.length > 0) {
      // Calculate total discount from items if available
      total_discount = lines.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unit_price;
        const itemDiscount = (itemTotal * item.discount_rate) / 100;
        return sum + itemDiscount;
      }, 0);
    }

    if (total_tax === 0 && lines.length > 0) {
      // Calculate total tax from items
      total_tax = lines.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unit_price;
        const itemDiscount = (itemTotal * item.discount_rate) / 100;
        const netAmount = itemTotal - itemDiscount;
        const itemTax = (netAmount * item.tax_rate) / 100;
        return sum + itemTax;
      }, 0);
    }

    if (total_amount === 0) {
      total_amount = subtotal - total_discount + total_tax;
    }

    return {
      id: proposal.id || '',
      number: proposal.proposal_number || proposal.number || '',
      title: proposal.title || '',
      description: proposal.description || '',
      customer,
      company: defaultCompany,
      items: lines,
      subtotal,
      total_discount,
      total_tax,
      total_amount,
      currency: proposal.currency || 'TRY',
      valid_until: proposal.valid_until || '',
      payment_terms: proposal.payment_terms || '',
      delivery_terms: proposal.delivery_terms || '',
      warranty_terms: proposal.warranty_terms || '',
      price_terms: proposal.price_terms || '', // Fiyat şartları
      other_terms: proposal.other_terms || '', // Diğer şartlar
      notes: proposal.notes || '',
      created_at: proposal.created_at || new Date().toISOString(),
      prepared_by: proposal.prepared_by || proposal.created_by || proposal.employee?.name || companySettings?.default_prepared_by || 'Sistem'
    };
  }

  /**
   * Get company settings for PDF header from companies table
   */
  static async getCompanySettings(): Promise<{
    company_name?: string;
    company_address?: string;
    company_phone?: string;
    company_email?: string;
    company_website?: string;
    company_logo_url?: string;
    company_tax_number?: string;
    company_tax_office?: string;
    company_city?: string;
    company_district?: string;
    company_country?: string;
    company_postal_code?: string;
    company_trade_registry_number?: string;
    company_mersis_number?: string;
    company_bank_name?: string;
    company_iban?: string;
    company_account_number?: string;
    default_currency?: string;
    default_prepared_by?: string;
  }> {
    try {
      console.log('getCompanySettings: Starting...'); // Debug
      const companyId = await this.getCurrentCompanyId();
      console.log('getCompanySettings: companyId =', companyId); // Debug
      
      if (!companyId) {
        console.warn('No company_id found for current user');
        return {};
      }

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .eq('is_active', true)
        .maybeSingle();

      console.log('getCompanySettings: Supabase query result:', { data, error }); // Debug

      if (error) {
        console.error('Error fetching company settings:', error);
        return {};
      }

      if (!data) {
        console.warn('No active company found for companyId:', companyId);
        return {};
      }

      // Map companies table fields to expected format
      const mappedData = {
        company_name: data.name || '',
        company_address: data.address || '',
        company_phone: data.phone || '',
        company_email: data.email || '',
        company_website: data.website || '',
        company_tax_number: data.tax_number || '',
        company_tax_office: data.tax_office || '',
        company_logo_url: data.logo_url || '',
        company_city: data.city || '',
        company_district: data.district || '',
        company_country: data.country || '',
        company_postal_code: data.postal_code || '',
        company_trade_registry_number: data.trade_registry_number || '',
        company_mersis_number: data.mersis_number || '',
        company_bank_name: data.bank_name || '',
        company_iban: data.iban || '',
        company_account_number: data.account_number || '',
        default_currency: data.default_currency || 'TRY',
        default_prepared_by: '', // Can be set from user profile if needed
      };
      
      console.log('getCompanySettings: Mapped data:', mappedData); // Debug
      return mappedData;
    } catch (error) {
      console.error('Error in getCompanySettings:', error);
      return {};
    }
  }

  /**
   * Transform service request to ServicePdfData format
   */
  static async transformServiceForPdf(service: ServiceRequest): Promise<ServicePdfData> {
    try {
      // Get customer data
      let customer: ServicePdfData['customer'] | undefined;
      if (service.customer_id) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('name, company, email, mobile_phone, address')
          .eq('id', service.customer_id)
          .single();

        if (customerData) {
          customer = {
            name: customerData.name || '',
            company: customerData.company || undefined,
            email: customerData.email || undefined,
            phone: customerData.mobile_phone || undefined,
            address: customerData.address || undefined,
          };
        }
      }

      // Get technician data
      let technician: ServicePdfData['technician'] | undefined;
      if (service.assigned_technician) {
        const { data: technicianData } = await supabase
          .from('employees')
          .select('first_name, last_name, email, mobile_phone')
          .eq('id', service.assigned_technician)
          .single();

        if (technicianData) {
          technician = {
            name: `${technicianData.first_name || ''} ${technicianData.last_name || ''}`.trim(),
            email: technicianData.email || undefined,
            phone: technicianData.mobile_phone || undefined,
          };
        }
      }

      // Get company settings
      const companySettings = await this.getCompanySettings();
      const company: ServicePdfData['company'] = {
        name: companySettings.company_name || '',
        address: companySettings.company_address || '',
        phone: companySettings.company_phone || '',
        email: companySettings.company_email || '',
        website: companySettings.company_website || undefined,
        logo_url: companySettings.company_logo_url || undefined,
        tax_number: companySettings.company_tax_number || undefined,
      };

      // Get parts from service_details if available
      const serviceDetails = service.service_details as any;
      const parts = serviceDetails?.parts_list || serviceDetails?.parts || [];

      // Get instructions from service_details if available
      const instructions = serviceDetails?.instructions || [];

      return {
        id: service.id,
        serviceNumber: service.service_number || `SR-${service.id.slice(-6).toUpperCase()}`,
        serviceTitle: service.service_title || '',
        serviceDescription: service.service_request_description || undefined,
        serviceType: service.service_type || undefined,
        priority: (service.service_priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
        status: service.service_status || '',
        estimatedDuration: service.estimated_duration || undefined,
        location: service.service_location || undefined,
        reportedDate: service.issue_date || service.created_at || undefined,
        dueDate: service.service_due_date || undefined,
        completedDate: service.completion_date || undefined,
        customer,
        technician,
        company,
        parts: parts.map((part: any, index: number) => ({
          id: part.id || `part-${index}`,
          name: part.name || part.part_name || '',
          quantity: Number(part.quantity) || 1,
          unit: part.unit || 'adet',
          unitPrice: Number(part.unit_price) || 0,
          total: Number(part.total) || (Number(part.quantity || 1) * Number(part.unit_price || 0)),
        })),
        instructions: Array.isArray(instructions) ? instructions : [],
        notes: serviceDetails?.notes || service.notes || undefined,
        technicianSignature: (service as any).technician_signature || undefined,
        customerSignature: (service as any).customer_signature || undefined,
        createdAt: service.created_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error transforming service for PDF:', error);
      throw new Error('Servis verisi PDF formatına dönüştürülemedi: ' + (error as Error).message);
    }
  }

  /**
   * Get service PDF templates
   * Note: service_templates table doesn't have schema_json, so we use default schema
   */
  static async getServiceTemplates(): Promise<ServicePdfTemplate[]> {
    const companyId = await this.getCurrentCompanyId();
    
    // Check if there's a service_pdf_templates table first
    let query = supabase
      .from('service_pdf_templates')
      .select('*')
      .eq('is_active', true);

    if (companyId) {
      query = query.eq('company_id', companyId);
    } else {
      query = query.is('company_id', null);
    }

    let { data, error } = await query.order('name');

    // If service_pdf_templates doesn't exist, try service_templates and use default schema
    if (error && error.code === '42P01') {
      // Table doesn't exist, use service_templates with default schema
      let fallbackQuery = supabase
        .from('service_templates')
        .select('*')
        .eq('is_active', true);

      if (companyId) {
        fallbackQuery = fallbackQuery.eq('company_id', companyId);
      } else {
        fallbackQuery = fallbackQuery.is('company_id', null);
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery.order('name');

      if (fallbackError) {
        console.error('Error fetching service templates:', fallbackError);
        throw new Error('Servis şablonları yüklenirken hata oluştu: ' + fallbackError.message);
      }

      // Import default schema
      const { defaultServiceTemplateSchema } = await import('@/types/service-template');
      
      // Transform to ServicePdfTemplate format with default schema
      return (fallbackData || []).map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        schema_json: defaultServiceTemplateSchema, // Use default schema
        is_active: template.is_active || true,
        company_id: template.company_id || '',
        created_by: template.created_by,
        created_at: template.created_at || new Date().toISOString(),
        updated_at: template.updated_at || new Date().toISOString(),
      })) as ServicePdfTemplate[];
    }

    if (error) {
      console.error('Error fetching service templates:', error);
      throw new Error('Servis şablonları yüklenirken hata oluştu: ' + error.message);
    }

    // Transform to ServicePdfTemplate format
    return (data || []).map((template: any) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      schema_json: template.schema_json || {},
      is_active: template.is_active,
      company_id: template.company_id,
      created_by: template.created_by,
      created_at: template.created_at,
      updated_at: template.updated_at,
    })) as ServicePdfTemplate[];
  }

  /**
   * Generate service PDF
   */
  static async generateServicePdf(
    serviceData: ServicePdfData,
    options?: { templateId?: string; template?: ServicePdfTemplate }
  ) {
    try {
      let activeTemplate: ServicePdfTemplate | null = null;

      if (options?.template) {
        activeTemplate = options.template;
      } else if (options?.templateId) {
        const { data, error } = await supabase
          .from('service_templates')
          .select('*')
          .eq('id', options.templateId)
          .single();

        if (error) {
          throw new Error('Şablon bulunamadı: ' + error.message);
        }

        activeTemplate = {
          id: data.id,
          name: data.name,
          description: data.description,
          schema_json: data.schema_json || {},
          is_active: data.is_active,
          company_id: data.company_id,
          created_by: data.created_by,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      } else {
        // Get default template
        const templates = await this.getServiceTemplates();
        activeTemplate = templates[0] || null;

        if (!activeTemplate) {
          throw new Error('Servis şablonu bulunamadı');
        }
      }

      if (!activeTemplate) {
        throw new Error('Servis şablonu bulunamadı');
      }

      // Parse schema if it's a string
      let schema = activeTemplate.schema_json;
      if (typeof schema === 'string') {
        try {
          schema = JSON.parse(schema);
        } catch (parseError) {
          throw new Error('Şablon şeması geçersiz JSON formatında');
        }
      }

      // Generate PDF using ServicePdfRenderer
      const pdfElement = (
        <ServicePdfRenderer
          data={serviceData}
          schema={schema as ServiceTemplateSchema}
        />
      );

      const blob = await pdf(pdfElement).toBlob();
      return blob;
    } catch (error) {
      console.error('Error generating service PDF:', error);
      throw new Error('Servis PDF oluşturulamadı: ' + (error as Error).message);
    }
  }

  /**
   * Open service PDF in new tab
   */
  static async openServicePdfInNewTab(
    serviceData: ServicePdfData,
    options: { templateId?: string; filename?: string } = {}
  ) {
    try {
      const blob = await this.generateServicePdf(serviceData, { templateId: options.templateId });
      
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        // Fallback to download if popup blocked
        const link = document.createElement('a');
        link.href = url;
        link.download = options.filename || `servis-${serviceData.serviceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Error opening service PDF:', error);
      throw new Error('Servis PDF açılırken hata oluştu: ' + (error as Error).message);
    }
  }

  /**
   * Transform service slip to ServicePdfData format
   * This is used for completed services with signatures
   */
  static async transformServiceSlipForPdf(service: ServiceRequest): Promise<ServicePdfData> {
    try {
      // Check if service is completed
      if (service.service_status !== 'completed') {
        throw new Error('Servis fişi sadece tamamlanmış servisler için oluşturulabilir');
      }

      // Get service slip data
      const serviceData = await this.transformServiceForPdf(service);
      
      // Add slip-specific data
      const serviceDetails = service.service_details as any;
      if (service.slip_number) {
        serviceData.serviceNumber = service.slip_number;
      }

      // Add completion date if available
      if (service.completion_date) {
        serviceData.completedDate = service.completion_date;
      }

      // Add signatures - these are already included in transformServiceForPdf
      // but we ensure they're set correctly here
      const serviceWithSignatures = service as any;
      if (serviceWithSignatures.technician_signature) {
        serviceData.technicianSignature = serviceWithSignatures.technician_signature;
      }
      if (serviceWithSignatures.customer_signature) {
        serviceData.customerSignature = serviceWithSignatures.customer_signature;
      }

      return serviceData;
    } catch (error) {
      console.error('Error transforming service slip for PDF:', error);
      throw new Error('Servis fişi PDF formatına dönüştürülemedi: ' + (error as Error).message);
    }
  }

}
