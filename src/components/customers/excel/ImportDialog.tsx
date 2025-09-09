
import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useExcelImport } from '@/hooks/useExcelImport';

interface ImportDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const ImportDialog = ({ isOpen, setIsOpen }: ImportDialogProps) => {
  const {
    isLoading,
    selectedFile,
    progress,
    stats,
    handleFileChange,
    handleImport
  } = useExcelImport(() => setIsOpen(false));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excel Dosyasından Müşteri İçe Aktar</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-500 mb-4">
            Lütfen bir Excel dosyası seçin. Dosya şu sütunları içermelidir: <strong>name</strong> (zorunlu), <strong>type</strong> (zorunlu), <strong>status</strong> (zorunlu), email, mobile_phone, office_phone, company, representative, balance, address, tax_number, tax_office.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Sistem, veritabanında zaten var olan müşterileri kontrol edecek ve sadece yeni müşterileri ekleyecektir.
          </p>
          
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
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>{stats.success} başarılı</span>
                <span>{stats.failed} başarısız</span>
                {stats.duplicates > 0 && (
                  <span>{stats.duplicates} mükerrer</span>
                )}
                {stats.invalidRows > 0 && (
                  <span>{stats.invalidRows} geçersiz</span>
                )}
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center mt-1">
                {progress < 100 ? 'İçe aktarılıyor...' : 'Tamamlandı!'}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
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

export default ImportDialog;
