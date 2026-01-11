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
        // Eğer bu ürün için hiç transaction yoksa boş array döndür
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

    // Product ID filtresi varsa transaction ID'lere göre filtrele
    if (transactionIds && transactionIds.length > 0) {
      query = query.in("id", transactionIds);
    } else if (transactionIds && transactionIds.length === 0) {
      // Hiç transaction yoksa boş array döndür
      return [];
    }

    query = query.order("created_at", { ascending: false });

    // Transaction type filtresi
    if (filters.transaction_type && filters.transaction_type !== "all") {
      query = query.eq("transaction_type", filters.transaction_type);
    }

    // Status filtresi
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    // Warehouse filtresi
    if (filters.warehouse_id && filters.warehouse_id !== "all") {
      query = query.or(`warehouse_id.eq.${filters.warehouse_id},from_warehouse_id.eq.${filters.warehouse_id},to_warehouse_id.eq.${filters.warehouse_id}`);
    }

    // Arama filtresi
    if (filters.search) {
      query = query.or(
        `transaction_number.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
      );
    }

    // Tarih aralığı filtresi
    if (filters.dateRange?.from) {
      query = query.gte(
        "transaction_date",
        filters.dateRange.from.toISOString()
      );
    }
    if (filters.dateRange?.to) {
      // Bitiş tarihine bir gün ekleyerek o günün tamamını dahil et
      const endDate = new Date(filters.dateRange.to);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte(
        "transaction_date",
        endDate.toISOString()
      );
    }

    const { data, error } = await query;

    if (error) {
      toast.error("İşlemler yüklenirken hata oluştu");
      throw error;
    }

    // Veriyi formatla
    const formattedData: InventoryTransaction[] = (data || []).map((transaction: any) => ({
      ...transaction,
      warehouse_name: transaction.warehouse?.name,
      from_warehouse_name: transaction.from_warehouse?.name,
      to_warehouse_name: transaction.to_warehouse?.name,
    }));

    return formattedData;
  };

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

    // Mevcut numaraları kontrol et
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("Şirket bilgisi bulunamadı");
    }

    // Transaction number oluştur
    const transactionNumber = await generateTransactionNumber(profile.company_id, transactionData.transaction_type);

    // Transaction oluştur
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

    // Items ekle
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
        // Transaction'ı sil
        await supabase.from("inventory_transactions").delete().eq("id", transaction.id);
        toast.error("Ürünler eklenirken hata oluştu");
        throw itemsError;
      }
    }

    toast.success("İşlem oluşturuldu");
    return await fetchTransactionById(transaction.id) || {} as InventoryTransaction;
  };

  const updateTransaction = async (
    id: string,
    transactionData: UpdateInventoryTransactionData
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("Şirket bilgisi bulunamadı");
    }

    // Mevcut transaction'ı kontrol et
    const existingTransaction = await fetchTransactionById(id);
    if (!existingTransaction) {
      throw new Error("İşlem bulunamadı");
    }

    // Transaction güncelle
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

    // Items güncelle
    if (transactionData.items !== undefined) {
      // Mevcut items'ı sil
      await supabase
        .from("inventory_transaction_items")
        .delete()
        .eq("transaction_id", id);

      // Yeni items'ı ekle
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

  const updateWarehouseStock = async (
    companyId: string,
    productId: string,
    warehouseId: string,
    quantityChange: number
  ) => {
    // Mevcut stok kaydını kontrol et
    const { data: existingStock } = await supabase
      .from("warehouse_stock")
      .select("id, quantity")
      .eq("product_id", productId)
      .eq("warehouse_id", warehouseId)
      .maybeSingle();

    if (existingStock) {
      // Mevcut stoku güncelle
      const newQuantity = existingStock.quantity + quantityChange;
      if (newQuantity < 0) {
        throw new Error("Stok miktarı negatif olamaz");
      }

      const { error } = await supabase
        .from("warehouse_stock")
        .update({
          quantity: newQuantity,
          last_transaction_date: new Date().toISOString(),
        })
        .eq("id", existingStock.id);

      if (error) throw error;
    } else {
      // Yeni stok kaydı oluştur (sadece pozitif miktar için)
      if (quantityChange > 0) {
        const { error } = await supabase
          .from("warehouse_stock")
          .insert({
            company_id: companyId,
            product_id: productId,
            warehouse_id: warehouseId,
            quantity: quantityChange,
            reserved_quantity: 0,
            last_transaction_date: new Date().toISOString(),
          });

        if (error) throw error;
      } else {
        throw new Error("Stok miktarı yetersiz");
      }
    }
  };

  const approveTransaction = async (id: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("Şirket bilgisi bulunamadı");
    }

    // Transaction'ı getir
    const transaction = await fetchTransactionById(id);
    if (!transaction) {
      throw new Error("İşlem bulunamadı");
    }

    if (transaction.status === 'completed') {
      throw new Error("İşlem zaten tamamlanmış");
    }

    if (transaction.status === 'cancelled') {
      throw new Error("İptal edilmiş işlem onaylanamaz");
    }

    // Stok güncellemelerini yap
    if (transaction.items && transaction.items.length > 0) {
      for (const item of transaction.items) {
        const quantity = Number(item.quantity);
        
        switch (transaction.transaction_type) {
          case 'giris':
            // Stok girişi - stok artır
            if (transaction.warehouse_id) {
              await updateWarehouseStock(
                profile.company_id,
                item.product_id,
                transaction.warehouse_id,
                quantity
              );
            }
            break;
          
          case 'cikis':
            // Stok çıkışı - stok azalt
            if (transaction.warehouse_id) {
              await updateWarehouseStock(
                profile.company_id,
                item.product_id,
                transaction.warehouse_id,
                -quantity
              );
            }
            break;
          
          case 'transfer':
            // Transfer - kaynak depodan çıkar, hedef depoya ekle
            if (transaction.from_warehouse_id && transaction.to_warehouse_id) {
              // Kaynak depodan çıkar
              await updateWarehouseStock(
                profile.company_id,
                item.product_id,
                transaction.from_warehouse_id,
                -quantity
              );
              // Hedef depoya ekle
              await updateWarehouseStock(
                profile.company_id,
                item.product_id,
                transaction.to_warehouse_id,
                quantity
              );
            }
            break;
          
          case 'sayim':
            // Sayım - stok miktarını direkt fiziksel sayım miktarına güncelle
            // ERP best practice: Fiziksel sayım sonucu direkt stok miktarı olur
            if (transaction.warehouse_id) {
              // Mevcut sistem stokunu kontrol et (fark analizi için)
              const { data: existingStock } = await supabase
                .from("warehouse_stock")
                .select("id, quantity")
                .eq("product_id", item.product_id)
                .eq("warehouse_id", transaction.warehouse_id)
                .maybeSingle();

              const systemQuantity = existingStock ? Number(existingStock.quantity) : 0;
              const physicalQuantity = quantity; // Fiziksel sayım miktarı
              const difference = physicalQuantity - systemQuantity;

              // Stok kaydını güncelle veya oluştur
              if (existingStock) {
                // Mevcut stoku fiziksel sayım miktarına güncelle
                const { error } = await supabase
                  .from("warehouse_stock")
                  .update({
                    quantity: physicalQuantity, // Direkt fiziksel sayım miktarı
                    last_transaction_date: new Date().toISOString(),
                  })
                  .eq("id", existingStock.id);
                if (error) throw error;
              } else {
                // Yeni stok kaydı oluştur (fiziksel sayımda bulunan ama sistemde olmayan ürün)
                const { error } = await supabase
                  .from("warehouse_stock")
                  .insert({
                    company_id: profile.company_id,
                    product_id: item.product_id,
                    warehouse_id: transaction.warehouse_id,
                    quantity: physicalQuantity, // Direkt fiziksel sayım miktarı
                    reserved_quantity: 0,
                    last_transaction_date: new Date().toISOString(),
                  });
                if (error) throw error;
              }

              // Fark analizi için log (opsiyonel - gelecekte fark raporu için kullanılabilir)
              if (difference !== 0) {
                console.log(`Sayım farkı: ${item.product_name} - Sistem: ${systemQuantity}, Fiziksel: ${physicalQuantity}, Fark: ${difference > 0 ? '+' : ''}${difference}`);
              }
            }
            break;
        }
      }
    }

    // Transaction'ı onayla ve tamamla
    const { error: updateError } = await supabase
      .from("inventory_transactions")
      .update({
        status: 'completed',
        approved_by: user?.id || null,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      toast.error("İşlem onaylanırken hata oluştu");
      throw updateError;
    }

    toast.success("İşlem onaylandı ve stok güncellendi");
  };

  const cancelTransaction = async (id: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("Şirket bilgisi bulunamadı");
    }

    // Transaction'ı kontrol et
    const transaction = await fetchTransactionById(id);
    if (!transaction) {
      throw new Error("İşlem bulunamadı");
    }

    if (transaction.status === 'completed') {
      throw new Error("Tamamlanmış işlem iptal edilemez. Önce stok geri alınmalıdır.");
    }

    // Transaction'ı iptal et
    const { error: updateError } = await supabase
      .from("inventory_transactions")
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      toast.error("İşlem iptal edilirken hata oluştu");
      throw updateError;
    }

    toast.success("İşlem iptal edildi");
  };

  const deleteTransaction = async (id: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("Şirket bilgisi bulunamadı");
    }

    // Transaction'ı getir
    const transaction = await fetchTransactionById(id);
    if (!transaction) {
      throw new Error("İşlem bulunamadı");
    }

    // Eğer transaction onaylanmış (completed) ise, stokları geri al
    if (transaction.status === 'completed' && transaction.items && transaction.items.length > 0) {
      for (const item of transaction.items) {
        const quantity = Number(item.quantity);
        
        switch (transaction.transaction_type) {
          case 'giris':
            // Stok girişi geri al - stok azalt
            if (transaction.warehouse_id) {
              await updateWarehouseStock(
                profile.company_id,
                item.product_id,
                transaction.warehouse_id,
                -quantity // approveTransaction'ın tersi
              );
            }
            break;
          
          case 'cikis':
            // Stok çıkışı geri al - stok artır
            if (transaction.warehouse_id) {
              await updateWarehouseStock(
                profile.company_id,
                item.product_id,
                transaction.warehouse_id,
                quantity // approveTransaction'ın tersi
              );
            }
            break;
          
          case 'transfer':
            // Transfer geri al - hedef depodan çıkar, kaynak depoya ekle
            if (transaction.from_warehouse_id && transaction.to_warehouse_id) {
              // Hedef depodan çıkar (geri al)
              await updateWarehouseStock(
                profile.company_id,
                item.product_id,
                transaction.to_warehouse_id,
                -quantity
              );
              // Kaynak depoya geri ekle
              await updateWarehouseStock(
                profile.company_id,
                item.product_id,
                transaction.from_warehouse_id,
                quantity
              );
            }
            break;
          
          case 'sayim':
            // Sayım işlemi geri alınamaz - kullanıcıya uyarı ver
            throw new Error("Sayım işlemleri silinemez. Lütfen yeni bir sayım işlemi oluşturun.");
        }
      }
    }

    // Önce transaction items'ları sil
    const { error: itemsDeleteError } = await supabase
      .from("inventory_transaction_items")
      .delete()
      .eq("transaction_id", id);

    if (itemsDeleteError) {
      console.error("❌ Transaction items silinirken hata:", itemsDeleteError);
      throw new Error("İşlem kalemleri silinirken hata oluştu");
    }

    // Sonra transaction'ı sil
    const { error: deleteError } = await supabase
      .from("inventory_transactions")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("❌ Transaction silinirken hata:", deleteError);
      toast.error("İşlem silinirken hata oluştu");
      throw deleteError;
    }

    toast.success("İşlem başarıyla silindi");
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
  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ["inventory_transactions", filters],
    queryFn: fetchTransactions,
    staleTime: 30000, // 30 saniye cache
    gcTime: 5 * 60 * 1000, // 5 dakika garbage collection
  });

  const { data: stats } = useQuery({
    queryKey: ["inventory_transaction_stats"],
    queryFn: getStats,
    staleTime: 60000, // 1 dakika cache
    gcTime: 5 * 60 * 1000, // 5 dakika garbage collection
  });

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

  const approveMutation = useMutation({
    mutationFn: approveTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_transaction_stats"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      queryClient.invalidateQueries({ queryKey: ["product_warehouse_stock"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-stock-movements"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_transaction_stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_transaction_stats"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      queryClient.invalidateQueries({ queryKey: ["product_warehouse_stock"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-stock-movements"] });
    },
  });

  return {
    transactions,
    isLoading,
    stats,
    filters,
    setFilters,
    refetch,
    fetchTransactionById,
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    approveTransaction: approveMutation.mutateAsync,
    cancelTransaction: cancelMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
};

