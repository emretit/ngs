import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InvoiceTag {
  UUID?: string;
  Description?: string;
  Name?: string;
  Color?: string;
}

export const useInvoiceTags = (invoiceId?: string, hasNilveraId?: boolean) => {
  // Get invoice tags
  const {
    data: tags,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['invoice-tags', invoiceId],
    queryFn: async (): Promise<InvoiceTag[]> => {
      if (!invoiceId || !hasNilveraId) return [];
      
      const { data, error } = await supabase.functions.invoke('nilvera-invoice-tags', {
        body: { invoiceId }
      });
      
      if (error) {
        throw new Error(error.message || 'Fatura etiketleri alınırken hata oluştu');
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Fatura etiketleri alınamadı');
      }
      
      return data.tags || [];
    },
    enabled: !!invoiceId && !!hasNilveraId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Refresh tags mutation
  const refreshTags = useMutation({
    mutationFn: async () => {
      if (!invoiceId || !hasNilveraId) throw new Error('Fatura ID ve Nilvera ID gerekli');
      
      const { data, error } = await supabase.functions.invoke('nilvera-invoice-tags', {
        body: { invoiceId }
      });
      
      if (error) {
        throw new Error(error.message || 'Fatura etiketleri yenilenirken hata oluştu');
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Fatura etiketleri yenilenemedi');
      }
      
      return data.tags || [];
    },
    onSuccess: (newTags) => {
      toast.success(`${newTags.length} etiket başarıyla yüklendi`);
    },
    onError: (error: any) => {
      console.error('Error refreshing tags:', error);
      toast.error(error.message || 'Etiketler yenilenirken hata oluştu');
    }
  });

  return {
    tags: tags || [],
    isLoading,
    error,
    refetch,
    refreshTags: refreshTags.mutate,
    isRefreshing: refreshTags.isPending
  };
};
