import { useState } from 'react';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { importProductsFromExcel, readExcelColumns } from '@/utils/excelUtils';
import { mapExcelColumnsWithAI, ColumnMapping } from '@/services/productColumnMappingService';

interface ImportStats {
  success: number;
  failed: number;
  duplicates: number;
  invalidRows: number;
  total: number;
}

export const useProductExcelImport = (onSuccess?: () => void) => {
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
        const mappingResult = await mapExcelColumnsWithAI(columns);
        
        setColumnMappings(mappingResult.mappings);
        setUnmappedColumns(mappingResult.unmappedColumns);
        setMappingConfidence(mappingResult.confidence);
        
        // Mapping dialog'unu göster
        setShowMappingDialog(true);
        
      } catch (error: any) {
        logger.error('Error mapping columns:', error);
        toast.error('Kolon eşleştirme yapılırken bir hata oluştu');
      } finally {
        setIsMappingColumns(false);
      }
    }
  };
  
  const handleMappingConfirm = () => {
    // Custom mapping'i oluştur
    const mapping: { [excelColumn: string]: string } = {};
    columnMappings.forEach(m => {
      mapping[m.excelColumn] = m.systemField;
    });
    
    // Kullanıcının manuel değişikliklerini de ekle
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

  const validateProductData = (row: any) => {
    const errors: string[] = [];
    
    // Required fields only
    if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
      errors.push('Ürün adı zorunludur');
    }
    
    // price zorunlu ama default değeri var (0), sadece geçersizse hata ver
    if (row.price !== undefined && row.price !== null && row.price !== '' && (isNaN(Number(row.price)) || Number(row.price) < 0)) {
      errors.push('Geçerli bir satış fiyatı giriniz (pozitif sayı)');
    }
    // Eğer price yoksa veya 0 ise, default olarak 0 kullanılacak (kullanıcı sonra düzenleyebilir)
    
    // stock_quantity artık zorunlu değil, isteğe bağlı
    // Sadece varsa ve geçerli değilse hata ver
    if (row.stock_quantity !== undefined && row.stock_quantity !== null && row.stock_quantity !== '' && (isNaN(Number(row.stock_quantity)) || Number(row.stock_quantity) < 0)) {
      errors.push('Geçerli bir stok miktarı giriniz (pozitif sayı veya boş)');
    }
    
    // tax_rate zorunlu ama default değeri var, sadece geçersizse hata ver
    if (row.tax_rate !== undefined && row.tax_rate !== null && row.tax_rate !== '' && (isNaN(Number(row.tax_rate)) || Number(row.tax_rate) < 0 || Number(row.tax_rate) > 100)) {
      errors.push('Geçerli bir vergi oranı giriniz (0-100 arası)');
    }
    // Eğer tax_rate yoksa default değer kullanılacak
    
    // unit zorunlu ama default değeri var
    if (row.unit && (typeof row.unit !== 'string' || row.unit.trim() === '')) {
      errors.push('Geçerli bir birim giriniz (piece, kg, m, hour, vb.)');
    }
    
    // currency zorunlu ama default değeri var
    if (row.currency && (typeof row.currency !== 'string' || !['TRY', 'TL', 'USD', 'EUR', 'GBP'].includes(row.currency.toUpperCase()))) {
      errors.push('Geçerli bir para birimi giriniz (TRY, USD, EUR, GBP)');
    }
    
    // product_type zorunlu ama default değeri var
    if (row.product_type && (typeof row.product_type !== 'string' || !['physical', 'service'].includes(row.product_type))) {
      errors.push('Geçerli bir ürün tipi giriniz (physical, service)');
    }
    
    // Convert string boolean to actual boolean for is_active
    if (row.is_active !== undefined && row.is_active !== null) {
      if (typeof row.is_active === 'string') {
        if (row.is_active.toLowerCase() === 'true') {
          row.is_active = true;
        } else if (row.is_active.toLowerCase() === 'false') {
          row.is_active = false;
        } else {
          errors.push('is_active alanı true veya false olmalıdır');
        }
      } else if (typeof row.is_active !== 'boolean') {
        errors.push('is_active alanı true veya false olmalıdır');
      }
    } else {
      row.is_active = true; // Default value
    }
    
    return errors;
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
      // Import and parse Excel file with custom mapping
      const importedData = await importProductsFromExcel(selectedFile, customMapping);
      
      if (!importedData || importedData.length === 0) {
        toast.error('Excel dosyası boş veya geçersiz');
        setIsLoading(false);
        return;
      }
      
      // Set total for progress calculation
      setStats(prev => ({ ...prev, total: importedData.length }));
      
      // Process each product record
      let successCount = 0;
      let failedCount = 0;
      let duplicateCount = 0;
      let invalidCount = 0;
      
      for (let i = 0; i < importedData.length; i++) {
        let row = importedData[i];
        
        // Önce eksik zorunlu alanları default değerlerle doldur
        // Böylece Excel'de olmayan kolonlar için hata vermeyiz
        if (row.price === undefined || row.price === null || row.price === '') {
          row.price = 0; // Default fiyat (kullanıcı sonra düzenleyebilir)
        }
        if (row.tax_rate === undefined || row.tax_rate === null || row.tax_rate === '') {
          row.tax_rate = 20; // Default vergi oranı
        }
        if (!row.unit || row.unit === '') {
          row.unit = 'piece'; // Default birim
        }
        if (!row.currency || row.currency === '') {
          row.currency = 'TRY'; // Default para birimi
        }
        if (!row.product_type || row.product_type === '') {
          row.product_type = 'physical'; // Default ürün tipi
        }
        
        // Validate data
        const validationErrors = validateProductData(row);
        if (validationErrors.length > 0) {
          logger.warn(`Row ${i + 1} validation errors:`, validationErrors);
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
        
        // Check if product already exists by name or SKU
        let existingProduct = null;
        
        if (row.sku && row.sku.trim() !== '') {
          const { data: existingBySku } = await supabase
            .from('products')
            .select('id, name, sku')
            .eq('sku', row.sku.trim())
            .maybeSingle();
          
          if (existingBySku) {
            existingProduct = existingBySku;
          }
        }
        
        if (!existingProduct) {
          const { data: existingByName } = await supabase
            .from('products')
            .select('id, name')
            .eq('name', row.name.trim())
            .maybeSingle();
          
          if (existingByName) {
            existingProduct = existingByName;
          }
        }
        
        if (existingProduct) {
          duplicateCount++;
        } else {
          // Kullanıcının company_id'sini al
          const { data: { user } } = await supabase.auth.getUser();
          const { data: profile } = await supabase
            .from("profiles")
            .select("company_id")
            .eq("id", user?.id)
            .single();

          const companyId = profile?.company_id;
          const stockQuantity = row.stock_quantity !== undefined && row.stock_quantity !== null && row.stock_quantity !== '' ? Number(row.stock_quantity) : 0;

          // Prepare product data for insertion
          const productData = {
            name: row.name ? row.name.toString().trim() : '',
            description: row.description ? row.description.toString().trim() : "",
            sku: row.sku ? row.sku.toString().trim() : "",
            barcode: row.barcode ? row.barcode.toString().trim() : "",
            price: Number(row.price),
            discount_rate: (row.discount_rate !== undefined && row.discount_rate !== null && row.discount_rate !== '') ? Number(row.discount_rate) : 0,
            stock_quantity: 0, // Products tablosunda stok artık kullanılmıyor
            min_stock_level: (row.min_stock_level !== undefined && row.min_stock_level !== null && row.min_stock_level !== '') ? Number(row.min_stock_level) : 0,
            stock_threshold: (row.stock_threshold !== undefined && row.stock_threshold !== null && row.stock_threshold !== '') ? Number(row.stock_threshold) : 0,
            tax_rate: (row.tax_rate !== undefined && row.tax_rate !== null && row.tax_rate !== '') ? Number(row.tax_rate) : 20,
            unit: row.unit ? row.unit.toString().trim() : 'piece',
            currency: row.currency ? row.currency.toString().trim().toUpperCase() : 'TRY',
            category_type: row.category_type ? row.category_type.toString().trim() : "product",
            product_type: row.product_type ? row.product_type.toString().trim() : "physical",
            status: row.status ? row.status.toString().trim() : "active",
            is_active: row.is_active !== undefined && row.is_active !== null && row.is_active !== '' ? Boolean(row.is_active) : true,
            image_url: null,
            category_id: null,
            supplier_id: null,
            company_id: companyId
          };
          
          // Insert new product
          const { data: insertedProduct, error: insertError } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single();
            
          if (insertError) {
            logger.error('Error inserting product:', insertError);
            failedCount++;
          } else {
            // Eğer stok miktarı varsa ve company_id varsa, warehouse_stock'a ekle
            if (insertedProduct && companyId && stockQuantity > 0) {
              // Company'nin Ana Depo'sunu bul
              const { data: warehouses } = await supabase
                .from("warehouses")
                .select("id")
                .eq("company_id", companyId)
                .eq("warehouse_type", "main")
                .eq("is_active", true)
                .limit(1)
                .maybeSingle();

              if (warehouses) {
                const { error: stockError } = await supabase
                  .from("warehouse_stock")
                  .insert({
                    company_id: companyId,
                    product_id: insertedProduct.id,
                    warehouse_id: warehouses.id,
                    quantity: stockQuantity,
                    reserved_quantity: 0,
                    last_transaction_date: new Date().toISOString()
                  });

                if (stockError) {
                  logger.error('Error adding stock to warehouse:', stockError);
                }
              }
            }
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
        toast.success(`${successCount} ürün başarıyla içe aktarıldı`);
        if (onSuccess) onSuccess();
      }
      
      if (duplicateCount > 0) {
        toast.info(`${duplicateCount} ürün zaten sistemde mevcut`);
      }
      
      if (invalidCount > 0) {
        toast.warning(`${invalidCount} satır geçersiz veri nedeniyle içe aktarılamadı`);
      }
      
      if (failedCount > 0) {
        toast.error(`${failedCount} ürün içe aktarılırken hata oluştu`);
      }
      
    } catch (error) {
      logger.error('Import error:', error);
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
    handleImport,
    // AI Mapping
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