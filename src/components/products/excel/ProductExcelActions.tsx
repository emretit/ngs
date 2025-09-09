import { Button } from '@/components/ui/button';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';
import { exportProductsToExcel, exportProductTemplateToExcel } from '@/utils/excelUtils';
import type { Product } from '@/types/product';

interface ProductExcelActionsProps {
  products: Product[];
  onImportClick: () => void;
}

const ProductExcelActions = ({ products, onImportClick }: ProductExcelActionsProps) => {
  const handleExport = () => {
    exportProductsToExcel(products);
  };

  const handleDownloadTemplate = () => {
    exportProductTemplateToExcel();
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

export default ProductExcelActions; 