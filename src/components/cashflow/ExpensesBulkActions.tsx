import React from "react";
import { Button } from "@/components/ui/button";
import { X, Trash2, Download, FileSpreadsheet } from "lucide-react";
import { ExpenseItem } from "./ExpensesManager";

interface ExpensesBulkActionsProps {
  selectedExpenses: ExpenseItem[];
  onClearSelection: () => void;
  onBulkAction: (action: string) => void;
}

const ExpensesBulkActions = ({ 
  selectedExpenses, 
  onClearSelection,
  onBulkAction
}: ExpensesBulkActionsProps) => {
  const hasSelection = selectedExpenses.length > 0;

  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-blue-900">
          {hasSelection ? `${selectedExpenses.length} işlem seçildi` : "İşlem seçilmedi"}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
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

export default ExpensesBulkActions;

