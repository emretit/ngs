import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { useCustomerExcelImport } from "@/hooks/useCustomerExcelImport";

interface ImportDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ImportDialog = ({ isOpen, setIsOpen }: ImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const { importFromExcel, isImporting, progress, stats } = useCustomerExcelImport(() => {
    setIsOpen(false);
    setFile(null);
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))) {
      setFile(selectedFile);
    } else {
      alert('Lütfen geçerli bir Excel dosyası seçin (.xlsx veya .xls)');
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('Lütfen önce bir dosya seçin');
      return;
    }

    try {
      await importFromExcel(file);
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel'den Müşteri İçe Aktar
          </DialogTitle>
          <DialogDescription>
            Excel dosyasından müşteri bilgilerini sisteme aktarın
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Excel dosyasında şu sütunlar bulunmalıdır: Ad, E-posta, Telefon, Şirket, Tip (bireysel/kurumsal), Durum (aktif/pasif/potansiyel)
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="excel-file">Excel Dosyası</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isImporting}
            />
          </div>

          {file && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Seçilen dosya:</p>
              <p className="text-sm text-muted-foreground">{file.name}</p>
            </div>
          )}

          {isImporting && (
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
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            İptal
          </Button>
          <Button onClick={handleImport} disabled={!file || isImporting}>
            {isImporting ? 'İçe Aktarılıyor...' : 'İçe Aktar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;