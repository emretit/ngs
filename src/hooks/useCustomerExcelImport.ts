import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { importCustomersFromExcel, readExcelColumns } from '@/utils/excelUtils';
import { mapCustomerColumnsWithAI, ColumnMapping } from '@/services/customerColumnMappingService';

interface ImportStats {
  success: number;
  failed: number;
  duplicates: number;
  invalidRows: number;
  total: number;
}

export const useCustomerExcelImport = (onSuccess?: () => void) => {
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
      
      // Excel kolonlarını oku ve AI ile mapping yap
      try {
        setIsMappingColumns(true);
        const columns = await readExcelColumns(file);
        setExcelColumns(columns);
        
        if (columns.length === 0) {
          toast.error('Excel dosyasında kolon bulunamadı');
          setIsMappingColumns(false);
          return;
        }
        
        // AI ile mapping yap
        const mappingResult = await mapCustomerColumnsWithAI(columns);
        
        setColumnMappings(mappingResult.mappings);
        setUnmappedColumns(mappingResult.unmappedColumns);
        setMappingConfidence(mappingResult.confidence);
        
        // Mapping dialog'unu göster
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
    // Custom mapping'i oluştur
    const mapping: { [excelColumn: string]: string } = {};
    
    // Önce AI mapping'lerden gelen değerleri ekle
    columnMappings.forEach(m => {
      // 'none' değerlerini atla
      if (m.systemField !== 'none') {
        mapping[m.excelColumn] = m.systemField;
      }
    });
    
    // Kullanıcının manuel değişikliklerini de ekle (override eder)
    Object.keys(customMapping).forEach(key => {
      if (customMapping[key] !== 'none') {
        mapping[key] = customMapping[key];
      }
    });
    
    console.log('📋 Final mapping:', mapping);
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

  const validateCustomerData = (row: any) => {
    const errors: string[] = [];
    
    // Required fields
    if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
      errors.push('Müşteri adı zorunludur');
    }
    
    // Email validation (optional but format check)
    if (row.email && row.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push('Geçerli bir e-posta adresi giriniz');
      }
    }
    
    // Type validation (default: kurumsal)
    if (row.type && row.type.trim() !== '') {
      const type = row.type.toLowerCase();
      if (type !== 'bireysel' && type !== 'kurumsal') {
        errors.push('Müşteri tipi sadece "bireysel" veya "kurumsal" olabilir');
      }
    }
    
    // Status validation (default: aktif)
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
      console.log('📋 Using custom mapping:', customMapping);
      const importedData = await importCustomersFromExcel(selectedFile, customMapping);
      
      console.log('📋 Imported data sample (first row):', importedData[0]);

      if (!importedData || importedData.length === 0) {
        toast.error('Excel dosyası boş veya geçersiz');
        setIsLoading(false);
        return;
      }
      
      // Veri artık zaten normalize edilmiş olarak geliyor
      const normalizedData = importedData;
      
      setStats(prev => ({ ...prev, total: normalizedData.length }));
      
      // Get user company_id
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
        
        // Defaults
        if (!row.type) row.type = 'kurumsal';
        if (!row.status) row.status = 'aktif';
        
        // Validate
        const validationErrors = validateCustomerData(row);
        if (validationErrors.length > 0) {
          invalidCount++;
          setStats(prev => ({ ...prev, invalidRows: invalidCount }));
          setProgress(Math.floor(((i + 1) / normalizedData.length) * 100));
          continue;
        }
        
        // Check duplicates (by name) - basit kontrol
        const { data: existing } = await supabase
           .from('customers')
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
        
        const customerType = row.type?.toLowerCase() || 'bireysel';
        
        // Kurumsal müşteriler için company alanı zorunlu
        // Eğer company yoksa, name değerini company olarak kullan
        const companyValue = row.company || (customerType === 'kurumsal' ? row.name.trim() : null);
        
        // Debug: Ham veriyi kontrol et
        console.log('🔍 Processing row:', {
          name: row.name,
          tax_number: row.tax_number,
          tax_office: row.tax_office,
          city: row.city,
          district: row.district,
          tax_number_type: typeof row.tax_number,
          tax_office_type: typeof row.tax_office
        });
        
        // City ve district string'lerini ID'ye çevir
        let cityId: number | null = null;
        let districtId: number | null = null;
        
        if (row.city) {
          try {
            const cityName = row.city.toString().trim();
            const { data: cityData } = await supabase
              .from('turkey_cities')
              .select('id')
              .ilike('name', cityName)
              .maybeSingle();
            
            if (cityData) {
              cityId = cityData.id;
              console.log('✅ City found:', cityName, '→ ID:', cityId);
            } else {
              console.log('⚠️ City not found:', cityName);
            }
          } catch (error) {
            console.error('Error resolving city ID:', error);
          }
        }
        
        if (row.district && cityId) {
          try {
            const districtName = row.district.toString().trim();
            const { data: districtData } = await supabase
              .from('turkey_districts')
              .select('id')
              .ilike('name', districtName)
              .eq('city_id', cityId)
              .maybeSingle();
            
            if (districtData) {
              districtId = districtData.id;
              console.log('✅ District found:', districtName, '→ ID:', districtId);
            } else {
              console.log('⚠️ District not found:', districtName, 'for city ID:', cityId);
            }
          } catch (error) {
            console.error('Error resolving district ID:', error);
          }
        }
        
        const customerData: any = {
           company_id: companyId,
           name: row.name.trim(),
           company: companyValue,
           email: row.email?.toString().trim() || null,
           mobile_phone: row.mobile_phone?.toString().trim() || null,
           office_phone: row.office_phone?.toString().trim() || null,
           type: customerType,
           status: row.status?.toLowerCase() || 'aktif',
           tax_number: row.tax_number?.toString().trim() || null,
           tax_office: row.tax_office?.toString().trim() || null,
           address: row.address?.toString().trim() || null,
           city: row.city?.toString().trim() || null,
           district: row.district?.toString().trim() || null,
           city_id: cityId,
           district_id: districtId,
           country: row.country?.toString().trim() || null,
           postal_code: row.postal_code?.toString().trim() || null,
           balance: 0,
           is_einvoice_mukellef: false
        };
        
        // Debug: Supabase'e gönderilecek veriyi kontrol et
        console.log('💾 Customer data to insert:', {
          name: customerData.name,
          tax_number: customerData.tax_number,
          tax_office: customerData.tax_office
        });

        const { error: insertError } = await supabase
           .from('customers')
           .insert(customerData);
           
        if (insertError) {
           console.error('Error inserting customer:', insertError);
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
          toast.success(`${successCount} müşteri başarıyla içe aktarıldı`);
          if (onSuccess) onSuccess();
        }
        
        if (duplicateCount > 0) toast.info(`${duplicateCount} müşteri zaten mevcut`);
        if (invalidCount > 0) toast.warning(`${invalidCount} satır geçersiz`);
        if (failedCount > 0) toast.error(`${failedCount} müşteri eklenirken hata oluştu`);
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
