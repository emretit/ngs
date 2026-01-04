import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import LoansHeader from "@/components/cashflow/loans/LoansHeader";
import { LoansFilterBar } from "@/components/cashflow/loans/LoansFilterBar";
import LoansContent from "@/components/cashflow/loans/LoansContent";
import { LoanDialog } from "@/components/cashflow/loans/LoanDialog";
import LoanDetailSheet from "@/components/cashflow/loans/LoanDetailSheet";
import { useLoansFilters } from "@/hooks/cashflow/useLoansFilters";

interface Loan {
  id: string;
  loan_name: string;
  bank: string;
  amount: number;
  start_date: string;
  end_date: string;
  interest_rate: number;
  installment_amount: number;
  remaining_debt: number;
  status: string;
  notes?: string;
  created_at: string;
}

const CashflowLoans = () => {
  const { t } = useTranslation();
  const [loanDialog, setLoanDialog] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch loans
  const { data: loans = [], isLoading: loansLoading } = useQuery({
    queryKey: ["loans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data as unknown as Loan[]) || [];
    },
  });

  // Filtreleme hook'u
  const filters = useLoansFilters({ loans });

  // Tüm durum seçenekleri
  const allStatusOptions = [
    { value: "all", label: "Tüm Durumlar" },
    { value: "odenecek", label: "⏳ Ödenecek" },
    { value: "odendi", label: "✅ Ödendi" },
  ];

  // Loan mutations
  const saveLoanMutation = useMutation({
    mutationFn: async (loanData: {
      loan_name: string;
      bank: string;
      amount: number;
      start_date: Date;
      end_date: Date;
      interest_rate: number;
      installment_amount: number;
      remaining_debt: number;
      status: string;
      notes?: string;
      deposit_to_account?: boolean;
      account_type?: string;
      account_id?: string;
    }) => {
      const formattedData = {
        loan_name: loanData.loan_name,
        bank: loanData.bank,
        amount: loanData.amount,
        start_date: loanData.start_date.toISOString().split('T')[0],
        end_date: loanData.end_date.toISOString().split('T')[0],
        interest_rate: loanData.interest_rate,
        installment_amount: loanData.installment_amount,
        remaining_debt: loanData.remaining_debt,
        status: loanData.status,
        notes: loanData.notes,
      };

      // Kullanıcı bilgisini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error("Şirket bilgisi bulunamadı");

      if (editingLoan) {
        const { error } = await supabase
          .from("loans")
          .update(formattedData)
          .eq("id", editingLoan.id);
        if (error) throw error;
      } else {
        const { data: insertedLoan, error } = await supabase
          .from("loans")
          .insert([formattedData])
          .select()
          .single();
        
        if (error) throw error;

        // Eğer "Hesaba Yatır" seçiliyse, transaction ekle
        if (loanData.deposit_to_account && loanData.account_id) {
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              company_id: profile.company_id,
              account_id: loanData.account_id,
              transaction_type: 'income',
              amount: loanData.amount,
              description: `Kredi: ${loanData.loan_name} - ${loanData.bank}`,
              transaction_date: loanData.start_date.toISOString().split('T')[0],
              category: 'Kredi',
              reference_id: insertedLoan.id,
              reference_type: 'loan',
            });

          if (transactionError) throw transactionError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["account-balance"] });
      setLoanDialog(false);
      setEditingLoan(null);
      toast({ title: "Başarılı", description: "Kredi kaydedildi" });
    },
    onError: (error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  // Delete mutations
  const deleteLoanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("loans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      toast({ title: "Başarılı", description: "Kredi silindi" });
      setIsDeleteDialogOpen(false);
      setLoanToDelete(null);
    },
    onError: () => {
      setIsDeleteDialogOpen(false);
      setLoanToDelete(null);
    },
  });

  const handleDeleteClick = (loan: Loan) => {
    setLoanToDelete(loan);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (loanToDelete) {
      deleteLoanMutation.mutate(loanToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setLoanToDelete(null);
  };

  const handleLoanSelect = (loan: Loan) => {
    setSelectedLoan(loan);
    setDetailSheetOpen(true);
  };

  const handleDetailSheetClose = () => {
    setDetailSheetOpen(false);
    // Küçük bir gecikme ile selectedLoan'ı temizle (animasyon için)
    setTimeout(() => setSelectedLoan(null), 300);
  };

  const handleEditFromSheet = (loan: Loan) => {
    setDetailSheetOpen(false);
    setEditingLoan(loan);
    setLoanDialog(true);
  };

  // Calculate summary data
  const summaryData = useMemo(() => {
    const totalLoanDebt = loans.reduce((sum, loan) => sum + loan.remaining_debt, 0);
    const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const thisMonthPayments = loans.filter(loan => {
      const endDate = new Date(loan.end_date);
      return endDate.getMonth() + 1 === currentMonth && endDate.getFullYear() === currentYear;
    }).reduce((sum, loan) => sum + loan.installment_amount, 0);
    const activeLoanCount = loans.filter(loan => loan.status === "odenecek").length;
    
    return { totalLoanDebt, totalLoanAmount, thisMonthPayments, activeLoanCount };
  }, [loans]);

  return (
    <>
      <div className="space-y-2">
        {/* Header */}
        <LoansHeader
          activeLoansCount={summaryData.activeLoanCount}
          totalLoanAmount={summaryData.totalLoanAmount}
          totalDebt={summaryData.totalLoanDebt}
          thisMonthPayment={summaryData.thisMonthPayments}
          onAddNew={() => {
            setEditingLoan(null);
            setLoanDialog(true);
          }}
        />

        {/* Filters */}
        <LoansFilterBar
          searchQuery={filters.searchQuery}
          onSearchChange={filters.setSearchQuery}
          statusFilter={filters.statusFilter}
          onStatusChange={filters.setStatusFilter}
          startDate={filters.startDate}
          onStartDateChange={filters.setStartDate}
          endDate={filters.endDate}
          onEndDateChange={filters.setEndDate}
          searchPlaceholder="Kredi adı, banka veya notlar ile ara..."
          statusOptions={allStatusOptions}
        />

        {loansLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Krediler yükleniyor...</p>
            </div>
          </div>
        ) : (
          <LoansContent
            loans={filters.filteredLoans}
            isLoading={loansLoading}
            error={null}
            onSelect={handleLoanSelect}
            onEdit={(loan) => {
              setEditingLoan(loan);
              setLoanDialog(true);
            }}
            onDelete={handleDeleteClick}
          />
        )}
      </div>

      {/* Loan Detail Sheet */}
      <LoanDetailSheet
        loan={selectedLoan}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onEdit={handleEditFromSheet}
      />

      {/* Loan Dialog */}
      <LoanDialog
        open={loanDialog}
        onOpenChange={setLoanDialog}
        editingLoan={editingLoan}
        onSubmit={(data) => saveLoanMutation.mutate(data)}
        isLoading={saveLoanMutation.isPending}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Krediyi Sil"
        description={
          loanToDelete
            ? `"${loanToDelete.loan_name}" kredisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
            : "Bu krediyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        }
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteLoanMutation.isPending}
      />
    </>
  );
};

export default CashflowLoans;
