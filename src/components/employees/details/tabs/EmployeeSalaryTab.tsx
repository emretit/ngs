import { useState, useMemo, useCallback } from "react";
import { Employee } from "@/types/employee";
import { EmployeeTransactionType } from "@/types/employee-transactions";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { SalaryInfoCards } from "../salary/SalaryInfoCards";
import { EmployeeSalaryHeader } from "../salary/EmployeeSalaryHeader";
import { EmployeeSalaryTable } from "../salary/EmployeeSalaryTable";
import { AddExpenseDialog } from "../salary/dialogs/AddExpenseDialog";
import { MakePaymentDialog } from "../salary/dialogs/MakePaymentDialog";
import { AddSalaryDialog } from "../salary/dialogs/AddSalaryDialog";
import { useEmployeeTransactionsQuery } from "../salary/hooks/useEmployeeTransactionsQuery";
import { useUnifiedEmployeeTransactions } from "../salary/hooks/useUnifiedEmployeeTransactions";
import { useFilteredEmployeeTransactions } from "../salary/hooks/useFilteredEmployeeTransactions";
import { useEmployeeTransactionsWithBalance } from "../salary/hooks/useEmployeeTransactionsWithBalance";
import { useEmployeeSalaryStats } from "../salary/hooks/useEmployeeSalaryStats";
import { useEmployeeTransactionsRealtime } from "../salary/hooks/useEmployeeTransactionsRealtime";

interface EmployeeSalaryTabProps {
  employee: Employee;
}

