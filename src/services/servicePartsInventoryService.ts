import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export interface PartUsage {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface LowStockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minStockLevel: number;
  warehouseName?: string;
}

/**
 * Service for managing service parts and inventory integration
 */
export class ServicePartsInventoryService {
  /**
   * Deduct parts from inventory when used in a service
   */
  static async deductPartsFromInventory(
    serviceId: string,
    parts: PartUsage[],
    warehouseId?: string
  ): Promise<void> {
    if (!parts || parts.length === 0) return;

    // Get company_id from service
    const { data: service, error: serviceError } = await supabase
      .from('service_requests')
      .select('company_id')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      throw new Error('Servis bulunamadı');
    }

    // For each part, deduct from inventory
    for (const part of parts) {
      if (!part.productId || !part.quantity) continue;

      // Find warehouse_stock entry
      let stockQuery = supabase
        .from('warehouse_stock')
        .select('id, quantity, warehouse_id')
        .eq('product_id', part.productId)
        .eq('company_id', service.company_id)
        .gt('quantity', 0)
        .order('quantity', { ascending: false }); // Use warehouse with most stock first

      if (warehouseId) {
        stockQuery = stockQuery.eq('warehouse_id', warehouseId);
      }

      const { data: stockEntries, error: stockError } = await stockQuery;

      if (stockError) {
        console.error(`Error fetching stock for product ${part.productId}:`, stockError);
        continue;
      }

      if (!stockEntries || stockEntries.length === 0) {
        console.warn(`No stock found for product ${part.productId}`);
        continue;
      }

      // Deduct from first available warehouse
      let remainingQuantity = part.quantity;
      for (const stockEntry of stockEntries) {
        if (remainingQuantity <= 0) break;

        const availableQuantity = Number(stockEntry.quantity) || 0;
        const deductAmount = Math.min(remainingQuantity, availableQuantity);

        if (deductAmount > 0) {
          const { error: updateError } = await supabase
            .from('warehouse_stock')
            .update({
              quantity: availableQuantity - deductAmount,
              last_transaction_date: new Date().toISOString(),
            })
            .eq('id', stockEntry.id);

          if (updateError) {
            console.error(`Error deducting stock for ${stockEntry.id}:`, updateError);
          } else {
            // Create inventory transaction record
            await supabase
              .from('inventory_transactions')
              .insert({
                product_id: part.productId,
                warehouse_id: stockEntry.warehouse_id,
                transaction_type: 'out',
                quantity: deductAmount,
                reference_type: 'service_request',
                reference_id: serviceId,
                company_id: service.company_id,
                notes: `Servis #${serviceId} için kullanıldı`,
              });

            remainingQuantity -= deductAmount;
          }
        }
      }

      if (remainingQuantity > 0) {
        console.warn(`Insufficient stock for product ${part.productId}. Remaining: ${remainingQuantity}`);
      }
    }
  }

  /**
   * Check if parts are available in inventory
   */
  static async checkPartsAvailability(
    parts: PartUsage[],
    companyId: string
  ): Promise<{ available: boolean; missingParts: PartUsage[] }> {
    const missingParts: PartUsage[] = [];

    for (const part of parts) {
      if (!part.productId || !part.quantity) continue;

      const { data: stockEntries, error } = await supabase
        .from('warehouse_stock')
        .select('quantity')
        .eq('product_id', part.productId)
        .eq('company_id', companyId);

      if (error) {
        console.error(`Error checking stock for product ${part.productId}:`, error);
        missingParts.push(part);
        continue;
      }

      const totalStock = stockEntries?.reduce(
        (sum, entry) => sum + (Number(entry.quantity) || 0),
        0
      ) || 0;

      if (totalStock < part.quantity) {
        missingParts.push({
          ...part,
          quantity: part.quantity - totalStock,
        });
      }
    }

    return {
      available: missingParts.length === 0,
      missingParts,
    };
  }

  /**
   * Get low stock alerts for parts used in services
   */
  static async getLowStockAlerts(companyId: string): Promise<LowStockAlert[]> {
    // Get products that are commonly used in services
    const { data: serviceParts, error: partsError } = await supabase
      .from('service_requests')
      .select('service_details')
      .eq('company_id', companyId)
      .not('service_details', 'is', null);

    if (partsError) {
      console.error('Error fetching service parts:', partsError);
      return [];
    }

    // Extract product IDs from service_details (if parts are stored there)
    // This is a simplified version - you may need to adjust based on your data structure
    const productIds = new Set<string>();
    
    // For now, we'll check all products with low stock
    const { data: lowStockProducts, error: stockError } = await supabase
      .from('warehouse_stock')
      .select(`
        product_id,
        quantity,
        products (
          id,
          name,
          min_stock_level
        ),
        warehouses (
          name
        )
      `)
      .eq('company_id', companyId)
      .lt('quantity', supabase.raw('products.min_stock_level'));

    if (stockError) {
      console.error('Error fetching low stock products:', stockError);
      return [];
    }

    const alerts: LowStockAlert[] = (lowStockProducts || [])
      .filter((entry: any) => entry.products && entry.products.min_stock_level)
      .map((entry: any) => ({
        productId: entry.product_id,
        productName: entry.products.name,
        currentStock: Number(entry.quantity) || 0,
        minStockLevel: Number(entry.products.min_stock_level) || 0,
        warehouseName: entry.warehouses?.name,
      }));

    return alerts;
  }

  /**
   * Get parts usage report
   */
  static async getPartsUsageReport(
    companyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    let query = supabase
      .from('inventory_transactions')
      .select(`
        product_id,
        quantity,
        transaction_type,
        created_at,
        products (
          id,
          name,
          sku
        )
      `)
      .eq('company_id', companyId)
      .eq('reference_type', 'service_request')
      .eq('transaction_type', 'out');

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching parts usage report:', error);
      return [];
    }

    // Group by product
    const usageMap = new Map<string, any>();
    (data || []).forEach((transaction: any) => {
      const productId = transaction.product_id;
      if (!usageMap.has(productId)) {
        usageMap.set(productId, {
          productId,
          productName: transaction.products?.name || 'Bilinmeyen',
          sku: transaction.products?.sku,
          totalQuantity: 0,
          usageCount: 0,
        });
      }

      const entry = usageMap.get(productId);
      entry.totalQuantity += Number(transaction.quantity) || 0;
      entry.usageCount += 1;
    });

    return Array.from(usageMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }
}
















