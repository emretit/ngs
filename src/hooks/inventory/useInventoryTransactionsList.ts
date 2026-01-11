import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  InventoryTransaction,
  InventoryTransactionFilters,
  InventoryTransactionStats,
} from "@/types/inventory";

export const useInventoryTransactionsList = () => {
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
    // Product ID filtresi varsa önce transaction ID'lerini bul
    let transactionIds: string[] | null = null;
    if (filters.product_id) {
      const { data: transactionItems } = await supabase
        .from("inventory_transaction_items")
        .select("transaction_id")
        .eq("product_id", filters.product_id);

      if (transactionItems && transactionItems.length > 0) {
        transactionIds = [...new Set(transactionItems.map(item => item.transaction_id))] as string[];
      } else {
        return [];
      }
    }

    let query = supabase
      .from("inventory_transactions")
      .select(`
        *,
        warehouse:warehouses!inventory_transactions_warehouse_id_fkey(id, name, code),
        from_warehouse:warehouses!inventory_transactions_from_warehouse_id_fkey(id, name, code),
        to_warehouse:warehouses!inventory_transactions_to_warehouse_id_fkey(id, name, code),
        items:inventory_transaction_items(
          *,
          product:products!inventory_transaction_items_product_id_fkey(id, name, sku)
        )
      `);

    if (transactionIds && transactionIds.length > 0) {
      query = query.in("id", transactionIds);
    } else if (transactionIds && transactionIds.length === 0) {
      return [];
    }

    query = query.order("created_at", { ascending: false });

    if (filters.transaction_type && filters.transaction_type !== "all") {
      query = query.eq("transaction_type", filters.transaction_type);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.warehouse_id && filters.warehouse_id !== "all") {
      query = query.or(`warehouse_id.eq.${filters.warehouse_id},from_warehouse_id.eq.${filters.warehouse_id},to_warehouse_id.eq.${filters.warehouse_id}`);
    }

    if (filters.search) {
      query = query.or(
        `transaction_number.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
      );
    }

    if (filters.dateRange?.from) {
      query = query.gte(
        "transaction_date",
        filters.dateRange.from.toISOString()
      );
    }
    if (filters.dateRange?.to) {
      const endDate = new Date(filters.dateRange.to);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte("transaction_date", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      toast.error("İşlemler yüklenirken hata oluştu");
      throw error;
    }

    return (data || []).map((item: any) => ({
      ...item,
      warehouse_name: item.warehouse?.name,
      from_warehouse_name: item.from_warehouse?.name,
      to_warehouse_name: item.to_warehouse?.name,
    })) as InventoryTransaction[];
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

  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ["inventory_transactions", filters],
    queryFn: fetchTransactions,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: stats } = useQuery({
    queryKey: ["inventory_transaction_stats"],
    queryFn: getStats,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    transactions,
    isLoading,
    stats,
    filters,
    setFilters,
    refetch,
  };
};
