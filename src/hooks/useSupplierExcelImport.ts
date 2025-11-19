import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { importCustomersFromExcel, readExcelColumns } from '@/utils/excelUtils'; // Reusing existing util as it returns JSON
import { mapSupplierColumnsWithAI, ColumnMapping } from '@/services/supplierColumnMappingService';

interface ImportStats {
  success: number;
  failed: number;
  duplicates: number;
  invalidRows: number;
  total: number;
}

export const useSupplierExcelImport = (onSuccess?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const isCancelledRef = useRef<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ImportStats>({
    success: 0,
    failed: 0,
    duplicates: 0,
    invalidRows: 0,
    total: 0
  });
  
  // AI Mapping states
  const [isMappingColumns, setIsMappingColumns] = useState(false);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [unmappedColumns, setUnmappedColumns] = useState<string[]>([]);
  const [mappingConfidence, setMappingConfidence] = useState<number>(0);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [customMapping, setCustomMapping] = useState<{ [excelColumn: string]: string }>({});

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      try {
        setIsMappingColumns(true);
        const columns = await readExcelColumns(file);
        setExcelColumns(columns);
        
        if (columns.length === 0) {
          toast.error('Excel dosyasında kolon bulunamadı');
          setIsMappingColumns(false);
          return;
        }
        
        const mappingResult = await mapSupplierColumnsWithAI(columns);
        
        setColumnMappings(mappingResult.mappings);
        setUnmappedColumns(mappingResult.unmappedColumns);
        setMappingConfidence(mappingResult.confidence);
        
        setShowMappingDialog(true);
        
      } catch (error: any) {
        console.error('Error mapping columns:', error);
        toast.error('Kolon eşleştirme yapılırken bir hata oluştu');
      } finally {
        setIsMappingColumns(false);
      }
    }
  };
  
  const handleMappingConfirm = () => {
    const mapping: { [excelColumn: string]: string } = {};
    columnMappings.forEach(m => {
      mapping[m.excelColumn] = m.systemField;
    });
    Object.assign(mapping, customMapping);
    setCustomMapping(mapping);
    setShowMappingDialog(false);
  };
  
  const handleMappingCancel = () => {
    setSelectedFile(null);
    setShowMappingDialog(false);
    setColumnMappings([]);
    setUnmappedColumns([]);
    setCustomMapping({});
  };

  const validateSupplierData = (row: any) => {
    const errors: string[] = [];
    
    if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
      errors.push('Tedarikçi adı zorunludur');
    }
    
    if (row.email && row.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push('Geçerli bir e-posta adresi giriniz');
      }
    }
    
    if (row.type && row.type.trim() !== '') {
      const type = row.type.toLowerCase();
      if (type !== 'bireysel' && type !== 'kurumsal') {
        errors.push('Tedarikçi tipi sadece "bireysel" veya "kurumsal" olabilir');
      }
    }
    
    if (row.status && row.status.trim() !== '') {
      const status = row.status.toLowerCase();
      if (!['aktif', 'pasif', 'potansiyel'].includes(status)) {
        errors.push('Durum "aktif", "pasif" veya "potansiyel" olabilir');
      }
    }
    
    return errors;
  };

  const handleCancel = () => {
    try {
      isCancelledRef.current = true;
      setIsLoading(false);
      toast.info('İçe aktarma iptal edildi');
    } catch (error) {
      console.error('Error cancelling import:', error);
      setIsLoading(false);
      toast.info('İçe aktarma iptal edildi');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    isCancelledRef.current = false;
    setProgress(0);
    setStats({
      success: 0,
      failed: 0,
      duplicates: 0,
      invalidRows: 0,
      total: 0
    });
    
    try {
      // Import and parse Excel file with custom mapping
      const importedData = await importCustomersFromExcel(selectedFile, customMapping);

      if (!importedData || importedData.length === 0) {
        toast.error('Excel dosyası boş veya geçersiz');
        setIsLoading(false);
        return;
      }
      
      // Veri artık zaten normalize edilmiş olarak geliyor
      const normalizedData = importedData;
      
      setStats(prev => ({ ...prev, total: normalizedData.length }));
      
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const companyId = profile?.company_id;
      
      let successCount = 0;
      let failedCount = 0;
      let duplicateCount = 0;
      let invalidCount = 0;
      
      for (let i = 0; i < normalizedData.length; i++) {
        // İptal kontrolü - her iterasyonda kontrol et
        if (isCancelledRef.current) {
          toast.info('İçe aktarma iptal edildi');
          setIsLoading(false);
          return;
        }
        
        let row = normalizedData[i];
        
        if (!row.type) row.type = 'kurumsal';
        if (!row.status) row.status = 'aktif';
        
        const validationErrors = validateSupplierData(row);
        if (validationErrors.length > 0) {
          invalidCount++;
          setStats(prev => ({ ...prev, invalidRows: invalidCount }));
          setProgress(Math.floor(((i + 1) / normalizedData.length) * 100));
          continue;
        }
        
        const { data: existing } = await supabase
           .from('suppliers')
           .select('id')
           .eq('company_id', companyId)
           .eq('name', row.name.trim())
           .maybeSingle();
           
        if (existing) {
           duplicateCount++;
           setStats(prev => ({ ...prev, duplicates: duplicateCount }));
           setProgress(Math.floor(((i + 1) / normalizedData.length) * 100));
           continue;
        }
        
        const supplierData = {
           company_id: companyId,
           name: row.name.trim(),
           email: row.email,
           mobile_phone: row.mobile_phone,
           office_phone: row.office_phone,
           type: row.type.toLowerCase(),
           status: row.status.toLowerCase(),
           tax_number: row.tax_number,
           tax_office: row.tax_office,
           address: row.address,
           city: row.city,
           district: row.district,
           country: row.country,
           postal_code: row.postal_code,
           website: row.website,
           bank_name: row.bank_name,
           iban: row.iban,
           balance: 0,
           is_active: true,
           is_einvoice_mukellef: false
        };

        const { error: insertError } = await supabase
           .from('suppliers')
           .insert(supplierData);
           
        if (insertError) {
           console.error('Error inserting supplier:', insertError);
           failedCount++;
        } else {
           successCount++;
        }
        
        setStats({
          success: successCount,
          failed: failedCount,
          duplicates: duplicateCount,
          invalidRows: invalidCount,
          total: normalizedData.length
        });
        
        setProgress(Math.floor(((i + 1) / normalizedData.length) * 100));
      }
      
      // İptal edilmediyse progress'i 100'e tamamla
      if (!isCancelledRef.current) {
        setProgress(100);
        
        if (successCount > 0) {
          toast.success(`${successCount} tedarikçi başarıyla içe aktarıldı`);
          if (onSuccess) onSuccess();
        }
        
        if (duplicateCount > 0) toast.info(`${duplicateCount} tedarikçi zaten mevcut`);
        if (invalidCount > 0) toast.warning(`${invalidCount} satır geçersiz`);
        if (failedCount > 0) toast.error(`${failedCount} tedarikçi eklenirken hata oluştu`);
      }
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('İçe aktarma sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
      if (!isCancelledRef.current) {
        setTimeout(() => setSelectedFile(null), 1000);
      }
    }
  };

  return {
    isLoading,
    selectedFile,
    progress,
    stats,
    handleFileChange,
    handleImport,
    handleCancel,
    isMappingColumns,
    columnMappings,
    unmappedColumns,
    mappingConfidence,
    showMappingDialog,
    setShowMappingDialog,
    excelColumns,
    customMapping,
    setCustomMapping,
    handleMappingConfirm,
    handleMappingCancel
  };
};
