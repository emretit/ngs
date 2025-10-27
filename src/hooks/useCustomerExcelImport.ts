import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseExcelFile } from '@/utils/customerExcelUtils';
import { toast } from 'sonner';

interface ImportStats {
  success: number;
  failed: number;
  duplicates: number;
  invalidRows: number;
  total: number;
}

export const useCustomerExcelImport = (onSuccess?: () => void) => {
  const [isImporting, setIsImporting] = useState(false);
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ImportStats>({
    success: 0,
    failed: 0,
    duplicates: 0,
    invalidRows: 0,
    total: 0
  });

  const importFromExcel = async (file: File) => {
    setIsImporting(true);
    setProgress(0);
    setStats({
      success: 0,
      failed: 0,
      duplicates: 0,
      invalidRows: 0,
      total: 0
    });
    
    try {
      const customers = await parseExcelFile(file);
      
      if (customers.length === 0) {
        toast.error('Excel dosyasında geçerli müşteri verisi bulunamadı');
        setIsImporting(false);
        return;
      }

      // Set total for progress calculation
      setStats(prev => ({ ...prev, total: customers.length }));
      
      // Process each customer record
      let successCount = 0;
      let failedCount = 0;
      let duplicateCount = 0;
      let invalidCount = 0;
      
      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];
        
        // Check for required fields
        if (!customer.name) {
          invalidCount++;
          setStats({
            success: successCount,
            failed: failedCount,
            duplicates: duplicateCount,
            invalidRows: invalidCount,
            total: customers.length
          });
          
          // Update progress
          setProgress(Math.floor(((i + 1) / customers.length) * 100));
          continue;
        }
        
        // Check if customer already exists by email or name
        const { data: existingCustomer, error: checkError } = await supabase
          .from('customers')
          .select('id, name, email')
          .or(`name.eq.${customer.name}${customer.email ? `,email.eq.${customer.email}` : ''}`)
          .maybeSingle();
        
        if (checkError) {
          console.error('Error checking existing customer:', checkError);
          failedCount++;
        } else if (existingCustomer) {
          duplicateCount++;
        } else {
          // Insert new customer
          const { error: insertError } = await supabase
            .from('customers')
            .insert({
              name: customer.name,
              email: customer.email || null,
              mobile_phone: customer.mobile_phone || null,
              office_phone: customer.office_phone || null,
              company: customer.company || null,
              type: customer.type || 'bireysel',
              status: customer.status || 'potansiyel',
              representative: customer.representative || null,
              balance: customer.balance || 0,
              address: customer.address || null,
              tax_number: customer.tax_number || null,
              tax_office: customer.tax_office || null,
              city: customer.city || null,
              district: customer.district || null
            });
            
          if (insertError) {
            console.error('Error inserting customer:', insertError);
            failedCount++;
          } else {
            successCount++;
          }
        }
        
        // Update stats
        setStats({
          success: successCount,
          failed: failedCount,
          duplicates: duplicateCount,
          invalidRows: invalidCount,
          total: customers.length
        });
        
        // Update progress
        setProgress(Math.floor(((i + 1) / customers.length) * 100));
      }
      
      // Final update
      setProgress(100);
      
      // Refresh the customers list
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      // Show success message
      if (successCount > 0) {
        toast.success(`${successCount} müşteri başarıyla içe aktarıldı`);
        if (onSuccess) onSuccess();
      }
      
      if (duplicateCount > 0) {
        toast.info(`${duplicateCount} müşteri zaten sistemde mevcut`);
      }
      
      if (invalidCount > 0) {
        toast.warning(`${invalidCount} satır geçersiz veri nedeniyle içe aktarılamadı`);
      }
      
      if (failedCount > 0) {
        toast.error(`${failedCount} müşteri içe aktarılırken hata oluştu`);
      }
      
    } catch (error) {
      console.error('Excel import error:', error);
      toast.error('Excel dosyası işlenirken hata oluştu');
    } finally {
      setIsImporting(false);
    }
  };

  return {
    importFromExcel,
    isImporting,
    progress,
    stats
  };
};