import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { X, Trash2, Download, Wallet, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { ExpenseItem } from "./ExpensesManager";

type PaymentStatusFilter = 'all' | 'paid' | 'pending' | 'overdue';

interface ExpensesBulkActionsProps {
  selectedExpenses: ExpenseItem[];
  allExpenses: ExpenseItem[];
  totalAmount: number;
  onClearSelection: () => void;
  onBulkAction: (action: string) => void;
  activeTab?: PaymentStatusFilter;
  onTabChange?: (tab: PaymentStatusFilter) => void;
}

const ExpensesBulkActions = ({ 
  selectedExpenses,
  allExpenses,
  totalAmount,
  onClearSelection,
  onBulkAction,
  activeTab = 'all',
  onTabChange
}: ExpensesBulkActionsProps) => {
  const hasSelection = selectedExpenses.length > 0;

  // Ödenen, bekleyen ve gecikmiş toplamlar
  const { paidAmount, pendingAmount, overdueAmount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Bugünün başlangıcı
    
    const paid = allExpenses.filter(e => e.is_paid).reduce((sum, e) => sum + e.amount, 0);
    
    // Gecikmiş: Ödenmemiş ve ödeme tarihi geçmiş olanlar
    const overdue = allExpenses.filter(e => {
      if (e.is_paid) return false;
      const expenseDate = new Date(e.date);
      expenseDate.setHours(0, 0, 0, 0);
      return expenseDate < today;
    }).reduce((sum, e) => sum + e.amount, 0);
    
    // Bekleyen: Ödenmemiş ve henüz vadesi gelmemiş olanlar
    const pending = allExpenses.filter(e => {
      if (e.is_paid) return false;
      const expenseDate = new Date(e.date);
      expenseDate.setHours(0, 0, 0, 0);
      return expenseDate >= today;
    }).reduce((sum, e) => sum + e.amount, 0);
    
    return { paidAmount: paid, pendingAmount: pending, overdueAmount: overdue };
  }, [allExpenses]);

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
      {/* Sol taraf - Toplam bilgileri (Tab'lar) */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onTabChange?.('all')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-red-100 border-2 border-red-300 shadow-sm'
              : 'bg-white border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${activeTab === 'all' ? 'bg-red-200' : 'bg-red-100'}`}>
            <Wallet className={`h-4 w-4 ${activeTab === 'all' ? 'text-red-700' : 'text-red-600'}`} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 leading-none">Toplam</span>
            <span className={`text-sm font-bold ${activeTab === 'all' ? 'text-red-700' : 'text-red-600'}`}>
              ₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </button>
        
        <button
          onClick={() => onTabChange?.('paid')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'paid'
              ? 'bg-green-100 border-2 border-green-300 shadow-sm'
              : 'bg-white border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${activeTab === 'paid' ? 'bg-green-200' : 'bg-green-100'}`}>
            <CheckCircle className={`h-4 w-4 ${activeTab === 'paid' ? 'text-green-700' : 'text-green-600'}`} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 leading-none">Ödenen</span>
            <span className={`text-sm font-semibold ${activeTab === 'paid' ? 'text-green-700' : 'text-green-600'}`}>
              ₺{paidAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </button>
        
        <button
          onClick={() => onTabChange?.('pending')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-100 border-2 border-amber-300 shadow-sm'
              : 'bg-white border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${activeTab === 'pending' ? 'bg-amber-200' : 'bg-amber-100'}`}>
            <Clock className={`h-4 w-4 ${activeTab === 'pending' ? 'text-amber-700' : 'text-amber-600'}`} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 leading-none">Bekleyen</span>
            <span className={`text-sm font-semibold ${activeTab === 'pending' ? 'text-amber-700' : 'text-amber-600'}`}>
              ₺{pendingAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </button>
        
        <button
          onClick={() => onTabChange?.('overdue')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'overdue'
              ? 'bg-red-100 border-2 border-red-300 shadow-sm'
              : 'bg-white border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${activeTab === 'overdue' ? 'bg-red-200' : 'bg-red-100'}`}>
            <AlertCircle className={`h-4 w-4 ${activeTab === 'overdue' ? 'text-red-700' : 'text-red-600'}`} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 leading-none">Gecikmiş</span>
            <span className={`text-sm font-semibold ${activeTab === 'overdue' ? 'text-red-700' : 'text-red-600'}`}>
              ₺{overdueAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </button>

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

