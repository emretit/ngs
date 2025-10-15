import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CashAccount {
  id: string;
  name: string;
  description?: string;
  current_balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_type: string;
  account_number: string;
  iban: string;
  currency: string;
  current_balance: number;
  available_balance: number;
  credit_limit?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreditCard {
  id: string;
  card_name: string;
  card_number: string;
  card_type: string;
  bank_name: string;
  current_balance: number;
  credit_limit: number;
  available_limit: number;
  status: string;
  expiry_date: string;
  created_at: string;
  updated_at: string;
}

interface PartnerAccount {
  id: string;
  partner_name: string;
  partner_type: string;
  account_type: string;
  current_balance: number;
  initial_capital: number;
  profit_share: number;
  ownership_percentage: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  account_id?: string;
  card_id?: string;
  partner_id?: string;
  amount: number;
  type: "income" | "expense";
  transaction_type?: string;
  description: string;
  category?: string;
  merchant_name?: string;
  merchant_category?: string;
  transaction_date: string;
  reference?: string;
  created_at?: string;
  updated_at?: string;
}

interface TransferTransaction {
  id: string;
  from_account_type: string;
  from_account_id: string;
  to_account_type: string;
  to_account_id: string;
  amount: number;
  currency: string;
  description?: string;
  transfer_date: string;
  created_at: string;
  updated_at: string;
  // İlişkili hesap bilgileri
  from_account_name?: string;
  to_account_name?: string;
}

// Company ID cache - useAccountsData.ts'den import edilecek
let companyIdCache: string | null = null;
let companyIdPromise: Promise<string> | null = null;

async function fetchCompanyId() {
  // Cache'den döndür
  if (companyIdCache) {
    return companyIdCache;
  }

  // Eğer zaten bir request varsa, onu bekle
  if (companyIdPromise) {
    return companyIdPromise;
  }

  // Yeni request başlat
  companyIdPromise = (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Kullanıcı bulunamadı");

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("Şirket bilgisi bulunamadı");
    }

    companyIdCache = profile.company_id;
    return profile.company_id;
  })();

  return companyIdPromise;
}

// Cash Account Detail - Optimized
export function useCashAccountDetail(accountId: string | undefined) {
  return useQuery({
    queryKey: ['cash-account', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      const companyId = await fetchCompanyId();

      const { data, error } = await supabase
        .from('cash_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Hesap bulunamadı");

      return data as CashAccount;
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 10, // 10 dakika cache - daha uzun
    gcTime: 1000 * 60 * 60, // 1 saat garbage collection
    retry: 1, // Daha az retry
    retryDelay: 500, // Daha hızlı retry
  });
}

// Cash Account Transactions - Optimized
export function useCashAccountTransactions(accountId: string | undefined, limit: number = 20) {
  return useQuery({
    queryKey: ['cash-account-transactions', accountId, limit],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      const companyId = await fetchCompanyId();

      const [cashTransactions, payments] = await Promise.all([
        supabase
          .from('cash_transactions')
          .select('*')
          .eq('account_id', accountId)
          .eq('company_id', companyId)
          .order('transaction_date', { ascending: false })
          .limit(limit),
        
        supabase
          .from('payments')
          .select(`
            *,
            customer:customers(name),
            supplier:suppliers(name)
          `)
          .eq('cash_account_id', accountId)
          .order('payment_date', { ascending: false })
          .limit(limit)
      ]);

      if (cashTransactions.error) throw cashTransactions.error;
      if (payments.error) throw payments.error;

      const formattedPayments = payments.data.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        description: payment.description,
        transaction_date: payment.payment_date,
        type: payment.payment_direction === 'incoming' ? 'income' : 'expense',
        category: 'Ödeme',
        currency: payment.currency,
        customer_name: payment.customer?.name,
        supplier_name: payment.supplier?.name,
        payment_direction: payment.payment_direction
      }));

      const allTransactions = [
        ...cashTransactions.data,
        ...formattedPayments
      ].sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );

      return allTransactions.slice(0, limit);
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5, // 5 dakika cache - daha uzun
    gcTime: 1000 * 60 * 30, // 30 dakika garbage collection
    retry: 1, // Daha az retry
    retryDelay: 500, // Daha hızlı retry
  });
}

