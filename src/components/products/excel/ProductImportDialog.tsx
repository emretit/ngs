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
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

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
    handleImport
  } = useProductExcelImport(() => {
    setIsOpen(false);
    if (onImportSuccess) onImportSuccess();
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Excel Dosyasından Ürün İçe Aktar</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm text-blue-700">
                <p className="font-semibold">Excel dosyanız şu sütunları içermelidir:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div><span className="font-medium">name</span> (zorunlu)</div>
                  <div><span className="font-medium">price</span> (zorunlu)</div>
                  <div><span className="font-medium">stock_quantity</span> (zorunlu)</div>
                  <div><span className="font-medium">unit</span> (zorunlu)</div>
                  <div><span className="font-medium">tax_rate</span> (zorunlu)</div>
                  <div><span className="font-medium">currency</span> (zorunlu)</div>
                  <div><span className="font-medium">product_type</span> (zorunlu)</div>
                  <div><span className="font-medium">is_active</span> (zorunlu)</div>
                  <div>description (isteğe bağlı)</div>
                  <div>sku (isteğe bağlı)</div>
                  <div>barcode (isteğe bağlı)</div>
                  <div>discount_price (isteğe bağlı)</div>
                  <div>min_stock_level (isteğe bağlı)</div>
                  <div>stock_threshold (isteğe bağlı)</div>
                  <div>category_type (isteğe bağlı)</div>
                  <div>status (isteğe bağlı)</div>
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
          />
          
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
          <Button disabled={!selectedFile || isLoading} onClick={handleImport}>
            {isLoading ? 'İçe Aktarılıyor...' : 'İçe Aktar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImportDialog; 