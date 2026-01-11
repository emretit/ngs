import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PurchaseInvoice, InvoiceStatus } from "@/types/purchase";
import { toast } from "sonner";
import { logger } from "@/utils/logger";

export const usePurchaseInvoicesCRUD = () => {
  const queryClient = useQueryClient();

  const fetchInvoiceById = async (id: string): Promise<PurchaseInvoice> => {
    const { data, error } = await supabase
      .from("purchase_invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Fatura yüklenirken hata oluştu");
      throw error;
    }

    return data;
  };

  const createInvoice = async (invoiceData: any): Promise<PurchaseInvoice> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) throw new Error("Company ID not found");

    const invoiceInsertData = {
      ...invoiceData,
      company_id: profile.company_id,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from("purchase_invoices")
      .insert([invoiceInsertData])
      .select()
      .single();

    if (error) {
      toast.error("Fatura oluşturulurken hata oluştu");
      throw error;
    }

    if (invoiceData.supplier_id) {
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("balance")
        .eq("id", invoiceData.supplier_id)
        .single();

      if (supplier) {
        const newBalance = (supplier.balance || 0) + (invoiceData.total_amount || 0);
        await supabase
          .from("suppliers")
          .update({ balance: newBalance })
          .eq("id", invoiceData.supplier_id);

        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        queryClient.invalidateQueries({ queryKey: ['supplier', invoiceData.supplier_id] });
        queryClient.invalidateQueries({ queryKey: ['supplier_statistics'] });
      }
    }

    toast.success("Fatura başarıyla oluşturuldu");
    return data;
  };

  const updateInvoice = async ({ id, data: invoiceData }: { id: string, data: any }): Promise<PurchaseInvoice> => {
    const { error } = await supabase
      .from("purchase_invoices")
      .update(invoiceData)
      .eq("id", id);

    if (error) {
      toast.error("Fatura güncellenirken hata oluştu");
      throw error;
    }

    toast.success("Fatura başarıyla güncellendi");
    return { id } as PurchaseInvoice;
  };

  const recordPayment = async ({ id, amount, paymentDate }: { id: string, amount: number, paymentDate: string }) => {
    const invoice = await fetchInvoiceById(id);
    const paidAmount = (invoice.paid_amount || 0) + amount;
    const remainingAmount = invoice.total_amount - paidAmount;
    const newStatus: InvoiceStatus = remainingAmount <= 0 ? 'paid' : 'partially_paid';

    const { error } = await supabase
      .from("purchase_invoices")
      .update({
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        status: newStatus,
        last_payment_date: paymentDate
      })
      .eq("id", id);

    if (error) throw error;

    toast.success("Ödeme kaydedildi");
  };

  const deleteInvoice = async (id: string): Promise<void> => {
    const invoice = await fetchInvoiceById(id);

    const { error: itemsError } = await supabase
      .from("purchase_invoice_items")
      .delete()
      .eq("invoice_id", id);

    if (itemsError) {
      logger.error("Items delete error:", itemsError);
      throw itemsError;
    }

    const { error } = await supabase
      .from("purchase_invoices")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (invoice.supplier_id && invoice.status !== 'paid') {
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("balance")
        .eq("id", invoice.supplier_id)
        .single();

      if (supplier) {
        const newBalance = (supplier.balance || 0) - (invoice.remaining_amount || 0);
        await supabase
          .from("suppliers")
          .update({ balance: newBalance })
          .eq("id", invoice.supplier_id);
      }
    }

    toast.success("Fatura silindi");
  };

  const createInvoiceMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: updateInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: recordPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['product-stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-stocks'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-stocks-proposal'] });
    },
  });

  return {
    fetchInvoiceById,
    createInvoice: createInvoiceMutation.mutateAsync,
    updateInvoice: updateInvoiceMutation.mutateAsync,
    recordPayment: recordPaymentMutation.mutateAsync,
    deleteInvoice: deleteInvoiceMutation.mutateAsync,
    isCreating: createInvoiceMutation.isPending,
    isUpdating: updateInvoiceMutation.isPending,
  };
};
