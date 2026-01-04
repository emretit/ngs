import { supabase } from '@/integrations/supabase/client';
import { PdfTemplate } from '@/types/pdf-template';
import { ServicePdfTemplate } from '@/types/service-template';
import { defaultServiceTemplateSchema } from '@/types/service-template';
import { logger } from '@/utils/logger';
import { createDefaultTemplates as createDefaults } from '../templates/defaultTemplates';

/**
 * Get current user's company_id
 */
async function getCurrentCompanyId(): Promise<string | null> {
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
    logger.error("Error fetching company_id", error);
    return null;
  }
}

/**
 * Create default templates for a company
 */
export async function createDefaultTemplates(companyId: string) {
  return createDefaults(companyId);
}

/**
 * Ensure default templates exist for current company
 */
export async function ensureDefaultTemplates() {
  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    throw new Error('Şirket bilgisi bulunamadı');
  }

  const { data: existingTemplates } = await supabase
    .from('pdf_templates')
    .select('type')
    .eq('company_id', companyId);

  const existingTypes = new Set(existingTemplates?.map(t => t.type) || []);

  if (existingTypes.size === 0) {
    await createDefaultTemplates(companyId);
  } else {
    const { data: allTemplates } = await supabase
      .from('pdf_templates')
      .select('type, name')
      .eq('company_id', companyId);

    const hasQuote = allTemplates?.some(t => t.type === 'quote' && t.name === 'Hazır Teklif Şablonu');
    const hasInvoice = allTemplates?.some(t => t.type === 'invoice' && t.name === 'Hazır Fatura Şablonu');

    if (!hasQuote || !hasInvoice) {
      await createDefaultTemplates(companyId);
    }
  }
}

/**
 * Get all PDF templates
 */
export async function getTemplates(type: 'quote' | 'invoice' | 'proposal' = 'quote'): Promise<PdfTemplate[]> {
  const companyId = await getCurrentCompanyId();
  
  let query = supabase
    .from('pdf_templates')
    .select('*')
    .eq('type', type);

  if (companyId) {
    query = query.eq('company_id', companyId);
  } else {
    query = query.is('company_id', null);
  }

  const { data, error } = await query.order('name');

  if (error) {
    logger.error("Error fetching templates", error);
    throw new Error('Şablonlar yüklenirken hata oluştu: ' + error.message);
  }

  // If no templates found and we have a company_id, create defaults
  if (data.length === 0 && companyId) {
    await createDefaultTemplates(companyId);
    
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
export async function getDefaultTemplate(type: 'quote' | 'invoice' | 'proposal' = 'quote'): Promise<PdfTemplate> {
  const companyId = await getCurrentCompanyId();
  
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
    logger.error("Error fetching template", error);
    throw new Error('Şablon bulunamadı. Lütfen önce bir şablon oluşturun.');
  }

  return data as PdfTemplate;
}

/**
 * Get template by ID
 */
export async function getTemplate(id: string): Promise<PdfTemplate> {
  const { data, error } = await supabase
    .from('pdf_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error("Error fetching template", error);
    throw new Error('Şablon bulunamadı: ' + error.message);
  }

  return data as PdfTemplate;
}

/**
 * Save or update a template
 */
export async function saveTemplate(
  template: Omit<PdfTemplate, 'id' | 'created_at' | 'updated_at'>,
  templateId?: string
): Promise<PdfTemplate> {
  const companyId = await getCurrentCompanyId();
  
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
    // Create new template
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
    logger.error("Error saving template", error);
    throw new Error('Şablon kaydedilirken hata oluştu: ' + error.message);
  }

  return data as PdfTemplate;
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string): Promise<boolean> {
  const { error } = await supabase
    .from('pdf_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    logger.error("Error deleting template", error);
    throw new Error('Şablon silinirken hata oluştu: ' + error.message);
  }

  return true;
}

/**
 * Get service PDF templates
 */
export async function getServiceTemplates(): Promise<ServicePdfTemplate[]> {
  const companyId = await getCurrentCompanyId();
  
  logger.debug("[getServiceTemplates] companyId", companyId);
  
  if (!companyId) {
    logger.warn("[getServiceTemplates] companyId not found");
    return [];
  }

  let query = supabase
    .from('service_templates')
    .select('*')
    .eq('company_id', companyId)
    .order('usage_count', { ascending: false })
    .order('created_at', { ascending: false });

  let { data, error } = await query;

  logger.debug("[getServiceTemplates] Query result", { 
    dataCount: data?.length || 0, 
    error: error?.message,
    templateNames: data?.map((t: any) => t.name) || []
  });

  if (error) {
    logger.error("[getServiceTemplates] Error fetching service PDF templates", error);
    return [];
  }

  // Transform to ServicePdfTemplate format
  return (data || []).map((template: any) => {
    let pdfSchema = {};
    if (template.service_details?.pdf_schema) {
      pdfSchema = template.service_details.pdf_schema;
    } else if (template.service_details && typeof template.service_details === 'object') {
      pdfSchema = template.service_details;
    }
    
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      schema_json: pdfSchema,
      is_active: template.is_active !== false,
      company_id: template.company_id,
      created_by: template.created_by,
      created_at: template.created_at,
      updated_at: template.updated_at,
    };
  }) as ServicePdfTemplate[];
}

/**
 * Get company settings for PDF header
 */
export async function getCompanySettings(): Promise<{
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
    logger.debug("getCompanySettings: Starting");
    const companyId = await getCurrentCompanyId();
    logger.debug("getCompanySettings: companyId", { companyId });
    
    if (!companyId) {
      logger.warn("No company_id found for current user");
      return {};
    }

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .eq('is_active', true)
      .maybeSingle();

    logger.debug("getCompanySettings: Supabase query result", { data, error });

    if (error) {
      logger.error("Error fetching company settings", error);
      return {};
    }

    if (!data) {
      logger.warn("No active company found for companyId", companyId);
      return {};
    }

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
      default_prepared_by: '',
    };
    
    logger.debug("getCompanySettings: Mapped data", { mappedData });
    return mappedData;
  } catch (error) {
    logger.error("Error in getCompanySettings", error);
    return {};
  }
}


