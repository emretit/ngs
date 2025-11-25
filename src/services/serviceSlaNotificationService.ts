import { supabase } from '@/integrations/supabase/client';
import { ServiceRequest } from '@/hooks/service/types';
import { shouldTriggerSLAWarning, getSLATimeRemaining } from '@/utils/serviceSlaUtils';
import { formatDate } from '@/utils/dateUtils';

/**
 * Service for handling SLA notifications and warnings
 */
export class ServiceSLANotificationService {
  /**
   * Check and create notifications for services with SLA issues
   */
  static async checkAndNotifySLAIssues(): Promise<void> {
    // Get services with SLA issues
    const { data: services, error } = await supabase
      .from('service_requests')
      .select('*, assigned_technician, company_id')
      .in('sla_status', ['at_risk', 'breached'])
      .in('service_status', ['new', 'assigned', 'in_progress']);

    if (error) {
      console.error('Error fetching services with SLA issues:', error);
      return;
    }

    if (!services || services.length === 0) {
      return;
    }

    // Create notifications for each service
    for (const service of services as ServiceRequest[]) {
      const timeRemaining = service.sla_due_time
        ? getSLATimeRemaining(new Date(service.sla_due_time))
        : null;

      if (shouldTriggerSLAWarning(service.sla_status as any, timeRemaining)) {
        await this.createSLANotification(service, timeRemaining);
      }
    }
  }

  /**
   * Create notification for SLA issue
   */
  private static async createSLANotification(
    service: ServiceRequest,
    timeRemaining: { totalMinutes: number; isOverdue: boolean } | null
  ): Promise<void> {
    if (!service.company_id) {
      return;
    }

    const status = service.sla_status;
    const isBreached = status === 'breached' || (timeRemaining?.isOverdue ?? false);
    
    let title: string;
    let body: string;
    let notificationType: string;

    if (isBreached) {
      title = 'SLA İhlal Edildi';
      body = `${service.service_title} servisi için SLA süresi aşıldı. Acil müdahale gerekiyor.`;
      notificationType = 'sla_breached';
    } else {
      title = 'SLA Risk Uyarısı';
      const minutes = timeRemaining?.totalMinutes || 0;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      body = `${service.service_title} servisi için SLA süresinin ${hours}s ${mins}dk kaldı. Risk altında!`;
      notificationType = 'sla_at_risk';
    }

    // Get technician user_id if assigned
    let technicianUserId: string | null = null;
    if (service.assigned_technician) {
      const { data: technician } = await supabase
        .from('employees')
        .select('user_id')
        .eq('id', service.assigned_technician)
        .single();

      if (technician?.user_id) {
        technicianUserId = technician.user_id;
      }
    }

    // Create notification for technician
    if (technicianUserId) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: technicianUserId,
          title,
          body,
          type: notificationType,
          service_request_id: service.id,
          company_id: service.company_id,
          is_read: false,
        });

      if (notifError) {
        console.error('Error creating SLA notification:', notifError);
      }
    }

    // Also notify service managers/admins (users with service management permissions)
    // This would require a query to find managers, but for now we'll skip it
    // You can extend this later based on your permission system
  }

  /**
   * Get services that need SLA attention
   */
  static async getServicesNeedingAttention(): Promise<ServiceRequest[]> {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .in('sla_status', ['at_risk', 'breached'])
      .in('service_status', ['new', 'assigned', 'in_progress'])
      .order('sla_due_time', { ascending: true });

    if (error) {
      console.error('Error fetching services needing attention:', error);
      return [];
    }

    return (data as ServiceRequest[]) || [];
  }

  /**
   * Manually trigger SLA check for a specific service
   */
  static async checkServiceSLA(serviceId: string): Promise<void> {
    const { data: service, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error || !service) {
      console.error('Error fetching service for SLA check:', error);
      return;
    }

    // Update SLA status by triggering the database function
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', serviceId);

    if (updateError) {
      console.error('Error updating service SLA:', updateError);
    }

    // Check if notification is needed
    const timeRemaining = service.sla_due_time
      ? getSLATimeRemaining(new Date(service.sla_due_time))
      : null;

    if (shouldTriggerSLAWarning(service.sla_status as any, timeRemaining)) {
      await this.createSLANotification(service as ServiceRequest, timeRemaining);
    }
  }
}




