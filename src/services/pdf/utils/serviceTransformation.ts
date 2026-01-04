import { supabase } from '@/integrations/supabase/client';
import { ServicePdfData } from '@/types/service-template';
import type { ServiceRequest } from '@/hooks/service/types';
import { logger } from '@/utils/logger';

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
 * Get company settings for PDF
 */
async function getCompanySettings(): Promise<{
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  company_logo_url?: string;
  company_tax_number?: string;
  company_tax_office?: string;
}> {
  try {
    const companyId = await getCurrentCompanyId();
    
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

    if (error || !data) {
      logger.error("Error fetching company settings", error);
      return {};
    }

    return {
      company_name: data.name || '',
      company_address: data.address || '',
      company_phone: data.phone || '',
      company_email: data.email || '',
      company_website: data.website || '',
      company_tax_number: data.tax_number || '',
      company_tax_office: data.tax_office || '',
      company_logo_url: data.logo_url || '',
    };
  } catch (error) {
    logger.error("Error in getCompanySettings", error);
    return {};
  }
}

/**
 * Fetch service parts from service_items table
 */
async function fetchServiceParts(serviceId: string) {
  try {
    const { data: serviceItems } = await supabase
      .from('service_items')
      .select('*')
      .eq('service_request_id', serviceId)
      .order('row_number', { ascending: true });

    if (serviceItems && serviceItems.length > 0) {
      return serviceItems.map((item: any) => ({
        id: item.id,
        name: item.name || '',
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'adet',
        unit_price: Number(item.unit_price) || 0,
        total: Number(item.total_price) || (Number(item.quantity || 1) * Number(item.unit_price || 0)),
        tax_rate: item.tax_rate || 20,
        discount_rate: item.discount_rate || 0,
        description: item.description || undefined,
      }));
    }
    
    return [];
  } catch (error) {
    logger.warn("Service items fetch error", error);
    return [];
  }
}

/**
 * Fetch service signatures
 */
async function fetchServiceSignatures(serviceId: string) {
  try {
    const { data: signatures } = await supabase
      .from('service_signatures')
      .select('signature_type, signature_data')
      .eq('service_request_id', serviceId);

    let technicianSignature: string | undefined;
    let customerSignature: string | undefined;

    if (signatures && signatures.length > 0) {
      for (const sig of signatures) {
        const base64Data = sig.signature_data as string;
        const dataUrl = base64Data.startsWith('data:') 
          ? base64Data 
          : `data:image/png;base64,${base64Data}`;
        
        if (sig.signature_type === 'technician') {
          technicianSignature = dataUrl;
        } else if (sig.signature_type === 'customer') {
          customerSignature = dataUrl;
        }
      }
    }

    return { technicianSignature, customerSignature };
  } catch (error) {
    logger.warn("Service signatures fetch error", error);
    return { technicianSignature: undefined, customerSignature: undefined };
  }
}

/**
 * Transform service request to ServicePdfData format
 */
export async function transformServiceForPdf(service: ServiceRequest): Promise<ServicePdfData> {
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
    const companySettings = await getCompanySettings();
    const company: ServicePdfData['company'] = {
      name: companySettings.company_name || '',
      address: companySettings.company_address || '',
      phone: companySettings.company_phone || '',
      email: companySettings.company_email || '',
      website: companySettings.company_website || undefined,
      logo_url: companySettings.company_logo_url || undefined,
      tax_number: companySettings.company_tax_number || undefined,
    };

    // Get parts
    let parts = await fetchServiceParts(service.id);
    
    // Fallback to service_details if no items
    if (parts.length === 0) {
      const serviceDetails = service.service_details as any;
      parts = serviceDetails?.parts_list || serviceDetails?.parts || [];
    }

    // Get instructions
    const serviceDetails = service.service_details as any;
    const instructions = serviceDetails?.instructions || [];

    // Get signatures
    const { technicianSignature, customerSignature } = await fetchServiceSignatures(service.id);

    // Fallback to service object for signatures
    const fallbackTechSig = (service as any).technician_signature;
    const fallbackCustSig = (service as any).customer_signature;
    
    const finalTechSignature = technicianSignature || 
      (fallbackTechSig 
        ? (fallbackTechSig.startsWith('data:') ? fallbackTechSig : `data:image/png;base64,${fallbackTechSig}`)
        : undefined);
    
    const finalCustSignature = customerSignature || 
      (fallbackCustSig 
        ? (fallbackCustSig.startsWith('data:') ? fallbackCustSig : `data:image/png;base64,${fallbackCustSig}`)
        : undefined);

    return {
      id: service.id,
      serviceNumber: service.service_number || `SR-${service.id.slice(-6).toUpperCase()}`,
      serviceTitle: service.service_title || '',
      serviceDescription: service.service_request_description || undefined,
      serviceResult: service.service_result || undefined,
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
        unitPrice: Number(part.unit_price || part.unitPrice) || 0,
        total: Number(part.total || part.total_price) || (Number(part.quantity || 1) * Number(part.unit_price || part.unitPrice || 0)),
      })),
      instructions: Array.isArray(instructions) ? instructions : [],
      notes: serviceDetails?.notes || service.notes || undefined,
      technicianSignature: finalTechSignature,
      customerSignature: finalCustSignature,
      createdAt: service.created_at || new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error transforming service for PDF", error);
    throw new Error('Servis verisi PDF formatına dönüştürülemedi: ' + (error as Error).message);
  }
}

/**
 * Transform service slip to ServicePdfData format
 * This is used for completed services with signatures
 */
export async function transformServiceSlipForPdf(service: ServiceRequest): Promise<ServicePdfData> {
  try {
    if (service.service_status !== 'completed') {
      throw new Error('Servis fişi sadece tamamlanmış servisler için oluşturulabilir');
    }

    const serviceData = await transformServiceForPdf(service);
    
    // Add slip-specific data
    if (service.service_number) {
      serviceData.serviceNumber = service.service_number;
    } else if ((service as any).slip_number) {
      serviceData.serviceNumber = (service as any).slip_number;
    }

    if (service.completion_date) {
      serviceData.completedDate = service.completion_date;
    }

    // Ensure signatures are set
    const serviceWithSignatures = service as any;
    if (serviceWithSignatures.technician_signature) {
      serviceData.technicianSignature = serviceWithSignatures.technician_signature;
    }
    if (serviceWithSignatures.customer_signature) {
      serviceData.customerSignature = serviceWithSignatures.customer_signature;
    }

    return serviceData;
  } catch (error) {
    logger.error("Error transforming service slip for PDF", error);
    throw new Error('Servis fişi PDF formatına dönüştürülemedi: ' + (error as Error).message);
  }
}

/**
 * Get company settings for PDF header (exported for external use)
 */
export async function getCompanySettingsForPdf() {
  return getCompanySettings();
}


