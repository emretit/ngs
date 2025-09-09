
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
        tax_number: data.type === 'kurumsal' ? data.tax_number || null : null,
        tax_office: data.type === 'kurumsal' ? data.tax_office || null : null,
      };

      console.log('Updating data:', sanitizedData);
      
      const { error: updateError } = await supabase
        .from('customers')
        .update(sanitizedData)
        .eq('id', customerId);
      
      if (updateError) {
        console.error('Update error:', updateError);
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
      console.error('Mutation error:', error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    },
  });

  return { mutation };
};
