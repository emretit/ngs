import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Filter, Plus, Minus, Download, FileText } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import TransactionTableHeader from "./table/TransactionTableHeader";
import { TransactionTableRow } from "./table/TransactionTableRow";
import TransactionTableEmpty from "./table/TransactionTableEmpty";
import { useSortedTransactions } from "./table/useSortedTransactions";
import type { TransactionSortField, TransactionSortDirection } from "./table/types";

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
  usdBalanceAfter?: number;
  updated_at?: string;
  created_at?: string;
  reference?: string | null;
  user_name?: string | null;
}


interface AccountTransactionHistoryProps {
  transactions: Transaction[];
  currency: string;
  showBalances: boolean;
  filterType: "all" | "income" | "expense";
  onFilterTypeChange: (value: "all" | "income" | "expense") => void;
  onAddIncome?: () => void;
  onAddExpense?: () => void;
  onDelete?: (transaction: Transaction) => void;
  initialBalance?: number;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  showHeader?: boolean;
  currentBalance?: number;
  totalIncome?: number;
  totalExpense?: number;
  hideUsdColumns?: boolean;
  isDeleting?: boolean;
}

export const AccountTransactionHistory = ({
  transactions,
  currency,
  showBalances,
  filterType,
  onFilterTypeChange,
  onAddIncome,
  onAddExpense,
  onDelete,
  initialBalance = 0,
  emptyStateTitle = "Henüz işlem bulunmuyor",
  emptyStateDescription = "İlk işleminizi ekleyerek başlayın",
  showHeader = false,
  currentBalance,
  totalIncome,
  totalExpense,
  hideUsdColumns = false,
  isDeleting = false
}: AccountTransactionHistoryProps) => {
  const { exchangeRates, convertCurrency } = useExchangeRates();
  
  // Sıralama state'leri
  const [sortField, setSortField] = useState<TransactionSortField>("transaction_date");
  const [sortDirection, setSortDirection] = useState<TransactionSortDirection>("desc");
  
  // USD kuru
  const usdRate = useMemo(() => {
    const rate = exchangeRates.find(r => r.currency_code === 'USD');
    return rate?.forex_selling || 1;
  }, [exchangeRates]);
  
  const handleSort = (field: TransactionSortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

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
    let transactionsToProcess = filteredTransactions;
    
    if (filteredTransactions.length > 0 && filteredTransactions[0].balanceAfter !== undefined) {
      transactionsToProcess = filteredTransactions;
    } else {
      // İşlemleri tarihe göre sırala (en eski en üstte)
      const sortedTransactions = [...filteredTransactions].sort((a, b) =>
        new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
      );

      let runningBalance = initialBalance;
      let runningUsdBalance = 0;

      transactionsToProcess = sortedTransactions.map(transaction => {
        // İşlem tutarını hesapla
        const amount = transaction.type === "income" ? transaction.amount : -transaction.amount;
        runningBalance += amount;
        
        // USD bakiye hesapla
        const usdAmount = currency === 'USD' ? transaction.amount : transaction.amount / usdRate;
        if (transaction.type === "income") {
          runningUsdBalance -= usdAmount; // Gelir → Alacak (negatif)
        } else {
          runningUsdBalance += usdAmount; // Gider → Borç (pozitif)
        }

        return {
          ...transaction,
          balanceAfter: runningBalance,
          usdBalanceAfter: runningUsdBalance
        };
      });
    }

    // USD bakiyeleri hesapla (eğer yoksa)
    let runningUsdBalance = 0;
    const sortedForUsd = [...transactionsToProcess].sort((a, b) =>
      new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    return sortedForUsd.map(transaction => {
      if (transaction.usdBalanceAfter === undefined) {
        const usdAmount = currency === 'USD' ? transaction.amount : transaction.amount / usdRate;
        if (transaction.type === "income") {
          runningUsdBalance -= usdAmount;
        } else {
          runningUsdBalance += usdAmount;
        }
        return {
          ...transaction,
          usdBalanceAfter: runningUsdBalance
        };
      }
      return transaction;
    }).reverse(); // En yeni en üstte olacak şekilde ters çevir
  }, [filteredTransactions, initialBalance, usdRate, currency]);

  // Sıralama uygula
  const sortedTransactions = useSortedTransactions(transactionsWithBalance, sortField, sortDirection);

  // İstatistikleri hesapla
  const stats = useMemo(() => {
    const balance = currentBalance ?? (transactionsWithBalance[0]?.balanceAfter ?? initialBalance);
    const income = totalIncome ?? transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = totalExpense ?? transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    return { balance, income, expense };
  }, [currentBalance, totalIncome, totalExpense, transactions, transactionsWithBalance, initialBalance]);

  if (transactions.length === 0) {
    return (
      <div className="space-y-4">
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">İşlem Geçmişi</h3>
              </div>
              <div className="h-8 w-px bg-gray-300" />
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Mevcut Bakiye</span>
                  <span className={`text-sm font-semibold ${
                    stats.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {showBalances ? formatCurrency(stats.balance, currency) : "••••••"}
                  </span>
                </div>
                <div className="h-8 w-px bg-gray-300" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Toplam Gelir</span>
                  <span className="text-sm font-semibold text-green-600">
                    {showBalances ? formatCurrency(stats.income, currency) : "••••••"}
                  </span>
                </div>
                <div className="h-8 w-px bg-gray-300" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Toplam Gider</span>
                  <span className="text-sm font-semibold text-red-600">
                    {showBalances ? formatCurrency(stats.expense, currency) : "••••••"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Select value={filterType} onValueChange={onFilterTypeChange}>
                <SelectTrigger className="w-[160px] h-9">
                  <Filter className="h-3.5 w-3.5 mr-2" />
                  <SelectValue placeholder="Filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm İşlemler</SelectItem>
                  <SelectItem value="income">Gelir</SelectItem>
                  <SelectItem value="expense">Gider</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-9">
                <Download className="h-4 w-4 mr-2" />
                Ekstre
              </Button>
            </div>
          </div>
        )}

        {/* Header (showHeader false ise) */}
        {!showHeader && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Hesap Hareketleri</h3>
            </div>
            <Select value={filterType} onValueChange={onFilterTypeChange}>
              <SelectTrigger className="w-[160px] h-10">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="income">Gelir</SelectItem>
                <SelectItem value="expense">Gider</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Empty State */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="text-center py-16">
            <div className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
              <FileText className="h-10 w-10 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">{emptyStateTitle}</h3>
            <p className="text-sm text-gray-600 mb-4">{emptyStateDescription}</p>
            {(onAddIncome || onAddExpense) && (
              <div className="flex gap-3 justify-center">
                {onAddIncome && (
                  <Button
                    onClick={onAddIncome}
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Gelir Ekle
                  </Button>
                )}
                {onAddExpense && (
                  <Button
                    onClick={onAddExpense}
                    size="sm"
                    className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-xl"
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Gider Ekle
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">İşlem Geçmişi</h3>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Mevcut Bakiye</span>
                <span className={`text-sm font-semibold ${
                  stats.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {showBalances ? formatCurrency(stats.balance, currency) : "••••••"}
                </span>
              </div>
              <div className="h-8 w-px bg-gray-300" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Toplam Gelir</span>
                <span className="text-sm font-semibold text-green-600">
                  {showBalances ? formatCurrency(stats.income, currency) : "••••••"}
                </span>
              </div>
              <div className="h-8 w-px bg-gray-300" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Toplam Gider</span>
                <span className="text-sm font-semibold text-red-600">
                  {showBalances ? formatCurrency(stats.expense, currency) : "••••••"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Select value={filterType} onValueChange={onFilterTypeChange}>
              <SelectTrigger className="w-[160px] h-9">
                <Filter className="h-3.5 w-3.5 mr-2" />
                <SelectValue placeholder="Filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm İşlemler</SelectItem>
                <SelectItem value="income">Gelir</SelectItem>
                <SelectItem value="expense">Gider</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="h-4 w-4 mr-2" />
              Ekstre
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TransactionTableHeader
              sortField={sortField}
              sortDirection={sortDirection}
              handleSort={handleSort}
              hideUsdColumns={hideUsdColumns}
            />
            <TableBody>
              {sortedTransactions.length === 0 ? (
                <TransactionTableEmpty colSpan={hideUsdColumns ? 8 : 12} />
              ) : (
                <>
                  {sortedTransactions.map((transaction, index) => (
                    <TransactionTableRow
                      key={transaction.id}
                      transaction={transaction}
                      index={index}
                      showBalances={showBalances}
                      hideUsdColumns={hideUsdColumns}
                      currency={currency}
                      usdRate={usdRate}
                      onDelete={onDelete}
                      isDeleting={isDeleting}
                    />
                  ))}
                  {/* Başlangıç Bakiyesi Satırı - En altta göster */}
                  {initialBalance !== 0 && (
                    <TableRow className="h-8 bg-gray-50 border-t-2 border-gray-300">
                      <TableCell className="py-2 px-3 text-xs whitespace-nowrap font-medium text-gray-500 italic">
                        Başlangıç Bakiyesi
                      </TableCell>
                      <TableCell className="py-2 px-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-bold border-gray-300 text-gray-600 bg-gray-100">
                          Başlangıç
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-xs text-gray-500 italic">
                        -
                      </TableCell>
                      <TableCell className="py-2 px-3 text-xs whitespace-nowrap font-medium text-gray-500">
                        -
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right text-xs font-medium text-gray-500 whitespace-nowrap">
                        -
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right text-xs font-medium text-gray-500 whitespace-nowrap">
                        -
                      </TableCell>
                      {!hideUsdColumns && (
                        <>
                          <TableCell className="py-2 px-3 text-right text-xs font-medium text-gray-500 whitespace-nowrap">
                            -
                          </TableCell>
                          <TableCell className="py-2 px-3 text-right text-xs font-medium text-gray-500 whitespace-nowrap">
                            -
                          </TableCell>
                          <TableCell className="py-2 px-3 text-right text-xs font-medium text-gray-500 whitespace-nowrap">
                            -
                          </TableCell>
                        </>
                      )}
                      <TableCell className={cn(
                        "py-2 px-3 text-right text-xs font-bold whitespace-nowrap",
                        initialBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {showBalances 
                          ? `${initialBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${initialBalance >= 0 ? 'A' : 'B'}`
                          : "••••••"}
                      </TableCell>
                      {!hideUsdColumns && (
                        <TableCell className="py-2 px-3 text-right text-xs text-gray-500 whitespace-nowrap">
                          -
                        </TableCell>
                      )}
                      <TableCell className="py-2 px-3 text-center">
                        -
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
