import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "../useCurrentUser";

export const useDashboardPurchasing = () => {
  const { userData } = useCurrentUser();

  const { data: pendingPurchaseRequests, isLoading: isPendingPurchaseRequestsLoading } = useQuery({
    queryKey: ['dashboard-pending-purchase-requests', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('purchase_requests')
        .select('id, request_number, title, total_budget, status, needed_by_date')
        .in('status', ['draft', 'pending', 'approved'])
        .order('requested_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []).map(pr => ({
        id: pr.id,
        requestNumber: pr.request_number,
        title: pr.title,
        totalBudget: Number(pr.total_budget) || 0,
        status: pr.status,
        neededByDate: pr.needed_by_date
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: pendingPurchaseOrders, isLoading: isPendingPurchaseOrdersLoading } = useQuery({
    queryKey: ['dashboard-pending-purchase-orders', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('id, order_number, total_amount, currency, status, expected_delivery_date, suppliers(name)')
        .in('status', ['draft', 'pending'])
        .order('order_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []).map(po => ({
        id: po.id,
        orderNumber: po.order_number,
        totalAmount: Number(po.total_amount) || 0,
        currency: po.currency || 'TRY',
        status: po.status,
        expectedDeliveryDate: po.expected_delivery_date,
        supplierName: (po.suppliers as any)?.name || 'Bilinmeyen'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    pendingPurchaseRequests: pendingPurchaseRequests || [],
    pendingPurchaseOrders: pendingPurchaseOrders || [],
    isLoading: isPendingPurchaseRequestsLoading || isPendingPurchaseOrdersLoading,
  };
};