// Bank Account Detail - Optimized
export function useBankAccountDetail(accountId: string | undefined) {
  return useQuery({
    queryKey: ['bank-account', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Hesap bulunamadı");

      return data as BankAccount;
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 10, // 10 dakika cache - daha uzun
    gcTime: 1000 * 60 * 60, // 1 saat garbage collection
    retry: 1, // Daha az retry
    retryDelay: 500, // Daha hızlı retry
  });
}

// Bank Account Transactions - Optimized
export function useBankAccountTransactions(accountId: string | undefined, limit: number = 20) {
  return useQuery({
    queryKey: ['bank-account-transactions', accountId, limit],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      const [bankTransactions, payments] = await Promise.all([
        supabase
          .from('bank_transactions')
          .select('*')
          .eq('account_id', accountId)
          .order('transaction_date', { ascending: false })
          .limit(limit),
        
        supabase
          .from('payments')
          .select(`
            *,
            customer:customers(name),
            supplier:suppliers(name)
          `)
          .eq('bank_account_id', accountId)
          .order('payment_date', { ascending: false })
          .limit(limit)
      ]);

      if (bankTransactions.error) throw bankTransactions.error;
      if (payments.error) throw payments.error;

      const formattedPayments = payments.data.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        description: payment.description,
        transaction_date: payment.payment_date,
        type: payment.payment_direction === 'incoming' ? 'income' : 'expense',
        currency: payment.currency,
        customer_name: payment.customer?.name,
        supplier_name: payment.supplier?.name,
        payment_direction: payment.payment_direction,
        payment_type: payment.payment_type
      }));

      const allTransactions = [
        ...bankTransactions.data,
        ...formattedPayments
      ].sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );

      return allTransactions.slice(0, limit);
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5, // 5 dakika cache - daha uzun
    gcTime: 1000 * 60 * 30, // 30 dakika garbage collection
    retry: 1, // Daha az retry
    retryDelay: 500, // Daha hızlı retry
  });
}

// Credit Card Detail - Optimized
export function useCreditCardDetail(cardId: string | undefined) {
  return useQuery({
    queryKey: ['credit-card', cardId],
    queryFn: async () => {
      if (!cardId) throw new Error("Kart ID bulunamadı");

      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Kart bulunamadı");

      return data as CreditCard;
    },
    enabled: !!cardId,
    staleTime: 1000 * 60 * 10, // 10 dakika cache - daha uzun
    gcTime: 1000 * 60 * 60, // 1 saat garbage collection
    retry: 1, // Daha az retry
    retryDelay: 500, // Daha hızlı retry
  });
}

// Credit Card Transactions - Optimized
export function useCreditCardTransactions(cardId: string | undefined, limit: number = 20) {
  return useQuery({
    queryKey: ['credit-card-transactions', cardId, limit],
    queryFn: async () => {
      if (!cardId) throw new Error("Kart ID bulunamadı");

      const [cardTransactions, payments] = await Promise.all([
        supabase
          .from('card_transactions')
          .select('*')
          .eq('card_id', cardId)
          .order('transaction_date', { ascending: false })
          .limit(limit),
        
        supabase
          .from('payments')
          .select(`
            *,
            customer:customers(name),
            supplier:suppliers(name)
          `)
          .eq('credit_card_account_id', cardId)
          .order('payment_date', { ascending: false })
          .limit(limit)
      ]);

      if (cardTransactions.error) throw cardTransactions.error;
      if (payments.error) throw payments.error;
      
      // Map card_transactions to Transaction interface
      const mappedCardTransactions = (cardTransactions.data || []).map((item: any) => ({
        ...item,
        type: item.transaction_type === 'payment' ? 'income' : 'expense',
        category: item.merchant_category || item.category || 'Genel',
        description: item.description || item.merchant_name || 'Kart İşlemi'
      }));

      const formattedPayments = payments.data.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        description: payment.description,
        transaction_date: payment.payment_date,
        type: payment.payment_direction === 'incoming' ? 'income' : 'expense',
        category: 'Ödeme',
        currency: payment.currency,
        customer_name: payment.customer?.name,
        supplier_name: payment.supplier?.name,
        payment_direction: payment.payment_direction
      }));

      const allTransactions = [
        ...mappedCardTransactions,
        ...formattedPayments
      ].sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );

      return allTransactions.slice(0, limit) as Transaction[];
    },
    enabled: !!cardId,
    staleTime: 1000 * 60 * 5, // 5 dakika cache - daha uzun
    gcTime: 1000 * 60 * 30, // 30 dakika garbage collection
    retry: 1, // Daha az retry
    retryDelay: 500, // Daha hızlı retry
  });
}

