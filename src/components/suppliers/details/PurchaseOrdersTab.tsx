import { useState, useMemo } from "react";
import { Plus, Package, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Supplier } from "@/types/supplier";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PurchaseOrder } from "@/hooks/usePurchaseOrders";
import { DatePicker } from "@/components/ui/date-picker";
import PurchaseOrdersTable from "@/components/purchase/orders/PurchaseOrdersTable";

interface PurchaseOrdersTabProps {
  supplier: Supplier;
}

export const PurchaseOrdersTab = ({ supplier }: PurchaseOrdersTabProps) => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  // Son 30 gün için varsayılan tarih filtresi
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());

  // Fetch purchase orders list
  const { data: purchaseOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['supplier-purchase-orders', supplier.id, statusFilter, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers!purchase_orders_supplier_id_fkey(
            id,
            name,
            email,
            phone,
            address
          ),
          items:purchase_order_items(*)
        `)
        .eq('supplier_id', supplier.id)
        .order('order_date', { ascending: false });

      // Status filtresi
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Tarih filtresi
      if (startDate) {
        query = query.gte('order_date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query = query.lte('order_date', endDateTime.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []) as PurchaseOrder[];
    },
  });

  // Filtrelenmiş siparişler
  const filteredOrders = useMemo(() => {
    if (!purchaseOrders) return [];
    return purchaseOrders;
  }, [purchaseOrders]);

  // İstatistikleri hesapla
  const orderStats = useMemo(() => {
    const allOrders = purchaseOrders || [];
    return {
      total: allOrders.length,
      draft: allOrders.filter(o => o.status === 'draft').length,
      submitted: allOrders.filter(o => o.status === 'submitted').length,
      confirmed: allOrders.filter(o => o.status === 'confirmed').length,
      partial_received: allOrders.filter(o => o.status === 'partial_received').length,
      received: allOrders.filter(o => o.status === 'received').length,
      cancelled: allOrders.filter(o => o.status === 'cancelled').length,
      totalAmount: allOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
    };
  }, [purchaseOrders]);

  const handleNewOrder = () => {
    navigate(`/purchasing/orders/new?supplier_id=${supplier.id}`);
  };

  const handleOrderClick = (order: PurchaseOrder) => {
    navigate(`/purchasing/orders/${order.id}`);
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Satın Alma Siparişleri</h3>
          </div>
          <div className="h-8 w-px bg-gray-300" />
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Toplam</span>
              <span className="text-sm font-semibold text-gray-900">
                {orderStats.total}
              </span>
            </div>
            {orderStats.draft > 0 && (
              <>
                <div className="h-8 w-px bg-gray-300" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Taslak</span>
                  <span className="text-sm font-semibold text-gray-600">
                    {orderStats.draft}
                  </span>
                </div>
              </>
            )}
            {orderStats.confirmed > 0 && (
              <>
                <div className="h-8 w-px bg-gray-300" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Onaylandı</span>
                  <span className="text-sm font-semibold text-green-600">
                    {orderStats.confirmed}
                  </span>
                </div>
              </>
            )}
            {orderStats.received > 0 && (
              <>
                <div className="h-8 w-px bg-gray-300" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Teslim Edildi</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {orderStats.received}
                  </span>
                </div>
              </>
            )}
            {orderStats.cancelled > 0 && (
              <>
                <div className="h-8 w-px bg-gray-300" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">İptal</span>
                  <span className="text-sm font-semibold text-red-600">
                    {orderStats.cancelled}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="draft">Taslak</SelectItem>
              <SelectItem value="submitted">Gönderildi</SelectItem>
              <SelectItem value="confirmed">Onaylandı</SelectItem>
              <SelectItem value="partial_received">Kısmen Teslim</SelectItem>
              <SelectItem value="received">Teslim Edildi</SelectItem>
              <SelectItem value="cancelled">İptal</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <DatePicker
              date={startDate}
              onSelect={setStartDate}
              placeholder="Başlangıç"
            />
            <span className="text-muted-foreground text-sm">-</span>
            <DatePicker
              date={endDate}
              onSelect={setEndDate}
              placeholder="Bitiş"
            />
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="h-9"
            onClick={handleNewOrder}
          >
            <Plus className="h-4 w-4 mr-2" />
            Sipariş Ekle
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="pb-6">
          <div className="-mx-4">
            <div className="px-4">
              {isLoadingOrders ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-muted-foreground">Yükleniyor...</p>
                  </div>
                </div>
              ) : (
                <PurchaseOrdersTable 
                  orders={filteredOrders || []}
                  isLoading={isLoadingOrders}
                  onOrderSelect={handleOrderClick}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

