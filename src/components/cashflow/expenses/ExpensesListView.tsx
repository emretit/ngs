import React, { memo } from "react";
import { FileText, Edit, Trash2, Calendar, User, Building2, CreditCard, CheckCircle2, Clock, Repeat } from "lucide-react";
import { ExpenseItem } from "../ExpensesManager";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ExpensesListViewProps {
  expenses: ExpenseItem[];
  loading: boolean;
  selectedExpenses: ExpenseItem[];
  onSelectExpense: (expense: ExpenseItem) => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  onEditExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (expense: ExpenseItem) => void;
  getAccountName: (type: string, id: string) => string;
}

const ExpensesListView = memo(({
  expenses,
  loading,
  selectedExpenses,
  onSelectExpense,
  onSelectAll,
  isAllSelected,
  onEditExpense,
  onDeleteExpense,
  getAccountName
}: ExpensesListViewProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Masraflar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-gray-100 rounded-full mb-4">
          <FileText className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Bu dönem için masraf kaydı bulunamadı
        </h3>
        <p className="text-gray-600 max-w-sm">
          Yeni masraf eklemek için yukarıdaki "Masraf Ekle" butonunu kullanabilirsiniz.
        </p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getPaymentTypeLabel = (type: string | null | undefined) => {
    switch (type) {
      case 'cash': return 'Kasa';
      case 'bank': return 'Banka';
      case 'credit_card': return 'Kredi Kartı';
      case 'partner': return 'Ortak';
      default: return '-';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b">
            <TableHead className="w-[40px] h-12 px-4">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
              📅 Tarih
            </TableHead>
            <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
              📁 Kategori
            </TableHead>
            <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
              📝 Açıklama
            </TableHead>
            <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
              👤 Tür
            </TableHead>
            <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
              💳 Ödeme
            </TableHead>
            <TableHead className="h-12 px-4 text-right align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
              💰 Tutar
            </TableHead>
            <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
              📊 Durum
            </TableHead>
            <TableHead className="h-12 px-4 text-center align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
              ⚙️ İşlemler
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => {
            const isSelected = selectedExpenses.some(e => e.id === expense.id);
            const isCompany = expense.expense_type === 'company';
            const isPaid = expense.is_paid;

            return (
              <TableRow 
                key={expense.id} 
                className={cn(
                  "hover:bg-muted/50 cursor-pointer",
                  isSelected && "bg-red-50"
                )}
                onClick={() => onEditExpense(expense)}
              >
                <TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelectExpense(expense)}
                  />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {format(new Date(expense.date), 'dd MMM yyyy', { locale: tr })}
                    </span>
                    {expense.is_recurring && (
                      <Repeat className="h-3.5 w-3.5 text-purple-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <Badge variant="outline" className="text-xs font-medium w-fit">
                      {expense.category?.name || 'Kategori Yok'}
                    </Badge>
                    {expense.subcategory && expense.subcategory.trim() !== '' && (
                      <span className="text-xs text-gray-500">{expense.subcategory}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 max-w-[200px]">
                  <p className="text-sm text-gray-700 truncate">
                    {expense.description || '-'}
                  </p>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-1.5 rounded-lg",
                      isCompany ? "bg-blue-100" : "bg-purple-100"
                    )}>
                      {isCompany ? (
                        <Building2 className="h-3.5 w-3.5 text-blue-600" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-purple-600" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-700">
                        {isCompany ? 'Şirket' : 'Çalışan'}
                      </span>
                      {!isCompany && expense.employee && (
                        <span className="text-xs text-gray-500">
                          {expense.employee.first_name} {expense.employee.last_name}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  {isPaid && expense.payment_account_type && expense.payment_account_id ? (
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-gray-500" />
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-600">
                          {getPaymentTypeLabel(expense.payment_account_type)}
                        </span>
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[100px]">
                          {getAccountName(expense.payment_account_type, expense.payment_account_id)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <span className="text-sm font-semibold text-red-600">
                    {formatCurrency(expense.amount)}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge 
                    className={cn(
                      "text-xs",
                      isPaid 
                        ? "bg-green-100 text-green-700 hover:bg-green-100" 
                        : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Ödendi
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          Bekliyor
                        </>
                      )}
                    </span>
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditExpense(expense)}
                      className="h-8 w-8"
                      title="Düzenle"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteExpense(expense)}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

ExpensesListView.displayName = 'ExpensesListView';

export default ExpensesListView;

