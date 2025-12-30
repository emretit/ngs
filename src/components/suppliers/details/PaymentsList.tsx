
import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Supplier } from "@/types/supplier";
import { Payment } from "@/types/payment";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, Plus, Calendar, Trash2 } from "lucide-react";
import { PaymentMethodSelector } from "@/components/shared/PaymentMethodSelector";
import { format } from "date-fns";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";

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
  paymentType?: string;
  dueDate?: string;
  branch?: string;
  balanceAfter?: number;
  usdBalanceAfter?: number;
  check?: {
    id: string;
    check_number: string;
    bank: string;
    due_date: string;
    status: string;
  } | null;
}

export const PaymentsList = ({ supplier, onAddPayment }: PaymentsListProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  // Bulunduğu yılın başı için varsayılan tarih filtresi
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1); // Yılın ilk günü (1 Ocak)
    return yearStart;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());
  const { exchangeRates, convertCurrency } = useExchangeRates();
  const { userData, loading: userLoading } = useCurrentUser();

  // Supplier balance'ı realtime güncellemeler için local query ile çek
  const { data: currentSupplier } = useQuery({
    queryKey: ['supplier', supplier.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('balance')
        .eq('id', supplier.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!supplier.id,
    initialData: { balance: supplier.balance },
  });

  const currentBalance = currentSupplier?.balance ?? supplier.balance ?? 0;

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

      // RLS politikası zaten company_id kontrolü yapıyor
      // Manuel filtre eklemek performans için iyi ama RLS ile çakışabilir
      // Eğer userData.company_id NULL ise, RLS'ye güveniyoruz
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('payment_date', { ascending: false });
      
      // Debug: Eğer data boşsa ve error yoksa, RLS sorunu olabilir
      if (!data || data.length === 0) {
        console.log('Payments query returned empty. Supplier ID:', supplier.id, 'Company ID:', userData.company_id);
      }

      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }
      
      // Her ödeme için hesap ve check bilgisini al
      const paymentsWithAccounts = await Promise.all(
        (data || []).map(async (payment: any) => {
          let accountName = "Bilinmeyen Hesap";
          let bankName = null;
          let checkData = null;
          
          try {
            // Hesap bilgisini çek
            if (payment.account_id && payment.account_type) {
              if (payment.account_type === 'bank') {
                const { data: bankAccount } = await supabase
                  .from('bank_accounts')
                  .select('account_name, bank_name')
                  .eq('id', payment.account_id)
                  .single();
                if (bankAccount) {
                  accountName = bankAccount.account_name;
                  bankName = bankAccount.bank_name;
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
                  .select('card_name, bank_name')
                  .eq('id', payment.account_id)
                  .single();
                if (cardAccount) {
                  accountName = cardAccount.card_name;
                  bankName = cardAccount.bank_name;
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
            }
            
            // Check bilgisini çek (eğer check_id varsa)
            if (payment.check_id) {
              const { data: check } = await supabase
                .from('checks')
                .select('id, check_number, bank, due_date, status')
                .eq('id', payment.check_id)
                .single();
              
              if (check) {
                checkData = {
                  id: check.id,
                  check_number: check.check_number,
                  bank: check.bank,
                  due_date: check.due_date,
                  status: check.status,
                };
              }
            }
          } catch (err) {
            console.error('Error fetching account/check:', err);
          }
          
          const result: any = {
            ...payment,
          };
          
          if (payment.account_id && payment.account_type) {
            result.accounts = {
              name: accountName,
              account_type: payment.account_type,
              bank_name: bankName
            };
          }
          
          if (checkData) {
            result.check = checkData;
          }
          
          return result;
        })
      );
      
      return paymentsWithAccounts as Payment[];
    },
    enabled: !!supplier.id && !!userData?.company_id && !userLoading,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  });

  // Realtime subscription - payments, purchase_invoices, sales_invoices ve suppliers tablolarındaki değişiklikleri dinle
  useEffect(() => {
    if (!supplier.id || !userData?.company_id || userLoading) return;

    const channel = supabase
      .channel(`supplier-payments-realtime-${supplier.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'payments',
          filter: `supplier_id=eq.${supplier.id}`
        },
        () => {
          // Payments değiştiğinde query'leri invalidate et - company_id ile birlikte
          if (supplier.id) {
            queryClient.invalidateQueries({ queryKey: ['supplier-payments', supplier.id, userData?.company_id] });
            queryClient.invalidateQueries({ queryKey: ['supplier', supplier.id] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchase_invoices',
          filter: `supplier_id=eq.${supplier.id}`
        },
        () => {
          // Purchase invoices değiştiğinde query'leri invalidate et
          queryClient.invalidateQueries({ queryKey: ['supplier-purchase-invoices', supplier.id, userData?.company_id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales_invoices',
          filter: `customer_id=eq.${supplier.id}`
        },
        () => {
          // Tedarikçi müşteri de olabilir, sales invoices değiştiğinde query'leri invalidate et
          queryClient.invalidateQueries({ queryKey: ['supplier-sales-invoices', supplier.id, userData?.company_id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'suppliers',
          filter: `id=eq.${supplier.id}`
        },
        () => {
          // Supplier bilgileri (özellikle balance) güncellendiğinde query'leri invalidate et
          if (supplier.id) {
            queryClient.invalidateQueries({ queryKey: ['supplier', supplier.id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supplier.id, userData?.company_id, userLoading, queryClient]);

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
        paymentType: payment.payment_type, // payment_type bilgisini ekle
        check: payment.check || null,
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

  // USD dönüşümü
  const getUsdAmount = useCallback((amount: number, currency: string) => {
    if (currency === 'USD') return amount;
    if (currency === 'TRY') return amount / usdRate;
    return convertCurrency(amount, currency, 'USD');
  }, [usdRate, convertCurrency]);

  // Alacak/Borç hesaplama
  const getCreditDebit = useCallback((transaction: UnifiedTransaction & { balanceAfter?: number }) => {
    // Alış faturası: Tedarikçiden mal aldık → Ona borçluyuz → BORÇ
    if (transaction.type === 'purchase_invoice') {
      return {
        credit: 0,
        debit: transaction.amount,
        usdCredit: 0,
        usdDebit: getUsdAmount(transaction.amount, transaction.currency),
      };
    }

    // Satış faturası: Ona mal sattık (tedarikçi aynı zamanda müşteri) → Bize borçlu → ALACAK
    if (transaction.type === 'sales_invoice') {
      return {
        credit: transaction.amount,
        debit: 0,
        usdCredit: getUsdAmount(transaction.amount, transaction.currency),
        usdDebit: 0,
      };
    }

    // Fiş işlemleri için özel mantık
    if (transaction.type === 'payment' && transaction.paymentType === 'fis') {
      // Tedarikçi için: Borç fişi (outgoing) = tedarikçiye borç yazıyoruz → Borç kolonunda
      // Tedarikçi için: Alacak fişi (incoming) = tedarikçiye alacak yazıyoruz → Alacak kolonunda
      if (transaction.direction === 'outgoing') {
        // Borç fişi → Borç kolonunda
        return {
          credit: 0,
          debit: transaction.amount,
          usdCredit: 0,
          usdDebit: getUsdAmount(transaction.amount, transaction.currency),
        };
      } else {
        // Alacak fişi → Alacak kolonunda
        return {
          credit: transaction.amount,
          debit: 0,
          usdCredit: getUsdAmount(transaction.amount, transaction.currency),
          usdDebit: 0,
        };
      }
    }

    // Diğer ödemeler için
    if (transaction.direction === 'incoming') {
      // Gelen ödemeler (tedarikçi bize ödedi, iade gibi) → Borç artar → BORÇ
      return {
        credit: 0,
        debit: transaction.amount,
        usdCredit: 0,
        usdDebit: getUsdAmount(transaction.amount, transaction.currency),
      };
    } else {
      // Giden ödemeler (biz tedarikçiye ödedik) → Borç azalır → ALACAK
      return {
        credit: transaction.amount,
        debit: 0,
        usdCredit: getUsdAmount(transaction.amount, transaction.currency),
        usdDebit: 0,
      };
    }
  }, [getUsdAmount]);

  // Kümülatif bakiye hesapla - Gerçek bakiye her zaman tüm işlemlere göre hesaplanır (filtreden bağımsız)
  const transactionsWithBalance = useMemo(() => {
    // ADIM 1: Tüm işlemleri tarihe göre sırala (en eski en önce)
    const allSortedTransactions = [...allTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA === dateB) {
        // Aynı tarihte ise, id'ye göre sırala (tutarlılık için)
        return a.id.localeCompare(b.id);
      }
      return dateA - dateB;
    });

    // ADIM 2: Her işlem için bakiye hesapla (en eskiden başlayarak)
    let runningBalance = 0;
    let runningUsdBalance = 0;
    const balanceMap = new Map<string, { balance: number; usdBalance: number }>();

    allSortedTransactions.forEach((transaction) => {
      // Borç ve alacak tutarlarını al
      const { credit, debit, usdCredit, usdDebit } = getCreditDebit(transaction);

      // TRY Bakiye formülü: Yeni Bakiye = Eski Bakiye + Borç - Alacak
      // Tedarikçi için:
      // - Borç (debit): Ona borçluyuz → bakiye artırır (+)
      // - Alacak (credit): Bize borçlu (veya biz ödedik) → bakiye azaltır (-)
      runningBalance = runningBalance + debit - credit;

      // USD Bakiye formülü: Aynı mantık ama USD tutarlarıyla
      runningUsdBalance = runningUsdBalance + usdDebit - usdCredit;

      // Her işlem için bakiyeleri map'e kaydet
      balanceMap.set(transaction.id, {
        balance: runningBalance,
        usdBalance: runningUsdBalance
      });
    });

    // ADIM 3: Filtrelenmiş işlemleri al ve gerçek bakiyeleriyle eşleştir
    const filteredSorted = [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA === dateB) {
        return a.id.localeCompare(b.id);
      }
      return dateA - dateB;
    });

    const transactionsWithBalances = filteredSorted.map((transaction) => {
      // Gerçek bakiyeleri map'ten al
      const balances = balanceMap.get(transaction.id) ?? { balance: 0, usdBalance: 0 };

      return {
        ...transaction,
        balanceAfter: balances.balance, // Bu işlemden sonraki TRY bakiye
        usdBalanceAfter: balances.usdBalance, // Bu işlemden sonraki USD bakiye
      };
    });

    // ADIM 4: Devir bakiye hesapla (eğer filtre varsa ve filtre öncesi işlemler varsa)
    let result = [...transactionsWithBalances];

    // Eğer filtrelenmiş işlemler varsa ve tüm işlemlerden az ise (yani filtre uygulanmış)
    if (filteredSorted.length > 0 && filteredSorted.length < allSortedTransactions.length) {
      // Filtredeki ilk işlemi bul
      const firstFilteredTransaction = filteredSorted[0];
      const firstFilteredDate = new Date(firstFilteredTransaction.date).getTime();

      // Filtre öncesi son işlemi bul (tarih olarak filtredeki ilk işlemden önceki)
      const beforeFilterTransactions = allSortedTransactions.filter(t => {
        const tDate = new Date(t.date).getTime();
        return tDate < firstFilteredDate;
      });

      // Eğer filtre öncesi işlemler varsa, devir bakiye ekle
      if (beforeFilterTransactions.length > 0) {
        const lastBeforeFilter = beforeFilterTransactions[beforeFilterTransactions.length - 1];
        const openingBalances = balanceMap.get(lastBeforeFilter.id) ?? { balance: 0, usdBalance: 0 };

        // Devir bakiye satırı oluştur
        const openingBalanceTransaction: UnifiedTransaction = {
          id: 'opening-balance',
          type: 'payment', // Dummy type
          date: firstFilteredTransaction.date,
          amount: 0,
          direction: 'incoming',
          description: 'Devir Bakiye',
          currency: 'TRY',
          balanceAfter: openingBalances.balance,
          usdBalanceAfter: openingBalances.usdBalance,
        };

        // Devir bakiyeyi en başa ekle
        result.unshift(openingBalanceTransaction);
      }
    }

    // ADIM 5: En yeni en üstte olacak şekilde ters çevir
    return result.reverse();
  }, [filteredTransactions, allTransactions, currentBalance, getCreditDebit]);

  // Gerçek bakiye: Tüm işlemlerdeki en son (en yeni) işlemin bakiyesi
  const calculatedBalance = useMemo(() => {
    // Tüm işlemleri tarihe göre sırala (en eski en önce)
    const sorted = [...allTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA === dateB ? a.id.localeCompare(b.id) : dateA - dateB;
    });

    // Bakiye hesapla
    let balance = 0;
    sorted.forEach((transaction) => {
      const { credit, debit } = getCreditDebit(transaction);
      balance = balance + debit - credit;
    });

    return balance;
  }, [allTransactions, getCreditDebit]);

  const getTransactionTypeLabel = (type: TransactionType, direction?: 'incoming' | 'outgoing', paymentType?: string) => {
    if (type === 'payment') {
      // Fiş işlemleri için özel etiket
      if (paymentType === 'fis') {
        // Tedarikçi için: outgoing = borç fişi (tedarikçiye borç yazıyoruz), incoming = alacak fişi (tedarikçiye alacak yazıyoruz)
        return direction === 'outgoing' ? 'Borç Fişi' : 'Alacak Fişi';
      }
      // Diğer ödeme türleri
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

  // Ödeme silme mutation'ı
  const deletePaymentMutation = useMutation({
    mutationFn: async (payment: Payment) => {
      if (!userData?.company_id) {
        throw new Error("Şirket bilgisi bulunamadı");
      }

      // Payment direction'a göre bakiye değişikliğini tersine çevir
      // Tedarikçi için: incoming = bakiye azalır, outgoing = bakiye artar
      // Silme işleminde tersini yap
      const balanceChange = payment.payment_direction === 'incoming' 
        ? -Number(payment.amount)  // Gelen ödeme silinirse bakiye azalır
        : Number(payment.amount); // Giden ödeme silinirse bakiye artar

      // Hesap bakiyesini geri al (eğer hesap varsa)
      if (payment.account_id && (payment as any).account_type) {
        const accountType = (payment as any).account_type;
        const accountBalanceChange = payment.payment_direction === 'incoming' ? -Number(payment.amount) : Number(payment.amount);

        if (accountType === 'bank') {
          const { data: bankAccount } = await supabase
            .from("bank_accounts")
            .select("current_balance, available_balance")
            .eq("id", payment.account_id)
            .single();

          if (bankAccount) {
            const newCurrentBalance = bankAccount.current_balance - accountBalanceChange;
            const newAvailableBalance = bankAccount.available_balance - accountBalanceChange;
            await supabase
              .from("bank_accounts")
              .update({
                current_balance: newCurrentBalance,
                available_balance: newAvailableBalance,
              })
              .eq("id", payment.account_id);
          }
        } else if (accountType === 'cash') {
          const { data: cashAccount } = await supabase
            .from("cash_accounts")
            .select("current_balance")
            .eq("id", payment.account_id)
            .single();

          if (cashAccount) {
            const newCurrentBalance = cashAccount.current_balance - accountBalanceChange;
            await supabase
              .from("cash_accounts")
              .update({ current_balance: newCurrentBalance })
              .eq("id", payment.account_id);
          }
        } else if (accountType === 'credit_card') {
          const { data: cardAccount } = await supabase
            .from("credit_cards")
            .select("current_balance")
            .eq("id", payment.account_id)
            .single();

          if (cardAccount) {
            const newCurrentBalance = cardAccount.current_balance - accountBalanceChange;
            await supabase
              .from("credit_cards")
              .update({ current_balance: newCurrentBalance })
              .eq("id", payment.account_id);
          }
        } else if (accountType === 'partner') {
          const { data: partnerAccount } = await supabase
            .from("partner_accounts")
            .select("current_balance")
            .eq("id", payment.account_id)
            .single();

          if (partnerAccount) {
            const newCurrentBalance = partnerAccount.current_balance - accountBalanceChange;
            await supabase
              .from("partner_accounts")
              .update({ current_balance: newCurrentBalance })
              .eq("id", payment.account_id);
          }
        }
      }

      // Tedarikçi bakiyesini güncelle
      const { data: supplierData } = await supabase
        .from("suppliers")
        .select("balance")
        .eq("id", supplier.id)
        .single();

      if (supplierData) {
        const newBalance = (supplierData.balance || 0) + balanceChange;
        const { error: updateError } = await supabase
          .from("suppliers")
          .update({ balance: newBalance })
          .eq("id", supplier.id);

        if (updateError) throw updateError;
      }

      // Payment'ı sil
      const { error: deleteError } = await supabase
        .from("payments")
        .delete()
        .eq("id", payment.id);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      toast.success("Ödeme başarıyla silindi");

      // Sadece ilgili supplier için spesifik query'leri invalidate et
      if (supplier.id) {
        queryClient.invalidateQueries({ queryKey: ["supplier-payments", supplier.id, userData?.company_id] });
        queryClient.invalidateQueries({ queryKey: ["supplier", supplier.id] });
        queryClient.invalidateQueries({ queryKey: ["supplier-purchase-invoices", supplier.id, userData?.company_id] });
        queryClient.invalidateQueries({ queryKey: ["supplier-sales-invoices", supplier.id, userData?.company_id] });
      }

      // Genel query'leri invalidate et (supplier.id olmadan)
      queryClient.invalidateQueries({
        queryKey: ["suppliers"],
        exact: false
      });
      queryClient.invalidateQueries({ queryKey: ["payment-accounts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ödeme silinirken bir hata oluştu");
    }
  });

  const handleDeletePayment = (payment: Payment) => {
    const paymentTypeLabel = payment.payment_type === 'fis' ? 'fiş' : 'ödeme';
    if (window.confirm(`Bu ${paymentTypeLabel}i silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      deletePaymentMutation.mutate(payment);
    }
  };

  // İstatistik bilgilerini hesapla - hesaplanan bakiyeyi kullan
  const paymentStats = useMemo(() => {
    const totalIncoming = payments
      .filter(p => p.payment_direction === 'incoming')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalOutgoing = payments
      .filter(p => p.payment_direction === 'outgoing')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return {
      currentBalance: calculatedBalance,
      totalIncoming,
      totalOutgoing,
    };
  }, [payments, calculatedBalance]);

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
              supplierId={supplier.id}
              calculatedBalance={paymentStats.currentBalance}
              onMethodSelect={(method) => {
                if (method.type === "hesap" || method.type === "cek" || method.type === "senet") {
                  onAddPayment({ type: method.type });
                }
              }}
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
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">Tarih</TableHead>
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
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center whitespace-nowrap">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsWithBalance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-gray-500 text-xs">
                    Henüz işlem bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                transactionsWithBalance.map((transaction) => {
                  // Devir bakiye kontrolü
                  const isOpeningBalance = transaction.id === 'opening-balance';
                  const { credit, debit, usdCredit, usdDebit } = getCreditDebit(transaction);
                  const usdBalance = transaction.usdBalanceAfter ?? 0;
                  const balanceIndicator = (transaction.balanceAfter || 0) >= 0 ? 'A' : 'B';
                  const usdBalanceIndicator = usdBalance >= 0 ? 'A' : 'B';
                  const exchangeRate = transaction.currency === 'USD' ? 1 : usdRate;

                  // Devir bakiye satırı için özel gösterim
                  if (isOpeningBalance) {
                    return (
                      <TableRow key={transaction.id} className="h-8 bg-blue-50 font-semibold border-b-2 border-blue-200">
                        <TableCell className="py-2 px-3 text-xs whitespace-nowrap" colSpan={3}>
                          <span className="font-bold text-blue-800">{transaction.description}</span>
                        </TableCell>
                        <TableCell className="py-2 px-3 text-xs whitespace-nowrap text-center">-</TableCell>
                        <TableCell className="py-2 px-3 text-right text-xs whitespace-nowrap">-</TableCell>
                        <TableCell className="py-2 px-3 text-right text-xs whitespace-nowrap">-</TableCell>
                        <TableCell className="py-2 px-3 text-right text-xs whitespace-nowrap">-</TableCell>
                        <TableCell className="py-2 px-3 text-right text-xs whitespace-nowrap">-</TableCell>
                        <TableCell className={`py-2 px-3 text-right text-xs font-bold whitespace-nowrap ${usdBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {usdBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {usdBalanceIndicator}
                        </TableCell>
                        <TableCell className={`py-2 px-3 text-right text-xs font-bold whitespace-nowrap ${(transaction.balanceAfter || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(transaction.balanceAfter || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {balanceIndicator}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-right text-xs whitespace-nowrap">-</TableCell>
                        <TableCell className="py-2 px-3 text-center">-</TableCell>
                      </TableRow>
                    );
                  }

                  return (
                    <TableRow key={`${transaction.type}-${transaction.id}`} className="h-8 transition-colors hover:bg-gray-50">
                      <TableCell className="py-2 px-3 text-xs whitespace-nowrap">
                        {format(new Date(transaction.date), "dd.MM.yyyy")}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-xs whitespace-nowrap">
                        {transaction.reference ? (
                          (transaction.type === 'purchase_invoice' || transaction.type === 'sales_invoice') ? (
                            <button
                              onClick={() => {
                                if (transaction.type === 'purchase_invoice') {
                                  navigate(`/purchase-invoices/${transaction.id}`);
                                } else if (transaction.type === 'sales_invoice') {
                                  navigate(`/sales-invoices/${transaction.id}`);
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                              title="Fatura detayını görüntüle"
                            >
                              {transaction.reference}
                            </button>
                          ) : (
                            transaction.reference
                          )
                        ) : (
                          '-'
                        )}
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
                          {getTransactionTypeLabel(transaction.type, transaction.direction, transaction.paymentType)}
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
                          {transaction.check && (
                            <div className="text-[10px] text-blue-600 mt-0.5 truncate font-medium">
                              Çek: {transaction.check.check_number} - {transaction.check.bank}
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
                      <TableCell className="py-2 px-3 text-center">
                        {transaction.type === 'payment' && transaction.payment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeletePayment(transaction.payment!)}
                            disabled={deletePaymentMutation.isPending}
                            title="Ödemeyi sil"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
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

