import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseExcelFile } from '@/utils/customerExcelUtils';
import { showSuccess, showError } from '@/utils/toastUtils';

export const useCustomerExcelImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const queryClient = useQueryClient();

  const importFromExcel = async (file: File) => {
    setIsImporting(true);
    
    try {
      const customers = await parseExcelFile(file);
      
      if (customers.length === 0) {
        showError('Excel dosyasında geçerli müşteri verisi bulunamadı');
        return;
      }

      // Batch insert customers
      const { data, error } = await supabase
        .from('customers')
        .insert(customers)
        .select();

      if (error) {
        console.error('Database insert error:', error);
        showError('Müşteri verileri kaydedilirken hata oluştu');
        return;
      }

      // Refresh the customers list
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      showSuccess(`${data.length} müşteri başarıyla içe aktarıldı`, { duration: 1000 });
      
    } catch (error) {
      console.error('Excel import error:', error);
      showError('Excel dosyası işlenirken hata oluştu');
    } finally {
      setIsImporting(false);
    }
  };

  return {
    importFromExcel,
    isImporting
  };
};