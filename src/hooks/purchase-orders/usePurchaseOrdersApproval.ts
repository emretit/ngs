import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Purchase Orders - Onay İşlemleri
 * - Onay talebi gönderme
 * - PO numarası üretimi
 */

// Request approval (assign PO number)
export const useRequestPOApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      // Generate PO number
      const { data: poNumber } = await supabase
        .rpc('generate_document_number', {
          p_company_id: profile?.company_id,
          p_doc_type: 'PO'
        });

      // Update status and assign number
      const { error } = await supabase
        .from('purchase_orders')
        .update({ 
          order_number: poNumber,
          status: 'submitted',
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order'] });
      toast.success("Onay talebi gönderildi.");
    },
  });
};