export const EmployeeSalaryTab = ({ employee }: EmployeeSalaryTabProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [typeFilter, setTypeFilter] = useState<EmployeeTransactionType | 'all'>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [visibleCount, setVisibleCount] = useState(20);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'expense' | 'payment'; id: string } | null>(null);

  // Hooks
  const { data: rawTransactions = [], isLoading } = useEmployeeTransactionsQuery(employee.id);
  const allTransactions = useUnifiedEmployeeTransactions(rawTransactions);
  const filteredTransactions = useFilteredEmployeeTransactions({
    allTransactions,
    typeFilter,
    startDate,
    endDate,
  });
  const transactionsWithBalance = useEmployeeTransactionsWithBalance({
    allTransactions,
    filteredTransactions,
  });
  const stats = useEmployeeSalaryStats(allTransactions);

  // Realtime
  useEmployeeTransactionsRealtime(employee.id);

  // Infinite scroll
  const visibleTransactions = useMemo(() => {
    return transactionsWithBalance.slice(0, visibleCount);
  }, [transactionsWithBalance, visibleCount]);

  const hasMore = transactionsWithBalance.length > visibleCount;
  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + 20);
  }, []);

  // Silme mutation'ı
  const deleteMutation = useMutation({
    mutationFn: async (target: { type: 'expense' | 'payment'; id: string }) => {
      if (target.type === 'expense') {
        // Masrafı sil
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', target.id);
        if (error) throw error;
      } else if (target.type === 'payment') {
        // Ödemeyi sil - transaction'ı bul ve sil
        const transaction = allTransactions.find(t => t.id === target.id);
        if (!transaction) throw new Error('Transaction bulunamadı');

        // Transaction tipine göre doğru tablodan sil
        if (transaction.id.startsWith('cash-')) {
          const actualId = transaction.id.replace('cash-', '');
          const { error } = await supabase.from('cash_transactions').delete().eq('id', actualId);
          if (error) throw error;
        } else if (transaction.id.startsWith('bank-')) {
          const actualId = transaction.id.replace('bank-', '');
          const { error } = await supabase.from('bank_transactions').delete().eq('id', actualId);
          if (error) throw error;
        } else if (transaction.id.startsWith('card-')) {
          const actualId = transaction.id.replace('card-', '');
          const { error } = await supabase.from('card_transactions').delete().eq('id', actualId);
          if (error) throw error;
        } else if (transaction.id.startsWith('partner-')) {
          const actualId = transaction.id.replace('partner-', '');
          const { error } = await supabase.from('partner_transactions').delete().eq('id', actualId);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: deleteTarget?.type === 'expense' ? "Masraf silindi" : "Ödeme silindi",
      });
      queryClient.invalidateQueries({ queryKey: ['employee-transactions', employee.id] });
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Silme işlemi başarısız",
      });
    },
  });

  // Silme handler'ları
  const handleDeleteExpense = useCallback((expenseId: string) => {
    setDeleteTarget({ type: 'expense', id: expenseId });
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeletePayment = useCallback((paymentId: string) => {
    setDeleteTarget({ type: 'payment', id: paymentId });
    setIsDeleteDialogOpen(true);
  }, []);

  const handleEditExpense = useCallback((expenseId: string) => {
    // TODO: Masraf düzenleme dialogunu aç
    toast({
      title: "Bilgi",
      description: "Masraf düzenleme özelliği yakında eklenecek",
    });
  }, [toast]);

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget);
    }
  };

  // Ekstre indirme fonksiyonu
  const handleExportExcel = useCallback(() => {
    const headers = [
      'Tarih', 'İşlem No', 'İşlem Tipi', 'Açıklama', 'Kategori', 'Alacak', 'Borç', 'Bakiye'
    ];

    const csvData = transactionsWithBalance.map(transaction => {
      const getCreditDebit = (t: typeof transaction) => {
        if (t.type === 'tahakkuk' || t.type === 'masraf' || t.type === 'prim') {
          return { credit: t.amount, debit: 0 };
        } else {
          return { credit: 0, debit: t.amount };
        }
      };

      const { credit, debit } = getCreditDebit(transaction);
      const balance = transaction.balanceAfter ?? 0;
      const balanceIndicator = balance >= 0 ? 'A' : 'B';

      return [
        new Date(transaction.date).toLocaleDateString('tr-TR'),
        transaction.reference || '-',
        transaction.type.toUpperCase(),
        transaction.description || '',
        transaction.category || '-',
        credit > 0 ? credit.toFixed(2) : '-',
        debit > 0 ? debit.toFixed(2) : '-',
        `${Math.abs(balance).toFixed(2)} ${balanceIndicator}`
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `calisan-ekstre-${employee.first_name}-${employee.last_name}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [transactionsWithBalance, employee]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-muted-foreground">İşlem geçmişi yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Maaş Bilgi Kartları */}
      <SalaryInfoCards employee={employee} />

      {/* Header */}
      <EmployeeSalaryHeader
        stats={stats}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onAddExpense={() => setIsExpenseDialogOpen(true)}
        onAddPayment={() => setIsPaymentDialogOpen(true)}
        onAddSalary={() => setIsSalaryDialogOpen(true)}
        onExportExcel={handleExportExcel}
        employeeId={employee.id}
      />

      {/* Tablo */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="pb-6">
          <div className="-mx-4">
            <div className="px-4">
              <EmployeeSalaryTable
                transactions={visibleTransactions}
                employeeId={employee.id}
                onDeleteExpense={handleDeleteExpense}
                onDeletePayment={handleDeletePayment}
                onEditExpense={handleEditExpense}
                isDeleting={deleteMutation.isPending}
              />
            </div>
          </div>
        </div>

        {/* Daha Fazla Yükle */}
        {hasMore && (
          <div className="flex justify-center py-4 border-t border-gray-200">
            <Button variant="outline" onClick={loadMore} className="text-sm">
              Daha Fazla Yükle ({transactionsWithBalance.length - visibleCount} işlem kaldı)
            </Button>
          </div>
        )}
      </div>

      {/* Dialog'lar */}
      <AddExpenseDialog
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        employee={employee}
      />
      <MakePaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        employee={employee}
        currentBalance={stats.pendingBalance}
      />
      <AddSalaryDialog
        open={isSalaryDialogOpen}
        onOpenChange={setIsSalaryDialogOpen}
        employee={employee}
      />

      {/* Silme Onay Dialog'u */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={deleteTarget?.type === 'expense' ? 'Masrafı Sil' : 'Ödemeyi Sil'}
        description={
          deleteTarget?.type === 'expense'
            ? 'Bu masrafı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
            : 'Bu ödemeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
        }
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setDeleteTarget(null);
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
