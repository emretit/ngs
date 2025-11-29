import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { X, Trash2, Download, Wallet, CheckCircle, Clock } from "lucide-react";
import { ExpenseItem } from "./ExpensesManager";

interface ExpensesBulkActionsProps {
  selectedExpenses: ExpenseItem[];
  allExpenses: ExpenseItem[];
  totalAmount: number;
  onClearSelection: () => void;
  onBulkAction: (action: string) => void;
}

const ExpensesBulkActions = ({ 
  selectedExpenses,
  allExpenses,
  totalAmount,
  onClearSelection,
  onBulkAction
}: ExpensesBulkActionsProps) => {
  const hasSelection = selectedExpenses.length > 0;

  // Ödenen ve bekleyen toplamlar
  const { paidAmount, pendingAmount } = useMemo(() => {
    const paid = allExpenses.filter(e => e.is_paid).reduce((sum, e) => sum + e.amount, 0);
    const pending = allExpenses.filter(e => !e.is_paid).reduce((sum, e) => sum + e.amount, 0);
    return { paidAmount: paid, pendingAmount: pending };
  }, [allExpenses]);

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
      {/* Sol taraf - Toplam bilgileri */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-100 rounded-lg">
            <Wallet className="h-4 w-4 text-red-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 leading-none">Toplam</span>
            <span className="text-sm font-bold text-red-600">
              ₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        <div className="h-8 w-px bg-gray-200" />
        
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-100 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 leading-none">Ödenen</span>
            <span className="text-sm font-semibold text-green-600">
              ₺{paidAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 rounded-lg">
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 leading-none">Bekleyen</span>
            <span className="text-sm font-semibold text-amber-600">
              ₺{pendingAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {hasSelection && (
          <>
            <div className="h-8 w-px bg-gray-200" />
            <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
              {selectedExpenses.length} seçildi
            </span>
          </>
        )}
      </div>
      
      {/* Sağ taraf - Aksiyon butonları */}
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
            Temizle
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExpensesBulkActions;

