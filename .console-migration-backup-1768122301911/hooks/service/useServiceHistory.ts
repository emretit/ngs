import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServiceHistoryItem {
  id: string;
  service_request_id: string;
  action_type: 'created' | 'status_changed' | 'assigned' | 'updated' | 'comment_added';
  old_value?: any;
  new_value?: any;
  description: string;
  created_by?: string;
  created_at: string;
  user_name?: string;
}

export const useServiceHistory = (serviceRequestId?: string) => {
  return useQuery({
    queryKey: ["service-history", serviceRequestId],
    queryFn: async (): Promise<ServiceHistoryItem[]> => {
      if (!serviceRequestId) return [];

      const { data, error } = await supabase
        .from("service_history")
        .select("*")
        .eq("service_request_id", serviceRequestId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching service history:", error);
        throw error;
      }

      // Transform data to include user name
      const transformedData = data?.map(item => ({
        ...item,
        user_name: 'Sistem' // Şimdilik sabit kullanıcı adı
      })) || [];

      return transformedData;
    },
    enabled: !!serviceRequestId,
  });
};

export const useCreateServiceHistoryEntry = () => {
  return async (entry: {
    service_request_id: string;
    action_type: ServiceHistoryItem['action_type'];
    description: string;
    old_value?: any;
    new_value?: any;
  }) => {
    const { data, error } = await supabase
      .from("service_history")
      .insert([{
        ...entry,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating service history entry:", error);
      throw error;
    }

    return data;
  };
};
