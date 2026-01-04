import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { useCurrentUser } from "./useCurrentUser";

export interface AllocatePaymentParams {
  paymentId: string;
  invoiceId: string;
  invoiceType: "sales" | "purchase";
  amount: number;
  notes?: string;
  allocationType?: "auto" | "manual";
}

export const usePaymentAllocation = () => {
  const { companyId } = useCompany();
  const { userData } = useCurrentUser();
  const queryClient = useQueryClient();

  // Manuel fatura-ödeme bağlama
  const allocatePayment = useMutation({
    mutationFn: async (params: AllocatePaymentParams) => {
      if (!companyId || !userData?.id) {
        throw new Error("Company ID or User ID not found");
      }

      // Ödeme tutarını kontrol et
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("amount, currency")
        .eq("id", params.paymentId)
        .eq("company_id", companyId)
        .single();

      if (paymentError) throw paymentError;
      if (!payment) throw new Error("Payment not found");

      // Bu ödemeye daha önce yapılan tahsisleri kontrol et
      const { data: existingAllocations, error: allocError } = await supabase
        .from("invoice_payment_allocations")
        .select("allocated_amount")
        .eq("payment_id", params.paymentId)
        .eq("company_id", companyId);

      if (allocError) throw allocError;

      const totalAllocated = existingAllocations?.reduce(
        (sum, alloc) => sum + Number(alloc.allocated_amount || 0),
        0
      ) || 0;

      const paymentAmount = Number(payment.amount || 0);
      const availableAmount = paymentAmount - totalAllocated;

      if (params.amount > availableAmount) {
        throw new Error(`Yetersiz ödeme tutarı. Kalan: ${availableAmount.toFixed(2)}`);
      }

      // Fatura tutarını kontrol et
      const tableName = params.invoiceType === "sales" ? "sales_invoices" : "purchase_invoices";
      const amountField = params.invoiceType === "sales" ? "toplam_tutar" : "total_amount";

      const { data: invoice, error: invoiceError } = await supabase
        .from(tableName)
        .select(amountField)
        .eq("id", params.invoiceId)
        .eq("company_id", companyId)
        .single();

      if (invoiceError) throw invoiceError;
      if (!invoice) throw new Error("Invoice not found");

      const invoiceAmount = Number(invoice[amountField] || 0);

      // Bu faturaya daha önce yapılan tahsisleri kontrol et
      const { data: invoiceAllocations, error: invAllocError } = await supabase
        .from("invoice_payment_allocations")
        .select("allocated_amount")
        .eq("invoice_id", params.invoiceId)
        .eq("invoice_type", params.invoiceType)
        .eq("company_id", companyId);

      if (invAllocError) throw invAllocError;

      const totalPaid = invoiceAllocations?.reduce(
        (sum, alloc) => sum + Number(alloc.allocated_amount || 0),
        0
      ) || 0;

      const remainingAmount = invoiceAmount - totalPaid;

      if (params.amount > remainingAmount) {
        throw new Error(`Fatura tutarından fazla tahsis yapılamaz. Kalan: ${remainingAmount.toFixed(2)}`);
      }

      // Tahsisi kaydet
      const { data, error } = await supabase
        .from("invoice_payment_allocations")
        .insert({
          company_id: companyId,
          payment_id: params.paymentId,
          invoice_id: params.invoiceId,
          invoice_type: params.invoiceType,
          allocated_amount: params.amount,
          allocation_type: params.allocationType || "manual",
          notes: params.notes,
          created_by: userData.id,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      // İlgili query'leri invalidate et
      queryClient.invalidateQueries({ queryKey: ["invoice-payment-status"] });
      queryClient.invalidateQueries({ queryKey: ["multiple-invoice-payment-status"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-balances"] });
      queryClient.invalidateQueries({ queryKey: ["critical-alerts"] });
    },
  });

  // Tahsisi kaldır
  const removeAllocation = useMutation({
    mutationFn: async (allocationId: string) => {
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const { error } = await supabase
        .from("invoice_payment_allocations")
        .delete()
        .eq("id", allocationId)
        .eq("company_id", companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-payment-status"] });
      queryClient.invalidateQueries({ queryKey: ["multiple-invoice-payment-status"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-balances"] });
      queryClient.invalidateQueries({ queryKey: ["critical-alerts"] });
    },
  });

  // Otomatik tahsis (en eski vadeli faturadan başlayarak)
  const autoAllocatePayment = useMutation({
    mutationFn: async (paymentId: string, customerId?: string, supplierId?: string) => {
      if (!companyId || !userData?.id) {
        throw new Error("Company ID or User ID not found");
      }

      // Ödeme bilgilerini çek
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("amount, currency, customer_id, supplier_id")
        .eq("id", paymentId)
        .eq("company_id", companyId)
        .single();

      if (paymentError) throw paymentError;
      if (!payment) throw new Error("Payment not found");

      const paymentAmount = Number(payment.amount || 0);
      const targetCustomerId = customerId || payment.customer_id;
      const targetSupplierId = supplierId || payment.supplier_id;

      if (!targetCustomerId && !targetSupplierId) {
        throw new Error("Customer or Supplier ID required");
      }

      // Bu ödemeye daha önce yapılan tahsisleri hesapla
      const { data: existingAllocations, error: allocError } = await supabase
        .from("invoice_payment_allocations")
        .select("allocated_amount")
        .eq("payment_id", paymentId)
        .eq("company_id", companyId);

      if (allocError) throw allocError;

      const totalAllocated = existingAllocations?.reduce(
        (sum, alloc) => sum + Number(alloc.allocated_amount || 0),
        0
      ) || 0;

      let remainingPayment = paymentAmount - totalAllocated;

      if (remainingPayment <= 0) {
        return { message: "Ödeme tamamen tahsis edilmiş" };
      }

      // Satış faturalarını çek (müşteri için)
      if (targetCustomerId) {
        const { data: salesInvoices, error: salesError } = await supabase
          .from("sales_invoices")
          .select("id, toplam_tutar, vade_tarihi")
          .eq("company_id", companyId)
          .eq("customer_id", targetCustomerId)
          .in("odeme_durumu", ["odenmedi", "kismi_odendi"])
          .not("vade_tarihi", "is", null)
          .order("vade_tarihi", { ascending: true }); // En eski vadeli önce

        if (salesError) throw salesError;

        // Her faturaya tahsis yap
        for (const invoice of salesInvoices || []) {
          if (remainingPayment <= 0) break;

          const invoiceAmount = Number(invoice.toplam_tutar || 0);

          // Bu faturaya daha önce yapılan tahsisleri kontrol et
          const { data: invoiceAllocations, error: invAllocError } = await supabase
            .from("invoice_payment_allocations")
            .select("allocated_amount")
            .eq("invoice_id", invoice.id)
            .eq("invoice_type", "sales")
            .eq("company_id", companyId);

          if (invAllocError) throw invAllocError;

          const totalPaid = invoiceAllocations?.reduce(
            (sum, alloc) => sum + Number(alloc.allocated_amount || 0),
            0
          ) || 0;

          const remainingInvoice = invoiceAmount - totalPaid;

          if (remainingInvoice <= 0) continue;

          const allocateAmount = Math.min(remainingPayment, remainingInvoice);

          const { error: insertError } = await supabase
            .from("invoice_payment_allocations")
            .insert({
              company_id: companyId,
              payment_id: paymentId,
              invoice_id: invoice.id,
              invoice_type: "sales",
              allocated_amount: allocateAmount,
              allocation_type: "auto",
              created_by: userData.id,
            });

          if (insertError) throw insertError;

          remainingPayment -= allocateAmount;
        }
      }

      // Alış faturalarını çek (tedarikçi için)
      if (targetSupplierId) {
        const { data: purchaseInvoices, error: purchaseError } = await supabase
          .from("purchase_invoices")
          .select("id, total_amount, due_date")
          .eq("company_id", companyId)
          .eq("supplier_id", targetSupplierId)
          .in("status", ["pending", "partially_paid"])
          .not("due_date", "is", null)
          .order("due_date", { ascending: true });

        if (purchaseError) throw purchaseError;

        for (const invoice of purchaseInvoices || []) {
          if (remainingPayment <= 0) break;

          const invoiceAmount = Number(invoice.total_amount || 0);

          const { data: invoiceAllocations, error: invAllocError } = await supabase
            .from("invoice_payment_allocations")
            .select("allocated_amount")
            .eq("invoice_id", invoice.id)
            .eq("invoice_type", "purchase")
            .eq("company_id", companyId);

          if (invAllocError) throw invAllocError;

          const totalPaid = invoiceAllocations?.reduce(
            (sum, alloc) => sum + Number(alloc.allocated_amount || 0),
            0
          ) || 0;

          const remainingInvoice = invoiceAmount - totalPaid;

          if (remainingInvoice <= 0) continue;

          const allocateAmount = Math.min(remainingPayment, remainingInvoice);

          const { error: insertError } = await supabase
            .from("invoice_payment_allocations")
            .insert({
              company_id: companyId,
              payment_id: paymentId,
              invoice_id: invoice.id,
              invoice_type: "purchase",
              allocated_amount: allocateAmount,
              allocation_type: "auto",
              created_by: userData.id,
            });

          if (insertError) throw insertError;

          remainingPayment -= allocateAmount;
        }
      }

      return {
        message: `Otomatik tahsis tamamlandı. Kalan ödeme: ${remainingPayment.toFixed(2)}`,
        remainingAmount: remainingPayment,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-payment-status"] });
      queryClient.invalidateQueries({ queryKey: ["multiple-invoice-payment-status"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-balances"] });
      queryClient.invalidateQueries({ queryKey: ["critical-alerts"] });
    },
  });

  return {
    allocatePayment,
    removeAllocation,
    autoAllocatePayment,
  };
};

