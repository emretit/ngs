
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { importCustomersFromExcel } from '@/utils/excelUtils';
import { Customer } from '@/types/customer';

interface ImportStats {
  success: number;
  failed: number;
  duplicates: number;
  invalidRows: number;
  total: number;
}

export const useExcelImport = (onSuccess?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ImportStats>({
    success: 0,
    failed: 0,
    duplicates: 0,
    invalidRows: 0,
    total: 0
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    setProgress(0);
    setStats({
      success: 0,
      failed: 0,
      duplicates: 0,
      invalidRows: 0,
      total: 0
    });
    
    try {
      // Import and parse Excel file
      const importedData = await importCustomersFromExcel(selectedFile);
      
      if (!importedData || importedData.length === 0) {
        toast.error('Excel dosyası boş veya geçersiz');
        setIsLoading(false);
        return;
      }
      
      // Set total for progress calculation
      setStats(prev => ({ ...prev, total: importedData.length }));
      
      // Process each customer record
      let successCount = 0;
      let failedCount = 0;
      let duplicateCount = 0;
      let invalidCount = 0;
      
      for (let i = 0; i < importedData.length; i++) {
        const row = importedData[i];
        
        // Check for required fields
        if (!row.name || !row.type || !row.status) {
          invalidCount++;
          setStats({
            success: successCount,
            failed: failedCount,
            duplicates: duplicateCount,
            invalidRows: invalidCount,
            total: importedData.length
          });
          
          // Update progress
          setProgress(Math.floor(((i + 1) / importedData.length) * 100));
          continue;
        }
        
        // Check if customer already exists by name
        const { data: existingCustomer, error: checkError } = await supabase
          .from('customers')
          .select('id, name')
          .eq('name', row.name)
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
              name: row.name,
              type: row.type,
              status: row.status,
              email: row.email || null,
              mobile_phone: row.mobile_phone || null,
              office_phone: row.office_phone || null,
              company: row.company || null,
              representative: row.representative || null,
              balance: row.balance || 0,
              address: row.address || null,
              tax_number: row.tax_number || null,
              tax_office: row.tax_office || null
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
          total: importedData.length
        });
        
        // Update progress
        setProgress(Math.floor(((i + 1) / importedData.length) * 100));
      }
      
      // Final update
      setProgress(100);
      
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
      console.error('Import error:', error);
      toast.error('İçe aktarma sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
      // Reset file input
      setTimeout(() => {
        setSelectedFile(null);
      }, 1000);
    }
  };

  return {
    isLoading,
    selectedFile,
    progress,
    stats,
    handleFileChange,
    handleImport
  };
};
