import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProductExcelImport } from '@/hooks/useProductExcelImport';
import { AlertCircle, CheckCircle, Info, AlertTriangle, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductImportDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onImportSuccess?: () => void;
}

const ProductImportDialog = ({ isOpen, setIsOpen, onImportSuccess }: ProductImportDialogProps) => {
  const {
    isLoading,
    selectedFile,
    progress,
    stats,
    handleFileChange,
    handleImport,
    isMappingColumns,
    columnMappings,
    unmappedColumns,
    mappingConfidence,
    showMappingDialog,
    excelColumns,
    customMapping,
    setCustomMapping,
    handleMappingConfirm,
    handleMappingCancel
  } = useProductExcelImport(() => {
    setIsOpen(false);
    if (onImportSuccess) onImportSuccess();
  });
  
  const systemFields = [
    { value: 'name', label: 'Ürün Adı (zorunlu)' },
    { value: 'description', label: 'Açıklama' },
    { value: 'sku', label: 'Stok Kodu' },
    { value: 'barcode', label: 'Barkod' },
    { value: 'price', label: 'Fiyat (zorunlu)' },
    { value: 'discount_rate', label: 'İndirim Oranı' },
    { value: 'stock_quantity', label: 'Stok Miktarı' },
    { value: 'min_stock_level', label: 'Minimum Stok' },
    { value: 'stock_threshold', label: 'Stok Eşiği' },
    { value: 'tax_rate', label: 'Vergi Oranı (zorunlu)' },
    { value: 'unit', label: 'Birim (zorunlu)' },
    { value: 'currency', label: 'Para Birimi (zorunlu)' },
    { value: 'category_type', label: 'Kategori Tipi' },
    { value: 'product_type', label: 'Ürün Tipi (zorunlu)' },
    { value: 'status', label: 'Durum' },
    { value: 'is_active', label: 'Aktif' },
    { value: 'none', label: 'Eşleştirme Yapma' }
  ];
  
  const updateMapping = (excelColumn: string, systemField: string) => {
    const newMapping = { ...customMapping };
    if (systemField && systemField !== 'none') {
      newMapping[excelColumn] = systemField;
    } else {
      delete newMapping[excelColumn];
    }
    setCustomMapping(newMapping);
  };
  
  const getMappingForColumn = (excelColumn: string): string => {
    // Önce custom mapping'i kontrol et
    if (customMapping[excelColumn]) {
      return customMapping[excelColumn];
    }
    // Sonra AI mapping'i kontrol et
    const aiMapping = columnMappings.find(m => m.excelColumn === excelColumn);
    return aiMapping?.systemField || 'none';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Excel Dosyasından Ürün İçe Aktar</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm text-blue-700">
                <p className="font-semibold">Excel dosyanız şu sütunları içermelidir:</p>
                <p className="text-xs text-blue-600 mb-2">
                  <span className="font-medium">✨ AI Özelliği:</span> Dosya seçildiğinde kolonlar otomatik olarak sistem alanlarına eşleştirilir. 
                  Kolon isimleri İngilizce, Türkçe veya farklı formatlarda olabilir.
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div><span className="font-medium">Ad</span> (zorunlu)</div>
                  <div><span className="font-medium">Fiyat</span> (zorunlu)</div>
                  <div><span className="font-medium">Birim</span> (zorunlu)</div>
                  <div><span className="font-medium">Vergi Oranı</span> (zorunlu)</div>
                  <div><span className="font-medium">Para Birimi</span> (zorunlu)</div>
                  <div><span className="font-medium">Ürün Tipi</span> (zorunlu)</div>
                  <div>Açıklama (isteğe bağlı)</div>
                  <div>Stok Kodu (isteğe bağlı)</div>
                  <div>Barkod (isteğe bağlı)</div>
                  <div>Stok Miktarı (isteğe bağlı)</div>
                  <div>İndirim Oranı (isteğe bağlı)</div>
                  <div>Minimum Stok (isteğe bağlı)</div>
                  <div>Stok Eşiği (isteğe bağlı)</div>
                  <div>Kategori Tipi (isteğe bağlı)</div>
                  <div>Durum (isteğe bağlı)</div>
                  <div>Aktif (isteğe bağlı)</div>
                </div>
                <p className="mt-2">
                  <span className="font-medium">Önce "Şablon İndir" butonuna tıklayarak örnek Excel dosyasını indirebilirsiniz.</span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-700">
                <p className="font-semibold mb-1">Dikkat:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Sistem, aynı isme veya SKU'ya sahip ürünleri kontrol edecek</li>
                  <li>Mevcut ürünler mükerrer olarak işaretlenecek</li>
                  <li>Sadece yeni ürünler eklenecektir</li>
                  <li>Geçersiz veriler içeren satırlar atlanacaktır</li>
                </ul>
              </div>
            </div>
          </div>
          
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-white
              hover:file:bg-primary/90
            "
            disabled={isMappingColumns}
          />
          
          {isMappingColumns && (
            <div className="flex items-center space-x-2 text-blue-600">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span className="text-sm">AI kolon eşleştirmesi yapılıyor...</span>
            </div>
          )}
          
          {/* AI Mapping Dialog */}
          {showMappingDialog && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
              <div className="flex items-start space-x-2">
                <Sparkles className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-green-800">AI Kolon Eşleştirmesi</p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Güven: %{mappingConfidence}
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mb-4">
                    Excel dosyanızdaki kolonlar otomatik olarak sistem alanlarına eşleştirildi. 
                    Gerekirse düzenleyebilirsiniz.
                  </p>
                  
                  {/* Zorunlu Alanlar Kontrolü */}
                  {(() => {
                    const requiredFieldsWithDefaults = ['price', 'tax_rate', 'unit', 'currency', 'product_type'];
                    const requiredFieldsWithoutDefaults = ['name'];
                    // Hem custom mapping hem de AI mapping'i kontrol et
                    const customMappedFields = Object.values(customMapping);
                    const aiMappedFields = columnMappings.map(m => m.systemField);
                    const allMappedFields = [...new Set([...customMappedFields, ...aiMappedFields])];
                    const missingWithDefaults = requiredFieldsWithDefaults.filter(field => !allMappedFields.includes(field));
                    const missingWithoutDefaults = requiredFieldsWithoutDefaults.filter(field => !allMappedFields.includes(field));
                    
                    if (missingWithoutDefaults.length > 0) {
                      const missingLabels = missingWithoutDefaults.map(field => {
                        const fieldInfo = systemFields.find(f => f.value === field);
                        return fieldInfo?.label || field;
                      });
                      
                      return (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-red-800 mb-1">
                                ⚠️ Kritik: Bu alanlar Excel'de bulunamadı ve zorunlu:
                              </p>
                              <p className="text-xs text-red-700">
                                {missingLabels.join(', ')} - Bu alanlar olmadan ürün oluşturulamaz. Lütfen Excel dosyanızda bu kolonları ekleyin veya eşleştirin.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    if (missingWithDefaults.length > 0) {
                      const missingLabels = missingWithDefaults.map(field => {
                        const fieldInfo = systemFields.find(f => f.value === field);
                        return fieldInfo?.label || field;
                      });
                      
                      return (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-amber-800 mb-1">
                                Bazı zorunlu alanlar Excel'de bulunamadı:
                              </p>
                              <p className="text-xs text-amber-700">
                                {missingLabels.join(', ')} - Bu alanlar default değerlerle doldurulacak (Fiyat: 0₺, Vergi: %20, Birim: adet, Para Birimi: TRY, Ürün Tipi: fiziksel). İsterseniz sonra düzenleyebilirsiniz.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Eşleştirilmiş Kolonlar */}
                  {columnMappings.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-medium text-green-800 mb-2">Eşleştirilmiş Kolonlar:</p>
                      {columnMappings.map((mapping) => (
                        <div key={mapping.excelColumn} className="bg-white rounded p-2 border border-green-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700">
                                  "{mapping.excelColumn}"
                                </span>
                                <span className="text-gray-400">→</span>
                                <Select
                                  value={getMappingForColumn(mapping.excelColumn)}
                                  onValueChange={(value) => updateMapping(mapping.excelColumn, value)}
                                >
                                  <SelectTrigger className="h-8 w-[200px]">
                                    <SelectValue placeholder="Sistem alanı seçin" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {systemFields.map((field) => (
                                      <SelectItem key={field.value} value={field.value}>
                                        {field.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="text-xs text-gray-500">
                                  (%{mapping.confidence})
                                </span>
                              </div>
                              {mapping.description && (
                                <p className="text-xs text-gray-500 mt-1 ml-4">
                                  {mapping.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Eşleştirilmeyen Kolonlar */}
                  {unmappedColumns.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-medium text-amber-800 mb-2">
                        Eşleştirilmeyen Kolonlar (Manuel Eşleştirme):
                      </p>
                      {unmappedColumns.map((column) => (
                        <div key={column} className="bg-white rounded p-2 border border-amber-200">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">
                              "{column}"
                            </span>
                            <span className="text-gray-400">→</span>
                            <Select
                              value={getMappingForColumn(column)}
                              onValueChange={(value) => updateMapping(column, value)}
                            >
                              <SelectTrigger className="h-8 w-[200px]">
                                <SelectValue placeholder="Sistem alanı seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {systemFields.map((field) => (
                                  <SelectItem key={field.value} value={field.value}>
                                    {field.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMappingCancel}
                    >
                      İptal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleMappingConfirm}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Eşleştirmeyi Onayla
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.success > 0 && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{stats.success} başarılı</span>
                  </div>
                )}
                {stats.failed > 0 && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{stats.failed} başarısız</span>
                  </div>
                )}
                {stats.duplicates > 0 && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">{stats.duplicates} mükerrer</span>
                  </div>
                )}
                {stats.invalidRows > 0 && (
                  <div className="flex items-center space-x-2 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">{stats.invalidRows} geçersiz</span>
                  </div>
                )}
              </div>
              <div>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-center mt-2 text-gray-600">
                  {progress < 100 ? `İşleniyor... ${stats.success + stats.failed + stats.duplicates + stats.invalidRows}/${stats.total}` : 'Tamamlandı!'}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            İptal
          </Button>
          <Button 
            disabled={!selectedFile || isLoading || showMappingDialog || isMappingColumns} 
            onClick={handleImport}
          >
            {isLoading ? 'İçe Aktarılıyor...' : showMappingDialog ? 'Önce Eşleştirmeyi Onaylayın' : 'İçe Aktar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImportDialog; 