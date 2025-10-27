import { Button } from '@/components/ui/button';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';
import { exportCustomersToExcel, exportCustomerTemplateToExcel } from '@/utils/customerExcelUtils';
import type { Customer } from '@/types/customer';

interface ExcelActionsProps {
  customers: Customer[];
  onImportClick: () => void;
}

const ExcelActions = ({ customers, onImportClick }: ExcelActionsProps) => {
  const handleExport = () => {
    exportCustomersToExcel(customers);
  };

  const handleDownloadTemplate = () => {
    exportCustomerTemplateToExcel();
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
        onClick={handleExport}
      >
        <Download className="h-4 w-4" />
        Excel İndir
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