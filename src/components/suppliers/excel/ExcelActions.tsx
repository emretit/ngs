import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { exportSupplierTemplateToExcel } from '@/utils/supplierExcelUtils';
import type { Supplier } from '@/types/supplier';

interface ExcelActionsProps {
  suppliers: Supplier[];
  onImportClick: () => void;
}

const ExcelActions = ({ suppliers, onImportClick }: ExcelActionsProps) => {
  const handleDownloadTemplate = () => {
    exportSupplierTemplateToExcel();
  };

  return (
    <div className="flex space-x-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-2" 
        onClick={handleDownloadTemplate}
      >
        <FileSpreadsheet className="h-4 w-4" />
        Şablon İndir
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-2" 
        onClick={onImportClick}
      >
        <Upload className="h-4 w-4" />
        Excel Yükle
      </Button>
    </div>
  );
};

export default ExcelActions;