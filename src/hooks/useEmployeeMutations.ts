import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Önce çalışanla ilgili tüm referansları sil
      const cleanupTasks = [
        // Expenses tablosunda employee_id
        { table: 'expenses', column: 'employee_id' },
        
        // Activities tablosunda assignee_id
        { table: 'activities', column: 'assignee_id' },
        
        // Orders tablosunda employee_id
        { table: 'orders', column: 'employee_id' },
        
        // Proposals tablosunda employee_id
        { table: 'proposals', column: 'employee_id' },
        
        // Sales invoices tablosunda employee_id
        { table: 'sales_invoices', column: 'employee_id' },
        
        // Customers tablosunda representative
        { table: 'customers', column: 'representative' },
        
        // Suppliers tablosunda representative
        { table: 'suppliers', column: 'representative' },
        
        // Vehicles tablosunda assigned_driver_id
        { table: 'vehicles', column: 'assigned_driver_id' },
        
        // Vehicle maintenance tablosunda technician_id
        { table: 'vehicle_maintenance', column: 'technician_id' },
        
        // Purchase requests tablosunda requester_id
        { table: 'purchase_requests', column: 'requester_id' },
        
        // Employee documents tablosunda employee_id
        { table: 'employee_documents', column: 'employee_id' },
        
        // Employee leaves tablosunda employee_id
        { table: 'employee_leaves', column: 'employee_id' },
        
        // Employee performance tablosunda employee_id
        { table: 'employee_performance', column: 'employee_id' }
      ];

      // Her tablo için çalışan referanslarını sil
      for (const task of cleanupTasks) {
        try {
          await supabase
            .from(task.table)
            .delete()
            .eq(task.column, id);
        } catch (error) {
          // Kolon yoksa veya hata varsa devam et
          console.log(`Column ${task.column} not found in table ${task.table} or error occurred:`, error);
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
