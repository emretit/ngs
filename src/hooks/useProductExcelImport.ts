import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { importProductsFromExcel } from '@/utils/excelUtils';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const validateProductData = (row: any) => {
    const errors: string[] = [];
    
    // Required fields only
    if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
      errors.push('Ürün adı zorunludur');
    }
    
    if (row.price === undefined || row.price === null || isNaN(Number(row.price)) || Number(row.price) < 0) {
      errors.push('Geçerli bir satış fiyatı giriniz');
    }
    
    if (row.stock_quantity === undefined || row.stock_quantity === null || isNaN(Number(row.stock_quantity)) || Number(row.stock_quantity) < 0) {
      errors.push('Geçerli bir stok miktarı giriniz');
    }
    
    if (row.tax_rate === undefined || row.tax_rate === null || isNaN(Number(row.tax_rate)) || Number(row.tax_rate) < 0 || Number(row.tax_rate) > 100) {
      errors.push('Geçerli bir vergi oranı giriniz (0-100 arası)');
    }
    
    if (!row.unit || typeof row.unit !== 'string' || row.unit.trim() === '') {
      errors.push('Birim zorunludur');
    }
    
    if (!row.currency || typeof row.currency !== 'string' || !['TRY', 'USD', 'EUR', 'GBP'].includes(row.currency)) {
      errors.push('Geçerli bir para birimi giriniz (TRY, USD, EUR, GBP)');
    }
    
    if (!row.product_type || typeof row.product_type !== 'string' || !['physical', 'service'].includes(row.product_type)) {
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
      // Import and parse Excel file
      const importedData = await importProductsFromExcel(selectedFile);
      
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
        const row = importedData[i];
        
        // Validate data
        const validationErrors = validateProductData(row);
        if (validationErrors.length > 0) {
          console.warn(`Row ${i + 1} validation errors:`, validationErrors);
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
          // Prepare product data for insertion
          const productData = {
            name: row.name.trim(),
            description: row.description ? row.description.toString().trim() : "",
            sku: row.sku ? row.sku.toString().trim() : "",
            barcode: row.barcode ? row.barcode.toString().trim() : "",
            price: Number(row.price),
            discount_price: row.discount_price && row.discount_price !== '' ? Number(row.discount_price) : null,
            stock_quantity: Number(row.stock_quantity),
            min_stock_level: row.min_stock_level ? Number(row.min_stock_level) : 0,
            stock_threshold: row.stock_threshold && row.stock_threshold !== '' ? Number(row.stock_threshold) : 0,
            tax_rate: Number(row.tax_rate),
            unit: row.unit.toString().trim(),
            currency: row.currency.toString().trim(),
            category_type: row.category_type ? row.category_type.toString().trim() : "product",
            product_type: row.product_type.toString().trim(),
            status: row.status ? row.status.toString().trim() : "active",
            is_active: Boolean(row.is_active),
            image_url: null,
            category_id: null,
            supplier_id: null
          };
          
          // Insert new product
          const { error: insertError } = await supabase
            .from('products')
            .insert(productData);
            
          if (insertError) {
            console.error('Error inserting product:', insertError);
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