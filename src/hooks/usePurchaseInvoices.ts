
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PurchaseInvoice, InvoiceStatus } from "@/types/purchase";
import { toast } from "sonner";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { useCurrentUser } from "./useCurrentUser";

export const usePurchaseInvoices = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    dateRange: { from: null, to: null } as { from: Date | null, to: Date | null }
  });

  const fetchInvoices = async (): Promise<PurchaseInvoice[]> => {
    // Supplier bilgilerini JOIN ile tek sorguda çek
    let query = supabase
      .from("purchase_invoices")
      .select(`
        *,
        supplier:suppliers (
          id,
          name,
          company,
          tax_number
        )
      `)
      .order("created_at", { ascending: false });

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status as InvoiceStatus);
    }

    if (filters.search) {
      query = query.or(`invoice_number.ilike.%${filters.search}%`);
    }

    if (filters.dateRange.from) {
      query = query.gte("created_at", filters.dateRange.from.toISOString());
    }

    if (filters.dateRange.to) {
      query = query.lte("created_at", filters.dateRange.to.toISOString());
    }

    const { data: invoices, error } = await query;

    if (error) {
      toast.error("Faturalar yüklenirken hata oluştu");
      throw error;
    }

    if (!invoices || invoices.length === 0) {
      return [];
    }


    return invoices;
  };

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

  const createInvoice = async (invoiceData: any) => {
    const { data, error } = await supabase
      .from("purchase_invoices")
      .insert([invoiceData])
      .select()
      .single();

    if (error) {
      toast.error("Fatura oluşturulurken hata oluştu");
      throw error;
    }

    toast.success("Fatura başarıyla oluşturuldu");
    return data;
  };

  const updateInvoice = async ({ id, data }: { id: string, data: any }) => {
    const { error } = await supabase
      .from("purchase_invoices")
      .update(data)
      .eq("id", id);

    if (error) {
      toast.error("Fatura güncellenirken hata oluştu");
      throw error;
    }

    toast.success("Fatura başarıyla güncellendi");
    return { id };
  };

  const recordPayment = async ({ id, amount }: { id: string, amount: number }) => {
    // Get current invoice
    const { data: invoice, error: fetchError } = await supabase
      .from("purchase_invoices")
      .select("*")
      .eq("id", id)
      .single();
    
    if (fetchError) {
      toast.error("Fatura bilgisi alınamadı");
      throw fetchError;
    }
    
    // Calculate new paid amount and status
    const newPaidAmount = parseFloat(String(invoice.paid_amount)) + amount;
    const newStatus = newPaidAmount >= parseFloat(String(invoice.total_amount)) 
      ? 'paid' 
      : newPaidAmount > 0 
        ? 'partially_paid' 
        : 'pending';
    
    // Update invoice
    const { error: updateError } = await supabase
      .from("purchase_invoices")
      .update({
        paid_amount: newPaidAmount,
        status: newStatus as InvoiceStatus
      })
      .eq("id", id);
    
    if (updateError) {
      toast.error("Ödeme kaydedilirken hata oluştu");
      throw updateError;
    }
    
    toast.success("Ödeme başarıyla kaydedildi");
    return { id };
  };

  const deleteInvoice = async (id: string) => {
    const { error } = await supabase
      .from("purchase_invoices")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Fatura silinirken hata oluştu");
      throw error;
    }

    toast.success("Fatura başarıyla silindi");
    return { id };
  };

  const { data: invoices, isLoading, error, refetch } = useQuery({
    queryKey: ['purchaseInvoices', filters],
    queryFn: fetchInvoices,
    staleTime: 5 * 60 * 1000, // 5 dakika boyunca fresh kabul et
    gcTime: 10 * 60 * 1000, // 10 dakika cache'de tut
    refetchOnWindowFocus: false, // Pencere odaklandığında refetch etme
  });

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
    },
  });

  return {
    invoices,
    isLoading,
    error,
    filters,
    setFilters,
    refetch,
    fetchInvoiceById,
    createInvoiceMutation,
    updateInvoiceMutation,
    recordPaymentMutation,
    deleteInvoiceMutation,
  };
};

// Purchase Invoices Filters Interface
export interface PurchaseInvoiceFilters {
  status?: string;
  search?: string;
  supplier_id?: string;
  dateRange?: { from: Date | null; to: Date | null };
}

// Infinite scroll hook for purchase invoices
export const usePurchaseInvoicesInfiniteScroll = (filters?: PurchaseInvoiceFilters, pageSize: number = 20) => {
  const { userData, loading: userLoading } = useCurrentUser();

  const fetchInvoices = useCallback(async (page: number, pageSize: number) => {
    if (!userData?.company_id) {
      throw new Error("Kullanıcının company_id'si bulunamadı");
    }

    let query = supabase
      .from('purchase_invoices')
      .select(`
        *,
        supplier:suppliers(id, name, company, tax_number, email),
        purchase_order:purchase_orders(id, order_number)
      `, { count: 'exact' })
      .eq('company_id', userData.company_id);

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`invoice_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    if (filters?.supplier_id && filters.supplier_id !== 'all') {
      query = query.eq('supplier_id', filters.supplier_id);
    }

    if (filters?.dateRange?.from) {
      query = query.gte('invoice_date', filters.dateRange.from.toISOString().split('T')[0]);
    }

    if (filters?.dateRange?.to) {
      query = query.lte('invoice_date', filters.dateRange.to.toISOString().split('T')[0]);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('invoice_date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching purchase invoices:", error);
      throw error;
    }

    return {
      data: data || [],
      totalCount: count || 0,
      hasNextPage: data ? data.length === pageSize : false,
    };
  }, [userData?.company_id, JSON.stringify(filters)]);

  const {
    data: invoices,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error,
    loadMore,
    refresh,
    totalCount,
  } = useInfiniteScroll(
    ["purchase-invoices-infinite", JSON.stringify(filters), userData?.company_id],
    fetchInvoices,
    {
      pageSize,
      enabled: !!userData?.company_id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  return {
    data: invoices,
    isLoading: isLoading || userLoading,
    isLoadingMore,
    hasNextPage,
    error,
    loadMore,
    refresh,
    totalCount,
  };
};
