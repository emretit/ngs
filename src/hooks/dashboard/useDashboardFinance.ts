import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "../useCurrentUser";

export const useDashboardFinance = () => {
  const { userData } = useCurrentUser();

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: monthlyTurnover, isLoading: isMonthlyTurnoverLoading } = useQuery({
    queryKey: ['dashboard-monthly-turnover', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return 0;
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('toplam_tutar')
        .eq('durum', 'onaylandi')
        .gte('fatura_tarihi', currentMonthStart)
        .lte('fatura_tarihi', currentMonthEnd);
      if (error) throw error;
      return data?.reduce((sum, inv) => sum + (Number(inv.toplam_tutar) || 0), 0) || 0;
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: monthlyExpenses, isLoading: isMonthlyExpensesLoading } = useQuery({
    queryKey: ['dashboard-monthly-expenses', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return 0;
      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('type', 'expense')
        .gte('date', currentMonthStart)
        .lte('date', currentMonthEnd);
      if (error) throw error;
      return data?.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: stockValue, isLoading: isStockValueLoading } = useQuery({
    queryKey: ['dashboard-stock-value', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return 0;
      const { data: warehouseStock, error: wsError } = await supabase
        .from('warehouse_stock')
        .select(`quantity, product_id, products!inner(price, purchase_price)`);
      if (wsError) throw wsError;
      if (warehouseStock && warehouseStock.length > 0) {
        return warehouseStock.reduce((sum, ws) => {
          const price = Number((ws.products as any)?.purchase_price || (ws.products as any)?.price || 0);
          return sum + (Number(ws.quantity) || 0) * price;
        }, 0);
      }
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('stock_quantity, purchase_price, price')
        .eq('is_active', true);
      if (productsError) throw productsError;
      return products?.reduce((sum, p) => sum + (Number(p.stock_quantity) || 0) * Number(p.purchase_price || p.price || 0), 0) || 0;
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: assets, isLoading: isAssetsLoading } = useQuery({
    queryKey: ['dashboard-assets', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return null;
      const [bankAccounts, cashAccounts, customers, checks] = await Promise.all([
        supabase.from('bank_accounts').select('current_balance'),
        supabase.from('cash_accounts').select('current_balance'),
        supabase.from('customers').select('balance'),
        supabase.from('checks').select('amount').eq('check_type', 'incoming').in('status', ['odenecek', 'tahsilat_bekleniyor', 'portfoyde'])
      ]);
      const bank = bankAccounts.data?.reduce((sum, acc) => sum + (Number(acc.current_balance) || 0), 0) || 0;
      const cash = cashAccounts.data?.reduce((sum, acc) => sum + (Number(acc.current_balance) || 0), 0) || 0;
      const receivables = customers.data?.reduce((sum, c) => sum + (Number(c.balance) || 0), 0) || 0;
      const checksAmount = checks.data?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0;
      return {
        bank,
        cash,
        receivables,
        checks: checksAmount,
        stock: stockValue || 0,
        total: bank + cash + receivables + checksAmount + (stockValue || 0)
      };
    },
    enabled: !!userData?.company_id && stockValue !== undefined,
    staleTime: 5 * 60 * 1000,
  });

  const { data: liabilities, isLoading: isLiabilitiesLoading } = useQuery({
    queryKey: ['dashboard-liabilities', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return null;
      const [suppliers, creditCards, loans, einvoices] = await Promise.all([
        supabase.from('suppliers').select('balance'),
        supabase.from('credit_cards').select('current_balance').eq('is_active', true),
        supabase.from('loans').select('remaining_debt').eq('status', 'odenecek'),
        supabase.from('einvoices').select('remaining_amount').in('status', ['pending', 'partially_paid'])
      ]);
      const payables = suppliers.data?.reduce((sum, s) => sum + (Number(s.balance) || 0), 0) || 0;
      const creditCardDebt = creditCards.data?.reduce((sum, cc) => sum + (Number(cc.current_balance) || 0), 0) || 0;
      const loansDebt = loans.data?.reduce((sum, l) => sum + (Number(l.remaining_debt) || 0), 0) || 0;
      const einvoicesDebt = einvoices.data?.reduce((sum, inv) => sum + (Number(inv.remaining_amount) || 0), 0) || 0;
      return {
        payables,
        creditCards: creditCardDebt,
        loans: loansDebt,
        einvoices: einvoicesDebt,
        total: payables + creditCardDebt + loansDebt + einvoicesDebt
      };
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    monthlyTurnover: monthlyTurnover || 0,
    monthlyExpenses: monthlyExpenses || 0,
    stockValue: stockValue || 0,
    assets,
    liabilities,
    isLoading: isMonthlyTurnoverLoading || isMonthlyExpensesLoading || isStockValueLoading,
    isAssetsLoading,
    isLiabilitiesLoading,
  };
};
