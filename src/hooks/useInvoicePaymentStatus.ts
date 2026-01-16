import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  allocatedAmount: number;
  allocationType: "auto" | "manual";
  allocationDate: string;
  notes?: string;
}

export interface InvoicePaymentStatus {
  invoiceId: string;
  invoiceType: "sales" | "purchase";
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "odendi" | "kismi_odendi" | "odenmedi";
  allocations: PaymentAllocation[];
  dueDate?: string; // Vade tarihi
}

export const useInvoicePaymentStatus = (invoiceId: string, invoiceType: "sales" | "purchase") => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["invoice-payment-status", invoiceId, invoiceType, companyId],
    queryFn: async (): Promise<InvoicePaymentStatus | null> => {
      if (!companyId || !invoiceId) return null;

      // Fatura bilgilerini çek
      const tableName = invoiceType === "sales" ? "sales_invoices" : "purchase_invoices";
      const amountField = invoiceType === "sales" ? "toplam_tutar" : "total_amount";
      const dueDateField = invoiceType === "sales" ? "vade_tarihi" : "due_date";
      // sales_invoices'ta odeme_durumu var, purchase_invoices'ta status var (ama kullanmıyoruz, hesaplıyoruz)
      const statusField = invoiceType === "sales" ? "odeme_durumu" : "status";

      const { data: invoice, error: invoiceError } = await supabase
        .from(tableName)
        .select(`${amountField}, ${statusField}, ${dueDateField}`)
        .eq("id", invoiceId)
        .eq("company_id", companyId)
        .single();

      if (invoiceError || !invoice) return null;

      const totalAmount = Number(invoice[amountField] || 0);

      // Bu faturaya yapılan ödeme tahsislerini çek
      const { data: allocations, error: allocError } = await supabase
        .from("invoice_payment_allocations")
        .select("id, payment_id, allocated_amount, allocation_type, allocation_date, notes")
        .eq("company_id", companyId)
        .eq("invoice_id", invoiceId)
        .eq("invoice_type", invoiceType)
        .order("allocation_date", { ascending: false });

      if (allocError) throw allocError;

      const paidAmount = allocations?.reduce((sum, alloc) => sum + Number(alloc.allocated_amount || 0), 0) || 0;
      const remainingAmount = totalAmount - paidAmount;

      let status: "odendi" | "kismi_odendi" | "odenmedi";
      if (remainingAmount <= 0) {
        status = "odendi";
      } else if (paidAmount > 0) {
        status = "kismi_odendi";
      } else {
        status = "odenmedi";
      }

      return {
        invoiceId,
        invoiceType,
        totalAmount,
        paidAmount,
        remainingAmount,
        status,
        dueDate: invoice[dueDateField] || undefined,
        allocations: (allocations || []).map((alloc) => ({
          id: alloc.id,
          paymentId: alloc.payment_id,
          allocatedAmount: Number(alloc.allocated_amount),
          allocationType: alloc.allocation_type as "auto" | "manual",
          allocationDate: alloc.allocation_date,
          notes: alloc.notes || undefined,
        })),
      };
    },
    enabled: !!companyId && !!invoiceId,
    staleTime: 30 * 1000, // 30 saniye cache
  });
};

// Birden fazla fatura için batch sorgu
export const useMultipleInvoicePaymentStatus = (invoiceIds: string[], invoiceType: "sales" | "purchase") => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["multiple-invoice-payment-status", invoiceIds.join(","), invoiceType, companyId],
    queryFn: async (): Promise<Map<string, InvoicePaymentStatus>> => {
      if (!companyId || invoiceIds.length === 0) return new Map();

      const tableName = invoiceType === "sales" ? "sales_invoices" : "purchase_invoices";
      const amountField = invoiceType === "sales" ? "toplam_tutar" : "total_amount";

      // Faturaları çek
      const { data: invoices, error: invoiceError } = await supabase
        .from(tableName)
        .select(`id, ${amountField}`)
        .eq("company_id", companyId)
        .in("id", invoiceIds);

      if (invoiceError) throw invoiceError;

      // Tüm tahsisleri çek
      const { data: allocations, error: allocError } = await supabase
        .from("invoice_payment_allocations")
        .select("id, invoice_id, payment_id, allocated_amount, allocation_type, allocation_date, notes")
        .eq("company_id", companyId)
        .eq("invoice_type", invoiceType)
        .in("invoice_id", invoiceIds);

      if (allocError) throw allocError;

      // Invoice ID'ye göre tahsisleri grupla
      const allocationsByInvoice = new Map<string, typeof allocations>();
      allocations?.forEach((alloc) => {
        if (!allocationsByInvoice.has(alloc.invoice_id)) {
          allocationsByInvoice.set(alloc.invoice_id, []);
        }
        allocationsByInvoice.get(alloc.invoice_id)!.push(alloc);
      });

      const result = new Map<string, InvoicePaymentStatus>();

      invoices?.forEach((invoice) => {
        const totalAmount = Number(invoice[amountField] || 0);
        const invoiceAllocations = allocationsByInvoice.get(invoice.id) || [];
        const paidAmount = invoiceAllocations.reduce((sum, alloc) => sum + Number(alloc.allocated_amount || 0), 0);
        const remainingAmount = totalAmount - paidAmount;

        let status: "odendi" | "kismi_odendi" | "odenmedi";
        if (remainingAmount <= 0) {
          status = "odendi";
        } else if (paidAmount > 0) {
          status = "kismi_odendi";
        } else {
          status = "odenmedi";
        }

        result.set(invoice.id, {
          invoiceId: invoice.id,
          invoiceType,
          totalAmount,
          paidAmount,
          remainingAmount,
          status,
          allocations: invoiceAllocations.map((alloc) => ({
            id: alloc.id,
            paymentId: alloc.payment_id,
            allocatedAmount: Number(alloc.allocated_amount),
            allocationType: alloc.allocation_type as "auto" | "manual",
            allocationDate: alloc.allocation_date,
            notes: alloc.notes || undefined,
          })),
        });
      });

      return result;
    },
    enabled: !!companyId && invoiceIds.length > 0,
    staleTime: 30 * 1000,
  });
};

