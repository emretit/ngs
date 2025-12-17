
import { useState, useCallback, useEffect } from "react";
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

    // Tedarikçi bakiyesini güncelle (alış faturası = tedarikçiye borçlanma = bakiye azalır/negatif yönde artar)
    // Pozitif bakiye = alacak, Negatif bakiye = borç
    if (invoiceData.supplier_id && invoiceData.total_amount) {
      const { data: supplierData, error: supplierFetchError } = await supabase
        .from('suppliers')
        .select('balance')
        .eq('id', invoiceData.supplier_id)
        .single();
      
      if (supplierFetchError) {
        console.error('❌ Error fetching supplier balance:', supplierFetchError);
        // Hata olsa bile devam et, sadece logla
      } else if (supplierData) {
        const newSupplierBalance = (supplierData.balance || 0) - invoiceData.total_amount;
        const { error: supplierUpdateError } = await supabase
          .from('suppliers')
          .update({ balance: newSupplierBalance })
          .eq('id', invoiceData.supplier_id);
        
        if (supplierUpdateError) {
          console.error('❌ Error updating supplier balance:', supplierUpdateError);
          // Hata olsa bile devam et, sadece logla
        } else {
          console.log('✅ Supplier balance updated:', newSupplierBalance);
        }
      }
    }

    // Tedarikçi cache'ini invalidate et (bakiye güncellendiği için)
    if (invoiceData.supplier_id) {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', invoiceData.supplier_id] });
      queryClient.invalidateQueries({ queryKey: ['supplier_statistics'] });
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
    // Önce fatura bilgilerini al
    const { data: invoice, error: fetchError } = await supabase
      .from("purchase_invoices")
      .select("id, invoice_number, einvoice_id")
      .eq("id", id)
      .single();

    if (fetchError) {
      toast.error("Fatura bilgisi alınamadı");
      throw fetchError;
    }

    if (!invoice) {
      throw new Error("Fatura bulunamadı");
    }

    // Company ID'yi al
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

    // 1. Bu faturaya ait stok hareketlerini bul ve stokları geri al
    // NOT: Aynı fatura numarasıyla birden fazla stok hareketi olabilir (fatura silinip tekrar eklenmiş)
    // Bu yüzden TÜM stok hareketlerini bulup silmeliyiz
    console.log(`🔍 Fatura siliniyor. Invoice Number: "${invoice.invoice_number}", Invoice ID: ${id}`);
    
    const { data: stockTransactions, error: stockTransactionsError } = await supabase
      .from("inventory_transactions")
      .select(`
        id,
        transaction_number,
        reference_number,
        warehouse_id,
        items:inventory_transaction_items (
          product_id,
          quantity
        )
      `)
      .eq("reference_number", invoice.invoice_number)
      .eq("company_id", profile.company_id)
      .eq("transaction_type", "giris");

    if (stockTransactionsError) {
      console.error("❌ Stok hareketleri bulunurken hata:", stockTransactionsError);
      // Hata olsa bile devam et, sadece logla
    }

    console.log(`📊 Bulunan stok hareketleri:`, stockTransactions?.length || 0);
    if (stockTransactions && stockTransactions.length > 0) {
      console.log(`🗑️ ${stockTransactions.length} adet stok hareketi bulundu, siliniyor...`);
      console.log(`📋 Transaction ID'leri:`, stockTransactions.map((t: any) => ({ id: t.id, transaction_number: t.transaction_number, reference_number: t.reference_number })));
      
      // Her transaction için stokları geri al
      for (const transaction of stockTransactions) {
        if (transaction.items && Array.isArray(transaction.items)) {
          for (const item of transaction.items) {
            if (item.product_id && transaction.warehouse_id) {
              // Mevcut stok kaydını kontrol et
              const { data: existingStock } = await supabase
                .from("warehouse_stock")
                .select("id, quantity")
                .eq("product_id", item.product_id)
                .eq("warehouse_id", transaction.warehouse_id)
                .eq("company_id", profile.company_id)
                .maybeSingle();

              if (existingStock) {
                const newQuantity = (existingStock.quantity || 0) - Number(item.quantity || 0);
                // Negatif stok kontrolü
                if (newQuantity < 0) {
                  console.warn(`⚠️ Stok negatif olacak, 0'a ayarlanıyor. Ürün: ${item.product_id}`);
                  await supabase
                    .from("warehouse_stock")
                    .update({
                      quantity: 0,
                      last_transaction_date: new Date().toISOString(),
                    })
                    .eq("id", existingStock.id);
                } else {
                  await supabase
                    .from("warehouse_stock")
                    .update({
                      quantity: newQuantity,
                      last_transaction_date: new Date().toISOString(),
                    })
                    .eq("id", existingStock.id);
                }
              }
            }
          }
        }
      }

      // Stok hareketlerini sil (TÜMÜNÜ - aynı reference_number ile olan tüm hareketler)
      const transactionIds = stockTransactions.map((t: any) => t.id);
      if (transactionIds.length > 0) {
        console.log(`🗑️ ${transactionIds.length} adet transaction item siliniyor...`);
        
        // Önce transaction items'ları sil (CASCADE ile otomatik silinebilir ama manuel de silelim)
        const { error: itemsDeleteError, data: deletedItems } = await supabase
          .from("inventory_transaction_items")
          .delete()
          .in("transaction_id", transactionIds)
          .select("id");

        if (itemsDeleteError) {
          console.error("❌ Stok hareketi kalemleri silinirken hata:", itemsDeleteError);
          // Hata olsa bile devam et, belki CASCADE ile silinecek
        } else {
          console.log(`✅ ${deletedItems?.length || 0} adet transaction item silindi`);
        }

        // Sonra transaction'ları sil - .select() OLMADAN
        const { error: transactionsDeleteError, data: deletedTransactions } = await supabase
          .from("inventory_transactions")
          .delete()
          .in("id", transactionIds)
          .select("id");

        if (transactionsDeleteError) {
          console.error("❌ Stok hareketleri silinirken hata:", transactionsDeleteError);
          console.error("❌ Hata detayları:", JSON.stringify(transactionsDeleteError, null, 2));
          throw new Error(`Stok hareketleri silinirken hata oluştu: ${transactionsDeleteError.message}`);
        }
        
        const deletedCount = deletedTransactions?.length || 0;
        console.log(`✅ ${deletedCount} adet transaction silindi (beklenen: ${transactionIds.length})`);

        // Silme işleminin başarılı olduğunu doğrula
        if (deletedCount < transactionIds.length) {
          console.warn(`⚠️ UYARI: Sadece ${deletedCount}/${transactionIds.length} transaction silindi!`);
          
          // Kalan transaction'ları bul
          const { data: verifyTransactions, error: verifyError } = await supabase
            .from("inventory_transactions")
            .select("id, transaction_number, reference_number, status")
            .in("id", transactionIds);

          if (verifyError) {
            console.error("❌ Doğrulama hatası:", verifyError);
          } else if (verifyTransactions && verifyTransactions.length > 0) {
            console.warn(`⚠️ ${verifyTransactions.length} adet transaction hala mevcut!`);
            console.warn(`⚠️ Kalan transaction'lar:`, verifyTransactions);
            
            // RLS veya başka bir sorun olabilir, tek tek silmeyi dene
            console.log(`🔄 Tek tek silme denemesi yapılıyor...`);
            for (const transactionId of transactionIds) {
              const { error: singleDeleteError, data: singleDeleted } = await supabase
                .from("inventory_transactions")
                .delete()
                .eq("id", transactionId)
                .select("id");
              
              if (singleDeleteError) {
                console.error(`❌ Transaction ${transactionId} silinemedi:`, singleDeleteError);
              } else if (singleDeleted && singleDeleted.length > 0) {
                console.log(`✅ Transaction ${transactionId} silindi`);
              }
            }
          } else {
            console.log(`✅ Doğrulama başarılı: Tüm transaction'lar silindi`);
          }
        } else {
          console.log(`✅ Doğrulama başarılı: Tüm transaction'lar silindi`);
        }
      }
    } else {
      console.log(`ℹ️ Bu faturaya ait stok hareketi bulunamadı (reference_number: "${invoice.invoice_number}")`);
      
      // Alternatif olarak, tüm reference_number'ları kontrol et
      const { data: allTransactions } = await supabase
        .from("inventory_transactions")
        .select("id, transaction_number, reference_number")
        .eq("company_id", profile.company_id)
        .eq("transaction_type", "giris")
        .limit(10);
      
      console.log(`🔍 Son 10 stok hareketi (örnek):`, allTransactions?.map((t: any) => ({ 
        transaction_number: t.transaction_number, 
        reference_number: t.reference_number 
      })));
    }

    // 2. E-fatura eşleştirme kayıtlarını sil
    if (invoice.einvoice_id) {
      // Önce invoice items'ları bul
      const { data: invoiceItems } = await supabase
        .from("purchase_invoice_items")
        .select("id")
        .eq("purchase_invoice_id", id);

      if (invoiceItems && invoiceItems.length > 0) {
        // E-fatura eşleştirme kayıtlarını sil
        await supabase
          .from("e_fatura_stok_eslestirme")
          .delete()
          .eq("invoice_id", invoice.einvoice_id);
      }
    }

    // 3. Purchase invoice items CASCADE ile otomatik silinecek, ama manuel de silebiliriz
    await supabase
      .from("purchase_invoice_items")
      .delete()
      .eq("purchase_invoice_id", id);

    // 4. Son olarak faturayı sil
    const { error } = await supabase
      .from("purchase_invoices")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Fatura silinirken hata oluştu");
      throw error;
    }

    toast.success("Fatura ve tüm ilişkili kayıtlar başarıyla silindi");
    return { id };
  };

  const { data: invoices, isLoading, error, refetch } = useQuery({
    queryKey: ['purchaseInvoices', filters],
    queryFn: fetchInvoices,
    staleTime: 5 * 60 * 1000, // 5 dakika boyunca fresh kabul et
    gcTime: 10 * 60 * 1000, // 10 dakika cache'de tut
    refetchOnWindowFocus: false, // Pencere odaklandığında refetch etme
    refetchOnMount: true, // Mount olduğunda yeniden yükleme
  });

  // Real-time subscription - purchase_invoices tablosundaki değişiklikleri dinle
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      // Subscribe to purchase_invoices table changes
      const channel = supabase
        .channel('purchase_invoices_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'purchase_invoices',
            filter: `company_id=eq.${profile.company_id}`
          },
          (payload) => {
            console.log('🔄 Purchase invoice changed:', payload.eventType, payload.new || payload.old);
            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
            queryClient.invalidateQueries({ queryKey: ['purchase-invoices-infinite'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();

    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [queryClient]);

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
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
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

    // Apply sorting - veritabanı seviyesinde sıralama
    const sortField = filters?.sortField || 'invoice_date';
    const sortDirection = filters?.sortDirection || 'desc';
    const ascending = sortDirection === 'asc';

    const { data, error, count } = await query
      .order(sortField, { ascending })
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
