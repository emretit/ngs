import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "../useCurrentUser";

export const useDashboardSales = () => {
  const { userData } = useCurrentUser();

  const { data: activeOpportunities, isLoading: isActiveOpportunitiesLoading } = useQuery({
    queryKey: ['dashboard-active-opportunities', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('opportunities')
        .select('id, title, value, currency, status, expected_close_date, customers(name, company)')
        .in('status', ['open', 'in_progress'])
        .order('expected_close_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return (data || []).map(opp => ({
        id: opp.id,
        title: opp.title,
        value: Number(opp.value) || 0,
        currency: opp.currency || 'TRY',
        status: opp.status,
        expectedCloseDate: opp.expected_close_date,
        customerName: (opp.customers as any)?.name || (opp.customers as any)?.company || 'Bilinmeyen'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: pendingProposals, isLoading: isPendingProposalsLoading } = useQuery({
    queryKey: ['dashboard-pending-proposals', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('proposals')
        .select('id, number, title, total_amount, currency, status, valid_until, customers(name, company)')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []).map(prop => ({
        id: prop.id,
        number: prop.number,
        title: prop.title,
        totalAmount: Number(prop.total_amount) || 0,
        currency: prop.currency || 'TRY',
        validUntil: prop.valid_until,
        customerName: (prop.customers as any)?.name || (prop.customers as any)?.company || 'Bilinmeyen'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: todaySales, isLoading: isTodaySalesLoading } = useQuery({
    queryKey: ['dashboard-today-sales', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return 0;
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('toplam_tutar')
        .eq('durum', 'onaylandi')
        .eq('fatura_tarihi', today);
      if (error) throw error;
      return data?.reduce((sum, inv) => sum + (Number(inv.toplam_tutar) || 0), 0) || 0;
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: pendingOrders, isLoading: isPendingOrdersLoading } = useQuery({
    queryKey: ['dashboard-pending-orders', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, title, total_amount, currency, status, expected_delivery_date, customers(name, company)')
        .in('status', ['pending', 'confirmed', 'processing'])
        .order('order_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []).map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        title: order.title,
        totalAmount: Number(order.total_amount) || 0,
        currency: order.currency || 'TRY',
        status: order.status,
        expectedDeliveryDate: order.expected_delivery_date,
        customerName: (order.customers as any)?.name || (order.customers as any)?.company || 'Bilinmeyen'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: pendingDeliveries, isLoading: isPendingDeliveriesLoading } = useQuery({
    queryKey: ['dashboard-pending-deliveries', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('deliveries')
        .select('id, delivery_number, status, planned_delivery_date, customers(name, company)')
        .in('status', ['pending', 'prepared', 'shipped'])
        .order('planned_delivery_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return (data || []).map(del => ({
        id: del.id,
        deliveryNumber: del.delivery_number,
        status: del.status,
        plannedDeliveryDate: del.planned_delivery_date,
        customerName: (del.customers as any)?.name || (del.customers as any)?.company || 'Bilinmeyen'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: topSellingProducts, isLoading: isTopSellingProductsLoading } = useQuery({
    queryKey: ['dashboard-top-selling-products', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('sales_invoice_items')
        .select('product_id, urun_adi, miktar, satir_toplami, products(id, name)');
      if (error) throw error;
      const productMap = new Map<string, { id: string; name: string; totalSales: number; quantity: number }>();
      (data || []).forEach((item: any) => {
        const productId = item.product_id || 'unknown';
        const productName = item.products?.name || item.urun_adi || 'Bilinmeyen Ürün';
        const quantity = Number(item.miktar) || 0;
        const sales = Number(item.satir_toplami) || 0;
        const existing = productMap.get(productId) || { id: productId, name: productName, totalSales: 0, quantity: 0 };
        productMap.set(productId, {
          id: productId,
          name: productName,
          totalSales: existing.totalSales + sales,
          quantity: existing.quantity + quantity
        });
      });
      return Array.from(productMap.values())
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 10);
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    activeOpportunities: activeOpportunities || [],
    pendingProposals: pendingProposals || [],
    todaySales: todaySales || 0,
    pendingOrders: pendingOrders || [],
    pendingDeliveries: pendingDeliveries || [],
    topSellingProducts: topSellingProducts || [],
    isLoading: isActiveOpportunitiesLoading || isPendingProposalsLoading || isTodaySalesLoading ||
               isPendingOrdersLoading || isPendingDeliveriesLoading || isTopSellingProductsLoading,
  };
};
