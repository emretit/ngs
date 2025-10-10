import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Önce çalışanla ilgili tüm referansları sil
      const tablesToClean = [
        'expenses',
        'activities', 
        'orders',
        'proposals',
        'sales_invoices',
        'customers',
        'suppliers',
        'vehicles',
        'vehicle_maintenance',
        'purchase_requests',
        'employee_documents',
        'employee_leaves',
        'employee_performance',
        'employee_salaries',
        'profiles'
      ];

      // Her tablo için çalışan referanslarını sil
      for (const table of tablesToClean) {
        const employeeColumns = ['employee_id', 'assignee_id', 'representative', 'assigned_driver_id', 'technician_id', 'requester_id'];
        
        for (const column of employeeColumns) {
          try {
            await supabase
              .from(table)
              .delete()
              .eq(column, id);
          } catch (error) {
            // Kolon yoksa veya hata varsa devam et
            console.log(`Column ${column} not found in table ${table} or error occurred:`, error);
          }
        }
      }

      // Son olarak çalışanı sil
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
