import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OrderStats } from "@/types/orders";

const OrdersSummary = () => {
  const [orderStats, setOrderStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    completed: 0,
    cancelled: 0,
    total_value: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderStats = async () => {
      try {
        setLoading(true);
        
        // Orders tablosundan istatistikleri çek
        const { data: orders, error } = await supabase
          .from('orders')
          .select('status, total_amount');
          
        if (error) {
          console.error('Orders table error:', error);
          // Fallback olarak mock data kullan
          setOrderStats({
            total: 0,
            pending: 0,
            confirmed: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            completed: 0,
            cancelled: 0,
            total_value: 0
          });
          return;
        }
        
        if (orders) {
          const stats: OrderStats = {
            total: orders.length,
            pending: 0,
            confirmed: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            completed: 0,
            cancelled: 0,
            total_value: 0
          };
          
          orders.forEach(order => {
            if (stats.hasOwnProperty(order.status)) {
              stats[order.status as keyof Omit<OrderStats, 'total' | 'total_value'>]++;
            }
            stats.total_value += Number(order.total_amount || 0);
          });
          
          setOrderStats(stats);
        }
      } catch (error) {
        console.error('Error fetching order stats:', error);
        // Error durumunda mock data kullan
        setOrderStats({
          total: 0,
          pending: 0,
          confirmed: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          completed: 0,
          cancelled: 0,
          total_value: 0
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
        </div>
        <div className="h-3 bg-muted rounded w-24 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Metric - Sade */}
      <div className="text-center bg-gray-50 rounded-lg p-4">
        <div className="text-2xl font-bold text-gray-900">
          {orderStats.total}
        </div>
        <div className="text-sm text-gray-600 font-medium">Toplam Sipariş</div>
      </div>
      
      {/* Order Status Grid - Sade */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="font-medium text-yellow-700">Bekliyor</span>
          </div>
          <div className="text-lg font-bold text-yellow-600">{orderStats.pending}</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-blue-700">Onaylandı</span>
          </div>
          <div className="text-lg font-bold text-blue-600">{orderStats.confirmed}</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="font-medium text-purple-700">İşleniyor</span>
          </div>
          <div className="text-lg font-bold text-purple-600">{orderStats.processing}</div>
        </div>
        
        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <span className="font-medium text-indigo-700">Kargo</span>
          </div>
          <div className="text-lg font-bold text-indigo-600">{orderStats.shipped}</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-700">Teslim</span>
          </div>
          <div className="text-lg font-bold text-green-600">{orderStats.delivered}</div>
        </div>
        
        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="font-medium text-emerald-700">Tamamlandı</span>
          </div>
          <div className="text-lg font-bold text-emerald-600">{orderStats.completed}</div>
        </div>
      </div>
      
      {/* Total Value Display - Sade */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">₺</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Toplam Değer</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(orderStats.total_value)}
            </div>
            <div className="text-xs text-gray-500">
              Ort: {orderStats.total > 0 ? new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(orderStats.total_value / orderStats.total) : '₺0'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersSummary;