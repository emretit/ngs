import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useCurrentUser";
import { showError, showSuccess, showWarning } from "@/utils/toastUtils";
import { logger } from "@/utils/logger";

export type AIInsight = {
  id: string;
  company_id: string;
  insight_text: string;
  insight_type: string;
  data_summary: any;
  created_at: string;
  period_start: string;
  period_end: string;
};

export const useAIInsights = () => {
  const { userData } = useCurrentUser();
  const queryClient = useQueryClient();

  // Fetch latest insight
  const { data: latestInsight, isLoading } = useQuery({
    queryKey: ['ai-insights', 'latest', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return null;

      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('company_id', userData.company_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as AIInsight | null;
    },
    enabled: !!userData?.company_id,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - daily cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Fetch insight history
  const { data: insightHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['ai-insights', 'history', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];

      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('company_id', userData.company_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as AIInsight[];
    },
    enabled: !!userData?.company_id,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - daily cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Generate new insight
  const generateMutation = useMutation({
    mutationFn: async ({ periodDays = 30 }: { periodDays?: number }) => {
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { period_days: periodDays }
      });

      if (error) throw error;

      // Handle specific error cases
      if (data?.error) {
        if (data.error === 'no_data') {
          throw new Error(data.message || 'Yeterli veri yok');
        } else if (data.error === 'rate_limit') {
          throw new Error(data.message || 'AI kullanım limiti aşıldı');
        } else if (data.error === 'payment_required') {
          throw new Error(data.message || 'AI kredisi tükendi');
        }
        throw new Error(data.message || 'Bir hata oluştu');
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch insights
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
      
      if (data?.cached) {
        showSuccess('Bugünkü içgörü yüklendi (Cache)');
      } else {
        showSuccess('Yeni içgörü oluşturuldu');
      }
    },
    onError: (error: Error) => {
      logger.error('Error generating insight', error);
      
      if (error.message.includes('limit')) {
        showWarning(error.message);
      } else if (error.message.includes('kredi')) {
        showError(error.message);
      } else if (error.message.includes('veri yok')) {
        showWarning(error.message);
      } else {
        showError('İçgörü oluşturulurken bir hata oluştu');
      }
    },
  });

  return {
    latestInsight,
    insightHistory,
    isLoading,
    isLoadingHistory,
    generateInsight: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
  };
};
