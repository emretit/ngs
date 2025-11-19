import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Trash2, Download, Mail, FileSpreadsheet, Upload } from "lucide-react";
import { Customer } from "@/types/customer";
import { exportCustomerTemplateToExcel, exportCustomersToExcel } from "@/utils/excelUtils";
import ImportDialog from "./excel/ImportDialog";

interface CustomersBulkActionsProps {
  selectedCustomers: Customer[];
  onClearSelection: () => void;
  onBulkAction?: (action: string) => void;
  onImportSuccess?: () => void;
}

const CustomersBulkActions = ({ selectedCustomers, onClearSelection, onBulkAction, onImportSuccess }: CustomersBulkActionsProps) => {
  const hasSelection = selectedCustomers.length > 0;
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const handleDownloadTemplate = () => {
    exportCustomerTemplateToExcel();
  };

  const handleExportExcel = () => {
    if (selectedCustomers.length > 0) {
      exportCustomersToExcel(selectedCustomers);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-blue-900">
            {hasSelection ? `${selectedCustomers.length} müşteri seçildi` : "Müşteri seçilmedi"}
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
            onClick={handleExportExcel}
          >
            <Download className="h-4 w-4 mr-1" />
            Excel İndir
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="text-green-700 border-green-300 hover:bg-green-100"
            disabled={!hasSelection}
          >
            <Mail className="h-4 w-4 mr-1" />
            Toplu E-posta
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="text-red-700 border-red-300 hover:bg-red-100"
            disabled={!hasSelection}
            onClick={() => onBulkAction?.('delete')}
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
      
      <ImportDialog 
        isOpen={isImportDialogOpen} 
        setIsOpen={setIsImportDialogOpen}
        onImportSuccess={onImportSuccess}
      />
    </>
  );
};

export default CustomersBulkActions;
