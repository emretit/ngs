import { supabase } from '@/integrations/supabase/client';
import { RecurrenceConfig, calculateNextRecurrenceDate } from '@/utils/serviceRecurrenceUtils';

/**
 * Service for managing recurring services
 */
export class ServiceRecurrenceService {
  /**
   * Generate recurring service instances using database function
   */
  static async generateInstances(): Promise<number> {
    const { data, error } = await supabase.rpc('generate_recurring_service_instances');

    if (error) {
      console.error('Error generating recurring service instances:', error);
      throw error;
    }

    return data || 0;
  }

  /**
   * Create a recurring service template
   */
  static async createRecurringService(
    serviceData: any,
    recurrenceConfig: RecurrenceConfig
  ): Promise<any> {
    const nextDate = calculateNextRecurrenceDate(
      new Date(serviceData.service_reported_date || new Date()),
      recurrenceConfig
    );

    const recurringServiceData = {
      ...serviceData,
      is_recurring: true,
      recurrence_type: recurrenceConfig.type,
      recurrence_interval: recurrenceConfig.interval || 1,
      recurrence_end_date: recurrenceConfig.endDate?.toISOString().split('T')[0] || null,
      recurrence_days: recurrenceConfig.days || null,
      recurrence_day_of_month: recurrenceConfig.dayOfMonth || null,
      next_recurrence_date: nextDate?.toISOString().split('T')[0] || null,
    };

    const { data, error } = await supabase
      .from('service_requests')
      .insert([recurringServiceData])
      .select()
      .single();

    if (error) {
      console.error('Error creating recurring service:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update recurrence configuration for a service
   */
  static async updateRecurrenceConfig(
    serviceId: string,
    recurrenceConfig: RecurrenceConfig
  ): Promise<void> {
    const nextDate = calculateNextRecurrenceDate(new Date(), recurrenceConfig);

    const { error } = await supabase
      .from('service_requests')
      .update({
        is_recurring: recurrenceConfig.type !== 'none',
        recurrence_type: recurrenceConfig.type,
        recurrence_interval: recurrenceConfig.interval || 1,
        recurrence_end_date: recurrenceConfig.endDate?.toISOString().split('T')[0] || null,
        recurrence_days: recurrenceConfig.days || null,
        recurrence_day_of_month: recurrenceConfig.dayOfMonth || null,
        next_recurrence_date: nextDate?.toISOString().split('T')[0] || null,
      })
      .eq('id', serviceId);

    if (error) {
      console.error('Error updating recurrence config:', error);
      throw error;
    }
  }

  /**
   * Stop recurrence for a service
   */
  static async stopRecurrence(serviceId: string): Promise<void> {
    const { error } = await supabase
      .from('service_requests')
      .update({
        is_recurring: false,
        recurrence_type: 'none',
        next_recurrence_date: null,
      })
      .eq('id', serviceId);

    if (error) {
      console.error('Error stopping recurrence:', error);
      throw error;
    }
  }

  /**
   * Get all recurring service templates
   */
  static async getRecurringTemplates(companyId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_recurring', true)
      .eq('is_recurring_instance', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recurring templates:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get instances of a recurring service
   */
  static async getServiceInstances(parentServiceId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('parent_service_id', parentServiceId)
      .eq('is_recurring_instance', true)
      .order('service_reported_date', { ascending: false });

    if (error) {
      console.error('Error fetching service instances:', error);
      throw error;
    }

    return data || [];
  }
}














