import { logger } from '@/utils/logger';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InventoryTransaction } from "@/types/inventory";

export const useInventoryTransactionOperations = (
  fetchTransactionById: (id: string) => Promise<InventoryTransaction | null>
) => {
  const queryClient = useQueryClient();

  const updateWarehouseStock = async (
    companyId: string,
    productId: string,
    warehouseId: string,
    quantityChange: number
  ) => {
    const { data: existingStock } = await supabase
      .from("warehouse_stock")
      .select("id, quantity")
      .eq("product_id", productId)
      .eq("warehouse_id", warehouseId)
      .maybeSingle();

    if (existingStock) {
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
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("Şirket bilgisi bulunamadı");
    }

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

    if (transaction.items && transaction.items.length > 0) {
      for (const item of transaction.items) {
        const quantity = Number(item.quantity);
        
        switch (transaction.transaction_type) {
          case 'giris':
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
            if (transaction.from_warehouse_id && transaction.to_warehouse_id) {
              await updateWarehouseStock(
                profile.company_id,
                item.product_id,
                transaction.from_warehouse_id,
                -quantity
              );
              await updateWarehouseStock(
                profile.company_id,
                item.product_id,
                transaction.to_warehouse_id,
                quantity
              );
            }
            break;
          
          case 'sayim':
            if (transaction.warehouse_id) {
              const { data: existingStock } = await supabase
                .from("warehouse_stock")
                .select("id, quantity")
                .eq("product_id", item.product_id)
                .eq("warehouse_id", transaction.warehouse_id)
                .maybeSingle();

              const systemQuantity = existingStock ? Number(existingStock.quantity) : 0;
              const physicalQuantity = quantity;
              const difference = physicalQuantity - systemQuantity;

              if (existingStock) {
                const { error } = await supabase
                  .from("warehouse_stock")
                  .update({
                    quantity: physicalQuantity,
                    last_transaction_date: new Date().toISOString(),
                  })
                  .eq("id", existingStock.id);
                if (error) throw error;
              } else {
                const { error } = await supabase
                  .from("warehouse_stock")
                  .insert({
                    company_id: profile.company_id,
                    product_id: item.product_id,
                    warehouse_id: transaction.warehouse_id,
                    quantity: physicalQuantity,
                    reserved_quantity: 0,
                    last_transaction_date: new Date().toISOString(),
                  });
                if (error) throw error;
              }

              if (difference !== 0) {
                logger.debug(`Sayım farkı: ${item.product_name} - Sistem: ${systemQuantity}, Fiziksel: ${physicalQuantity}, Fark: ${difference > 0 ? '+' : ''}${difference}`);
              }
            }
            break;
        }
      }
    }

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
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("Şirket bilgisi bulunamadı");
    }

    const transaction = await fetchTransactionById(id);
    if (!transaction) {
      throw new Error("İşlem bulunamadı");
    }

    if (transaction.status === 'completed') {
      throw new Error("Tamamlanmış işlem iptal edilemez. Önce stok geri alınmalıdır.");
    }

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
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("Şirket bilgisi bulunamadı");
    }

    const transaction = await fetchTransactionById(id);
    if (!transaction) {
      throw new Error("İşlem bulunamadı");
    }

    if (transaction.status === 'completed' && transaction.items && transaction.items.length > 0) {
      for (const item of transaction.items) {
        const quantity = Number(item.quantity);
        
        switch (transaction.transaction_type) {
          case 'giris':
            if (transaction.warehouse_id) {
              await updateWarehouseStock(
                profile.company_id,
                item.product_id,
                transaction.warehouse_id,
                -quantity
              );
            }
            break;
          
          case 'cikis':
            if (transaction.warehouse_id) {
              await updateWarehouseStock(
                profile.company_id,
                item.product_id,
                transaction.warehouse_id,
                quantity
              );
            }
            break;
          
          case 'transfer':
            if (transaction.from_warehouse_id && transaction.to_warehouse_id) {
              await updateWarehouseStock(
                profile.company_id,
                item.product_id,
                transaction.to_warehouse_id,
                -quantity
              );
              await updateWarehouseStock(
                profile.company_id,
                item.product_id,
                transaction.from_warehouse_id,
                quantity
              );
            }
            break;
          
          case 'sayim':
            throw new Error("Sayım işlemleri silinemez. Lütfen yeni bir sayım işlemi oluşturun.");
        }
      }
    }

    const { error: itemsDeleteError } = await supabase
      .from("inventory_transaction_items")
      .delete()
      .eq("transaction_id", id);

    if (itemsDeleteError) {
      logger.error("❌ Transaction items silinirken hata:", itemsDeleteError);
      throw new Error("İşlem kalemleri silinirken hata oluştu");
    }

    const { error: deleteError } = await supabase
      .from("inventory_transactions")
      .delete()
      .eq("id", id);

    if (deleteError) {
      logger.error("❌ Transaction silinirken hata:", deleteError);
      toast.error("İşlem silinirken hata oluştu");
      throw deleteError;
    }

    toast.success("İşlem başarıyla silindi");
  };

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
    approveTransaction: approveMutation.mutateAsync,
    cancelTransaction: cancelMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
  };
};
