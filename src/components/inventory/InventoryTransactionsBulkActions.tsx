import React from "react";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, XCircle, Download, FileSpreadsheet } from "lucide-react";
import { InventoryTransaction } from "@/types/inventory";

interface InventoryTransactionsBulkActionsProps {
  selectedTransactions: InventoryTransaction[];
  onClearSelection: () => void;
  onBulkAction: (action: string) => void;
}

const InventoryTransactionsBulkActions = ({ 
  selectedTransactions, 
  onClearSelection,
  onBulkAction
}: InventoryTransactionsBulkActionsProps) => {
  const hasSelection = selectedTransactions.length > 0;

  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-blue-900">
          {hasSelection ? `${selectedTransactions.length} işlem seçildi` : "İşlem seçilmedi"}
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
          onClick={() => onBulkAction('approve')}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Onayla
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="text-red-700 border-red-300 hover:bg-red-100"
          disabled={!hasSelection}
          onClick={() => onBulkAction('cancel')}
        >
          <XCircle className="h-4 w-4 mr-1" />
          İptal Et
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

export default InventoryTransactionsBulkActions;

