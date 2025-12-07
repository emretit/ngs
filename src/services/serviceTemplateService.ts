import { supabase } from '@/integrations/supabase/client';

export interface ServiceTemplate {
  id: string;
  name: string;
  description?: string;
  service_title: string;
  service_request_description?: string;
  service_type?: string;
  service_priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_duration?: number;
  default_location?: string;
  default_technician_id?: string;
  service_details?: any;
  parts_list?: any[];
  instructions?: any[];
  company_id: string;
  usage_count: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceTemplateData {
  name: string;
  description?: string;
  service_title: string;
  service_request_description?: string;
  service_type?: string;
  service_priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimated_duration?: number;
  default_location?: string;
  default_technician_id?: string;
  service_details?: any;
  parts_list?: any[];
  instructions?: any[];
}

/**
 * Service for managing service templates
 */
export class ServiceTemplateService {
  /**
   * Get all service templates for a company
   */
  static async getTemplates(companyId: string, activeOnly: boolean = true): Promise<ServiceTemplate[]> {
    let query = supabase
      .from('service_templates')
      .select('*')
      .eq('company_id', companyId)
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching service templates:', error);
      throw error;
    }

    return (data as ServiceTemplate[]) || [];
  }

  /**
   * Get a single service template
   */
  static async getTemplate(templateId: string): Promise<ServiceTemplate | null> {
    const { data, error } = await supabase
      .from('service_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      console.error('Error fetching service template:', error);
      throw error;
    }

    return data as ServiceTemplate | null;
  }

  /**
   * Create a new service template
   */
  static async createTemplate(
    companyId: string,
    userId: string,
    templateData: CreateServiceTemplateData
  ): Promise<ServiceTemplate> {
    const { data, error } = await supabase
      .from('service_templates')
      .insert({
        ...templateData,
        company_id: companyId,
        created_by: userId,
        service_priority: templateData.service_priority || 'medium',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating service template:', error);
      throw error;
    }

    return data as ServiceTemplate;
  }

  /**
   * Update a service template
   */
  static async updateTemplate(
    templateId: string,
    templateData: Partial<CreateServiceTemplateData>
  ): Promise<ServiceTemplate> {
    const { data, error } = await supabase
      .from('service_templates')
      .update(templateData)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      console.error('Error updating service template:', error);
      throw error;
    }

    return data as ServiceTemplate;
  }

  /**
   * Delete a service template
   */
  static async deleteTemplate(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('service_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Error deleting service template:', error);
      throw error;
    }
  }

  /**
   * Create a service from a template
   */
  static async createServiceFromTemplate(
    templateId: string,
    companyId: string,
    overrides?: Partial<any>
  ): Promise<any> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Increment usage count
    await supabase
      .from('service_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', templateId);

    // Create service from template
    const serviceData = {
      service_title: template.service_title,
      service_request_description: template.service_request_description,
      service_location: overrides?.service_location || template.default_location,
      service_priority: overrides?.service_priority || template.service_priority,
      service_type: overrides?.service_type || template.service_type,
      assigned_technician: overrides?.assigned_technician || template.default_technician_id,
      service_status: 'new',
      company_id: companyId,
      service_details: template.service_details,
      ...overrides,
    };

    const { data, error } = await supabase
      .from('service_requests')
      .insert([serviceData])
      .select()
      .single();

    if (error) {
      console.error('Error creating service from template:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create template from existing service
   */
  static async createTemplateFromService(
    serviceId: string,
    templateName: string,
    companyId: string,
    userId: string
  ): Promise<ServiceTemplate> {
    const { data: service, error: serviceError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      throw new Error('Service not found');
    }

    const templateData: CreateServiceTemplateData = {
      name: templateName,
      description: `Şablon: ${service.service_title}`,
      service_title: service.service_title,
      service_request_description: service.service_request_description,
      service_type: service.service_type,
      service_priority: service.service_priority || 'medium',
      default_location: service.service_location,
      default_technician_id: service.assigned_technician,
      service_details: service.service_details,
    };

    return this.createTemplate(companyId, userId, templateData);
  }
}
















