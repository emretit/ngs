import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCustomerExcelImport } from '@/hooks/useCustomerExcelImport';
import { AlertCircle, CheckCircle, Info, AlertTriangle, Sparkles, Edit } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CustomerImportDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onImportSuccess?: () => void;
}

const CustomerImportDialog = ({ isOpen, setIsOpen, onImportSuccess }: CustomerImportDialogProps) => {
  const {
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
  } = useCustomerExcelImport(() => {
    setIsOpen(false);
    if (onImportSuccess) onImportSuccess();
  });
  
  const systemFields = [
    { value: 'name', label: 'Müşteri Adı (zorunlu)' },
    { value: 'company', label: 'Şirket Adı (kurumsal için zorunlu)' },
    { value: 'email', label: 'E-posta' },
    { value: 'mobile_phone', label: 'Cep Telefonu' },
    { value: 'office_phone', label: 'İş Telefonu' },
    { value: 'type', label: 'Tip (bireysel/kurumsal)' },
    { value: 'status', label: 'Durum (aktif/pasif/potansiyel)' },
    { value: 'tax_number', label: 'Vergi/TC No' },
    { value: 'tax_office', label: 'Vergi Dairesi' },
    { value: 'address', label: 'Adres' },
    { value: 'city', label: 'Şehir' },
    { value: 'district', label: 'İlçe' },
    { value: 'country', label: 'Ülke' },
    { value: 'postal_code', label: 'Posta Kodu' },
    { value: 'none', label: 'Eşleştirme Yapma' }
  ];
  
  const updateMapping = (excelColumn: string, systemField: string) => {
    const newMapping = { ...customMapping };
    
    if (systemField === 'none') {
      // "Eşleştirme Yapma" seçildiğinde, AI mapping'i override etmek için özel bir değer kaydet
      newMapping[excelColumn] = 'none';
    } else if (systemField) {
      // Aynı sistem alanına başka bir kolon eşleştirilmiş mi kontrol et
      const existingColumn = Object.keys(newMapping).find(
        col => col !== excelColumn && newMapping[col] === systemField && newMapping[col] !== 'none'
      );
      
      // AI mapping'de de kontrol et
      const existingAIMapping = columnMappings.find(
        m => m.excelColumn !== excelColumn && m.systemField === systemField
      );
      
      if (existingColumn || existingAIMapping) {
        // Önceki eşleştirmeyi kaldır
        if (existingColumn) {
          delete newMapping[existingColumn];
          console.log(`⚠️ "${existingColumn}" kolonunun "${systemField}" eşleştirmesi kaldırıldı, "${excelColumn}" ile değiştirildi`);
        }
        if (existingAIMapping && !newMapping[existingAIMapping.excelColumn]) {
          // AI mapping'i override et
          newMapping[existingAIMapping.excelColumn] = 'none';
          console.log(`⚠️ AI eşleştirmesi "${existingAIMapping.excelColumn}" → "${systemField}" kaldırıldı, "${excelColumn}" ile değiştirildi`);
        }
      }
      
      newMapping[excelColumn] = systemField;
    } else {
      delete newMapping[excelColumn];
    }
    
    setCustomMapping(newMapping);
  };
  
  const getMappingForColumn = (excelColumn: string): string => {
    // Önce customMapping'e bak (kullanıcı manuel olarak değiştirdiyse veya "none" seçtiyse)
    if (customMapping[excelColumn] !== undefined) {
      return customMapping[excelColumn];
    }
    // Custom mapping yoksa AI mapping'i kullan
    const aiMapping = columnMappings.find(m => m.excelColumn === excelColumn);
    return aiMapping?.systemField || 'none';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-lg">Excel Dosyasından Müşteri İçe Aktar</DialogTitle>
        </DialogHeader>
        
        <div className="py-1 space-y-2">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
            <div className="flex items-start space-x-1.5">
              <Info className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-semibold">✨ AI ile otomatik kolon eşleştirme</p>
                <p className="text-blue-600 text-[11px] mt-0.5">
                  Desteklenen kolonlar: Ad/Ünvan (zorunlu), E-posta, Telefon, Vergi No, Adres, Şehir, İlçe vb.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
            <div className="flex items-start space-x-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-700">
                <p className="font-semibold mb-0.5">Dikkat:</p>
                <ul className="list-disc list-inside space-y-0 text-[11px]">
                  <li>Aynı isimli müşteriler mükerrer olarak işaretlenir</li>
                  <li>Sadece yeni müşteriler eklenir</li>
                  <li>Geçersiz satırlar atlanır</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="flex-1 text-xs text-gray-500
                file:mr-3 file:py-1.5 file:px-3
                file:rounded-md file:border-0
                file:text-xs file:font-semibold
                file:bg-primary file:text-white
                hover:file:bg-primary/90
              "
              disabled={isMappingColumns || isLoading}
            />
            <Button
              disabled={!selectedFile || isLoading || showMappingDialog || isMappingColumns}
              onClick={handleImport}
              size="sm"
              className="flex-shrink-0 text-xs"
            >
              {isLoading ? 'Aktarılıyor...' : showMappingDialog ? 'Önce Onayla' : 'İçe Aktar'}
            </Button>
          </div>
          
          {isMappingColumns && (
            <div className="flex items-center space-x-2 text-blue-600 text-xs">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>AI kolon eşleştirmesi yapılıyor...</span>
            </div>
          )}
          
          {/* Düzenle Butonu - Mapping onaylandıktan sonra görünür */}
          {!showMappingDialog && !isMappingColumns && selectedFile && (Object.keys(customMapping).length > 0 || columnMappings.length > 0) && (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-1.5">
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                <p className="text-xs font-medium text-gray-700">
                  {Object.keys(customMapping).length > 0 
                    ? `${Object.keys(customMapping).length} kolon eşleştirildi`
                    : `${columnMappings.length} kolon otomatik eşleştirildi`}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMappingDialog(true)}
                className="h-6 text-xs px-2"
              >
                <Edit className="h-3 w-3 mr-1" />
                Düzenle
              </Button>
            </div>
          )}
          
          {/* AI Mapping Dialog */}
          {showMappingDialog && (
            <div className="bg-green-50 border border-green-200 rounded-md p-2 space-y-2">
              <div className="flex items-start space-x-1.5">
                <Sparkles className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-green-800">AI Kolon Eşleştirmesi</p>
                    <span className="text-[11px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                      %{mappingConfidence}
                    </span>
                  </div>
                  <p className="text-[11px] text-green-700 mb-2">
                    Kolonlar otomatik eşleştirildi. Gerekirse düzenleyebilirsiniz.
                  </p>
                  
                  {/* Zorunlu Alanlar Kontrolü */}
                  {(() => {
                    const requiredFields = ['name'];
                    const customMappedFields = Object.values(customMapping);
                    const aiMappedFields = columnMappings.map(m => m.systemField);
                    const allMappedFields = [...new Set([...customMappedFields, ...aiMappedFields])];
                    const missingFields = requiredFields.filter(field => !allMappedFields.includes(field));
                    
                    if (missingFields.length > 0) {
                      const missingLabels = missingFields.map(field => {
                        const fieldInfo = systemFields.find(f => f.value === field);
                        return fieldInfo?.label || field;
                      });
                      
                      return (
                        <div className="bg-red-50 border border-red-200 rounded-md p-1.5 mb-2">
                          <div className="flex items-start space-x-1.5">
                            <AlertCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] text-red-700">
                              <span className="font-medium">Zorunlu alan eksik:</span> {missingLabels.join(', ')} - Excel'de bu kolonları ekleyin veya eşleştirin.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Eşleştirilmiş Kolonlar */}
                  {columnMappings.length > 0 && (
                    <div className="space-y-1 mb-2">
                      <p className="text-[11px] font-medium text-green-800 mb-1">Eşleştirilmiş:</p>
                      {columnMappings.map((mapping) => {
                        const selectedField = systemFields.find(f => f.value === getMappingForColumn(mapping.excelColumn));
                        return (
                          <div key={mapping.excelColumn} className="bg-white rounded p-1 border border-green-200">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-shrink-0 min-w-[90px]">
                                <div className="text-[10px] text-gray-500 mb-0.5">Excel:</div>
                                <span className="text-[11px] font-medium text-gray-700 truncate block">
                                  "{mapping.excelColumn}"
                                </span>
                              </div>
                              <span className="text-gray-400 text-xs">→</span>
                              <div className="flex-1">
                                <div className="text-[10px] text-gray-500 mb-0.5">Pafta.app:</div>
                                <Select
                                  value={getMappingForColumn(mapping.excelColumn)}
                                  onValueChange={(value) => updateMapping(mapping.excelColumn, value)}
                                >
                                  <SelectTrigger className="h-6 w-full text-[11px]">
                                    <SelectValue placeholder="Seçin" />
                                  </SelectTrigger>
                                  <SelectContent 
                                    className="bg-background border border-border shadow-xl z-[9999] [&>button:first-child]:hidden [&>button:last-child]:hidden [&>div:nth-child(2)]:!h-[300px] [&>div:nth-child(2)]:!max-h-[300px] [&>div:nth-child(2)]:overflow-y-auto" 
                                    position="popper"
                                  >
                                    {systemFields.map((field) => (
                                      <SelectItem key={field.value} value={field.value} className="text-xs">
                                        {field.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <span className="text-[11px] text-gray-500 flex-shrink-0">
                                %{mapping.confidence}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Eşleştirilmeyen Kolonlar */}
                  {unmappedColumns.length > 0 && (
                    <div className="space-y-1 mb-2">
                      <p className="text-[11px] font-medium text-amber-800 mb-1">
                        Eşleştirilmeyen:
                      </p>
                      {unmappedColumns.map((column) => (
                        <div key={column} className="bg-white rounded p-1 border border-amber-200">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-shrink-0 min-w-[90px]">
                              <div className="text-[10px] text-gray-500 mb-0.5">Excel:</div>
                              <span className="text-[11px] font-medium text-gray-700 truncate block">
                                "{column}"
                              </span>
                            </div>
                            <span className="text-gray-400 text-xs">→</span>
                            <div className="flex-1">
                              <div className="text-[10px] text-gray-500 mb-0.5">Pafta.app:</div>
                              <Select
                                value={getMappingForColumn(column)}
                                onValueChange={(value) => updateMapping(column, value)}
                              >
                                <SelectTrigger className="h-6 w-full text-[11px]">
                                  <SelectValue placeholder="Seçin" />
                                </SelectTrigger>
                                <SelectContent 
                                  className="bg-background border border-border shadow-xl z-[9999] [&>button:first-child]:hidden [&>button:last-child]:hidden [&>div:nth-child(2)]:!h-[300px] [&>div:nth-child(2)]:!max-h-[300px] [&>div:nth-child(2)]:overflow-y-auto" 
                                  position="popper"
                                >
                                  {systemFields.map((field) => (
                                    <SelectItem key={field.value} value={field.value} className="text-xs">
                                      {field.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex space-x-1.5 pt-0.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMappingCancel}
                      className="h-6 text-[11px] px-2"
                    >
                      İptal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleMappingConfirm}
                      className="bg-green-600 hover:bg-green-700 h-6 text-[11px] px-2"
                    >
                      Onayla
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                {stats.success > 0 && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span className="text-[11px] font-medium">{stats.success} başarılı</span>
                  </div>
                )}
                {stats.failed > 0 && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span className="text-[11px] font-medium">{stats.failed} başarısız</span>
                  </div>
                )}
                {stats.duplicates > 0 && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Info className="h-3 w-3" />
                    <span className="text-[11px] font-medium">{stats.duplicates} mükerrer</span>
                  </div>
                )}
                {stats.invalidRows > 0 && (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-[11px] font-medium">{stats.invalidRows} geçersiz</span>
                  </div>
                )}
              </div>
              <div>
                <Progress value={progress} className="h-1.5" />
                <p className="text-[11px] text-center mt-0.5 text-gray-600">
                  {progress < 100 ? `${stats.success + stats.failed + stats.duplicates + stats.invalidRows}/${stats.total}` : 'Tamamlandı!'}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="pt-1">
          {isLoading && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCancel}
              className="h-6 text-[11px] px-2"
            >
              İptal Et
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerImportDialog;
