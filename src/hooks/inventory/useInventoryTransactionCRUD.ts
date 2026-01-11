import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  InventoryTransaction,
  TransactionType,
  CreateInventoryTransactionData,
  UpdateInventoryTransactionData,
} from "@/types/inventory";

export const useInventoryTransactionCRUD = () => {
  const queryClient = useQueryClient();

  const fetchTransactionById = async (id: string): Promise<InventoryTransaction | null> => {
    const { data, error } = await supabase
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
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast.error("İşlem yüklenirken hata oluştu");
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      ...data,
      warehouse_name: data.warehouse?.name,
      from_warehouse_name: data.from_warehouse?.name,
      to_warehouse_name: data.to_warehouse?.name,
    } as InventoryTransaction;
  };

  const generateTransactionNumber = async (companyId: string, transactionType: TransactionType): Promise<string> => {
    const year = new Date().getFullYear();
    const prefixMap: Record<TransactionType, string> = {
      'giris': 'STG',
      'cikis': 'STC',
      'transfer': 'STT',
      'sayim': 'STS'
    };
    const prefix = `${prefixMap[transactionType]}-${year}-`;

    const { data: existingTransactions } = await supabase
      .from('inventory_transactions')
      .select('transaction_number')
      .like('transaction_number', `${prefix}%`)
      .order('transaction_number', { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (existingTransactions && existingTransactions.length > 0) {
      const lastNumber = existingTransactions[0].transaction_number;
      const lastNumStr = lastNumber.replace(prefix, '');
      const lastNum = parseInt(lastNumStr, 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }

    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  };

  const createTransaction = async (transactionData: CreateInventoryTransactionData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("Şirket bilgisi bulunamadı");
    }

    const transactionNumber = await generateTransactionNumber(profile.company_id, transactionData.transaction_type);

    const { data: transaction, error: transactionError } = await supabase
      .from("inventory_transactions")
      .insert({
        company_id: profile.company_id,
        transaction_number: transactionNumber,
        transaction_type: transactionData.transaction_type,
        status: 'pending',
        warehouse_id: transactionData.warehouse_id || null,
        from_warehouse_id: transactionData.from_warehouse_id || null,
        to_warehouse_id: transactionData.to_warehouse_id || null,
        transaction_date: transactionData.transaction_date,
        reference_number: transactionData.reference_number || null,
        notes: transactionData.notes || null,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (transactionError) {
      toast.error("İşlem oluşturulurken hata oluştu");
      throw transactionError;
    }

    if (transactionData.items && transactionData.items.length > 0) {
      const itemsToInsert = transactionData.items.map(item => ({
        transaction_id: transaction.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost: item.unit_cost || null,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from("inventory_transaction_items")
        .insert(itemsToInsert);

      if (itemsError) {
        await supabase.from("inventory_transactions").delete().eq("id", transaction.id);
        toast.error("Ürünler eklenirken hata oluştu");
        throw itemsError;
      }
    }

    toast.success("İşlem oluşturuldu");
    return await fetchTransactionById(transaction.id) || {} as InventoryTransaction;
  };

  const updateTransaction = async (id: string, transactionData: UpdateInventoryTransactionData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("Şirket bilgisi bulunamadı");
    }

    const existingTransaction = await fetchTransactionById(id);
    if (!existingTransaction) {
      throw new Error("İşlem bulunamadı");
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (transactionData.status !== undefined) {
      updateData.status = transactionData.status;
    }
    if (transactionData.warehouse_id !== undefined) {
      updateData.warehouse_id = transactionData.warehouse_id || null;
    }
    if (transactionData.from_warehouse_id !== undefined) {
      updateData.from_warehouse_id = transactionData.from_warehouse_id || null;
    }
    if (transactionData.to_warehouse_id !== undefined) {
      updateData.to_warehouse_id = transactionData.to_warehouse_id || null;
    }
    if (transactionData.transaction_date !== undefined) {
      updateData.transaction_date = transactionData.transaction_date;
    }
    if (transactionData.reference_number !== undefined) {
      updateData.reference_number = transactionData.reference_number || null;
    }
    if (transactionData.notes !== undefined) {
      updateData.notes = transactionData.notes || null;
    }

    const { error: updateError } = await supabase
      .from("inventory_transactions")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      toast.error("İşlem güncellenirken hata oluştu");
      throw updateError;
    }

    if (transactionData.items !== undefined) {
      await supabase
        .from("inventory_transaction_items")
        .delete()
        .eq("transaction_id", id);

      if (transactionData.items.length > 0) {
        const itemsToInsert = transactionData.items.map(item => ({
          transaction_id: id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          unit_cost: item.unit_cost || null,
          notes: item.notes || null,
        }));

        const { error: itemsError } = await supabase
          .from("inventory_transaction_items")
          .insert(itemsToInsert);

        if (itemsError) {
          toast.error("Ürünler güncellenirken hata oluştu");
          throw itemsError;
        }
      }
    }

    toast.success("İşlem güncellendi");
    return await fetchTransactionById(id) || {} as InventoryTransaction;
  };

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_transaction_stats"] });
      queryClient.invalidateQueries({ queryKey: ["product-stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      queryClient.invalidateQueries({ queryKey: ["product_warehouse_stock"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse_products"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryTransactionData }) =>
      updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_transaction_stats"] });
      queryClient.invalidateQueries({ queryKey: ["product-stock-movements"] });
    },
  });

  return {
    fetchTransactionById,
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
};
