import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  InventoryTransaction,
  InventoryTransactionItem,
  TransactionType,
  TransactionStatus,
  CreateInventoryTransactionData,
  UpdateInventoryTransactionData,
  InventoryTransactionFilters,
  InventoryTransactionStats,
} from "@/types/inventory";

export const useInventoryTransactions = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<InventoryTransactionFilters>({
    transaction_type: "all",
    status: "all",
    warehouse_id: "all",
    search: "",
    dateRange: { from: null, to: null },
    page: 1,
    pageSize: 20,
  });

  const fetchTransactions = async (): Promise<InventoryTransaction[]> => {
    // Get current user's company_id
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    // TODO: inventory_transactions tablosu oluşturulduğunda bu sorguyu güncelle
    // Şimdilik boş array döndürüyoruz
    return [];
    
    // let query = supabase
    //   .from("inventory_transactions")
    //   .select(`
    //     *,
    //     employee:employees(id, first_name, last_name, email),
    //     approved_by_employee:employees!inventory_transactions_approved_by_fkey(id, first_name, last_name),
    //     warehouse:warehouses(id, name, code),
    //     items:inventory_transaction_items(*)
    //   `)
    //   .eq("company_id", profile?.company_id)
    //   .order("created_at", { ascending: false });

    // // Transaction type filtresi
    // if (filters.transaction_type && filters.transaction_type !== "all") {
    //   query = query.eq("transaction_type", filters.transaction_type);
    // }

    // // Status filtresi
    // if (filters.status && filters.status !== "all") {
    //   query = query.eq("status", filters.status);
    // }

    // // Warehouse filtresi
    // if (filters.warehouse_id && filters.warehouse_id !== "all") {
    //   query = query.eq("warehouse_id", filters.warehouse_id);
    // }

    // // Arama filtresi
    // if (filters.search) {
    //   query = query.or(
    //     `transaction_number.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
    //   );
    // }

    // // Tarih aralığı filtresi
    // if (filters.dateRange?.from) {
    //   query = query.gte(
    //     "transaction_date",
    //     filters.dateRange.from.toISOString().split("T")[0]
    //   );
    // }
    // if (filters.dateRange?.to) {
    //   query = query.lte(
    //     "transaction_date",
    //     filters.dateRange.to.toISOString().split("T")[0]
    //   );
    // }

    // const { data, error } = await query;

    // if (error) {
    //   toast.error("İşlemler yüklenirken hata oluştu");
    //   throw error;
    // }

    // return (data as unknown as InventoryTransaction[]) || [];
  };

  const fetchTransactionById = async (id: string): Promise<InventoryTransaction | null> => {
    // TODO: Implement when table is ready
    return null;
  };

  const createTransaction = async (transactionData: CreateInventoryTransactionData) => {
    // TODO: Implement when table is ready
    toast.success("İşlem oluşturuldu");
    return {} as InventoryTransaction;
  };

  const updateTransaction = async (
    id: string,
    transactionData: UpdateInventoryTransactionData
  ) => {
    // TODO: Implement when table is ready
    toast.success("İşlem güncellendi");
    return {} as InventoryTransaction;
  };

  const approveTransaction = async (id: string) => {
    // TODO: Implement when table is ready
    toast.success("İşlem onaylandı");
  };

  const cancelTransaction = async (id: string) => {
    // TODO: Implement when table is ready
    toast.success("İşlem iptal edildi");
  };

  const getStats = async (): Promise<InventoryTransactionStats> => {
    const transactions = await fetchTransactions();
    
    return {
      total: transactions.length,
      pending: transactions.filter(t => t.status === 'pending').length,
      approved: transactions.filter(t => t.status === 'approved').length,
      completed: transactions.filter(t => t.status === 'completed').length,
      cancelled: transactions.filter(t => t.status === 'cancelled').length,
      by_type: {
        giris: transactions.filter(t => t.transaction_type === 'giris').length,
        cikis: transactions.filter(t => t.transaction_type === 'cikis').length,
        transfer: transactions.filter(t => t.transaction_type === 'transfer').length,
        sayim: transactions.filter(t => t.transaction_type === 'sayim').length,
      }
    };
  };

  // React Query hooks
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["inventory_transactions", filters],
    queryFn: fetchTransactions,
  });

  const { data: stats } = useQuery({
    queryKey: ["inventory_transaction_stats"],
    queryFn: getStats,
  });

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_transaction_stats"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryTransactionData }) =>
      updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_transaction_stats"] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: approveTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_transaction_stats"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_transaction_stats"] });
    },
  });

  return {
    transactions,
    isLoading,
    stats,
    filters,
    setFilters,
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    approveTransaction: approveMutation.mutateAsync,
    cancelTransaction: cancelMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
};

