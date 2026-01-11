import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🔵 [useDeleteEmployee] Deleting employee:', id);
      
      // Database fonksiyonunu çağır - tüm temizlik işlemlerini yapar
      const { error } = await supabase.rpc('delete_employee_with_cleanup', {
        employee_id_param: id
      });

      if (error) {
        console.error('❌ [useDeleteEmployee] Error:', error);
        throw error;
      }
      
      console.log('✅ [useDeleteEmployee] Employee deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success("Çalışan ve ilgili kayıtlar başarıyla silindi");
    },
    onError: (error) => {
      toast.error("Çalışan silinirken bir hata oluştu");
      console.error('Employee deletion error:', error);
    },
  });
};