// Partner Account Detail - Optimized
export function usePartnerAccountDetail(accountId: string | undefined) {
  return useQuery({
    queryKey: ['partner-account', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      // Company ID kontrolünü kaldırdık - account ID zaten unique
      const { data, error } = await supabase
        .from('partner_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Hesap bulunamadı");

      return data as PartnerAccount;
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 10, // 10 dakika cache - daha uzun
    gcTime: 1000 * 60 * 60, // 1 saat garbage collection
    retry: 1, // Daha az retry
    retryDelay: 500, // Daha hızlı retry
  });
}

// Partner Account Transactions - Optimized
export function usePartnerAccountTransactions(accountId: string | undefined, limit: number = 20) {
  return useQuery({
    queryKey: ['partner-account-transactions', accountId, limit],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      const [partnerTransactions, payments] = await Promise.all([
        supabase
          .from('partner_transactions')
          .select('*')
          .eq('partner_id', accountId)
          .order('transaction_date', { ascending: false })
          .limit(limit),
        
        supabase
          .from('payments')
          .select(`
            *,
            customer:customers(name),
            supplier:suppliers(name)
          `)
          .eq('partner_account_id', accountId)
          .order('payment_date', { ascending: false })
          .limit(limit)
      ]);

      if (partnerTransactions.error) throw partnerTransactions.error;
      if (payments.error) throw payments.error;
      
      // Partner transactions için özel mapping
      const mappedPartnerTransactions = (partnerTransactions.data || []).map((transaction: any) => ({
        ...transaction,
        type: transaction.type === 'capital_increase' || transaction.type === 'profit_distribution' ? 'income' : 'expense'
      }));

      const formattedPayments = payments.data.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        description: payment.description,
        transaction_date: payment.payment_date,
        type: payment.payment_direction === 'incoming' ? 'income' : 'expense',
        category: 'Ödeme',
        currency: payment.currency,
        customer_name: payment.customer?.name,
        supplier_name: payment.supplier?.name,
        payment_direction: payment.payment_direction
      }));

      const allTransactions = [
        ...mappedPartnerTransactions,
        ...formattedPayments
      ].sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );
      
      return allTransactions.slice(0, limit) as Transaction[];
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5, // 5 dakika cache - daha uzun
    gcTime: 1000 * 60 * 30, // 30 dakika garbage collection
    retry: 1, // Daha az retry
    retryDelay: 500, // Daha hızlı retry
  });
}

// Transfer Transactions - Belirli bir hesap için gelen/giden transferler
export function useAccountTransfers(accountType: string, accountId: string | undefined, limit: number = 20) {
  return useQuery({
    queryKey: ['account-transfers', accountType, accountId, limit],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      // Hem gelen hem giden transferleri çek
      const [outgoingTransfers, incomingTransfers] = await Promise.all([
        // Giden transferler (bu hesaptan başka hesaplara)
        supabase
          .from('account_transfers')
          .select(`
            *,
            to_account_name:to_account_id
          `)
          .eq('from_account_type', accountType)
          .eq('from_account_id', accountId)
          .order('transfer_date', { ascending: false })
          .limit(limit),
        
        // Gelen transferler (başka hesaplardan bu hesaba)
        supabase
          .from('account_transfers')
          .select(`
            *,
            from_account_name:from_account_id
          `)
          .eq('to_account_type', accountType)
          .eq('to_account_id', accountId)
          .order('transfer_date', { ascending: false })
          .limit(limit)
      ]);

      if (outgoingTransfers.error) throw outgoingTransfers.error;
      if (incomingTransfers.error) throw incomingTransfers.error;

      // Transferleri birleştir ve tarihe göre sırala
      const allTransfers = [
        ...(outgoingTransfers.data || []).map(transfer => ({
          ...transfer,
          direction: 'outgoing' as const
        })),
        ...(incomingTransfers.data || []).map(transfer => ({
          ...transfer,
          direction: 'incoming' as const
        }))
      ].sort((a, b) => new Date(b.transfer_date).getTime() - new Date(a.transfer_date).getTime());

      return allTransfers.slice(0, limit) as (TransferTransaction & { direction: 'incoming' | 'outgoing' })[];
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5, // 5 dakika cache
    gcTime: 1000 * 60 * 30, // 30 dakika garbage collection
    retry: 1,
    retryDelay: 500,
  });
}
