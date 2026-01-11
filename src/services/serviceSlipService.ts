import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { ServiceSlipData, ServiceSlipFormData } from '@/types/service-slip';

export class ServiceSlipService {
  /**
   * Create a new service slip
   */
  static async createServiceSlip(serviceRequestId: string, formData: ServiceSlipFormData): Promise<ServiceSlipData> {
    // Get service request details
    const { data: serviceRequest, error: serviceError } = await supabase
      .from('service_requests')
      .select(`
        *,
        customers (name, company, address, mobile_phone, email),
        equipment (name, model, serial_number, location_address)
      `)
      .eq('id', serviceRequestId)
      .single();

    if (serviceError) {
      throw new Error('Servis talebi bulunamadı: ' + serviceError.message);
    }

    // Generate slip number
    const slipNumber = await this.generateSlipNumber();

    // Get technician info (assuming from assigned_to field)
    const { data: technicanProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', serviceRequest.assigned_to)
      .single();

    const serviceSlipData = {
      service_number: slipNumber,
      issue_date: new Date().toISOString(),
      completion_date: formData.completion_date,
      technician_name: technicanProfile?.full_name || 'Belirtilmemiş',
      technician_signature: formData.technician_signature,
      customer_data: {
        name: serviceRequest.customers?.name || 'Müşteri',
        company: serviceRequest.customers?.company || '',
        address: serviceRequest.customers?.address || '',
        phone: serviceRequest.customers?.mobile_phone || '',
        email: serviceRequest.customers?.email || '',
      },
      equipment_data: {
        name: serviceRequest.equipment?.name || '',
        model: serviceRequest.equipment?.model || '',
        serial_number: serviceRequest.equipment?.serial_number || '',
        location: serviceRequest.equipment?.location_address || serviceRequest.location || '',
      },
      service_details: {
        problem_description: formData.problem_description,
        work_performed: formData.work_performed,
        parts_used: formData.parts_used,
        service_type: serviceRequest.service_type,
        warranty_status: serviceRequest.warranty_info?.status || '',
      },
      slip_status: formData.completion_date ? 'completed' : 'draft',
    };

    // Update service request with slip data
    const { data, error } = await supabase
      .from('service_requests')
      .update(serviceSlipData)
      .eq('id', serviceRequestId)
      .select()
      .single();

    if (error) {
      throw new Error('Servis fişi kaydedilemedi: ' + error.message);
    }

    // Return data in ServiceSlipData format for compatibility
    return {
      id: data.id,
      service_request_id: data.id,
      slip_number: data.service_number,
      issue_date: data.issue_date,
      completion_date: data.completion_date,
      technician_name: data.technician_name,
      technician_signature: data.technician_signature,
      customer: data.customer_data,
      equipment: data.equipment_data,
      service_details: data.service_details,
      status: data.slip_status,
      created_at: data.created_at,
      updated_at: data.updated_at,
    } as ServiceSlipData;
  }

  /**
   * Update service slip
   */
  static async updateServiceSlip(slipId: string, formData: Partial<ServiceSlipFormData>): Promise<ServiceSlipData> {
    const updateData: any = {
      service_details: formData,
      completion_date: formData.completion_date,
      technician_signature: formData.technician_signature,
      slip_status: formData.completion_date ? 'completed' : 'draft',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('service_requests')
      .update(updateData)
      .eq('id', slipId)
      .select()
      .single();

    if (error) {
      throw new Error('Servis fişi güncellenemedi: ' + error.message);
    }

    // Return data in ServiceSlipData format for compatibility
    return {
      id: data.id,
      service_request_id: data.id,
      slip_number: data.service_number,
      issue_date: data.issue_date,
      completion_date: data.completion_date,
      technician_name: data.technician_name,
      technician_signature: data.technician_signature,
      customer: data.customer_data,
      equipment: data.equipment_data,
      service_details: data.service_details,
      status: data.slip_status,
      created_at: data.created_at,
      updated_at: data.updated_at,
    } as ServiceSlipData;
  }

  /**
   * Get service slip by service request ID
   */
  static async getServiceSlipByRequestId(serviceRequestId: string): Promise<ServiceSlipData | null> {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', serviceRequestId)
      .not('service_number', 'is', null)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error('Servis fişi getirilemedi: ' + error.message);
    }

    if (!data || !data.service_number) {
      return null;
    }

    // Return data in ServiceSlipData format for compatibility
    return {
      id: data.id,
      service_request_id: data.id,
      slip_number: data.service_number,
      issue_date: data.issue_date,
      completion_date: data.completion_date,
      technician_name: data.technician_name,
      technician_signature: data.technician_signature,
      customer: data.customer_data,
      equipment: data.equipment_data,
      service_details: data.service_details,
      status: data.slip_status,
      created_at: data.created_at,
      updated_at: data.updated_at,
    } as ServiceSlipData;
  }

  /**
   * Generate unique slip number
   */
  private static async generateSlipNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('service_requests')
      .select('*', { count: 'exact', head: true })
      .not('service_number', 'is', null)
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`);

    const slipCount = (count || 0) + 1;
    return `SF-${year}-${slipCount.toString().padStart(4, '0')}`;
  }

  /**
   * Complete service and mark slip as completed
   */
  static async completeService(slipId: string, signatureData?: string): Promise<ServiceSlipData> {
    const updateData: any = {
      slip_status: 'completed',
      completion_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (signatureData) {
      updateData.technician_signature = signatureData;
    }

    const { data, error } = await supabase
      .from('service_requests')
      .update(updateData)
      .eq('id', slipId)
      .select()
      .single();

    if (error) {
      throw new Error('Servis tamamlanamadı: ' + error.message);
    }

    // Also update the service request status
    const { error: requestError } = await supabase
      .from('service_requests')
      .update({ status: 'completed' })
      .eq('id', slipId);

    if (requestError) {
      logger.error('Service request status update failed:', requestError);
    }

    // Return data in ServiceSlipData format for compatibility
    return {
      id: data.id,
      service_request_id: data.id,
      slip_number: data.service_number,
      issue_date: data.issue_date,
      completion_date: data.completion_date,
      technician_name: data.technician_name,
      technician_signature: data.technician_signature,
      customer: data.customer_data,
      equipment: data.equipment_data,
      service_details: data.service_details,
      status: data.slip_status,
      created_at: data.created_at,
      updated_at: data.updated_at,
    } as ServiceSlipData;
  }
}