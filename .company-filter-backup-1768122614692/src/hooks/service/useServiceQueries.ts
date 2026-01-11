
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { ServiceRequest, ServiceQueriesResult } from "./types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useEffect } from "react";

export const useServiceQueries = (): ServiceQueriesResult => {
  const { userData } = useCurrentUser();
  const queryClient = useQueryClient();
  
  // Fetch all service requests
  const serviceRequestsQuery = useQuery({
    queryKey: ['service-requests', userData?.company_id],
    queryFn: async (): Promise<ServiceRequest[]> => {
      logger.debug("Fetching service requests...");
      
      if (!userData?.company_id) {
        logger.debug("No company_id found, returning empty array");
        return [];
      }
      
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          customers (
            id,
            name,
            company,
            email,
            mobile_phone,
            office_phone,
            address
          )
        `)
        .eq('company_id', userData.company_id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error("Error fetching service requests:", error);
        throw error;
      }
      
      logger.debug("Service requests data:", data);
      
      return (data || []).map((item: any) => ({
        ...item,
        customer_data: item.customers ? {
          id: item.customers.id,
          name: item.customers.name,
          company: item.customers.company,
          email: item.customers.email,
          mobile_phone: item.customers.mobile_phone,
          office_phone: item.customers.office_phone,
          address: item.customers.address
        } : null,
        attachments: Array.isArray(item.attachments) 
          ? item.attachments.map((att: any) => ({
              name: String(att.name || ''),
              path: String(att.path || ''),
              type: String(att.type || ''),
              size: Number(att.size || 0)
            }))
          : [],
        notes: Array.isArray(item.notes) ? item.notes : undefined,
        warranty_info: typeof item.warranty_info === 'object' ? item.warranty_info : undefined
      }));
    },
    enabled: !!userData?.company_id,
    refetchOnMount: true, // Mount olduğunda yeniden yükleme
    staleTime: 5 * 60 * 1000, // 5 dakika
  });

  // Real-time subscription - service_requests tablosundaki değişiklikleri dinle
  useEffect(() => {
    if (!userData?.company_id) return;

    const channel = supabase
      .channel('service-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'service_requests',
          filter: `company_id=eq.${userData.company_id}`,
        },
        () => {
          // Service requests tablosunda herhangi bir değişiklik olduğunda query'yi invalidate et
          queryClient.invalidateQueries({ queryKey: ['service-requests'] });
          queryClient.invalidateQueries({ queryKey: ['customer-service-requests'] });
        }
      )
      .subscribe();

    // Cleanup subscription when component unmounts or company_id changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.company_id, queryClient]);

  // Get a single service request
  const getServiceRequest = async (id: string): Promise<ServiceRequest | null> => {
    if (!userData?.company_id) {
      logger.debug("No company_id found for getServiceRequest");
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          customers (
            id,
            name,
            company,
            email,
            mobile_phone,
            office_phone,
            address
          )
        `)
        .eq('id', id)
        .eq('company_id', userData.company_id)
        .single();

      if (error) {
        logger.error("Error fetching service request:", error);
        throw error;
      }

      if (!data) {
        logger.debug("No service request found with id:", id);
        return null;
      }

      return {
        ...data,
        customer_data: (data as any).customers ? {
          id: (data as any).customers.id,
          name: (data as any).customers.name,
          company: (data as any).customers.company,
          email: (data as any).customers.email,
          mobile_phone: (data as any).customers.mobile_phone,
          office_phone: (data as any).customers.office_phone,
          address: (data as any).customers.address
        } : null,
        attachments: Array.isArray(data.attachments) 
          ? data.attachments.map((att: any) => ({
              name: String(att.name || ''),
              path: String(att.path || ''),
              type: String(att.type || ''),
              size: Number(att.size || 0)
            }))
          : [],
        notes: Array.isArray(data.notes) ? data.notes : undefined,
        warranty_info: typeof data.warranty_info === 'object' ? data.warranty_info : undefined
      };
    } catch (error) {
      logger.error("Error in getServiceRequest:", error);
      return null;
    }
  };

  return {
    serviceRequests: serviceRequestsQuery.data || [],
    isLoading: serviceRequestsQuery.isLoading,
    error: serviceRequestsQuery.error as Error | null,
    refetch: serviceRequestsQuery.refetch,
    getServiceRequest
  };
};
