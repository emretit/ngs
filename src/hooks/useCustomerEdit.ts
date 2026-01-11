
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CustomerFormData } from "@/types/customer";

export const useCustomerEdit = (customerId: string | undefined, onSuccess?: () => void) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      if (!customerId) {
        throw new Error("Müşteri ID'si gerekli");
      }

      const sanitizedData = {
        name: data.name,
        email: data.email || null,
        mobile_phone: data.mobile_phone || null,
        office_phone: data.office_phone || null,
        company: data.company || null,
        type: data.type,
        status: data.status,
        representative: data.representative || null,
        balance: data.balance || 0,
        address: data.address || null,
        tax_number: data.tax_number || null,
        tax_office: data.tax_office || null,
      };

      logger.debug('Updating data:', sanitizedData);
      
      const { error: updateError } = await supabase
        .from('customers')
        .update(sanitizedData)
        .eq('id', customerId);
      
      if (updateError) {
        logger.error('Update error:', updateError);
        throw updateError;
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      }

      toast({
        title: "Müşteri güncellendi",
        description: "Müşteri bilgileri başarıyla güncellendi.",
      });

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      logger.error('Mutation error:', error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    },
  });

  return { mutation };
};
