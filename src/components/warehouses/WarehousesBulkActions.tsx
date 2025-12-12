import React from "react";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, XCircle, Download, FileSpreadsheet, Trash2 } from "lucide-react";
import { Warehouse } from "@/types/warehouse";

interface WarehousesBulkActionsProps {
  selectedWarehouses: Warehouse[];
  onClearSelection: () => void;
  onBulkAction: (action: string) => void;
}

const WarehousesBulkActions = ({ 
  selectedWarehouses, 
  onClearSelection,
  onBulkAction
}: WarehousesBulkActionsProps) => {
  const hasSelection = selectedWarehouses.length > 0;

  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-blue-900">
          {hasSelection ? `${selectedWarehouses.length} depo seçildi` : "Depo seçilmedi"}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="text-indigo-700 border-indigo-300 hover:bg-indigo-100"
          disabled={!hasSelection}
          onClick={() => onBulkAction('export')}
        >
          <FileSpreadsheet className="h-4 w-4 mr-1" />
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
  );
};

export default WarehousesBulkActions;

