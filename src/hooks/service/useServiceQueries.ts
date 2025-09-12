
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ServiceRequest, ServiceQueriesResult } from "./types";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const useServiceQueries = (): ServiceQueriesResult => {
  const { userData } = useCurrentUser();
  
  // Fetch all service requests
  const serviceRequestsQuery = useQuery({
    queryKey: ['service-requests', userData?.company_id],
    queryFn: async (): Promise<ServiceRequest[]> => {
      console.log("Fetching service requests...");
      
      if (!userData?.company_id) {
        console.log("No company_id found, returning empty array");
        return [];
      }
      
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('company_id', userData.company_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching service requests:", error);
        throw error;
      }
      
      console.log("Service requests data:", data);
      
      return (data || []).map(item => ({
        ...item,
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
    refetchOnWindowFocus: true,
    staleTime: 60000,
  });

  // Get a single service request
  const getServiceRequest = async (id: string): Promise<ServiceRequest | null> => {
    if (!userData?.company_id) {
      console.log("No company_id found for getServiceRequest");
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', id)
        .eq('company_id', userData.company_id)
        .single();

      if (error) {
        console.error("Error fetching service request:", error);
        throw error;
      }

      if (!data) {
        console.log("No service request found with id:", id);
        return null;
      }

      return {
        ...data,
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
      console.error("Error in getServiceRequest:", error);
      return null;
    }
  };

  return {
    data: serviceRequestsQuery.data,
    isLoading: serviceRequestsQuery.isLoading,
    error: serviceRequestsQuery.error as Error | null,
    isError: !!serviceRequestsQuery.error,
    refetch: serviceRequestsQuery.refetch,
    getServiceRequest
  };
};
