import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { useExchangeRates } from "./useExchangeRates";

export interface OverdueBalance {
  customerId: string;
  customerName: string;
  overdueBalance: number;      // Vadesi geçmiş
  upcomingBalance: number;      // Vadesi gelmemiş
  totalBalance: number;        // Toplam
  oldestOverdueDate?: string;  // En eski vadesi geçmiş fatura tarihi
  currency: string;
}

export const useOverdueBalances = () => {
  const { companyId } = useCompany();
  const { exchangeRates, convertCurrency } = useExchangeRates();

  return useQuery({
    queryKey: ["overdue-balances", companyId],
    queryFn: async (): Promise<OverdueBalance[]> => {
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const today = new Date().toISOString().split("T")[0];

      // Tüm ödenmemiş/kısmi ödenmiş satış faturalarını çek
      const { data: salesInvoices, error: salesError } = await supabase
        .from("sales_invoices")
        .select("id, customer_id, toplam_tutar, vade_tarihi, para_birimi, odeme_durumu, customers(name)")
        
        .in("odeme_durumu", ["odenmedi", "kismi_odendi"])
        .not("vade_tarihi", "is", null);

      if (salesError) throw salesError;

      // Fatura-ödeme eşleştirmelerini çek
      const invoiceIds = salesInvoices?.map((inv) => inv.id) || [];
      const { data: allocations, error: allocError } = await supabase
        .from("invoice_payment_allocations")
        .select("invoice_id, allocated_amount")
        
        .eq("invoice_type", "sales")
        .in("invoice_id", invoiceIds);

      if (allocError) throw allocError;

      // Allocation'ları invoice_id'ye göre grupla
      const allocationsByInvoice = new Map<string, number>();
      allocations?.forEach((alloc) => {
        const current = allocationsByInvoice.get(alloc.invoice_id) || 0;
        allocationsByInvoice.set(alloc.invoice_id, current + Number(alloc.allocated_amount));
      });

      // Müşteri bazında grupla
      const balancesByCustomer = new Map<string, OverdueBalance>();

      salesInvoices?.forEach((invoice) => {
        const customerId = invoice.customer_id;
        if (!customerId) return;

        const totalAmount = Number(invoice.toplam_tutar || 0);
        const paidAmount = allocationsByInvoice.get(invoice.id) || 0;
        const remainingAmount = totalAmount - paidAmount;

        // Eğer tamamen ödendiyse atla
        if (remainingAmount <= 0) return;

        const vadeTarihi = invoice.vade_tarihi;
        const currency = invoice.para_birimi || "TRY";
        const isOverdue = vadeTarihi < today;

        // USD'ye çevir (bakiye hesaplaması için)
        const usdRate = exchangeRates.find((r) => r.currency_code === "USD")?.forex_selling || 1;
        let remainingAmountUsd = remainingAmount;
        if (currency !== "USD") {
          if (currency === "TRY") {
            remainingAmountUsd = remainingAmount / usdRate;
          } else {
            remainingAmountUsd = convertCurrency(remainingAmount, currency, "USD");
          }
        }

        if (!balancesByCustomer.has(customerId)) {
          balancesByCustomer.set(customerId, {
            customerId,
            customerName: (invoice.customers as any)?.name || "Bilinmeyen Müşteri",
            overdueBalance: 0,
            upcomingBalance: 0,
            totalBalance: 0,
            currency: "USD", // Tüm bakiyeleri USD'ye çeviriyoruz
          });
        }

        const balance = balancesByCustomer.get(customerId)!;

        if (isOverdue) {
          balance.overdueBalance += remainingAmountUsd;
          // En eski vadesi geçmiş tarihi güncelle
          if (!balance.oldestOverdueDate || vadeTarihi < balance.oldestOverdueDate) {
            balance.oldestOverdueDate = vadeTarihi;
          }
        } else {
          balance.upcomingBalance += remainingAmountUsd;
        }

        balance.totalBalance = balance.overdueBalance + balance.upcomingBalance;
      });

      // Sadece vadesi geçmiş bakiyesi olan müşterileri döndür
      return Array.from(balancesByCustomer.values())
        .filter((b) => b.overdueBalance > 0)
        .sort((a, b) => b.overdueBalance - a.overdueBalance);
    },
    enabled: !!companyId && exchangeRates.length > 0,
    staleTime: 1 * 60 * 1000, // 1 dakika cache
  });
};

