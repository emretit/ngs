
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Supplier } from "@/types/supplier";
import { Payment } from "@/types/payment";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, Plus, Calendar } from "lucide-react";
import { PaymentMethodSelector } from "@/components/shared/PaymentMethodSelector";
import { format } from "date-fns";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { DatePicker } from "@/components/ui/date-picker";

interface PaymentsListProps {
  supplier: Supplier;
  onAddPayment?: (method: { type: "hesap" | "cek" | "senet" }) => void;
}

type TransactionType = 'payment' | 'purchase_invoice' | 'sales_invoice';

interface UnifiedTransaction {
  id: string;
  type: TransactionType;
  date: string;
  amount: number;
  direction: 'incoming' | 'outgoing';
  description: string;
  reference?: string;
  currency: string;
  status?: string;
  payment?: Payment & { account_name?: string };
  dueDate?: string;
  branch?: string;
}

export const PaymentsList = ({ supplier, onAddPayment }: PaymentsListProps) => {
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  // Son 30 gün için varsayılan tarih filtresi
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());
  const { exchangeRates, convertCurrency } = useExchangeRates();
  const { userData, loading: userLoading } = useCurrentUser();
  
  // USD kuru
  const usdRate = useMemo(() => {
    const rate = exchangeRates.find(r => r.currency_code === 'USD');
    return rate?.forex_selling || 1;
  }, [exchangeRates]);

  // Ödemeler
  const { data: payments = [] } = useQuery({
    queryKey: ['supplier-payments', supplier.id, userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        console.warn('No company_id available for payments');
        return [];
      }

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('supplier_id', supplier.id)
        .eq('company_id', userData.company_id)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }
      
      // Her ödeme için hesap bilgisini al
      const paymentsWithAccounts = await Promise.all(
        (data || []).map(async (payment: any) => {
          if (payment.account_id && payment.account_type) {
            let accountName = "Bilinmeyen Hesap";
            
            try {
              if (payment.account_type === 'bank') {
                const { data: bankAccount } = await supabase
                  .from('bank_accounts')
                  .select('account_name, bank_name')
                  .eq('id', payment.account_id)
                  .single();
                if (bankAccount) {
                  accountName = `${bankAccount.account_name} - ${bankAccount.bank_name}`;
                }
              } else if (payment.account_type === 'cash') {
                const { data: cashAccount } = await supabase
                  .from('cash_accounts')
                  .select('name')
                  .eq('id', payment.account_id)
                  .single();
                if (cashAccount) {
                  accountName = cashAccount.name;
                }
              } else if (payment.account_type === 'credit_card') {
                const { data: cardAccount } = await supabase
                  .from('credit_cards')
                  .select('card_name')
                  .eq('id', payment.account_id)
                  .single();
                if (cardAccount) {
                  accountName = cardAccount.card_name;
                }
              } else if (payment.account_type === 'partner') {
                const { data: partnerAccount } = await supabase
                  .from('partner_accounts')
                  .select('partner_name')
                  .eq('id', payment.account_id)
                  .single();
                if (partnerAccount) {
                  accountName = partnerAccount.partner_name;
                }
              }
            } catch (err) {
              console.error('Error fetching account:', err);
            }
            
            return {
              ...payment,
              accounts: {
                name: accountName,
                account_type: payment.account_type,
                bank_name: null
              }
            };
          }
          
          return payment;
        })
      );
      
      return paymentsWithAccounts as Payment[];
    },
    enabled: !!supplier.id && !!userData?.company_id && !userLoading,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  });

  // Alış faturaları
  const { data: purchaseInvoices = [] } = useQuery({
    queryKey: ['supplier-purchase-invoices', supplier.id, userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        console.warn('No company_id available for purchase invoices');
        return [];
      }

      const { data, error } = await supabase
        .from('purchase_invoices')
        .select('*')
        .eq('supplier_id', supplier.id)
        .eq('company_id', userData.company_id)
        .order('invoice_date', { ascending: false });

      if (error) {
        console.error('Error fetching purchase invoices:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!supplier.id && !!userData?.company_id && !userLoading,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  });

  // Satış faturaları (tedarikçi müşteri de olabilir)
  const { data: salesInvoices = [] } = useQuery({
    queryKey: ['supplier-sales-invoices', supplier.id, userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        console.warn('No company_id available for sales invoices');
        return [];
      }

      const { data, error } = await supabase
        .from('sales_invoices')
        .select('*')
        .eq('customer_id', supplier.id)
        .eq('company_id', userData.company_id)
        .order('fatura_tarihi', { ascending: false });

      if (error) {
        console.error('Error fetching sales invoices:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!supplier.id && !!userData?.company_id && !userLoading,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  });


  // Tüm işlemleri birleştir
  const allTransactions = useMemo<UnifiedTransaction[]>(() => {
    const transactions: UnifiedTransaction[] = [];

    // Ödemeler
    payments.forEach((payment) => {
      transactions.push({
        id: payment.id,
        type: 'payment',
        date: payment.payment_date,
        amount: Number(payment.amount),
        direction: payment.payment_direction === 'incoming' ? 'incoming' : 'outgoing',
        description: payment.description || 'Ödeme',
        reference: payment.reference_note,
        currency: payment.currency || 'TRY',
        payment: payment as Payment & { account_name?: string },
      });
    });

    // Alış faturaları
    purchaseInvoices.forEach((invoice: any) => {
      // invoice_date date formatında, timestamp'e çevir
      let invoiceDate: string;
      if (invoice.invoice_date) {
        const date = new Date(invoice.invoice_date);
        date.setHours(0, 0, 0);
        invoiceDate = date.toISOString();
      } else {
        invoiceDate = invoice.created_at;
      }
      
      transactions.push({
        id: invoice.id,
        type: 'purchase_invoice',
        date: invoiceDate,
        amount: Number(invoice.total_amount || 0),
        direction: 'outgoing',
        description: invoice.notes || `Alış Faturası: ${invoice.invoice_number || invoice.id}`,
        reference: invoice.invoice_number,
        currency: invoice.currency || 'TRY',
        status: invoice.status,
        dueDate: invoice.due_date,
        branch: invoice.warehouse_id ? 'PERPA' : undefined,
      });
    });

    // Satış faturaları
    salesInvoices.forEach((invoice: any) => {
      // fatura_tarihi date formatında, timestamp'e çevir
      let invoiceDate: string;
      if (invoice.fatura_tarihi) {
        // Date string'i timestamp'e çevir (günün başlangıcı olarak)
        const date = new Date(invoice.fatura_tarihi);
        // issue_time varsa ekle, yoksa 00:00:00 kullan
        if (invoice.issue_time) {
          const [hours, minutes, seconds] = invoice.issue_time.split(':');
          date.setHours(parseInt(hours || '0'), parseInt(minutes || '0'), parseInt(seconds || '0'));
        } else {
          date.setHours(0, 0, 0);
        }
        invoiceDate = date.toISOString();
      } else {
        invoiceDate = invoice.created_at;
      }
      
      transactions.push({
        id: invoice.id,
        type: 'sales_invoice',
        date: invoiceDate,
        amount: Number(invoice.toplam_tutar || 0),
        direction: 'incoming',
        description: invoice.aciklama || invoice.notlar || `Satış Faturası: ${invoice.fatura_no || invoice.id}`,
        reference: invoice.fatura_no,
        currency: invoice.para_birimi || 'TRY',
        status: invoice.odeme_durumu || invoice.durum,
        dueDate: invoice.vade_tarihi,
        branch: invoice.warehouse_id ? 'PERPA' : undefined,
      });
    });

    // Tarihe göre sırala (en yeni en üstte)
    const sorted = transactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA === dateB) {
        // Aynı tarihte ise, type'a göre sırala (önce ödemeler, sonra faturalar)
        const typeOrder = { payment: 0, sales_invoice: 1, purchase_invoice: 2 };
        return (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
      }
      return dateB - dateA;
    });
    
    return sorted;
  }, [payments, purchaseInvoices, salesInvoices]);

  // Filtreleme
  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;

    // Tip filtresi
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    // Tarih filtresi
    if (startDate || endDate) {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        if (startDate && transactionDate < startDate) return false;
        if (endDate) {
          const endDateWithTime = new Date(endDate);
          endDateWithTime.setHours(23, 59, 59, 999);
          if (transactionDate > endDateWithTime) return false;
        }
        return true;
      });
    }

    return filtered;
  }, [allTransactions, typeFilter, startDate, endDate]);

  // Kümülatif bakiye hesapla
  const transactionsWithBalance = useMemo(() => {
    // İşlemleri tarihe göre sırala (en eski en üstte)
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA === dateB) {
        // Aynı tarihte ise, id'ye göre sırala (tutarlılık için)
        return a.id.localeCompare(b.id);
      }
      return dateA - dateB;
    });

    // Sadece balance'a etki eden işlemleri filtrele
    const balanceAffectingTransactions = sortedTransactions.filter(t => 
      t.type === 'payment' || t.type === 'purchase_invoice'
    );

    // Mevcut bakiyeden başlayarak geriye doğru başlangıç bakiyesini hesapla
    let initialBalance = supplier.balance || 0;
    
    // Tüm balance'a etki eden işlemleri geriye doğru çıkar
    balanceAffectingTransactions.forEach((transaction) => {
      if (transaction.type === 'payment') {
        // Ödeme: giden ödeme balance += amount, geri alırken balance -= amount
        const amount = transaction.direction === 'incoming' 
          ? -Number(transaction.amount)  // Gelen ödeme balance -= amount, geri alırken balance += amount
          : Number(transaction.amount);  // Giden ödeme balance += amount, geri alırken balance -= amount
        initialBalance = initialBalance - amount;
      } else if (transaction.type === 'purchase_invoice') {
        // Alış faturası: balance -= amount (oluşturulduğunda), geri alırken balance += amount
        initialBalance = initialBalance + Number(transaction.amount);
      }
    });
    
    // Şimdi en eski işlemden başlayarak ileriye doğru bakiyeyi hesapla
    let currentBalance = initialBalance;
    
    const transactionsWithBalances = sortedTransactions.map((transaction) => {
      // İşlem tutarını hesapla - sadece balance'a etki eden işlemler için
      let amount: number = 0;
      if (transaction.type === 'payment') {
        // Ödeme: giden ödeme balance += amount, gelen ödeme balance -= amount
        amount = transaction.direction === 'incoming' 
          ? -Number(transaction.amount)  // Gelen ödeme: balance -= amount
          : Number(transaction.amount);   // Giden ödeme: balance += amount
      } else if (transaction.type === 'purchase_invoice') {
        // Alış faturası: balance -= amount (oluşturulduğunda)
        amount = -Number(transaction.amount);
      }
      // Satış faturaları, satın alma siparişleri balance'a etki etmez (amount = 0)
      
      // Bu işlemden önceki bakiye
      const balanceBefore = currentBalance;
      
      // Bu işlemden sonraki bakiye (sadece balance'a etki eden işlemler için)
      currentBalance = currentBalance + amount;

      return {
        ...transaction,
        balanceAfter: currentBalance, // Bu işlemden sonraki bakiye
      };
    });

    // En yeni en üstte olacak şekilde ters çevir
    return transactionsWithBalances.reverse();
  }, [filteredTransactions, supplier.balance]);

  const getTransactionTypeLabel = (type: TransactionType, direction?: 'incoming' | 'outgoing') => {
    if (type === 'payment') {
      if (direction === 'incoming') {
        return 'Gelen Ödeme';
      } else if (direction === 'outgoing') {
        return 'Giden Ödeme';
      }
      return 'Ödeme';
    }
    
    const labels: Record<TransactionType, string> = {
      payment: 'Ödeme',
      purchase_invoice: 'Alış Faturası',
      sales_invoice: 'Satış Faturası',
    };
    return labels[type];
  };

  const getAccountName = (payment: Payment) => {
    if (payment.accounts) {
      const account = payment.accounts;
      if (account.account_type === 'bank' && account.bank_name) {
        return `${account.name} - ${account.bank_name}`;
      }
      return account.name;
    }
    // Fallback: account_id ve account_type varsa manuel olarak çek
    if (payment.account_id && (payment as any).account_type) {
      return `${(payment as any).account_type} Hesabı`;
    }
    return "Bilinmeyen Hesap";
  };

  // USD dönüşümü
  const getUsdAmount = (amount: number, currency: string) => {
    if (currency === 'USD') return amount;
    if (currency === 'TRY') return amount / usdRate;
    return convertCurrency(amount, currency, 'USD');
  };

  // Alacak/Borç hesaplama
  const getCreditDebit = (transaction: UnifiedTransaction & { balanceAfter?: number }) => {
    // Tüm işlemler için direction'a göre (ödemeler dahil)
    if (transaction.direction === 'incoming') {
      // Gelen ödemeler ve satış faturaları → Alacak
      return {
        credit: transaction.amount,
        debit: 0,
        usdCredit: getUsdAmount(transaction.amount, transaction.currency),
        usdDebit: 0,
      };
    } else {
      // Giden ödemeler ve alış faturaları → Borç
      return {
        credit: 0,
        debit: transaction.amount,
        usdCredit: 0,
        usdDebit: getUsdAmount(transaction.amount, transaction.currency),
      };
    }
  };

  // İstatistik bilgilerini hesapla
  const paymentStats = useMemo(() => {
    const totalIncoming = payments
      .filter(p => p.payment_direction === 'incoming')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    
    const totalOutgoing = payments
      .filter(p => p.payment_direction === 'outgoing')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return {
      currentBalance: supplier.balance || 0,
      totalIncoming,
      totalOutgoing,
    };
  }, [payments, supplier.balance]);

  return (
    <div className="space-y-4">
      {/* Action Bar */}
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
                paymentStats.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {paymentStats.currentBalance.toLocaleString('tr-TR', { 
                  style: 'currency', 
                  currency: 'TRY' 
                })}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Gelen Ödemeler</span>
              <span className="text-sm font-semibold text-green-600">
                {paymentStats.totalIncoming.toLocaleString('tr-TR', { 
                  style: 'currency', 
                  currency: 'TRY' 
                })}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Giden Ödemeler</span>
              <span className="text-sm font-semibold text-red-600">
                {paymentStats.totalOutgoing.toLocaleString('tr-TR', { 
                  style: 'currency', 
                  currency: 'TRY' 
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TransactionType | 'all')}>
            <SelectTrigger className="w-[160px] h-9">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm İşlemler</SelectItem>
              <SelectItem value="payment">Ödemeler</SelectItem>
              <SelectItem value="purchase_invoice">Alış Faturaları</SelectItem>
              <SelectItem value="sales_invoice">Satış Faturaları</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <DatePicker
              date={startDate}
              onSelect={setStartDate}
              placeholder="Başlangıç"
            />
            <span className="text-muted-foreground text-sm">-</span>
            <DatePicker
              date={endDate}
              onSelect={setEndDate}
              placeholder="Bitiş"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9">
            <Download className="h-4 w-4 mr-2" />
            Ekstre
          </Button>
          {onAddPayment && (
            <PaymentMethodSelector 
              onMethodSelect={(method) => onAddPayment({ type: method.type })}
            />
          )}
        </div>
      </div>

      {/* Ekstre Tablosu */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="pb-6">
          <div className="-mx-4">
            <div className="px-4">
              <Table>
            <TableHeader>
              <TableRow className="bg-slate-100 border-b border-slate-200">
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">Tarih/Saat</TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">Belge No</TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">Belge Tipi</TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">Açıklama</TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">Alacak</TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">Borç</TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">$ Borç</TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">$ Alacak</TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">$ Bakiye</TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">Bakiye</TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">$ Kur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsWithBalance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-gray-500 text-xs">
                    Henüz işlem bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                transactionsWithBalance.map((transaction) => {
                  const { credit, debit, usdCredit, usdDebit } = getCreditDebit(transaction);
                  const usdBalance = transaction.balanceAfter ? getUsdAmount(transaction.balanceAfter, transaction.currency) : 0;
                  const balanceIndicator = (transaction.balanceAfter || 0) >= 0 ? 'A' : 'B';
                  const usdBalanceIndicator = usdBalance >= 0 ? 'A' : 'B';
                  const exchangeRate = transaction.currency === 'USD' ? 1 : usdRate;

                  return (
                    <TableRow key={`${transaction.type}-${transaction.id}`} className="h-8 transition-colors hover:bg-gray-50">
                      <TableCell className="py-2 px-3 text-xs whitespace-nowrap">
                        {format(new Date(transaction.date), "dd.MM.yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-xs whitespace-nowrap">
                        {transaction.reference || '-'}
                      </TableCell>
                      <TableCell className="py-2 px-3 whitespace-nowrap">
                        <Badge 
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            transaction.type === 'payment' 
                              ? transaction.direction === 'incoming'
                                ? 'border-green-500 text-green-700 bg-green-50'
                                : 'border-red-500 text-red-700 bg-red-50'
                              : transaction.type === 'sales_invoice'
                              ? 'border-green-500 text-green-700 bg-green-50'
                              : transaction.type === 'purchase_invoice'
                              ? 'border-orange-500 text-orange-700 bg-orange-50'
                              : 'border-gray-500 text-gray-700 bg-gray-50'
                          }`}
                        >
                          {getTransactionTypeLabel(transaction.type, transaction.direction)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-xs max-w-[200px]">
                        <div className="truncate" title={transaction.description}>
                          {transaction.description}
                          {transaction.type === 'payment' && transaction.payment && (
                            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                              {getAccountName(transaction.payment)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right text-xs font-medium text-green-600 whitespace-nowrap">
                        {credit > 0 ? credit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right text-xs font-medium text-red-600 whitespace-nowrap">
                        {debit > 0 ? debit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right text-xs font-medium text-red-600 whitespace-nowrap">
                        {usdDebit > 0 ? usdDebit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right text-xs font-medium text-green-600 whitespace-nowrap">
                        {usdCredit > 0 ? usdCredit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                      </TableCell>
                      <TableCell className={`py-2 px-3 text-right text-xs font-medium whitespace-nowrap ${usdBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {usdBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {usdBalanceIndicator}
                      </TableCell>
                      <TableCell className={`py-2 px-3 text-right text-xs font-medium whitespace-nowrap ${(transaction.balanceAfter || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(transaction.balanceAfter || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {balanceIndicator}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                        {exchangeRate.toFixed(6)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
