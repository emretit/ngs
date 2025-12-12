import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Filter, Plus, Minus, MoreVertical } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description?: string | null;
  transaction_date: string;
  category?: string | null;
  customer_name?: string | null;
  supplier_name?: string | null;
  isTransfer?: boolean;
  transfer_direction?: "incoming" | "outgoing";
  balanceAfter?: number;
  updated_at?: string;
  created_at?: string;
  reference?: string | null;
}

interface AccountTransactionHistoryProps {
  transactions: Transaction[];
  currency: string;
  showBalances: boolean;
  filterType: "all" | "income" | "expense";
  onFilterTypeChange: (value: "all" | "income" | "expense") => void;
  onAddIncome?: () => void;
  onAddExpense?: () => void;
  initialBalance?: number;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export const AccountTransactionHistory = ({
  transactions,
  currency,
  showBalances,
  filterType,
  onFilterTypeChange,
  onAddIncome,
  onAddExpense,
  initialBalance = 0,
  emptyStateTitle = "Henüz işlem bulunmuyor",
  emptyStateDescription = "İlk işleminizi ekleyerek başlayın"
}: AccountTransactionHistoryProps) => {
  const navigate = useNavigate();
  // Filtreleme - önce filtreleme yap
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      if (filterType === "all") return true;
      return transaction.type === filterType;
    });
  }, [transactions, filterType]);

  // Bakiye hesaplama - filtrelenmiş işlemleri tarihe göre sırala ve her işlemden sonraki bakiyeyi hesapla
  const transactionsWithBalance = useMemo(() => {
    // Eğer zaten balanceAfter varsa, onu kullan
    if (filteredTransactions.length > 0 && filteredTransactions[0].balanceAfter !== undefined) {
      return filteredTransactions;
    }

    // İşlemleri tarihe göre sırala (en eski en üstte)
    const sortedTransactions = [...filteredTransactions].sort((a, b) =>
      new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    let runningBalance = initialBalance;

    return sortedTransactions.map(transaction => {
      // İşlem tutarını hesapla
      const amount = transaction.type === "income" ? transaction.amount : -transaction.amount;
      runningBalance += amount;

      return {
        ...transaction,
        balanceAfter: runningBalance
      };
    }).reverse(); // En yeni en üstte olacak şekilde ters çevir
  }, [filteredTransactions, initialBalance]);

  const getTransactionTypeLabel = (transaction: Transaction) => {
    if (transaction.isTransfer) {
      return transaction.transfer_direction === 'incoming' ? 'Transfer (Giriş)' : 'Transfer (Çıkış)';
    }
    return transaction.type === "income" ? "Para Girişi" : "Para Çıkışı";
  };

  const getAccountName = (transaction: Transaction) => {
    if (transaction.customer_name) return transaction.customer_name;
    if (transaction.supplier_name) return transaction.supplier_name;
    return "-";
  };

  // Masraf açıklamasını düzelt - eğer "Masraf: {id}" formatındaysa veya boşsa sadece "Masraf" göster
  const getExpenseDescription = (transaction: Transaction) => {
    if (!transaction.description) return "Masraf";
    
    // Eğer "Masraf: {id}" formatındaysa sadece "Masraf" göster
    if (transaction.description.startsWith("Masraf: ")) {
      return "Masraf";
    }
    
    return transaction.description;
  };

  // Reference'dan masraf ID'sini çıkar (EXP-{id} formatından)
  const getExpenseIdFromReference = (reference: string | null | undefined): string | null => {
    if (!reference || !reference.startsWith("EXP-")) return null;
    return reference.replace("EXP-", "");
  };

  // Masraf satırına tıklandığında masrafa yönlendir
  const handleTransactionClick = (transaction: Transaction) => {
    const expenseId = getExpenseIdFromReference(transaction.reference);
    if (expenseId) {
      navigate(`/cashflow/expenses?expenseId=${expenseId}`);
    }
  };

  if (transactions.length === 0) {
    return (
      <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-gray-50 to-gray-50/50 border border-gray-200/50">
                <FileText className="h-4 w-4 text-gray-600" />
              </div>
              Hesap Hareketleri
            </CardTitle>
            <Select value={filterType} onValueChange={onFilterTypeChange}>
              <SelectTrigger className="w-[140px] h-8">
                <Filter className="h-3 w-3 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="income">Gelir</SelectItem>
                <SelectItem value="expense">Gider</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-12">
            <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">{emptyStateTitle}</h3>
            <p className="text-sm text-gray-500 mb-3">{emptyStateDescription}</p>
            {(onAddIncome || onAddExpense) && (
              <div className="flex gap-2 justify-center">
                {onAddIncome && (
                  <Button
                    onClick={onAddIncome}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Gelir
                  </Button>
                )}
                {onAddExpense && (
                  <Button
                    onClick={onAddExpense}
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <Minus className="h-3 w-3 mr-1" />
                    Gider
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-gray-50 to-gray-50/50 border border-gray-200/50">
              <FileText className="h-4 w-4 text-gray-600" />
            </div>
            Hesap Hareketleri
          </CardTitle>
          <Select value={filterType} onValueChange={onFilterTypeChange}>
            <SelectTrigger className="w-[140px] h-8">
              <Filter className="h-3 w-3 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="income">Gelir</SelectItem>
              <SelectItem value="expense">Gider</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Tarih</TableHead>
                <TableHead className="font-semibold text-gray-700">İşlem</TableHead>
                <TableHead className="font-semibold text-gray-700">Hesap</TableHead>
                <TableHead className="font-semibold text-gray-700">Açıklama</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Borç</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Alacak</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Bakiye</TableHead>
                <TableHead className="font-semibold text-gray-700 text-center w-20">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsWithBalance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    İşlem bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                transactionsWithBalance.map((transaction) => (
                  <TableRow 
                    key={transaction.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="font-medium">
                      {new Date(transaction.transaction_date).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.isTransfer
                          ? transaction.transfer_direction === 'incoming'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                          : transaction.type === "income"
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {getTransactionTypeLabel(transaction)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {getAccountName(transaction)}
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      <div 
                        className={`truncate ${
                          getExpenseIdFromReference(transaction.reference) 
                            ? 'cursor-pointer hover:text-blue-600 hover:underline' 
                            : ''
                        }`}
                        title={transaction.description || transaction.category || '-'}
                        onClick={() => handleTransactionClick(transaction)}
                      >
                        {getExpenseIdFromReference(transaction.reference) 
                          ? getExpenseDescription(transaction)
                          : (transaction.description || transaction.category || '-')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {transaction.type === "expense" ? (
                        <span className="text-red-600">
                          {showBalances ? formatCurrency(transaction.amount, currency) : "••••••"}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {transaction.type === "income" ? (
                        <span className="text-green-600">
                          {showBalances ? formatCurrency(transaction.amount, currency) : "••••••"}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      <span className={
                        transaction.balanceAfter && transaction.balanceAfter >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }>
                        {showBalances 
                          ? formatCurrency(transaction.balanceAfter || 0, currency) 
                          : "••••••"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            Detayları Görüntüle
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
