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
    <div className="space-y-3 py-4">
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold">{orderStats.total}</span>
        <span className="text-sm text-muted-foreground">Toplam Sipariş</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-yellow-600">⏳</span>
          <span>{orderStats.pending}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-blue-600">✅</span>
          <span>{orderStats.confirmed}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-purple-600">⚙️</span>
          <span>{orderStats.processing}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-indigo-600">📦</span>
          <span>{orderStats.shipped}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-green-600">🎯</span>
          <span>{orderStats.delivered}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-emerald-600">✅</span>
          <span>{orderStats.completed}</span>
        </div>
      </div>
      
      <div className="pt-2 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Toplam Değer:</span>
          <span className="font-semibold">
            {new Intl.NumberFormat('tr-TR', {
              style: 'currency',
              currency: 'TRY'
            }).format(orderStats.total_value)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrdersSummary;