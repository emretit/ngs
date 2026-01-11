import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReserveStockParams {
  orderId: string;
}

export interface ShortageItem {
  product_id: string;
  product_name: string;
  required_quantity: number;
  available_stock: number;
  shortage: number;
  unit: string;
}

export interface StockReservationResult {
  success: boolean;
  reservedItems: number;
  skippedItems: number;
  errors: string[];
  shortageItems?: ShortageItem[];
}

export const useStockReservation = () => {
  const queryClient = useQueryClient();

  /**
   * Reserve stock for an order
   * - Checks each order item
   * - If product_id exists, reserves the quantity
   * - Updates order_items.stock_status
   */
  const reserveStock = async ({ orderId }: ReserveStockParams): Promise<StockReservationResult> => {
    logger.debug("📦 [useStockReservation] Reserving stock for order:", orderId);
    
    const result: StockReservationResult = {
      success: true,
      reservedItems: 0,
      skippedItems: 0,
      errors: [],
      shortageItems: [],
    };

    try {
      // 1. Get order items
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("id, product_id, quantity, name")
        .eq("order_id", orderId);

      if (itemsError) {
        throw new Error(`Sipariş kalemleri alınamadı: ${itemsError.message}`);
      }

      if (!orderItems || orderItems.length === 0) {
        logger.debug("⚠️ [useStockReservation] No items found for order");
        return result;
      }

      logger.debug(`📋 [useStockReservation] Found ${orderItems.length} order items`);

      // 2. Process each item
      for (const item of orderItems) {
        // Skip items without product_id
        if (!item.product_id) {
          logger.debug(`⏭️ [useStockReservation] Skipping item ${item.name} (no product_id)`);
          result.skippedItems++;
          
          // Update item status to 'pending' (not linked to product)
          await supabase
            .from("order_items")
            .update({ stock_status: 'pending' })
            .eq("id", item.id);
          
          continue;
        }

        try {
          // 3. Check available stock using the database function
          const { data: hasStock, error: checkError } = await supabase
            .rpc("check_available_stock", {
              p_product_id: item.product_id,
              p_quantity: item.quantity
            });

          if (checkError) {
            throw new Error(`Stok kontrolü başarısız: ${checkError.message}`);
          }

          if (!hasStock) {
            // Get available stock for shortage calculation
            const { data: availableStockData } = await supabase
              .rpc("get_available_stock", {
                p_product_id: item.product_id
              });

            const availableStock = availableStockData || 0;
            
            // Add to shortage items
            result.shortageItems!.push({
              product_id: item.product_id,
              product_name: item.name,
              required_quantity: item.quantity,
              available_stock: availableStock,
              shortage: item.quantity - availableStock,
              unit: item.unit || 'adet'
            });
            
            // Insufficient stock
            result.errors.push(`${item.name}: Yetersiz stok (${item.quantity} adet gerekli, ${availableStock} adet mevcut)`);
            
            // Update item status to 'out_of_stock'
            await supabase
              .from("order_items")
              .update({ stock_status: 'out_of_stock' })
              .eq("id", item.id);
            
            result.success = false;
            logger.warn(`⚠️ [useStockReservation] Insufficient stock for ${item.name}`);
            continue;
          }

          // 4. Reserve stock - increase reserved_quantity
          const { error: reserveError } = await supabase
            .rpc("reserve_product_stock", {
              p_product_id: item.product_id,
              p_quantity: item.quantity
            });

          if (reserveError) {
            // Fallback: manual update if RPC doesn't exist
            const { data: product, error: fetchError } = await supabase
              .from("products")
              .select("reserved_quantity")
              .eq("id", item.product_id)
              .single();

            if (fetchError) {
              throw new Error(`Ürün bilgisi alınamadı: ${fetchError.message}`);
            }

            const newReservedQuantity = (product.reserved_quantity || 0) + item.quantity;

            const { error: updateError } = await supabase
              .from("products")
              .update({ reserved_quantity: newReservedQuantity })
              .eq("id", item.product_id);

            if (updateError) {
              throw new Error(`Stok rezerve edilemedi: ${updateError.message}`);
            }
          }

          // 5. Update item status to 'in_stock'
          await supabase
            .from("order_items")
            .update({ stock_status: 'in_stock' })
            .eq("id", item.id);

          result.reservedItems++;
          logger.debug(`✅ [useStockReservation] Reserved ${item.quantity} units of ${item.name}`);

        } catch (itemError) {
          const errorMsg = itemError instanceof Error ? itemError.message : "Bilinmeyen hata";
          result.errors.push(`${item.name}: ${errorMsg}`);
          result.success = false;
          logger.error(`❌ [useStockReservation] Error processing item ${item.name}:`, itemError);
        }
      }

      logger.debug(`✅ [useStockReservation] Reservation complete:`, result);
      return result;

    } catch (error) {
      logger.error("❌ [useStockReservation] Error reserving stock:", error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : "Bilinmeyen hata");
      return result;
    }
  };

  /**
   * Release stock reservation for an order
   * - Decreases reserved_quantity for each product
   * - Updates order_items.stock_status
   */
  const releaseReservation = async ({ orderId }: ReserveStockParams): Promise<StockReservationResult> => {
    logger.debug("🔓 [useStockReservation] Releasing stock reservation for order:", orderId);
    
    const result: StockReservationResult = {
      success: true,
      reservedItems: 0,
      skippedItems: 0,
      errors: [],
    };

    try {
      // 1. Get order items
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("id, product_id, quantity, name, stock_status")
        .eq("order_id", orderId);

      if (itemsError) {
        throw new Error(`Sipariş kalemleri alınamadı: ${itemsError.message}`);
      }

      if (!orderItems || orderItems.length === 0) {
        logger.debug("⚠️ [useStockReservation] No items found for order");
        return result;
      }

      logger.debug(`📋 [useStockReservation] Found ${orderItems.length} order items to release`);

      // 2. Process each item
      for (const item of orderItems) {
        // Skip items without product_id or not reserved
        if (!item.product_id || item.stock_status !== 'in_stock') {
          logger.debug(`⏭️ [useStockReservation] Skipping item ${item.name} (no reservation)`);
          result.skippedItems++;
          continue;
        }

        try {
          // 3. Release stock - decrease reserved_quantity
          const { error: releaseError } = await supabase
            .rpc("release_product_stock", {
              p_product_id: item.product_id,
              p_quantity: item.quantity
            });

          if (releaseError) {
            // Fallback: manual update if RPC doesn't exist
            const { data: product, error: fetchError } = await supabase
              .from("products")
              .select("reserved_quantity")
              .eq("id", item.product_id)
              .single();

            if (fetchError) {
              throw new Error(`Ürün bilgisi alınamadı: ${fetchError.message}`);
            }

            const newReservedQuantity = Math.max(0, (product.reserved_quantity || 0) - item.quantity);

            const { error: updateError } = await supabase
              .from("products")
              .update({ reserved_quantity: newReservedQuantity })
              .eq("id", item.product_id);

            if (updateError) {
              throw new Error(`Rezervasyon serbest bırakılamadı: ${updateError.message}`);
            }
          }

          // 4. Update item status to 'pending'
          await supabase
            .from("order_items")
            .update({ stock_status: 'pending' })
            .eq("id", item.id);

          result.reservedItems++;
          logger.debug(`✅ [useStockReservation] Released ${item.quantity} units of ${item.name}`);

        } catch (itemError) {
          const errorMsg = itemError instanceof Error ? itemError.message : "Bilinmeyen hata";
          result.errors.push(`${item.name}: ${errorMsg}`);
          result.success = false;
          logger.error(`❌ [useStockReservation] Error releasing item ${item.name}:`, itemError);
        }
      }

      logger.debug(`✅ [useStockReservation] Release complete:`, result);
      return result;

    } catch (error) {
      logger.error("❌ [useStockReservation] Error releasing reservation:", error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : "Bilinmeyen hata");
      return result;
    }
  };

  // Mutation for reserving stock
  const reserveStockMutation = useMutation({
    mutationFn: reserveStock,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Stok rezerve edildi (${result.reservedItems} ürün)`);
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
      } else {
        toast.error(`Stok rezervasyonu başarısız: ${result.errors.join(", ")}`);
      }
    },
    onError: (error) => {
      logger.error("❌ [useStockReservation] Mutation error:", error);
      toast.error("Stok rezerve edilirken hata oluştu");
    },
  });

  // Mutation for releasing reservation
  const releaseReservationMutation = useMutation({
    mutationFn: releaseReservation,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Stok rezervasyonu serbest bırakıldı (${result.reservedItems} ürün)`);
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
      } else {
        toast.warning(`Rezervasyon kısmen serbest bırakıldı: ${result.errors.join(", ")}`);
      }
    },
    onError: (error) => {
      logger.error("❌ [useStockReservation] Mutation error:", error);
      toast.error("Rezervasyon serbest bırakılırken hata oluştu");
    },
  });

  return {
    reserveStock,
    releaseReservation,
    reserveStockMutation,
    releaseReservationMutation,
    isReserving: reserveStockMutation.isPending,
    isReleasing: releaseReservationMutation.isPending,
  };
};
