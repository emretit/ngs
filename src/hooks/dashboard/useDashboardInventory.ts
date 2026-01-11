import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "../useCurrentUser";

export const useDashboardInventory = () => {
  const { userData } = useCurrentUser();

  const { data: lowStockItems, isLoading: isLowStockItemsLoading } = useQuery({
    queryKey: ['dashboard-low-stock', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity, min_stock_level, purchase_price, price')
        .eq('is_active', true)
        .filter('stock_quantity', 'lt', supabase.raw('min_stock_level'))
        .order('stock_quantity', { ascending: true })
        .limit(10);
      if (error) throw error;
      return (data || []).map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stockQuantity: Number(product.stock_quantity) || 0,
        minStockLevel: Number(product.min_stock_level) || 0,
        purchasePrice: Number(product.purchase_price || product.price) || 0
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    lowStockItems: lowStockItems || [],
    isLoading: isLowStockItemsLoading,
  };
};
