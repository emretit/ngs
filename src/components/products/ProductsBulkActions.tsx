import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Trash2, Download, CheckCircle, XCircle, FileSpreadsheet, Upload } from "lucide-react";
import { Product } from "@/types/product";
import { exportProductTemplateToExcel } from "@/utils/excelUtils";
import ProductImportDialog from "./excel/ProductImportDialog";

interface ProductsBulkActionsProps {
  selectedProducts: Product[];
  onClearSelection: () => void;
  onBulkAction: (action: string) => void;
  onImportSuccess?: () => void;
}

const ProductsBulkActions = ({ 
  selectedProducts, 
  onClearSelection,
  onBulkAction,
  onImportSuccess
}: ProductsBulkActionsProps) => {
  const hasSelection = selectedProducts.length > 0;
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const handleDownloadTemplate = () => {
    exportProductTemplateToExcel();
  };

  return (
    <>
      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-blue-900">
            {hasSelection ? `${selectedProducts.length} ürün seçildi` : "Ürün seçilmedi"}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="text-indigo-700 border-indigo-300 hover:bg-indigo-100"
            onClick={handleDownloadTemplate}
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Şablon İndir
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="text-cyan-700 border-cyan-300 hover:bg-cyan-100"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-1" />
            Excel Yükle
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="text-blue-700 border-blue-300 hover:bg-blue-100"
            disabled={!hasSelection}
            onClick={() => onBulkAction('export')}
          >
            <Download className="h-4 w-4 mr-1" />
            Excel İndir
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="text-green-700 border-green-300 hover:bg-green-100"
            disabled={!hasSelection}
            onClick={() => onBulkAction('activate')}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Aktifleştir
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="text-orange-700 border-orange-300 hover:bg-orange-100"
            disabled={!hasSelection}
            onClick={() => onBulkAction('deactivate')}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Pasifleştir
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="text-red-700 border-red-300 hover:bg-red-100"
            disabled={!hasSelection}
            onClick={() => onBulkAction('delete')}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Sil
          </Button>
          
          {hasSelection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-gray-600 hover:bg-gray-100"
            >
              <X className="h-4 w-4 mr-1" />
              Seçimi Temizle
            </Button>
          )}
        </div>
      </div>
      
      <ProductImportDialog 
        isOpen={isImportDialogOpen} 
        setIsOpen={setIsImportDialogOpen}
        onImportSuccess={onImportSuccess}
      />
    </>
  );
};

export default ProductsBulkActions;
